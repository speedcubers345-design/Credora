'use client';

import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, parseAbi } from 'viem';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

// --- Sub-Components ---

const NeuralBackground = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light"></div>
        <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-[#00D2FF]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[10%] left-[10%] w-[80%] h-[60%] bg-[#3AFF9D]/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00D2FF]/10 rounded-full blur-[120px]" />
    </div>
);

// ABI Fragments
const MOCK_FBTC_ABI = parseAbi([
    "function mint(address to, uint256 amount) external",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)"
]);

const MICRO_LENDER_ABI = parseAbi([
    "function verifyCredit(uint256 score, bytes memory signature) public",
    "function depositCollateral(uint256 amount) external",
    "function borrow(uint256 amount) external",
    "function loans(address) external view returns (uint256 collateralAmount, uint256 debtAmount, uint256 maxLTV)"
]);

const MOCK_FTSO_ABI = parseAbi([
    "function getPrice() external view returns (uint256)"
]);

// Addresses
const MOCK_FBTC_ADDRESS = '0xf2fAeDba4331Ed3da9e2A2E96f91A67B20C0F5aC' as `0x${string}`;
const MICRO_LENDER_ADDRESS = '0xaE8AF28498Ab6e91935D341065FFC3C824d91326' as `0x${string}`;
const MOCK_FTSO_ADDRESS = '0xb86AF393672c648854a85D95ff89D2EFe84087F2' as `0x${string}`;
const RED_FLAG_NFT_ADDRESS = '0xb9484a062c039a9806b3663EBfB40DB6198702f4' as `0x${string}`;
const DID_REGISTRY_ADDRESS = '0x2f36dCA491F3A939322Da225d5f48F9E36822Bb9' as `0x${string}`;

export default function BorrowerPage() {
    const { address, isConnected } = useAccount();
    const { writeContract, isPending, data: hash, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    // State
    const [creditScore, setCreditScore] = useState<number | null>(null);
    const [signature, setSignature] = useState<string | null>(null);
    const [aiReasoning, setAiReasoning] = useState<string | null>(null);
    const [aiLimit, setAiLimit] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [borrowAmount, setBorrowAmount] = useState('');
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
    const [repaymentTime, setRepaymentTime] = useState('30');
    const [interestWillingness, setInterestWillingness] = useState('');
    const [collateralType, setCollateralType] = useState('fBTC');
    const [aggregatedDebt, setAggregatedDebt] = useState<string>('0');
    const [aggregatedCollateral, setAggregatedCollateral] = useState<string>('0');

    // Fetch and Aggregate Loans
    useEffect(() => {
        const fetchLoans = async () => {
            if (!address) return;
            try {
                const res = await fetch(`/api/loans?user=${address}`);
                if (res.ok) {
                    const data = await res.json();
                    // API returns an array of loans directly, or an object with loans property if changed later
                    const loans = Array.isArray(data) ? data : (data.loans || []);
                    const activeLoans = loans.filter((l: any) => l.status === 'ACTIVE' || l.status === 'PENDING');

                    const totalDebt = activeLoans.reduce((sum: number, loan: any) => sum + parseFloat(loan.amount), 0);
                    // Parse "0.005 fBTC" -> 0.005
                    const totalCollateral = activeLoans.reduce((sum: number, loan: any) => {
                        const val = parseFloat(loan.collateral.split(' ')[0]);
                        return sum + (isNaN(val) ? 0 : val);
                    }, 0);

                    setAggregatedDebt(totalDebt.toString());
                    setAggregatedCollateral(totalCollateral.toString());
                }
            } catch (error) {
                console.error("Failed to fetch loans:", error);
            }
        };

        fetchLoans();
        // Poll every 5 seconds to keep it fresh
        const interval = setInterval(fetchLoans, 5000);
        return () => clearInterval(interval);
    }, [address, isConfirmed]); // Re-fetch on tx confirmation

    // Reads
    const { data: btcBalance, refetch: refetchBalance } = useReadContract({
        address: MOCK_FBTC_ADDRESS,
        abi: MOCK_FBTC_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
        query: { enabled: !!address },
    });

    const { data: loanData, refetch: refetchLoan } = useReadContract({
        address: MICRO_LENDER_ADDRESS,
        abi: MICRO_LENDER_ABI,
        functionName: 'loans',
        args: [address as `0x${string}`],
        query: { enabled: !!address },
    });

    const { data: btcPrice } = useReadContract({
        address: MOCK_FTSO_ADDRESS,
        abi: MOCK_FTSO_ABI,
        functionName: 'getPrice',
    });

    // Read DID Status
    const { data: didStatus } = useReadContract({
        address: DID_REGISTRY_ADDRESS,
        abi: parseAbi(["function getDIDStatus(address _user) external view returns (bool isValid, uint8 level)"]),
        functionName: 'getDIDStatus',
        args: [address as `0x${string}`],
        query: { enabled: !!address },
    });

    const isIdentityVerified = didStatus ? (didStatus as any)[0] : false;

    // Actions
    const handleGetTestAssets = async () => {
        if (!address) return;
        writeContract({
            address: MOCK_FBTC_ADDRESS,
            abi: MOCK_FBTC_ABI,
            functionName: 'mint',
            args: [address, parseEther('1')],
        });
    };

    const handleGetCreditScore = async () => {
        if (!address) return;
        setIsAnalyzing(true);
        try {
            console.log("Requesting credit score for:", address);
            const res = await fetch('/api/get-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address }),
            });

            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            console.log("Credit Score API Response:", data);

            if (data.error) {
                throw new Error(data.error);
            }

            if (data.score && data.signature) {
                setCreditScore(data.score);
                setSignature(data.signature);
                setAiReasoning(data.reasoning);
                setAiLimit(data.limit);
            }
        } catch (err) {
            console.error("Credit Score Fetch Error:", err);
            // Optional: Show a UI toast or alert here
            alert("Failed to generate credit score. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleVerifyCredit = () => {
        if (!creditScore || !signature) return;
        writeContract({
            address: MICRO_LENDER_ADDRESS,
            abi: MICRO_LENDER_ABI,
            functionName: 'verifyCredit',
            args: [BigInt(creditScore), signature as `0x${string}`],
        });
    };

    const handleDeposit = async () => {
        if (!depositAmount) return;
        writeContract({
            address: MICRO_LENDER_ADDRESS,
            abi: MICRO_LENDER_ABI,
            functionName: 'depositCollateral',
            args: [parseEther(depositAmount)],
        });
    };

    const handleApprove = () => {
        writeContract({
            address: MOCK_FBTC_ADDRESS,
            abi: MOCK_FBTC_ABI,
            functionName: 'approve',
            args: [MICRO_LENDER_ADDRESS, parseEther('1000')],
        });
    }

    const handleBorrow = async () => {
        if (!isIdentityVerified) {
            alert("You must verify your identity before borrowing.");
            // router.push('/verify-identity'); // Uncomment if you have a dedicated verification page
            return;
        }
        if (!borrowAmount) return;

        try {
            console.log("Initiating Borrow Request...");

            // 1. On-Chain Transaction
            console.log("Sending Transaction...");
            writeContract({
                address: MICRO_LENDER_ADDRESS,
                abi: MICRO_LENDER_ABI,
                functionName: 'borrow',
                args: [parseEther(borrowAmount)],
            });
            console.log("Transaction Sent (waiting for wallet)...");

            // 2. Sync with Backend (Optimistic update for demo)
            // Note: In a real app, we should wait for tx confirmation, but for demo speed we do it here.
            // If writeContract throws (user rejects), this won't execute.

            console.log("Syncing with Backend...");
            const res = await fetch('/api/loans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    borrower: address,
                    amount: borrowAmount,
                    collateral: `${(parseFloat(borrowAmount) / 10000).toFixed(3)} fBTC`, // Mock collateral calc
                    term: `${repaymentTime} Days`,
                    score: creditScore || 750,
                    hasRedFlag: (creditScore || 750) < 600
                }),
            });

            if (!res.ok) {
                throw new Error(`Backend sync failed: ${res.statusText}`);
            }

            const data = await res.json();
            console.log("Loan Created in Backend:", data);

            alert("Loan Request Submitted Successfully!");
        } catch (e) {
            console.error("Borrow Error:", e);
            alert("Failed to submit loan request. Check console for details.");
        }
    };

    // Derived Data
    // Use aggregated values from API (Active + Pending) for display
    // Fallback to on-chain data if API returns 0 (e.g. initial load or error)
    const onChainCollateral = loanData ? formatEther((loanData as any)[0]) : '0';
    const onChainDebt = loanData ? formatEther((loanData as any)[1]) : '0';

    const collateral = parseFloat(aggregatedCollateral) > 0 ? aggregatedCollateral : onChainCollateral;
    const debt = parseFloat(aggregatedDebt) > 0 ? aggregatedDebt : onChainDebt;

    const maxLTV = loanData ? Number((loanData as any)[2]) : 0;
    const price = btcPrice ? Number(btcPrice) : 0;

    // Parse AI Limit (e.g. "$5,000" -> 5000)
    const aiLimitValue = aiLimit ? parseFloat(aiLimit.replace(/[^0-9.]/g, '')) : 0;
    // Cap the max loan at $100 as per user request for collateral-free loans
    const calculatedLimit = aiLimitValue > 0 ? aiLimitValue : (parseFloat(collateral) * price * maxLTV) / 100;
    const maxLoanAvailable = Math.min(calculatedLimit, 100);

    const healthFactor = parseFloat(debt) > 0 ? (parseFloat(collateral) * price * 0.8) / parseFloat(debt) : 999;

    useEffect(() => {
        if (isConfirmed) {
            refetchBalance();
            refetchLoan();
        }
    }, [isConfirmed, refetchBalance, refetchLoan]);

    return (
        <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#3AFF9D]/30 selection:text-[#3AFF9D] relative overflow-x-hidden">
            <NeuralBackground />

            {/* Navbar */}
            <Navbar creditScore={creditScore} />

            <main className="relative z-10 pt-32 pb-20 px-6 max-w-5xl mx-auto">
                {!isConnected ? (
                    <div className="text-center py-20">
                        <h1 className="text-4xl font-bold mb-6">Welcome, Borrower</h1>
                        <p className="text-gray-400 mb-8">Connect your wallet to start your credit journey.</p>
                        <div className="flex justify-center">
                            <ConnectButton />
                        </div>
                    </div>
                ) : !isIdentityVerified ? (
                    // STYLISH DID GATEKEEPER
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="relative w-32 h-32 mb-8">
                            <div className="absolute inset-0 bg-[#3AFF9D]/20 rounded-full animate-ping"></div>
                            <div className="absolute inset-0 bg-[#3AFF9D]/10 rounded-full blur-xl"></div>
                            <div className="relative w-full h-full bg-[#0F1219] border border-[#3AFF9D]/50 rounded-full flex items-center justify-center text-3xl font-bold text-[#3AFF9D] shadow-[0_0_30px_rgba(58,255,157,0.3)]">
                                DID
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-[#3AFF9D] text-black text-xs font-bold px-2 py-1 rounded-full border-2 border-[#0B0E14]">
                                REQUIRED
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-[#3AFF9D] to-white animate-text-shimmer bg-[length:200%_auto]">
                            Identity is the New Collateral
                        </h1>

                        <p className="text-gray-400 text-lg md:text-xl text-center max-w-2xl mb-10 leading-relaxed">
                            To ensure a fair and sybil-resistant lending ecosystem, we require a one-time
                            <span className="text-[#3AFF9D] font-bold"> Proof of Personhood</span> verification.
                            <br />No documents. No KYC. Just You.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-3xl">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-[#3AFF9D]/30 transition-colors group">
                                <div className="text-xs font-bold text-gray-500 mb-3 group-hover:text-[#3AFF9D] transition-colors">01</div>
                                <h3 className="font-bold text-white mb-1">Liveness Check</h3>
                                <p className="text-xs text-gray-500">AI-powered face scan to verify you're human.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-[#3AFF9D]/30 transition-colors group">
                                <div className="text-xs font-bold text-gray-500 mb-3 group-hover:text-[#3AFF9D] transition-colors">02</div>
                                <h3 className="font-bold text-white mb-1">Device Graph</h3>
                                <p className="text-xs text-gray-500">Unique hardware fingerprinting.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-[#3AFF9D]/30 transition-colors group">
                                <div className="text-xs font-bold text-gray-500 mb-3 group-hover:text-[#3AFF9D] transition-colors">03</div>
                                <h3 className="font-bold text-white mb-1">Behavior Entropy</h3>
                                <p className="text-xs text-gray-500">Micro-interaction pattern analysis.</p>
                            </div>
                        </div>

                        <Link href="/verify-identity" className="group relative px-8 py-4 bg-[#3AFF9D] text-black font-bold text-lg rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(58,255,157,0.4)]">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative flex items-center gap-2">
                                Mint My DID <span className="text-xl">→</span>
                            </span>
                        </Link>

                        <p className="mt-6 text-xs text-gray-600">
                            Takes ~30 seconds • Stored Off-Chain • Privacy Preserved
                        </p>
                    </div>
                ) : !creditScore ? (
                    <div className="max-w-2xl mx-auto text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <h1 className="text-4xl font-bold mb-6">Let's Check Your Eligibility</h1>
                        <p className="text-gray-400 mb-8 text-lg">
                            We use AI to analyze your on-chain history and generate a trust score.
                            This score determines your borrowing limit and collateral ratio.
                        </p>

                        <div className="p-8 rounded-2xl bg-[#0F1219] border border-white/5 backdrop-blur-md mb-8">
                            <div className="w-20 h-20 mx-auto bg-[#3AFF9D]/10 rounded-full flex items-center justify-center text-2xl font-bold text-[#3AFF9D] mb-6 shadow-lg shadow-[#3AFF9D]/20 font-mono">
                                AI
                            </div>
                            <h3 className="text-xl font-bold mb-2">AI Credit Analysis</h3>
                            <p className="text-sm text-gray-400 mb-6">
                                Scans transaction history, asset holdings, and interaction patterns.
                            </p>
                            <button
                                onClick={handleGetCreditScore}
                                disabled={isAnalyzing}
                                className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                            >
                                {isAnalyzing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        Analyzing Identity...
                                    </span>
                                ) : (
                                    'Generate My Score'
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Borrower Dashboard</h1>
                                <p className="text-gray-400">Manage your collateral and loans.</p>
                            </div>
                        </div>

                        {/* Red Flag Warning (Mocked) */}
                        {creditScore && creditScore < 600 && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 animate-pulse">
                                <span className="text-xl font-bold text-red-500">!</span>
                                <div>
                                    <h4 className="font-bold text-red-400">Account Flagged</h4>
                                    <p className="text-sm text-gray-400">A "Red Flag" NFT has been minted on your account due to prior defaults. This may affect your borrowing ability.</p>
                                </div>
                            </div>
                        )}

                        {/* Score & Analysis Card */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-[#00D2FF]/10 to-black border border-[#00D2FF]/20">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <span className="text-[#00D2FF] font-mono text-xs">AI ANALYSIS</span>
                                </h3>
                                <p className="text-gray-300 italic mb-4">"{aiReasoning}"</p>
                                <div className="flex gap-4">
                                    <div className="px-3 py-1 rounded-lg bg-[#00D2FF]/10 border border-[#00D2FF]/20 text-xs text-[#00D2FF]">
                                        Limit: {aiLimit}
                                    </div>
                                    <div className="px-3 py-1 rounded-lg bg-[#3AFF9D]/10 border border-[#3AFF9D]/20 text-xs text-[#3AFF9D]">
                                        Tier A Approved
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-[#0F1219] border border-white/5 flex flex-col justify-center items-center text-center">
                                <div className="text-sm text-gray-400 mb-1">Credit Score</div>
                                <div className="text-4xl font-bold text-white mb-2">{creditScore}</div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${(creditScore || 0) >= 700 ? 'bg-[#3AFF9D]/10 border-[#3AFF9D]/20 text-[#3AFF9D]' :
                                    (creditScore || 0) >= 600 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                        'bg-red-500/10 border-red-500/20 text-red-500'
                                    }`}>
                                    {(creditScore || 0) >= 700 ? 'High Credibility' :
                                        (creditScore || 0) >= 600 ? 'Medium Credibility' :
                                            'Low Credibility'}
                                </div>
                            </div>
                        </div>

                        {/* Main Actions */}
                        <div className="mb-8">
                            <button
                                onClick={() => setIsBorrowModalOpen(true)}
                                className="w-full p-8 rounded-2xl bg-gradient-to-r from-[#0F1219] to-[#0F1219] border border-white/10 hover:border-[#3AFF9D]/50 transition-all text-left group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[#3AFF9D]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-full bg-[#3AFF9D]/20 flex items-center justify-center text-[#3AFF9D] text-xl font-bold group-hover:scale-110 transition-transform">
                                            +
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold mb-1 text-white">Borrow C2FLR</h3>
                                            <p className="text-gray-400">Get instant liquidity. Add collateral if needed.</p>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#3AFF9D] group-hover:text-black transition-colors">
                                        →
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Identity Status Badge (Small) */}
                        <div className="flex justify-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3AFF9D]/10 border border-[#3AFF9D]/20">
                                <span className="text-[#3AFF9D] font-bold text-xs">DID VERIFIED</span>
                                <span className="text-xs font-bold text-[#3AFF9D]">Level 5 Sybil Resistance</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-6 rounded-2xl bg-[#0F1219] border border-white/5 text-center hover:border-[#3AFF9D]/30 transition-colors">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Collateral Value</p>
                                <p className="text-2xl font-bold text-white mb-1">
                                    {parseFloat(collateral).toFixed(4)} <span className="text-sm text-gray-400">fBTC</span>
                                </p>
                                <p className="text-xs text-[#3AFF9D]">
                                    ≈ ${(parseFloat(collateral) * price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl bg-[#0F1219] border border-white/5 text-center hover:border-[#3AFF9D]/30 transition-colors">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Current Debt</p>
                                <p className="text-2xl font-bold text-white mb-1">
                                    {parseFloat(debt).toFixed(2)} <span className="text-sm text-gray-400">C2FLR</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                    Interest Accruing
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl bg-[#0F1219] border border-white/5 text-center hover:border-[#3AFF9D]/30 transition-colors relative overflow-hidden">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Health Factor</p>
                                <p className={`text-2xl font-bold mb-1 ${healthFactor > 2 ? 'text-[#3AFF9D]' : healthFactor > 1.1 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    {healthFactor > 100 ? '∞' : healthFactor.toFixed(2)}
                                </p>
                                <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${healthFactor > 2 ? 'bg-[#3AFF9D]' : healthFactor > 1.1 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${Math.min(healthFactor * 20, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2">
                                    Liquidation at &lt; 1.0
                                </p>
                            </div>
                        </div>

                        {/* FTSO Insights Section */}
                        <div className="mt-8 pt-8 border-t border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <span className="text-[#3AFF9D] font-mono text-xs">LIVE</span> FTSO Insights
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-[#3AFF9D] bg-[#3AFF9D]/10 px-3 py-1 rounded-full border border-[#3AFF9D]/20 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#3AFF9D]"></span>
                                    Live Feed
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* FLR Price */}
                                <div className="p-4 rounded-xl bg-[#0F1219] border border-white/5 hover:border-[#3AFF9D]/30 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500 font-bold text-xs">
                                                FLR
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">Flare</div>
                                                <div className="text-[10px] text-gray-500">Native Token</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-[#3AFF9D] font-mono">+2.4%</div>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">$0.042</div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-pink-500 w-[60%] group-hover:w-[70%] transition-all duration-1000"></div>
                                    </div>
                                </div>

                                {/* fBTC Price */}
                                <div className="p-4 rounded-xl bg-[#0F1219] border border-white/5 hover:border-[#3AFF9D]/30 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-xs">
                                                fBTC
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">Bitcoin</div>
                                                <div className="text-[10px] text-gray-500">F-Asset</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-[#3AFF9D] font-mono">+1.1%</div>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">${price.toLocaleString()}</div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 w-[80%] group-hover:w-[85%] transition-all duration-1000"></div>
                                    </div>
                                </div>

                                {/* fETH Price */}
                                <div className="p-4 rounded-xl bg-[#0F1219] border border-white/5 hover:border-[#3AFF9D]/30 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-xs">
                                                fETH
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">Ethereum</div>
                                                <div className="text-[10px] text-gray-500">F-Asset</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-red-400 font-mono">-0.5%</div>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">$3,450</div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[40%] group-hover:w-[45%] transition-all duration-1000"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Combined Borrow Modal */}
            {isBorrowModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-[#0F1219] border border-white/10 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setIsBorrowModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="text-[#3AFF9D] font-mono text-lg">BORROW</span> C2FLR
                        </h3>

                        <div className="space-y-6">
                            {/* Collateral Section */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="flex items-center gap-2 text-sm font-bold text-white cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={isDepositModalOpen} // Reusing this state for "Add Collateral" toggle inside modal
                                            onChange={(e) => setIsDepositModalOpen(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-600 text-[#3AFF9D] focus:ring-[#3AFF9D] bg-transparent"
                                        />
                                        Add Collateral?
                                    </label>
                                    {isDepositModalOpen && (
                                        <span className="text-xs text-gray-400">
                                            Balance: <span className="text-white">{btcBalance ? formatEther(btcBalance as bigint) : '0'} fBTC</span>
                                        </span>
                                    )}
                                </div>

                                {isDepositModalOpen && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <select
                                                value={collateralType}
                                                onChange={(e) => setCollateralType(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#00D2FF]"
                                            >
                                                <option value="fBTC">fBTC (Flare Bitcoin)</option>
                                                <option value="fETH" disabled>fETH (Coming Soon)</option>
                                            </select>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={depositAmount}
                                                onChange={(e) => setDepositAmount(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#00D2FF]"
                                                placeholder="Amount to Deposit"
                                            />
                                            <button
                                                onClick={() => setDepositAmount(btcBalance ? formatEther(btcBalance as bigint) : '0')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#00D2FF] font-bold hover:text-[#00D2FF]/80"
                                            >
                                                MAX
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleApprove}
                                                disabled={isPending}
                                                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold transition-colors border border-white/10"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={handleDeposit}
                                                disabled={isPending || !depositAmount}
                                                className="flex-[2] py-2 bg-[#00D2FF] hover:bg-[#00D2FF]/80 text-black rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                            >
                                                Deposit
                                            </button>
                                        </div>
                                        <div className="text-center">
                                            <button onClick={handleGetTestAssets} className="text-[10px] text-gray-500 hover:text-white underline">
                                                Mint Test fBTC
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Borrow Section */}
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-2">
                                    <span className="uppercase tracking-wider">Loan Amount</span>
                                    <span>Max: ${maxLoanAvailable.toLocaleString()}</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={borrowAmount}
                                        onChange={(e) => setBorrowAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3AFF9D] transition-colors"
                                        placeholder="0.00"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-bold">C2FLR</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Term</label>
                                    <select
                                        value={repaymentTime}
                                        onChange={(e) => setRepaymentTime(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3AFF9D] appearance-none"
                                    >
                                        <option value="30">30 Days</option>
                                        <option value="60">60 Days</option>
                                        <option value="90">90 Days</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Avg Rate</label>
                                    <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-300 cursor-not-allowed">
                                        12.5% APR
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Max Interest Willingness</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={interestWillingness}
                                        onChange={(e) => setInterestWillingness(e.target.value)}
                                        placeholder="13.0"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3AFF9D] transition-colors"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-bold">%</span>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">Setting a higher rate may improve matching speed (P2P mode).</p>
                            </div>

                            <div className="p-4 rounded-xl bg-[#3AFF9D]/10 border border-[#3AFF9D]/20 space-y-2">
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Transaction Fee (0.5%)</span>
                                    <span>{borrowAmount ? (parseFloat(borrowAmount) * 0.005).toFixed(2) : '0.00'} C2FLR</span>
                                </div>
                                <div className="flex justify-between text-sm mb-1 pt-2 border-t border-[#3AFF9D]/20">
                                    <span className="text-gray-400">Est. Repayment</span>
                                    <span className="text-white font-bold">
                                        {borrowAmount ? (
                                            parseFloat(borrowAmount) * (1 + (12.5 / 100) * (parseInt(repaymentTime) / 365)) +
                                            (parseFloat(borrowAmount) * 0.005)
                                        ).toFixed(2) : '0.00'} C2FLR
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Due Date</span>
                                    <span>{new Date(Date.now() + parseInt(repaymentTime) * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => { handleBorrow(); setIsBorrowModalOpen(false); }}
                                disabled={isPending || !borrowAmount}
                                className="w-full py-4 bg-[#3AFF9D] hover:bg-[#32e68d] text-black rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-[#3AFF9D]/20"
                            >
                                Confirm Borrow Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
