import type { NextApiRequest, NextApiResponse } from 'next';

// Mock internal service calls
const checkIdentity = async (address: string) => {
    // Simulate identity verification delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { verified: true, score: 780 };
};

const checkFraud = async (address: string, amount: string) => {
    // Simulate fraud check delay
    await new Promise(resolve => setTimeout(resolve, 800));
    // Simple rule: amount > 10000 triggers manual review (simulated)
    if (parseFloat(amount) > 10000) return { flagged: true, reason: 'High Value Transaction' };
    return { flagged: false };
};

const executeLoan = async (loanData: any) => {
    // Call the existing loans API to persist
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
        await fetch(`${baseUrl}/api/loans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loanData),
        });
        return { success: true, txHash: '0x' + Math.random().toString(16).substr(2, 64) };
    } catch (e) {
        console.error("Loan Execution Failed", e);
        return { success: false };
    }
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { eventType, txId, sender, amount, asset } = req.body;

    if (eventType !== 'XRPL_PAYMENT') {
        return res.status(400).json({ error: 'Unsupported Event Type' });
    }

    try {
        // Step 1: Identity Verification
        const identity = await checkIdentity(sender);
        if (!identity.verified) {
            return res.status(403).json({ step: 'IDENTITY', error: 'Identity Verification Failed' });
        }

        // Step 2: Fraud Detection
        const fraudCheck = await checkFraud(sender, amount);
        if (fraudCheck.flagged) {
            return res.status(403).json({ step: 'FRAUD', error: `Fraud Check Failed: ${fraudCheck.reason}` });
        }

        // Step 3: Loan Execution (Smart Account Action)
        const loanData = {
            borrower: sender,
            amount: amount,
            collateral: `${(parseFloat(amount) / 50000).toFixed(4)} ${asset}`, // Mock conversion
            term: '30 Days', // Default
            score: identity.score,
            status: 'Active',
            source: 'XRPL Bridge'
        };

        const execution = await executeLoan(loanData);

        return res.status(200).json({
            success: true,
            steps: [
                { name: 'Identity', status: 'Verified', score: identity.score },
                { name: 'Fraud Check', status: 'Passed' },
                { name: 'Execution', status: 'Success', txHash: execution.txHash }
            ]
        });

    } catch (error) {
        console.error("Middleware Error:", error);
        return res.status(500).json({ error: 'Internal Middleware Error' });
    }
}
