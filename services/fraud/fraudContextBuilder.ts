import { FraudContext } from './types';
import { ethers } from 'ethers';

// Mock FDC (Flare Data Connector) API response
const getMockFDCData = async (userId: string) => {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 100));

    // Deterministic mock based on userId length or char codes
    const isRisky = userId.includes('risk');

    return {
        deviceFingerprint: `device_${userId.substring(0, 5)}_${Math.floor(Math.random() * 1000)}`,
        ipCountryCode: isRisky ? 'XX' : 'US',
        linkedWalletsCount: isRisky ? 5 : 1,
        blacklistedFlags: isRisky ? ['SUSPICIOUS_IP'] : [],
    };
};

// Mock Database / On-Chain Query
const getMockLoanHistory = async (walletAddress: string) => {
    // Simulate DB query
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
        activeLoansCount: 1,
        recentLoanRequestsLast24h: 0,
        totalLoansTaken: 5,
        totalDefaults: 0,
        avgRepaymentDelaySeconds: 0,
        onChainScore: 750
    };
};

export async function buildFraudContext(
    userId: string,
    walletAddress: string,
    loanRequest?: {
        amount: string;
        assetSymbol: string;
        collateralAmount: string;
    }
): Promise<FraudContext> {

    const fdcData = await getMockFDCData(userId);
    const loanHistory = await getMockLoanHistory(walletAddress);

    // Mock Identity Hash (e.g. from FDC)
    const identityHash = ethers.keccak256(ethers.toUtf8Bytes(userId));

    // Check if destination is blacklisted (Mock)
    const isBlacklistedAddressDestination = false;

    return {
        userId,
        walletAddress,
        identityHash,
        currentLoanRequest: loanRequest ? {
            ...loanRequest,
            timestamp: Date.now()
        } : undefined,
        activeLoansCount: loanHistory.activeLoansCount,
        recentLoanRequestsLast24h: loanHistory.recentLoanRequestsLast24h,
        totalLoansTaken: loanHistory.totalLoansTaken,
        totalDefaults: loanHistory.totalDefaults,
        avgRepaymentDelaySeconds: loanHistory.avgRepaymentDelaySeconds,
        deviceFingerprint: fdcData.deviceFingerprint,
        ipCountryCode: fdcData.ipCountryCode,
        linkedWalletsCount: fdcData.linkedWalletsCount,
        isBlacklistedAddressDestination,
        onChainScore: loanHistory.onChainScore
    };
}
