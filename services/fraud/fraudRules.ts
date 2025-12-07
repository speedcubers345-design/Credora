import { FraudContext, RuleEngineResult } from './types';

export function runFraudRules(context: FraudContext): RuleEngineResult {
    const triggeredRules: string[] = [];
    let ruleScore = 0; // 0 = Safe, 1 = Fraud

    // Rule 1: Sybil Suspect (Many linked wallets)
    if (context.linkedWalletsCount > 3) {
        triggeredRules.push("SYBIL_SUSPECT");
        ruleScore += 0.4;
    }

    // Rule 2: Loan Spam (Too many requests in 24h)
    if (context.recentLoanRequestsLast24h > 5) {
        triggeredRules.push("LOAN_SPAM");
        ruleScore += 0.3;
    }

    // Rule 3: Multiple Defaults
    if (context.totalDefaults >= 2) {
        triggeredRules.push("MULTIPLE_DEFAULTS");
        ruleScore += 0.5;
    }

    // Rule 4: Risky Recipient
    if (context.isBlacklistedAddressDestination) {
        triggeredRules.push("RISKY_RECIPIENT");
        ruleScore += 0.8;
    }

    // Rule 5: Chronic Late Payer (Avg delay > 7 days)
    if (context.avgRepaymentDelaySeconds > 604800) {
        triggeredRules.push("CHRONIC_LATE_PAYER");
        ruleScore += 0.2;
    }

    // Rule 6: High Value Loan with Low History (Strategic Default Risk)
    if (context.currentLoanRequest) {
        const amount = parseFloat(context.currentLoanRequest.amount);
        if (amount > 5000 && context.totalLoansTaken < 3) {
            triggeredRules.push("HIGH_VALUE_NO_HISTORY");
            ruleScore += 0.3;
        }
    }

    // Cap score at 1
    return {
        ruleScore: Math.min(ruleScore, 1),
        triggeredRules
    };
}
