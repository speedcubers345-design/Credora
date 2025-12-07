export interface FraudContext {
    userId: string;
    walletAddress: string;
    identityHash: string;
    currentLoanRequest?: {
        amount: string;
        assetSymbol: string; // e.g., "C2FLR", "fBTC"
        collateralAmount: string;
        timestamp: number;
    };
    activeLoansCount: number;
    recentLoanRequestsLast24h: number;
    totalLoansTaken: number;
    totalDefaults: number;
    avgRepaymentDelaySeconds: number;
    deviceFingerprint?: string;
    ipCountryCode?: string;
    linkedWalletsCount: number;
    isBlacklistedAddressDestination: boolean;
    onChainScore?: number; // existing credit score
}

export interface RuleEngineResult {
    ruleScore: number; // 0–1
    triggeredRules: string[];
}

export interface GeminiFraudResult {
    fraudRiskLevel: "LOW" | "MEDIUM" | "HIGH";
    fraudRiskScore: number; // 0–1
    explanation: string;
    flagsFromModel: string[];
}

export interface FraudAssessment {
    fraudRiskLevel: "LOW" | "MEDIUM" | "HIGH";
    fraudRiskScore: number;
    triggeredRules: string[];
    modelFlags: string[];
    explanation: string;
    timestamp: number;
}
