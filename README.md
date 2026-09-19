# TrustLedger — Digital Lending Security Intelligence

> **Detect. Verify. Connect. Protect.**  
> *One application. Multiple signals. Explainable risk.*

TrustLedger is an enterprise-grade fraud intelligence and lending verification platform. It enables modern digital lenders and underwriters to systematically uncover document tampering, biometric deepfakes, and cross-application synthetic fraud rings before disbursement.

---

## Key Features

1. **AI Document Forensics**: Detects glyph anomalies, table baseline tampering, Ghostscript metadata mismatches, and layout tampering across bank statements and paystubs.
2. **Photo & KYC Biometric Studio**: Real browser camera capture (`navigator.mediaDevices.getUserMedia`) for government identity documents and live selfies, with 3D liveness detection, 96% 1:1 Euclidean face matching, and frequency-domain deepfake detection.
3. **Fraud Network Intelligence**: Interactive network graph revealing multi-application entity collisions (shared hardware IMEIs, common bank accounts, synthetic identity anagrams, and IP subnets).
4. **Cryptographic Verification Ledger**: Append-only tamper-evident verification chain using SHA-256 state hashes:
   $$\text{current\_hash} = \text{SHA256}(\text{prev\_hash} + \text{artifact\_hash} + \text{timestamp} + \text{record\_data})$$
5. **Explainable 4-Pillar Risk Engine**:
   - Document Risk (30%)
   - KYC Biometrics (30%)
   - Fraud Network Risk (25%)
   - Verification Integrity (15%)
6. **Live Threat Alert Triage**: Real-time severity classification (Critical, High, Medium, Low) with underwriter escalation protocols.
7. **Institutional Reporting**: Portfolio risk breakdown, anomaly distribution, and CSV export for compliance auditing.

---

## Visual Design System

TrustLedger rejects generic blue SaaS styling in favor of a focused, high-contrast security palette:
- **Deep Plum (`#24132F`, `#1A0E23`)**: Brand foundation, persistent navigation sidebar, outer canvases.
- **Charcoal (`#17151C`, `#121017`)**: Analytical panels, data tables, and card elevation.
- **Electric Violet (`#8B5CF6`)**: AI intelligence, neural biometrics, active analysis states.
- **Vibrant Coral (`#F05A5A`)**: High risk, fraud warnings, deepfake alerts, and critical indicators.
- **Warm Amber (`#F4A340`)**: Suspicious flags, medium risk, and manual review required.
- **Mint (`#62D6A7`)**: Verified checks, successful face match, and cryptographic chain integrity.
- **Cream (`#FFF7EA`)**: Focused login card and high-contrast focal surfaces.

---

## Architecture

```
[ React + TypeScript + Vite + Tailwind CSS ]
                    │
                    ▼  (REST / JSON / Multipart)
        [ FastAPI (Python 3.11+) ]
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
[ SQLite ORM ]  [ Analysis ]   [ SHA-256 Ledger ]
(11 Tables)     (Forensics)    (Hash-Chain Engine)
```

---

## Installation & Setup

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend is served at `http://localhost:5173` and proxies `/api` calls directly to the FastAPI server at `http://127.0.0.1:8000`.

---

## User Onboarding & Authentication
 
 TrustLedger features enterprise multi-tenant user authentication and isolation:
 - **Email & Password Registration**: `/register` with client & server-side password strength validation (100,000-iteration PBKDF2-HMAC-SHA256 password hashing).
 - **Google OAuth 2.0**: One-click Google sign-in using standard OpenID Connect (`/api/auth/google/url` & `/api/auth/google/callback`).
 - **Tenant Data Isolation**: Complete separation across all 11 database tables via authenticated `user_id` foreign keys.
 - **Dynamic Underwriting**: Manual loan application intake (`+ New Application`) with real-time cross-application fraud collision detection (shared PAN, phone, or bank accounts).

---

## Prototype Limitations & Production Roadmap

- **Prototype Analysis Inference**: Document forensic checks, biometric liveness, and deepfake detection in this build use deterministic prototype inference pipelines to demonstrate the end-to-end underwriter workflow without external cloud model latency.
- **Scoring Engine**: The 4-pillar risk formula is an illustrative scoring framework. Production deployment requires training against historical portfolio default and delinquency datasets.
- **Storage & Security**: Images are stored in a controlled local sandbox. Production environments should utilize AES-256 encrypted S3/GCS buckets with hardware security modules (HSM) for ledger signing keys.
