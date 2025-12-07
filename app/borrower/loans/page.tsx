'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function LoanHistoryPage() {
    const [loans, setLoans] = useState<any[]>([]);

    useEffect(() => {
        const fetchLoans = async () => {
            try {
                const res = await fetch('/api/loans');
                const data = await res.json();
                setLoans(data);
            } catch (e) {
                console.error("Failed to fetch history:", e);
            }
        };
        fetchLoans();
    }, []);

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
                        <Link href="/borrower" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                            Back to Dashboard
                        </Link>
                        <ConnectButton />
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Loan History</h1>
                        <p className="text-gray-400">Track your borrowing journey and reputation.</p>
                    </div>
                </div>

                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-white/10">
                                    <th className="pb-4 pl-2">Loan ID</th>
                                    <th className="pb-4">Date</th>
                                    <th className="pb-4">Amount (C2FLR)</th>
                                    <th className="pb-4">Collateral</th>
                                    <th className="pb-4">Status</th>
                                    <th className="pb-4 text-right pr-2">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {loans.map((loan) => (
                                    <tr key={loan.id} className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                        <td className="py-4 pl-2 font-mono text-gray-300">{loan.id}</td>
                                        <td className="py-4 text-gray-400">{loan.date}</td>
                                        <td className="py-4 font-bold text-white">${loan.amount}</td>
                                        <td className="py-4 text-gray-400">{loan.collateral}</td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${loan.status === 'Active' ? 'bg-blue-500/20 text-blue-400' :
                                                loan.status === 'Repaid' ? 'bg-green-500/20 text-green-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                {loan.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right pr-2">
                                            <Link
                                                href={`/borrower/loans/${loan.id}`}
                                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors inline-block"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
