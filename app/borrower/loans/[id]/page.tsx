'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseAbi, parseEther, formatEther } from 'viem';

// ABI Fragments
const MICRO_LENDER_ABI = parseAbi([
    "function loans(address) external view returns (uint256 collateralAmount, uint256 debtAmount, uint256 maxLTV)",
    "function repay() external payable"
]);

const MICRO_LENDER_ADDRESS = '0xaE8AF28498Ab6e91935D341065FFC3C824d91326' as `0x${string}`;

export default function LoanDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    const { address } = useAccount();
    const [loan, setLoan] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Contract Write
    const { writeContract, isPending, data: hash, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        const fetchLoan = async () => {
            try {
                const res = await fetch('/api/loans');
                const data = await res.json();
                const foundLoan = data.find((l: any) => l.id === id);

                if (foundLoan) {
                    // Calculate derived fields if missing
                    const principal = parseFloat(foundLoan.amount);
                    const interestRate = 0.125; // 12.5%
                    const termDays = parseInt(foundLoan.term) || 30;
                    const interest = (principal * interestRate * (termDays / 365)).toFixed(2);
                    const totalRepayment = (principal + parseFloat(interest)).toFixed(2);

                    setLoan({
                        ...foundLoan,
                        principal: foundLoan.amount,
                        interest,
                        totalRepayment,
                        collateralLocked: foundLoan.collateral,
                        ltvAtOrigination: '75%', // Mocked for now
                        dateBorrowed: foundLoan.date,
                        dueDate: new Date(new Date(foundLoan.date).getTime() + termDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        interestRate: '12.5% APR'
                    });
                }
            } catch (e) {
                console.error("Failed to fetch loan details:", e);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchLoan();
    }, [id, isConfirmed]); // Refetch on confirmation

    // Read On-Chain Loan Data
    const { data: onChainLoan } = useReadContract({
        address: MICRO_LENDER_ADDRESS,
        abi: MICRO_LENDER_ABI,
        functionName: 'loans',
        args: [address as `0x${string}`],
        query: { enabled: !!address },
    });

    const onChainDebt = onChainLoan ? parseFloat(formatEther((onChainLoan as any)[1])) : 0;

    const handleRepay = async () => {
        if (!loan || !address) return;

        if (onChainDebt <= 0) {
            alert("Error: No active debt found on-chain. This loan might be from an old deployment or already repaid.");
            return;
        }

        try {
            // 1. On-Chain Repayment
            writeContract({
                address: MICRO_LENDER_ADDRESS,
                abi: MICRO_LENDER_ABI,
                functionName: 'repay',
                value: parseEther(loan.totalRepayment), // Repay full amount
            });

            // 2. Sync with Backend (will happen after confirmation via useEffect)
        } catch (e) {
            console.error("Repayment Failed:", e);
        }
    };

    // Effect to sync backend after successful on-chain repayment
    useEffect(() => {
        if (isConfirmed && loan) {
            const updateBackend = async () => {
                try {
                    console.log("Repayment Confirmed on Chain! Syncing with Backend...");

                    const res = await fetch('/api/loans', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: loan.id,
                            status: 'Repaid'
                        }),
                    });

                    if (!res.ok) {
                        throw new Error(`Backend sync failed: ${res.statusText}`);
                    }

                    const updatedLoan = await res.json();
                    console.log("Loan Repaid in Backend:", updatedLoan);
                    setLoan({ ...loan, status: 'Repaid' }); // Optimistic local update
                    alert("Loan Repaid Successfully!");

                } catch (e) {
                    console.error("Backend Sync Failed:", e);
                    alert("Repayment confirmed on-chain, but failed to update status in database.");
                }
            };
            updateBackend();
        }
    }, [isConfirmed]); // Remove 'loan' from dependency to avoid loop, though 'loan' is needed inside. Better to use ref or check status.

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!loan) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Loan Not Found</h1>
                <Link href="/borrower/loans" className="text-pink-500 hover:underline">Back to History</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-pink-500 selection:text-white">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-violet-600 rounded-lg" />
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Credora
                        </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/borrower/loans" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                            Back to History
                        </Link>
                        <ConnectButton />
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-3xl font-bold">Loan {loan.id}</h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${loan.status === 'Active' || loan.status === 'Pending' ? 'bg-blue-500/20 text-blue-400' :
                            loan.status === 'Repaid' ? 'bg-green-500/20 text-green-400' :
                                'bg-red-500/20 text-red-400'
                            }`}>
                            {loan.status}
                        </span>
                    </div>
                    <p className="text-gray-400">Borrowed on {loan.dateBorrowed}</p>
                </div>

                <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    {/* Main Details Card */}
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">Financial Details</h3>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Principal Amount</p>
                                <p className="text-xl font-bold text-white">${Number(loan.principal).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Interest Accrued</p>
                                <p className="text-xl font-bold text-pink-400">+${loan.interest}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Repayment</p>
                                <p className="text-2xl font-bold text-white">${Number(loan.totalRepayment).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Due Date</p>
                                <p className="text-xl font-bold text-white">{loan.dueDate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Collateral & Risk Card */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Collateral Locked</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold">₿</div>
                                <div>
                                    <p className="text-lg font-bold text-white">{loan.collateralLocked}</p>
                                    <p className="text-xs text-gray-500">Bitcoin on Flare</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Risk Metrics</p>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-sm text-gray-400">LTV at Origination</p>
                                    <p className="text-lg font-bold text-white">{loan.ltvAtOrigination}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">APR</p>
                                    <p className="text-lg font-bold text-white">{loan.interestRate}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {(loan.status === 'Active' || loan.status === 'Pending') && (
                        <div className="p-8 rounded-2xl bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Ready to Repay?</h3>
                                <p className="text-sm text-gray-400">Repaying early improves your Credora Trust Score.</p>
                            </div>
                            <button
                                onClick={handleRepay}
                                disabled={isPending || isConfirming}
                                className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition-all shadow-lg shadow-green-600/20 w-full md:w-auto disabled:opacity-50"
                            >
                                {isPending || isConfirming ? 'Repaying...' : `Repay $${Number(loan.totalRepayment).toLocaleString()}`}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
