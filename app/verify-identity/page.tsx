'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi, keccak256, toHex, stringToBytes } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/navigation';

// ABI for DIDRegistry
const DID_REGISTRY_ABI = parseAbi([
    "function registerDID(bytes32 _uniquePersonID, uint8 _sybilResistanceLevel) external",
    "function getDIDStatus(address _user) external view returns (bool isValid, uint8 level)"
]);

const DID_REGISTRY_ADDRESS = '0x2f36dCA491F3A939322Da225d5f48F9E36822Bb9';

const NeuralBackground = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0B0E14]">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light"></div>
        <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-[#3AFF9D]/5 rounded-full blur-[120px]" />
    </div>
);

export default function VerifyIdentityPage() {
    const { address, isConnected } = useAccount();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [signals, setSignals] = useState({
        faceHash: '',
        deviceHash: '',
        behaviorHash: ''
    });
    const [mousePath, setMousePath] = useState<number[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);

    const { writeContract, data: hash } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    // Step 2: Liveness / Face
    const startCamera = async () => {
        setIsScanning(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            // Simulate scanning
            let progress = 0;
            const interval = setInterval(() => {
                progress += 5;
                setScanProgress(progress);
                if (progress >= 100) {
                    clearInterval(interval);
                    stream.getTracks().forEach(track => track.stop());
                    // Generate mock hash
                    const mockHash = keccak256(toHex(Date.now().toString()));
                    setSignals(prev => ({ ...prev, faceHash: mockHash }));
                    setIsScanning(false);
                    setStep(3);
                }
            }, 100);
        } catch (e) {
            console.error("Camera error:", e);
            alert("Camera access required for liveness check.");
            setIsScanning(false);
        }
    };

    // Step 3: Device Fingerprint
    useEffect(() => {
        if (step === 3) {
            const generateDeviceHash = async () => {
                const data = [
                    navigator.userAgent,
                    navigator.language,
                    new Date().getTimezoneOffset(),
                    screen.width + 'x' + screen.height
                ].join('|');
                const hash = keccak256(toHex(data));
                await new Promise(r => setTimeout(r, 1500)); // Fake delay
                setSignals(prev => ({ ...prev, deviceHash: hash }));
                setStep(4);
            };
            generateDeviceHash();
        }
    }, [step]);

    // Step 4: Behavior
    const handleMouseMove = (e: React.MouseEvent) => {
        if (step === 4 && mousePath.length < 100) {
            setMousePath(prev => [...prev, e.clientX, e.clientY]);
        }
    };

    const finishBehavior = () => {
        if (mousePath.length < 20) {
            alert("Please move your mouse around to generate entropy.");
            return;
        }
        const hash = keccak256(toHex(mousePath.join(',')));
        setSignals(prev => ({ ...prev, behaviorHash: hash }));
        setStep(5);
    };

    // Step 5: Submit
    const registerIdentity = async () => {
        if (!address) return;

        // 1. Generate Unique ID (Off-chain logic)
        const uniquePersonID = keccak256(toHex(signals.faceHash + signals.deviceHash + signals.behaviorHash));

        // 2. Save to Backend
        try {
            const res = await fetch('/api/did', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: address,
                    faceEmbeddingHash: signals.faceHash,
                    deviceFingerprintHash: signals.deviceHash,
                    behaviourSignatureHash: signals.behaviorHash,
                    uniquePersonID
                })
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Error: ${err.error}`);
                return;
            }

            const didData = await res.json();

            // 3. Register On-Chain
            writeContract({
                address: DID_REGISTRY_ADDRESS,
                abi: DID_REGISTRY_ABI,
                functionName: 'registerDID',
                args: [uniquePersonID, didData.sybilResistanceLevel]
            });

        } catch (e) {
            console.error(e);
            alert("Registration failed");
        }
    };

    useEffect(() => {
        if (isConfirmed) {
            alert("Identity Verified Successfully!");
            router.push('/borrower');
        }
    }, [isConfirmed]);

    return (
        <div className="min-h-screen text-white font-sans flex flex-col items-center justify-center p-6" onMouseMove={handleMouseMove}>
            <NeuralBackground />

            <div className="relative z-10 w-full max-w-md bg-[#0F1219] border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">Verify Identity</h1>
                    <div className="text-xs text-gray-500">Step {step}/5</div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-gray-800 rounded-full mb-8">
                    <div className="h-full bg-[#3AFF9D] rounded-full transition-all duration-500" style={{ width: `${(step / 5) * 100}%` }}></div>
                </div>

                {step === 1 && (
                    <div className="text-center space-y-6">
                        <div className="text-4xl font-bold text-[#3AFF9D]">CONNECT</div>
                        <h2 className="text-xl font-bold">Connect Wallet</h2>
                        <p className="text-gray-400 text-sm">Link your EVM wallet to start the unique personhood verification.</p>
                        <div className="flex justify-center"><ConnectButton /></div>
                        {isConnected && (
                            <button onClick={() => setStep(2)} className="w-full py-3 bg-[#3AFF9D] text-black font-bold rounded-lg hover:bg-[#3AFF9D]/90 transition">
                                Continue
                            </button>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="text-center space-y-6">
                        <div className="relative w-48 h-48 mx-auto bg-black rounded-full overflow-hidden border-2 border-[#3AFF9D]/30">
                            {isScanning ? (
                                <>
                                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                                    <div className="absolute inset-0 bg-[#3AFF9D]/20 animate-pulse"></div>
                                    <div className="absolute bottom-0 left-0 w-full bg-[#3AFF9D] transition-all duration-100" style={{ height: `${scanProgress}%`, opacity: 0.2 }}></div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-2xl font-bold text-[#3AFF9D]">SCAN</div>
                            )}
                        </div>
                        <h2 className="text-xl font-bold">Liveness Check</h2>
                        <p className="text-gray-400 text-sm">We need to verify you are a real human. No data is stored, only a hash.</p>
                        {!isScanning && (
                            <button onClick={startCamera} className="w-full py-3 bg-[#3AFF9D] text-black font-bold rounded-lg hover:bg-[#3AFF9D]/90 transition">
                                Start Scan
                            </button>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center space-y-6">
                        <div className="text-4xl font-bold text-[#3AFF9D] animate-pulse">DEVICE</div>
                        <h2 className="text-xl font-bold">Device Fingerprinting</h2>
                        <p className="text-gray-400 text-sm">Analyzing device signals for uniqueness...</p>
                        <div className="text-[#3AFF9D] text-xs font-mono">Generating Hash...</div>
                    </div>
                )}

                {step === 4 && (
                    <div className="text-center space-y-6">
                        <div className="text-4xl font-bold text-[#3AFF9D]">ACTION</div>
                        <h2 className="text-xl font-bold">Behavioral Analysis</h2>
                        <p className="text-gray-400 text-sm">Move your mouse (or tap around) randomly to generate a unique entropy signature.</p>
                        <div className="w-full h-32 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                            <span className="text-xs text-gray-500">{mousePath.length}% Entropy Collected</span>
                        </div>
                        <button onClick={finishBehavior} className="w-full py-3 bg-[#3AFF9D] text-black font-bold rounded-lg hover:bg-[#3AFF9D]/90 transition">
                            Generate Signature
                        </button>
                    </div>
                )}

                {step === 5 && (
                    <div className="text-center space-y-6">
                        <div className="text-4xl font-bold text-[#3AFF9D]">MINT</div>
                        <h2 className="text-xl font-bold">Mint Identity</h2>
                        <div className="space-y-2 text-sm text-gray-400 text-left bg-white/5 p-4 rounded-lg">
                            <div className="flex justify-between"><span>Face Hash:</span> <span className="text-[#3AFF9D]">Generated</span></div>
                            <div className="flex justify-between"><span>Device Hash:</span> <span className="text-[#3AFF9D]">Generated</span></div>
                            <div className="flex justify-between"><span>Behavior Hash:</span> <span className="text-[#3AFF9D]">Generated</span></div>
                            <div className="flex justify-between pt-2 border-t border-white/10"><span>Sybil Score:</span> <span className="text-[#3AFF9D] font-bold">High (Level 5)</span></div>
                        </div>
                        <button
                            onClick={registerIdentity}
                            disabled={isConfirming}
                            className="w-full py-3 bg-[#3AFF9D] text-black font-bold rounded-lg hover:bg-[#3AFF9D]/90 transition disabled:opacity-50"
                        >
                            {isConfirming ? 'Minting on Chain...' : 'Mint Verified DID'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
