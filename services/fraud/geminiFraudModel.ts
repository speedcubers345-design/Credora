import { GoogleGenerativeAI } from '@google/generative-ai';
import { FraudContext, RuleEngineResult, GeminiFraudResult } from './types';

const GEN_AI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEN_AI_API_KEY);

export async function getGeminiFraudAssessment(
    context: FraudContext,
    ruleResult: RuleEngineResult
): Promise<GeminiFraudResult> {

    // If no API key, return a mock response (for safety/testing)
    if (!GEN_AI_API_KEY) {
        console.warn("Gemini API Key missing. Returning mock fraud assessment.");
        return {
            fraudRiskLevel: "LOW",
            fraudRiskScore: 0.1,
            explanation: "Mock assessment: API key missing. User behavior appears normal.",
            flagsFromModel: []
        };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are an AI fraud detection engine for a decentralized micro-loan protocol called Credora, built on the Flare blockchain.
    You receive structured behavioral, identity, and on-chain loan data for a borrower.
    Your job is to:
    1. Assess fraud risk on a 0–1 scale
    2. Classify risk as LOW, MEDIUM, or HIGH
    3. List specific fraud patterns that may apply (e.g., SYBIL_SUSPECT, LOAN_STACKING, STRATEGIC_DEFAULT, STOLEN_WALLET, LAUNDERING_PATTERN, COLLATERAL_ANOMALY)
    4. Provide a brief explanation understandable to a risk analyst.

    Only consider fraud risk and behavioral risk, not creditworthiness alone. If behavior looks normal and low-risk, say so clearly.

    Here is the user context:
    JSON "fraudContext": ${JSON.stringify(context, null, 2)}

    JSON "ruleEngineResult": ${JSON.stringify(ruleResult, null, 2)}

    Return a strict JSON object with:
    {
        "fraudRiskLevel": "LOW" | "MEDIUM" | "HIGH",
        "fraudRiskScore": number between 0 and 1,
        "flagsFromModel": string[],
        "explanation": string
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiResult = JSON.parse(jsonString);

        return {
            fraudRiskLevel: aiResult.fraudRiskLevel || "MEDIUM",
            fraudRiskScore: typeof aiResult.fraudRiskScore === 'number' ? aiResult.fraudRiskScore : 0.5,
            explanation: aiResult.explanation || "AI analysis completed.",
            flagsFromModel: Array.isArray(aiResult.flagsFromModel) ? aiResult.flagsFromModel : []
        };

    } catch (error) {
        console.error("Gemini API Error:", error);
        // Fallback on error
        return {
            fraudRiskLevel: "MEDIUM",
            fraudRiskScore: 0.5,
            explanation: "AI analysis failed due to technical error. Manual review recommended.",
            flagsFromModel: ["AI_ERROR"]
        };
    }
}
