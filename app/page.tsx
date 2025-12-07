'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// --- Sub-Components ---

const NeuralBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    {/* Base Stars/Noise */}
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light"></div>

    {/* Aurora Gradients */}
    <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-[#00D2FF]/10 rounded-full blur-[120px] animate-pulse" />
    <div className="absolute top-[10%] left-[10%] w-[80%] h-[60%] bg-[#3AFF9D]/10 rounded-full blur-[130px]" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00D2FF]/10 rounded-full blur-[120px]" />

    {/* Neural Nodes (CSS Animation) */}
    <div className="absolute inset-0 opacity-20">
      <svg className="w-full h-full">
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#3AFF9D" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
        {/* Animated Lines */}
        <path d="M0,100 Q400,300 800,100 T1600,100" fill="none" stroke="#3AFF9D" strokeWidth="1" strokeOpacity="0.2" className="animate-dash" />
        <path d="M0,300 Q600,500 1200,300 T2400,300" fill="none" stroke="#00D2FF" strokeWidth="1" strokeOpacity="0.2" className="animate-dash delay-1000" />
      </svg>
    </div>
  </div>
);

const Badge = ({ level }: { level: number }) => (
  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#3AFF9D]/30 bg-[#3AFF9D]/10 text-[#3AFF9D] text-[10px] font-bold uppercase tracking-wider">
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
    Level {level} Identity
  </div>
);

const BorrowSimulator = () => {
  const [score, setScore] = useState(750);
  const maxLoan = Math.round((score / 900) * 10000);
  const apy = (15 - (score / 100)).toFixed(1);
  const risk = score > 700 ? 'Low' : score > 600 ? 'Medium' : 'High';
  const riskColor = score > 700 ? 'text-[#3AFF9D]' : score > 600 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="p-6 rounded-xl bg-[#0B0E14] border border-white/10">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-bold text-gray-300">Borrow Power Simulator</h4>
        <span className={`text-xs font-bold ${riskColor}`}>{risk} Risk</span>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Credit Score</span>
          <span className="text-white font-mono">{score}</span>
        </div>
        <input
          type="range"
          min="300"
          max="900"
          value={score}
          onChange={(e) => setScore(parseInt(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#3AFF9D]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-white/5">
          <div className="text-xs text-gray-500">Limit</div>
          <div className="text-lg font-bold text-white">${maxLoan.toLocaleString()}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5">
          <div className="text-xs text-gray-500">APY</div>
          <div className="text-lg font-bold text-[#3AFF9D]">{apy}%</div>
        </div>
      </div>
    </div>
  );
};

const CreditGauge = ({ score }: { score: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ((score / 900) * circumference);

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
        <circle cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-[#3AFF9D] transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-white">{score}</div>
        <div className="text-[10px] text-gray-400 uppercase">Excellent</div>
      </div>
    </div>
  );
};

const FraudHeatmap = () => (
  <div className="grid grid-cols-6 gap-1 p-4 bg-[#0B0E14] rounded-xl border border-white/10 w-full">
    {[...Array(24)].map((_, i) => {
      const isBlocked = [2, 5, 11, 15, 19, 22].includes(i);
      return (
        <div key={i} className={`h-6 rounded-sm ${isBlocked ? 'bg-red-500/50 animate-pulse' : 'bg-white/5'}`} title={isBlocked ? "Blocked Attempt" : "Safe"} />
      );
    })}
    <div className="col-span-6 flex justify-between items-center mt-2">
      <span className="text-[10px] text-gray-500">Last 24h Activity</span>
      <span className="text-[10px] text-red-400 font-bold">6 Threats Blocked</span>
    </div>
  </div>
);

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// --- Main Page Component ---

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#3AFF9D]/30 selection:text-[#3AFF9D] overflow-x-hidden">
      <NeuralBackground />

      {/* Navbar */}
      <Navbar />

      <main className="relative z-10 pt-32 pb-20">

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 mb-32 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="text-left">
              <FadeIn delay={100}>
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="px-3 py-1 rounded-full bg-[#3AFF9D]/10 border border-[#3AFF9D]/20 text-[#3AFF9D] text-xs font-bold animate-pulse">No KYC — AI Identity Only</span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-bold">Borrow in Seconds</span>
                  <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold">No Collateral for High Scores</span>
                </div>
              </FadeIn>

              <FadeIn delay={200}>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-[1.1]">
                  AI-Powered <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3AFF9D] via-[#00D2FF] to-[#3AFF9D] animate-text-shimmer">Trustless Lending</span>
                </h1>
              </FadeIn>

              <FadeIn delay={300}>
                <p className="text-lg text-gray-400 mb-10 leading-relaxed max-w-xl">
                  On-chain AI identity, dynamic credit scoring, and real-time fraud detection built on decentralized data.
                </p>
              </FadeIn>

              <FadeIn delay={400}>
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Link href="/borrower" className="group relative px-8 py-4 bg-white text-black rounded-full font-bold overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shine" />
                    <span className="relative z-10">Enter Borrower Dashboard</span>
                  </Link>
                  <Link href="/lender" className="group relative px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-bold overflow-hidden transition-all hover:bg-white/10 hover:scale-105 hover:border-white/30">
                    <span className="relative z-10">Enter Lender Dashboard</span>
                  </Link>
                </div>
              </FadeIn>

              <FadeIn delay={500}>
                <div className="flex items-center gap-6 text-gray-500 text-sm font-medium">
                  <div className="flex items-center gap-2 hover:text-white transition-colors">
                    <svg className="w-5 h-5 text-[#3AFF9D]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Audited
                  </div>
                  <div className="flex items-center gap-2 hover:text-white transition-colors">
                    <svg className="w-5 h-5 text-[#00D2FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Powered by Flare
                  </div>
                  <div className="flex items-center gap-2 hover:text-white transition-colors">
                    <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    ZK Encryption
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Right Dashboard Preview */}
            <FadeIn delay={600} className="relative animate-float">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#3AFF9D] to-[#00D2FF] rounded-2xl blur opacity-20 animate-pulse"></div>
              <div className="relative bg-[#0F1219]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 grid grid-cols-2 gap-6 shadow-2xl hover:shadow-[0_0_40px_-10px_rgba(0,210,255,0.3)] transition-shadow duration-500">
                {/* Top Row */}
                <div className="col-span-2 flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-500">0x</div>
                    <div>
                      <div className="text-sm font-bold text-white">0x12...8F3A</div>
                      <Badge level={4} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 uppercase">Status</div>
                    <div className="text-sm font-bold text-[#3AFF9D]">Verified</div>
                  </div>
                </div>

                {/* Gauge & Heatmap */}
                <div className="flex flex-col items-center justify-center p-4 bg-black/40 rounded-xl border border-white/5 hover:border-[#3AFF9D]/30 transition-colors">
                  <div className="text-xs text-gray-400 mb-2">Real-Time Score</div>
                  <CreditGauge score={750} />
                </div>
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-black/40 rounded-xl border border-white/5 hover:border-red-500/30 transition-colors">
                    <div className="text-xs text-gray-400 mb-2">Fraud Firewall</div>
                    <FraudHeatmap />
                  </div>
                </div>

                {/* Simulator */}
                <div className="col-span-2">
                  <BorrowSimulator />
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Core Value Cards */}
        <section id="features" className="max-w-7xl mx-auto px-6 mb-32">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "AI Identity Layer", label: "01", desc: "On-chain DID and behavioral analysis prevents fake KYC, Sybil attacks, and bots.", color: "text-[#3AFF9D]", bg: "bg-[#3AFF9D]/10", shadow: "hover:shadow-[0_0_30px_-5px_rgba(58,255,157,0.2)]" },
              { title: "AI Credit Score", label: "02", desc: "Evaluates repayment history, identity strength, and transaction patterns to generate a dynamic score.", color: "text-[#00D2FF]", bg: "bg-[#00D2FF]/10", shadow: "hover:shadow-[0_0_30px_-5px_rgba(0,210,255,0.2)]" },
              { title: "AI Fraud Detection", label: "03", desc: "Real-time engine monitors wallet anomalies and velocity. Automatically blocks risky wallets.", color: "text-red-400", bg: "bg-red-500/10", shadow: "hover:shadow-[0_0_30px_-5px_rgba(248,113,113,0.2)]" }
            ].map((card, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className={`h-full p-8 rounded-2xl bg-[#0F1219] border border-white/5 hover:border-white/10 transition-all duration-300 group hover:scale-105 ${card.shadow}`}>
                  <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center text-xl font-bold font-mono mb-6 group-hover:scale-110 transition-transform duration-300 ${card.color}`}>
                    {card.label}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                    {card.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">{card.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 mb-32">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-gray-400">Trustless lending in 4 simple steps.</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>
            {[
              { title: "Create AI Identity", label: "I", desc: "Connect wallet & verify on-chain." },
              { title: "Get Credit Score", label: "II", desc: "Instant analysis of your history." },
              { title: "Borrow Funds", label: "III", desc: "Access liquidity based on score." },
              { title: "Earn Yield", label: "IV", desc: "Lenders earn from safe borrowers." }
            ].map((step, i) => (
              <FadeIn key={i} delay={i * 150} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-2xl bg-[#0B0E14] border border-white/10 flex items-center justify-center text-2xl font-bold font-mono mb-6 shadow-xl group-hover:scale-110 group-hover:border-[#3AFF9D]/30 transition-all duration-300 group-hover:shadow-[0_0_20px_-5px_rgba(58,255,157,0.3)] text-gray-500 group-hover:text-[#3AFF9D]">
                  {step.label}
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-[#3AFF9D] transition-colors">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Deep Dives Grid */}
        <section className="max-w-7xl mx-auto px-6 mb-32 space-y-24">

          {/* Identity Engine */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <div>
                <div className="text-[#3AFF9D] font-mono text-sm mb-4">01. IDENTITY ENGINE</div>
                <h2 className="text-3xl font-bold mb-6">On-Chain Digital Identity</h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  Our identity engine creates a unique fingerprint for every user based on their on-chain behavior, ensuring Sybil resistance without invasive KYC.
                </p>
                <ul className="space-y-4">
                  {["On-chain DID (Decentralized ID)", "Sybil resistance model", "Behavioural fingerprinting", "Identity refresh logic"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3AFF9D] animate-pulse"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={200}>
              <div className="p-8 bg-[#0F1219] rounded-3xl border border-white/5 relative overflow-hidden group hover:border-[#3AFF9D]/20 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#3AFF9D]/5 rounded-full blur-[80px] group-hover:bg-[#3AFF9D]/10 transition-colors duration-500"></div>
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-white/5 hover:translate-x-2 transition-transform duration-300">
                    <span className="text-gray-400">Wallet Age</span>
                    <span className="text-white font-mono">3.2 Years</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-white/5 hover:translate-x-2 transition-transform duration-300 delay-75">
                    <span className="text-gray-400">Tx Count</span>
                    <span className="text-white font-mono">1,402</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-white/5 hover:translate-x-2 transition-transform duration-300 delay-150">
                    <span className="text-gray-400">Unique Interactions</span>
                    <span className="text-white font-mono">84 Contracts</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-300">Identity Strength</span>
                    <Badge level={4} />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Credit Score Engine */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeIn delay={200} className="order-2 md:order-1">
              <div className="p-8 bg-[#0F1219] rounded-3xl border border-white/5 relative group hover:border-[#00D2FF]/20 transition-colors duration-500">
                <div className="flex items-center justify-center h-64">
                  {/* Simple CSS Pie Chart Representation */}
                  <div className="relative w-48 h-48 rounded-full border-[16px] border-[#00D2FF]/20 border-t-[#00D2FF] border-r-[#3AFF9D] transform rotate-45 group-hover:rotate-[225deg] transition-transform duration-[1.5s] ease-in-out">
                    <div className="absolute inset-0 flex items-center justify-center flex-col transform -rotate-45 group-hover:-rotate-[225deg] transition-transform duration-[1.5s]">
                      <span className="text-3xl font-bold text-white">750</span>
                      <span className="text-xs text-gray-500">CREDIT SCORE</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="text-center">
                    <div className="text-[#00D2FF] font-bold text-lg">40%</div>
                    <div className="text-xs text-gray-500">Repayment History</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#3AFF9D] font-bold text-lg">30%</div>
                    <div className="text-xs text-gray-500">Collateral Ratio</div>
                  </div>
                </div>
              </div>
            </FadeIn>
            <FadeIn className="order-1 md:order-2">
              <div>
                <div className="text-[#00D2FF] font-mono text-sm mb-4">02. SCORING ENGINE</div>
                <h2 className="text-3xl font-bold mb-6">Dynamic Credit Scoring</h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  Scores update in real-time based on your repayment behavior and market conditions. Higher scores unlock lower rates and under-collateralized loans.
                </p>
                <ul className="space-y-4">
                  {["Real-time update animation", "Income signal analysis", "Risk pattern detection", "Score ranges: 100–900"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00D2FF] animate-pulse"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>

          {/* Fraud Firewall */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <div>
                <div className="text-red-400 font-mono text-sm mb-4">03. FRAUD FIREWALL</div>
                <h2 className="text-3xl font-bold mb-6">Active Threat Defense</h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  Our AI monitors the mempool and transaction velocity to detect attacks before they settle. Suspicious wallets are auto-frozen.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-default">
                    <span className="text-sm text-red-200">Wallet Flagged: 0x8...92a</span>
                    <span className="text-xs font-bold text-red-400 animate-pulse">BLOCKED</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-default">
                    <span className="text-sm text-red-200">Identity Mismatch Detected</span>
                    <span className="text-xs font-bold text-red-400 animate-pulse">ALERT</span>
                  </div>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={200}>
              <div className="p-8 bg-[#0F1219] rounded-3xl border border-white/5 hover:border-red-500/30 transition-colors duration-500">
                <FraudHeatmap />
                <div className="mt-6 text-center">
                  <div className="text-4xl font-bold text-white mb-1">14,203</div>
                  <div className="text-sm text-gray-500">Threats Neutralized This Month</div>
                </div>
              </div>
            </FadeIn>
          </div>

        </section>

        {/* Flare Tech Section */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Powered by Flare Network</h2>
              <p className="text-gray-400">Leveraging the data protocols for trustless finance.</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: "FTSO", desc: "Decentralized price feeds for accurate interest rates.", label: "FTSO" },
              { title: "FDC", desc: "Verifying off-chain identity and credit data.", label: "FDC" },
              { title: "FAssets", desc: "Bringing non-smart contract assets (BTC, XRP) to DeFi.", label: "FAssets" },
              { title: "Smart Accounts", desc: "Automated risk controls and loan execution.", label: "Smart" }
            ].map((tech, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="h-full p-6 rounded-xl bg-[#0B0E14] border border-white/10 hover:border-[#3AFF9D]/50 hover:shadow-[0_0_20px_-5px_rgba(58,255,157,0.2)] transition-all duration-300 text-center group hover:-translate-y-2">
                  <div className="text-xs font-bold font-mono text-gray-500 mb-4 group-hover:text-[#3AFF9D] transition-colors">{tech.label}</div>
                  <h3 className="font-bold text-white mb-2 group-hover:text-[#3AFF9D] transition-colors">{tech.title}</h3>
                  <p className="text-xs text-gray-400">{tech.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Transparency Section */}
        <section className="max-w-7xl mx-auto px-6 mb-32 border-y border-white/5 py-16 bg-[#0B0E14]/50">
          <FadeIn>
            <div className="grid md:grid-cols-4 gap-8 text-center divide-x divide-white/5">
              <div className="group cursor-default">
                <div className="text-3xl font-bold text-white mb-1 group-hover:text-[#3AFF9D] transition-colors">$4.2M</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Live Reserves</div>
              </div>
              <div className="group cursor-default">
                <div className="text-3xl font-bold text-[#3AFF9D] mb-1 group-hover:scale-110 transition-transform">150%</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Risk Buffer</div>
              </div>
              <div className="group cursor-default">
                <div className="text-3xl font-bold text-white mb-1 group-hover:text-red-400 transition-colors">0.8%</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Bad Debt</div>
              </div>
              <div className="group cursor-default">
                <div className="text-3xl font-bold text-[#00D2FF] mb-1 group-hover:scale-110 transition-transform">100%</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Open Source</div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* Choose Your Journey */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <FadeIn>
            <h2 className="text-3xl font-bold mb-12 text-center">Choose Your Journey</h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            <FadeIn delay={100} className="h-full">
              <Link href="/lender" className="h-full block group relative p-8 rounded-3xl bg-gradient-to-b from-blue-900/10 to-black border border-white/10 hover:border-blue-500/50 transition-all hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] hover:-translate-y-2 duration-300">
                <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-400 transition-colors">Lender Dashboard</h3>
                <ul className="space-y-3 mb-8 text-gray-400 text-sm">
                  <li>✓ Earn high APY returns</li>
                  <li>✓ View borrower risk levels</li>
                  <li>✓ Real-time default protection</li>
                </ul>
                <span className="text-blue-400 font-bold group-hover:gap-3 transition-all flex items-center gap-2">Enter Dashboard →</span>
              </Link>
            </FadeIn>

            <FadeIn delay={200} className="h-full">
              <Link href="/borrower" className="h-full block group relative p-8 rounded-3xl bg-gradient-to-b from-[#3AFF9D]/10 to-black border border-white/10 hover:border-[#3AFF9D]/50 transition-all hover:shadow-[0_0_40px_-10px_rgba(58,255,157,0.3)] hover:-translate-y-2 duration-300">
                <h3 className="text-2xl font-bold mb-4 group-hover:text-[#3AFF9D] transition-colors">Borrower Dashboard</h3>
                <ul className="space-y-3 mb-8 text-gray-400 text-sm">
                  <li>✓ Check your AI Credit Score</li>
                  <li>✓ Instant loan approval</li>
                  <li>✓ Build on-chain reputation</li>
                </ul>
                <span className="text-[#3AFF9D] font-bold group-hover:gap-3 transition-all flex items-center gap-2">Enter Dashboard →</span>
              </Link>
            </FadeIn>

            <FadeIn delay={300} className="h-full">
              <Link href="/explore" className="h-full block group relative p-8 rounded-3xl bg-gradient-to-b from-purple-900/10 to-black border border-white/10 hover:border-purple-500/50 transition-all hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)] hover:-translate-y-2 duration-300">
                <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-400 transition-colors">Explore Protocol</h3>
                <ul className="space-y-3 mb-8 text-gray-400 text-sm">
                  <li>✓ View protocol analytics</li>
                  <li>✓ Live fraud alerts</li>
                  <li>✓ Credit score distribution</li>
                </ul>
                <span className="text-purple-400 font-bold group-hover:gap-3 transition-all flex items-center gap-2">Start Exploring →</span>
              </Link>
            </FadeIn>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0B0E14] py-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-[#3AFF9D] flex items-center justify-center">
                <span className="text-black font-bold text-xs">C</span>
              </div>
              <span className="font-bold text-white">Credora</span>
            </div>
            <p className="text-xs text-gray-500">The intelligent lending platform for the decentralized web.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/borrower" className="hover:text-[#3AFF9D]">Borrow</Link></li>
              <li><Link href="/lender" className="hover:text-[#3AFF9D]">Lend</Link></li>
              <li><Link href="#" className="hover:text-[#3AFF9D]">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 text-sm">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-[#3AFF9D]">Documentation</Link></li>
              <li><Link href="#" className="hover:text-[#3AFF9D]">API Reference</Link></li>
              <li><Link href="#" className="hover:text-[#3AFF9D]">Community</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-[#3AFF9D]">About</Link></li>
              <li><Link href="#" className="hover:text-[#3AFF9D]">Careers</Link></li>
              <li><Link href="#" className="hover:text-[#3AFF9D]">Contact</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
