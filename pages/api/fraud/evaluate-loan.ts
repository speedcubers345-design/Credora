import type { NextApiRequest, NextApiResponse } from 'next';
import { evaluateLoanFraud } from '../../../services/fraud/fraudService';
import { FraudAssessment } from '../../../services/fraud/types';

type Data = FraudAssessment | { error: string };

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId, walletAddress, amount, assetSymbol, collateralAmount } = req.body;

    if (!userId || !walletAddress || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const assessment = await evaluateLoanFraud(
            userId,
            walletAddress,
            amount,
            assetSymbol || 'C2FLR',
            collateralAmount || '0'
        );

        res.status(200).json(assessment);
    } catch (error) {
        console.error("Fraud Evaluation Error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
