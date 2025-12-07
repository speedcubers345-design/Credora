'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function TransferPage() {
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [showSuccessLink, setShowSuccessLink] = useState(false);

    const startMonitoring = async () => {
        setIsMonitoring(true);
        setShowSuccessLink(false);
        setLogs(['Initializing Operator Service...']);

        try {
            // Simulate detecting the event on XRPL
            await new Promise(r => setTimeout(r, 1000));
            setLogs(prev => [...prev, 'Detected Payment on XRPL (TxID: 5A2...9F1)']);

            // Call Middleware
            setLogs(prev => [...prev, 'Triggering Smart Account Middleware...']);

            const res = await fetch('/api/smart-account/process-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: 'XRPL_PAYMENT',
                    txId: '5A2...9F1',
                    sender: '0x71C...9A21', // Mock Sender
                    amount: '5000',
                    asset: 'XRP'
                })
            });

            const data = await res.json();

            if (res.ok) {
                // Visualize the steps returned by the middleware
                data.steps.forEach((step: any, index: number) => {
                    setTimeout(() => {
                        setLogs(prev => [...prev, `[Middleware] ${step.name}: ${step.status}`]);
                        if (step.txHash) {
                            setLogs(prev => [...prev, `[Chain] Transaction Executed: ${step.txHash.substring(0, 10)}...`]);
                        }
                    }, (index + 1) * 1000);
                });

                setTimeout(() => {
                    setLogs(prev => [...prev, 'Transfer Complete. Assets Minted & Loan Created.']);
                    setIsMonitoring(false);
                    setShowSuccessLink(true);
                }, (data.steps.length + 2) * 1000);
            } else {
                setLogs(prev => [...prev, `Error: ${data.error}`]);
                setIsMonitoring(false);
            }

        } catch (e) {
            console.error(e);
            setLogs(prev => [...prev, 'System Error: Connection Failed']);
            setIsMonitoring(false);
        }
    };

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
                        <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                            Back to Home
                        </Link>
                        <ConnectButton />
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
                <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6">
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Flare Smart Account</span>
                    </div>
                    <h1 className="text-5xl font-bold mb-6">Cross-Chain Transfer Bridge</h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Seamlessly move assets from XRPL to Flare using our automated Operator Service and State Connector.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                    <div className="space-y-8">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -z-10" />
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-blue-400">1.</span> Monitor XRPL
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                The Operator Service continuously listens for specific payment transactions on the XRP Ledger intended for the bridge.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -z-10" />
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-purple-400">2.</span> Verify & Relay
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Once detected, the transaction is verified using the Flare State Connector to ensure finality and authenticity.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl -z-10" />
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-pink-400">3.</span> Execute on Flare
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                The Smart Account automatically mints or releases the corresponding wrapped assets (e.g., FXRP) on the Flare network.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">Operator Console</h3>
                            <div className="flex gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                            </div>
                        </div>

                        <div className="h-64 bg-black/50 rounded-xl p-4 font-mono text-xs text-green-400 overflow-y-auto mb-6 border border-white/5">
                            <p className="opacity-50 mb-2">// System Ready. Waiting for command...</p>
                            {logs.map((log, i) => (
                                <p key={i} className="mb-2 animate-in fade-in slide-in-from-left-2">
                                    <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
                                </p>
                            ))}
                            {isMonitoring && (
                                <p className="animate-pulse">_</p>
                            )}
                        </div>

                        <button
                            onClick={startMonitoring}
                            disabled={isMonitoring}
                            className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isMonitoring ? 'Processing Transfer...' : 'Simulate XRPL Transfer'}
                        </button>

                        {showSuccessLink && (
                            <div className="mt-4 text-center animate-in fade-in slide-in-from-top-2">
                                <p className="text-green-400 text-sm mb-2">✓ Loan successfully created from Smart Account action.</p>
                                <Link href="/borrower/loans" className="text-sm font-bold text-white underline hover:text-gray-300">
                                    View in Loan History →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
