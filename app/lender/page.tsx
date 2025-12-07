'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';

// --- Sub-Components ---

const NeuralBackground = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light"></div>
        <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-[#00D2FF]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[10%] left-[10%] w-[80%] h-[60%] bg-[#3AFF9D]/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00D2FF]/10 rounded-full blur-[120px]" />
    </div>
);

const MICRO_LENDER_ADDRESS = '0xaE8AF28498Ab6e91935D341065FFC3C824d91326';

export default function LenderPage() {
    const { address, isConnected } = useAccount();
    const [supplyAmount, setSupplyAmount] = useState('');
    const [loans, setLoans] = useState<any[]>([]);
    const [fundedLoans, setFundedLoans] = useState<any[]>([]);
    const [fundingId, setFundingId] = useState<string | null>(null);

    // Fetch Loans
    const fetchLoans = async () => {
        try {
            const res = await fetch('/api/loans');
            const data = await res.json();
            // Filter for active/pending loans for the lender view
            setLoans(data.filter((l: any) => l.status === 'Pending'));
            // Filter for loans funded by this user
            if (address) {
                setFundedLoans(data.filter((l: any) => l.lender === address));
            }
        } catch (e) {
            console.error("Failed to fetch loans:", e);
        }
    };

    useEffect(() => {
        fetchLoans();
        // Poll every 5 seconds to keep in sync
        const interval = setInterval(fetchLoans, 5000);
        return () => clearInterval(interval);
    }, [address]);

    // Contract Balance (Liquidity Pool)
    const { data: contractBalance, refetch: refetchContractBalance } = useBalance({
        address: MICRO_LENDER_ADDRESS,
    });

    // Send Transaction (Supply Liquidity)
    const { sendTransaction, data: hash, isPending, error: sendError } = useSendTransaction();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    const handleSupply = () => {
        if (!supplyAmount) return;
        sendTransaction({
            to: MICRO_LENDER_ADDRESS,
            value: parseEther(supplyAmount),
        });
    };

    const handleFund = async (loanId: string, amount: string) => {
        if (!address) return;
        setFundingId(loanId);

        try {
            // 1. Send funds to contract (Simulating funding specific loan)
            // In a real P2P, this might go to the borrower or a specific pool. 
            // Here we just add to the general pool for simplicity but mark it as "Funded by X".

            // Note: For this demo, we assume the user approves the "Supply" transaction manually via the button first
            // OR we can trigger a transaction here. Let's trigger it.

            sendTransaction({
                to: MICRO_LENDER_ADDRESS,
                value: parseEther(amount.replace(/,/g, '')), // Handle commas
            });

            // We wait for the effect [isConfirmed] to update the backend
            // But since we can't easily pass the ID through the wagmi hook effect without complex state,
            // We'll do an optimistic update or wait for the user to confirm the tx hash.

            // For this demo, we'll assume success if the tx is sent to the wallet
            // and update the backend immediately (Optimistic UI).

            await fetch('/api/loans', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: loanId,
                    status: 'Active',
                    lender: address
                }),
            });

            alert("Loan Funded Successfully!");
            fetchLoans(); // Refresh list

        } catch (e) {
            console.error("Funding Error:", e);
            alert("Failed to fund loan.");
        } finally {
            setFundingId(null);
        }
    };

    useEffect(() => {
        if (isConfirmed) {
            setSupplyAmount('');
            refetchContractBalance();
        }
    }, [isConfirmed, refetchContractBalance]);

    return (
        <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#3AFF9D]/30 selection:text-[#3AFF9D] relative overflow-x-hidden">
            <NeuralBackground />

            {/* Navbar */}
            <Navbar />

            <main className="relative z-10 pt-32 pb-20 px-6 max-w-5xl mx-auto">
                {!isConnected ? (
                    <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <h1 className="text-4xl font-bold mb-6">Become a Liquidity Provider</h1>
                        <p className="text-gray-400 mb-8">Earn yield by funding the next generation of micro-loans.</p>
                        <div className="flex justify-center">
                            <ConnectButton />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Lender Dashboard</h1>
                                <p className="text-gray-400">Supply liquidity and track protocol performance.</p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#00D2FF]/10 border border-[#00D2FF]/20 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-[#00D2FF] animate-pulse" />
                                <span className="text-sm font-medium text-[#00D2FF]">Pool Active</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-2xl bg-[#0F1219] border border-white/5">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Liquidity</p>
                                <p className="text-3xl font-bold text-white">
                                    {contractBalance ? parseFloat(formatEther(contractBalance.value)).toFixed(2) : '0.00'}
                                    <span className="text-lg text-gray-500 ml-1">C2FLR</span>
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-[#0F1219] border border-white/5">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current APY</p>
                                <p className="text-3xl font-bold text-[#3AFF9D]">12.5%</p>
                                <p className="text-xs text-[#3AFF9D]/60 mt-1">+2.1% from last week</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-[#0F1219] border border-white/5">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Active Loans</p>
                                <p className="text-3xl font-bold text-white">{loans.length + fundedLoans.length}</p>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Supply Liquidity Panel */}
                            <div className="lg:col-span-1">
                                <div className="p-8 rounded-2xl bg-gradient-to-b from-[#0F1219] to-black border border-white/10 sticky top-24">
                                    <h3 className="text-xl font-bold mb-6">Supply Liquidity</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Amount (C2FLR)</label>
                                            <input
                                                type="number"
                                                value={supplyAmount}
                                                onChange={(e) => setSupplyAmount(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D2FF] transition-colors"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="p-4 rounded-xl bg-[#00D2FF]/10 border border-[#00D2FF]/20">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-400">Est. Weekly Yield</span>
                                                <span className="text-white font-bold">
                                                    {supplyAmount ? (parseFloat(supplyAmount) * 0.125 / 52).toFixed(4) : '0.00'} C2FLR
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#00D2FF]/60">Based on current 12.5% APY</p>
                                        </div>
                                        <button
                                            onClick={handleSupply}
                                            disabled={isPending || !supplyAmount}
                                            className="w-full py-4 bg-[#00D2FF] hover:bg-[#00D2FF]/80 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#00D2FF]/20"
                                        >
                                            {isPending ? 'Supplying...' : 'Supply Pool'}
                                        </button>
                                        {hash && (
                                            <div className="text-center">
                                                <p className="text-xs text-[#3AFF9D] mt-2">Transaction Sent!</p>
                                                <p className="text-[10px] text-gray-600 font-mono break-all">{hash}</p>
                                            </div>
                                        )}
                                        {sendError && (
                                            <p className="text-xs text-red-400 text-center mt-2">{sendError.message.slice(0, 50)}...</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Active Loans List */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="p-8 rounded-2xl bg-[#0F1219] border border-white/5">
                                    <h3 className="text-xl font-bold mb-6">Active Borrower Requests</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-white/10">
                                                    <th className="pb-4 pl-2">Borrower</th>
                                                    <th className="pb-4">Trust Score</th>
                                                    <th className="pb-4">Amount</th>
                                                    <th className="pb-4">Term</th>
                                                    <th className="pb-4 text-right pr-2">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {loans.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="py-8 text-center text-gray-500">No active requests found.</td>
                                                    </tr>
                                                ) : (
                                                    loans.map((loan) => (
                                                        <tr key={loan.id} className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                                            <td className="py-4 pl-2 font-mono text-gray-300 flex items-center gap-2">
                                                                {loan.borrower.slice(0, 6)}...{loan.borrower.slice(-4)}
                                                                {loan.hasRedFlag && (
                                                                    <span title="Red Flag: Prior Default" className="cursor-help text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">!</span>
                                                                )}
                                                            </td>
                                                            <td className="py-4">
                                                                <span className={`px-2 py-1 rounded text-xs font-bold ${loan.score >= 800 ? 'bg-green-500/20 text-green-400' :
                                                                    loan.score >= 700 ? 'bg-yellow-500/20 text-yellow-400' :
                                                                        'bg-red-500/20 text-red-400'
                                                                    }`}>
                                                                    {loan.score}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 font-medium">${loan.amount}</td>
                                                            <td className="py-4 text-gray-400">{loan.term}</td>
                                                            <td className="py-4 text-right pr-2">
                                                                <button
                                                                    onClick={() => handleFund(loan.id, loan.amount)}
                                                                    disabled={fundingId === loan.id}
                                                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                                                >
                                                                    {fundingId === loan.id ? 'Funding...' : 'Fund'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* My Funded Loans */}
                                <div className="p-8 rounded-2xl bg-[#0F1219] border border-white/5">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <span className="text-[#3AFF9D] font-mono text-lg">PORTFOLIO</span> My Funded Loans
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-white/10">
                                                    <th className="pb-4 pl-2">Loan ID</th>
                                                    <th className="pb-4">Borrower</th>
                                                    <th className="pb-4">Amount</th>
                                                    <th className="pb-4">Status</th>
                                                    <th className="pb-4 text-right pr-2">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {fundedLoans.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="py-8 text-center text-gray-500">You haven't funded any loans yet.</td>
                                                    </tr>
                                                ) : (
                                                    fundedLoans.map((loan) => (
                                                        <tr key={loan.id} className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                                            <td className="py-4 pl-2 text-gray-400">{loan.id}</td>
                                                            <td className="py-4 font-mono text-gray-300">
                                                                {loan.borrower.slice(0, 6)}...{loan.borrower.slice(-4)}
                                                            </td>
                                                            <td className="py-4 font-medium">${loan.amount}</td>
                                                            <td className="py-4">
                                                                <span className="px-2 py-1 rounded text-xs font-bold bg-[#3AFF9D]/20 text-[#3AFF9D]">
                                                                    Active
                                                                </span>
                                                            </td>
                                                            <td className="py-4 text-right pr-2 text-gray-400">{loan.date}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
