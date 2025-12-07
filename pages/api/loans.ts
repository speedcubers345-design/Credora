import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'loans.json');

// Helper to read data
const readData = () => {
    if (!fs.existsSync(dataFilePath)) {
        return [];
    }
    const fileData = fs.readFileSync(dataFilePath, 'utf8');
    try {
        return JSON.parse(fileData);
    } catch (e) {
        return [];
    }
};

// Helper to write data
const writeData = (data: any[]) => {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        const loans = readData();
        // If empty, return some mock defaults for the demo
        if (loans.length === 0) {
            const defaults = [
                { id: 'LN-1001', borrower: '0x71C...9A21', score: 780, amount: '500', collateral: '0.02 fBTC', term: '30 Days', status: 'Active', date: '2024-11-01', hasRedFlag: false },
                { id: 'LN-1002', borrower: '0x3B2...1C4D', score: 820, amount: '1,200', collateral: '0.05 fBTC', term: '60 Days', status: 'Repaid', date: '2024-10-15', hasRedFlag: false },
                { id: 'LN-1003', borrower: '0x9F1...8E22', score: 650, amount: '250', collateral: '0.01 fBTC', term: '15 Days', status: 'Repaid', date: '2024-09-20', hasRedFlag: true },
            ];
            writeData(defaults);
            return res.status(200).json(defaults);
        }
        return res.status(200).json(loans);
    } else if (req.method === 'POST') {
        try {
            const newLoan = req.body;
            const loans = readData();

            // Add timestamp and ID if missing
            const loanWithMeta = {
                id: `LN-${1000 + loans.length + 1}`,
                date: new Date().toISOString().split('T')[0],
                status: 'Pending',
                ...newLoan
            };

            loans.unshift(loanWithMeta); // Add to top
            writeData(loans);
            return res.status(200).json(loanWithMeta);
        } catch (error) {
            console.error("Failed to save loan:", error);
            return res.status(500).json({ error: 'Failed to save loan data' });
        }
    } else if (req.method === 'PUT') {
        try {
            const { id, status, lender } = req.body;
            const loans = readData();
            const loanIndex = loans.findIndex((l: any) => l.id === id);

            if (loanIndex === -1) {
                return res.status(404).json({ error: 'Loan not found' });
            }

            loans[loanIndex] = {
                ...loans[loanIndex],
                status: status || loans[loanIndex].status,
                lender: lender || loans[loanIndex].lender
            };

            writeData(loans);
            return res.status(200).json(loans[loanIndex]);
        } catch (error) {
            console.error("Failed to update loan:", error);
            return res.status(500).json({ error: 'Failed to update loan data' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
