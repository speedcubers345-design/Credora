import { ethers } from 'ethers';

// Mock ABI for RiskScoreNFT or FraudRegistry
const FRAUD_REGISTRY_ABI = [
    "function updateFraudScore(address user, uint256 score, uint8 level) external"
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MICRO_LENDER_ADDRESS || ethers.ZeroAddress;

export async function updateOnChainFraudScore(
    userWallet: string,
    fraudRiskScore: number,
    fraudRiskLevel: "LOW" | "MEDIUM" | "HIGH"
) {
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
        console.log("Skipping on-chain update: No private key configured.");
        return;
    }

    // Map level to uint8 (0=LOW, 1=MEDIUM, 2=HIGH)
    const levelMap = { "LOW": 0, "MEDIUM": 1, "HIGH": 2 };
    const levelInt = levelMap[fraudRiskLevel];

    // Scale score to 0-100 integer
    const scoreInt = Math.floor(fraudRiskScore * 100);

    try {
        // In a real scenario, we would connect to the provider
        // const provider = new ethers.JsonRpcProvider("https://coston2-api.flare.network/ext/bc/C/rpc");
        // const wallet = new ethers.Wallet(privateKey, provider);
        // const contract = new ethers.Contract(CONTRACT_ADDRESS, FRAUD_REGISTRY_ABI, wallet);

        // await contract.updateFraudScore(userWallet, scoreInt, levelInt);

        console.log(`[MOCK] Updated on-chain fraud score for ${userWallet}: Score=${scoreInt}, Level=${levelInt}`);

    } catch (error) {
        console.error("Error updating on-chain fraud score:", error);
    }
}
