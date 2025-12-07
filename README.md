# 🏦 Credora: AI-Powered Micro-Lending on Flare

**Credora** is a next-generation decentralized micro-lending platform built on the **Flare Network**. It bridges the gap between Web2 identity and Web3 finance, enabling under-collateralized and collateralized loans using **Bitcoin (fBTC)** as collateral.

## 🚀 Key Features & Deep Tech

### 1. 🆔 Decentralized Identity (DID) System
A privacy-preserving "Proof of Personhood" system that verifies unique humanity without KYC.
- **Multi-Signal Entropy**: Generates a unique `uniquePersonID` by combining:
  - **Biometric Liveness**: Simulated face scan hash.
  - **Device Fingerprinting**: Hardware and browser signatures.
  - **Behavioral Analysis**: Mouse movement and interaction patterns.
- **Sybil Resistance**: Assigns a "Sybil Score" (1-5) to prevent bot attacks.

### 2. 🧠 AI-Powered Credit Scoring
A Hybrid Compute model that assesses borrower risk off-chain and verifies it on-chain.
- **Wallet Analysis**: Scans transaction history, liquidation events, and asset holding duration.
- **Score Generation**: Calculates a credit score (300-850) that dynamically sets:
  - **Max LTV (Loan-to-Value)**: Higher scores get better leverage.
  - **Interest Rates**: Lower risk = lower rates.
- **Cryptographic Attestation**: The API signs the score, and the `MicroLender` smart contract verifies the signature before approving loans.

### 3. 🛡️ Fraud Prevention & RedFlagNFT
An on-chain reputation system to deter default and malicious behavior.
- **RedFlagNFT (Soulbound)**: A non-transferable ERC-721 token automatically minted to a borrower's wallet if they default on a loan.
- **Permanent Scar**: Other protocols can query the `RedFlagNFT` contract to deny service to bad actors.
- **Duplicate Prevention**: The DID registry blocks multiple wallets from registering with the same face/device hash.

### 4. ⚡ Flare Network Integration
Leveraging Flare's native interoperability protocols.
- **FAssets (fBTC)**: Allows users to use non-smart contract assets (Bitcoin) as collateral for DeFi loans.
- **FTSO (Flare Time Series Oracle)**: Provides decentralized, high-frequency price feeds for BTC/USD and FLR/USD to calculate real-time health factors and trigger liquidations.

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS (Glassmorphism UI).
- **Blockchain**: Solidity, Hardhat, Ethers.js.
- **Web3 Integration**: Wagmi, Viem, RainbowKit.
- **Network**: Flare Coston2 Testnet.

## 📜 Smart Contracts (Coston2)

| Contract | Address | Description |
|----------|---------|-------------|
| **MicroLender** | `0xaE8AF28498Ab6e91935D341065FFC3C824d91326` | Main lending logic, collateral management. |
| **DIDRegistry** | `0x2f36dCA491F3A939322Da225d5f48F9E36822Bb9` | Stores unique identity hashes and scores. |
| **RedFlagNFT** | `0xb9484a062c039a9806b3663EBfB40DB6198702f4` | Soulbound token for defaulters. |
| **FTSO (Mock)** | `0xb86AF393672c648854a85D95ff89D2EFe84087F2` | Price oracle feeds. |
| **FBTC (Mock)** | `0xf2fAeDba4331Ed3da9e2A2E96f91A67B20C0F5aC` | Mock Bitcoin FAsset for testing. |

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd microloans2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

## 🧪 How to Test

1. **Connect Wallet**: Use Metamask connected to Coston2 Testnet.
2. **Verify Identity**: Go to "Borrow" -> Complete the 5-step DID verification.
3. **Get Credit Score**: Click "Analyze Score" to generate your AI risk profile.
4. **Borrow**: Lock Mock FBTC and borrow C2FLR.
5. **Repay**: Repay the loan to unlock your collateral.
