'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface NavbarProps {
    creditScore?: number | null;
}

export default function Navbar({ creditScore }: NavbarProps) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed top-0 w-full z-50 bg-[#0B0E14]/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[#3AFF9D]/20 group-hover:bg-[#3AFF9D]/30 transition-colors"></div>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#3AFF9D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 17L12 22L22 17" stroke="#3AFF9D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="#3AFF9D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white group-hover:text-[#3AFF9D] transition-colors">Credora</span>
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link
                        href="/borrower"
                        className={`text-sm font-medium transition-colors relative group ${isActive('/borrower') ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Borrow
                        <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-[#3AFF9D] transform origin-left transition-transform duration-300 ${isActive('/borrower') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                    </Link>
                    <Link
                        href="/lender"
                        className={`text-sm font-medium transition-colors relative group ${isActive('/lender') ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Lend
                        <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-[#00D2FF] transform origin-left transition-transform duration-300 ${isActive('/lender') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                    </Link>
                    <Link
                        href="/borrower/loans"
                        className={`text-sm font-medium transition-colors relative group ${isActive('/borrower/loans') ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        History
                        <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-purple-500 transform origin-left transition-transform duration-300 ${isActive('/borrower/loans') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                    </Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {creditScore && (
                        <div className="hidden md:flex items-center gap-2 bg-[#3AFF9D]/10 px-4 py-2 rounded-full border border-[#3AFF9D]/20 animate-in fade-in zoom-in duration-500">
                            <span className="w-2 h-2 rounded-full bg-[#3AFF9D] animate-pulse" />
                            <span className="text-sm font-medium text-[#3AFF9D]">Score: {creditScore}</span>
                        </div>
                    )}
                    <div className="scale-90 transform hover:scale-95 transition-transform">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}
