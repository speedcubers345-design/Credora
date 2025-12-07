# Credora Fraud Detection Layer

This module implements an AI-powered, blockchain-aware fraud detection system for the Credora micro-loan platform.

## Architecture

The system is built as a set of modular services in `services/fraud/` and exposed via a Next.js API route.

### Modules

1.  **`fraudContextBuilder.ts`**: Aggregates data from multiple sources to build a comprehensive user profile.
    *   **On-Chain Data**: Queries Flare/Coston2 for loan history and wallet activity.
    *   **FDC (Flare Data Connector)**: Mocks identity signals like device fingerprint and IP country.
    *   **Internal DB**: Retrieves historical loan performance.

2.  **`fraudRules.ts`**: A deterministic rule engine that flags known suspicious patterns.
    *   *Sybil Suspect*: >3 linked wallets.
    *   *Loan Spam*: >5 requests in 24h.
    *   *Strategic Default Risk*: High value loan with little history.
    *   *Risky Recipient*: Interaction with blacklisted addresses.

3.  **`geminiFraudModel.ts`**: Integrates **Google Gemini 1.5 Flash** to analyze the context and rules.
    *   Synthesizes behavioral data into a single risk score (0-1).
    *   Provides natural language explanations for the risk assessment.

4.  **`onChainFraudUpdater.ts`**: (Mocked) Updates the borrower's fraud score on a smart contract (e.g., `RiskScoreNFT`).

5.  **`fraudService.ts`**: Orchestrates the flow: Context -> Rules -> AI -> DB/Chain -> Response.

### API Endpoint

**POST** `/api/fraud/evaluate-loan`

**Request Body:**
```json
{
  "userId": "user_123",
  "walletAddress": "0x...",
  "amount": "5000",
  "assetSymbol": "C2FLR",
  "collateralAmount": "100"
}
```

**Response:**
```json
{
  "fraudRiskLevel": "LOW",
  "fraudRiskScore": 0.15,
  "triggeredRules": [],
  "modelFlags": [],
  "explanation": "User demonstrates consistent repayment history and healthy collateral ratios.",
  "timestamp": 1700000000000
}
```

## Setup

Ensure `GEMINI_API_KEY` and `PRIVATE_KEY` are set in your `.env` file.
