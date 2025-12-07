// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FTSO.sol";
import "./DIDRegistry.sol";

contract MicroLender is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct Loan {
        uint256 id;
        address borrower;
        uint256 amount; // Amount in C2FLR (wei)
        uint256 collateralAmount; // Amount in fBTC (wei)
        uint256 debtAmount; // Total to repay (wei)
        uint256 timestamp;
        bool active;
        bool repaid;
        bool liquidated;
    }

    IERC20 public collateralToken; // fBTC
    FTSO public ftso; // Price Oracle
    DIDRegistry public didRegistry; // Identity Registry

    uint256 public constant LTV_RATIO = 70; // 70% LTV
    uint256 public constant INTEREST_RATE = 5; // 5% Flat Fee
    uint256 public constant LOAN_DURATION = 30 days;

    mapping(address => Loan) public loans;
    mapping(address => uint256) public creditScores;

    event LoanRequested(address indexed borrower, uint256 amount, uint256 collateral);
    event LoanRepaid(address indexed borrower, uint256 amount);
    event CollateralDeposited(address indexed borrower, uint256 amount);

    constructor(address _collateralToken, address _ftso, address _didRegistry) Ownable(msg.sender) {
        collateralToken = IERC20(_collateralToken);
        ftso = FTSO(_ftso);
        didRegistry = DIDRegistry(_didRegistry);
    }

    function setCreditScore(address _borrower, uint256 _score) external onlyOwner {
        creditScores[_borrower] = _score;
    }

    function depositCollateral(uint256 _amount) external {
        require(_amount > 0, "Amount must be > 0");
        collateralToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        Loan storage loan = loans[msg.sender];
        loan.collateralAmount += _amount;
        
        emit CollateralDeposited(msg.sender, _amount);
    }

    function borrow(uint256 _amount) external nonReentrant {
        // 1. Identity Check
        (bool isValid, uint8 level) = didRegistry.getDIDStatus(msg.sender);
        require(isValid, "Identity not verified");
        require(level >= 2, "Sybil resistance level too low");

        Loan storage loan = loans[msg.sender];
        require(loan.collateralAmount > 0, "No collateral deposited");
        require(!loan.active || loan.repaid, "Existing active loan");

        // 2. Calculate Max Loan in C2FLR
        // Price: 1 fBTC = X C2FLR (from FTSO)
        uint256 fbtcPrice = ftso.getPrice(); 
        // Value of Collateral in C2FLR = (Collateral * Price) / 1e18 (assuming 18 decimals)
        uint256 collateralValue = (loan.collateralAmount * fbtcPrice) / 1e18;
        
        uint256 maxLoan = (collateralValue * LTV_RATIO) / 100;
        require(_amount <= maxLoan, "Insufficient collateral");

        // 3. Create Loan
        loan.borrower = msg.sender;
        loan.amount = _amount;
        loan.debtAmount = _amount + (_amount * INTEREST_RATE) / 100;
        loan.timestamp = block.timestamp;
        loan.active = true;
        loan.repaid = false;
        loan.liquidated = false;

        // 4. Transfer C2FLR (Native Token)
        (bool sent, ) = payable(msg.sender).call{value: _amount}("");
        require(sent, "Failed to send C2FLR");

        emit LoanRequested(msg.sender, _amount, loan.collateralAmount);
    }

    function repay() external payable nonReentrant {
        Loan storage loan = loans[msg.sender];
        require(loan.active, "No active loan");
        require(!loan.repaid, "Already repaid");
        
        // Handle Overpayment
        if (msg.value > loan.debtAmount) {
            uint256 refund = msg.value - loan.debtAmount;
            (bool sent, ) = payable(msg.sender).call{value: refund}("");
            require(sent, "Refund failed");
        } else {
            require(msg.value == loan.debtAmount, "Incorrect repayment amount");
        }

        loan.repaid = true;
        loan.active = false;

        // Return Collateral
        uint256 collateral = loan.collateralAmount;
        loan.collateralAmount = 0;
        collateralToken.safeTransfer(msg.sender, collateral);

        emit LoanRepaid(msg.sender, loan.debtAmount);
    }

    // Allow contract to receive C2FLR for funding
    receive() external payable {}
}
