import { buildFraudContext } from './fraudContextBuilder';
import { runFraudRules } from './fraudRules';
import { getGeminiFraudAssessment } from './geminiFraudModel';
import { updateOnChainFraudScore } from './onChainFraudUpdater';
import { FraudAssessment } from './types';

export async function evaluateLoanFraud(
    userId: string,
    walletAddress: string,
    amount: string,
    assetSymbol: string,
    collateralAmount: string
): Promise<FraudAssessment> {

    // 1. Build Context
    const context = await buildFraudContext(userId, walletAddress, {
        amount,
        assetSymbol,
        collateralAmount
    });

    // 2. Run Deterministic Rules
    const ruleResult = runFraudRules(context);

    // 3. Run AI Model
    const geminiResult = await getGeminiFraudAssessment(context, ruleResult);

    // 4. Merge Results
    // We can weight the rule score and AI score. For now, let's take the max risk or average.
    // Let's trust Gemini's synthesis but ensure rules are flagged.

    const finalAssessment: FraudAssessment = {
        fraudRiskLevel: geminiResult.fraudRiskLevel,
        fraudRiskScore: geminiResult.fraudRiskScore,
        triggeredRules: ruleResult.triggeredRules,
        modelFlags: geminiResult.flagsFromModel,
        explanation: geminiResult.explanation,
        timestamp: Date.now()
    };

    // 5. Update On-Chain (Fire and forget)
    updateOnChainFraudScore(walletAddress, finalAssessment.fraudRiskScore, finalAssessment.fraudRiskLevel);

    return finalAssessment;
}
