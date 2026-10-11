# RechargeMatch

**Terrain-Aware Stormwater Runoff Routing & Groundwater Recharge Planning Engine for Urban Drainage Wards**

RechargeMatch is a civil and hydrological decision-support platform designed for municipal drainage engineers, Resident Welfare Associations (RWAs), and urban planners. Focusing on **South Delhi Ward 142 (Defence Colony / Lajpat Nagar — Kushak Nala Sub-Basin)**, it routes overland monsoon runoff by gravity from chronic waterlogging hotspots to downhill public parks, institutional campuses, and municipal grounds, while enforcing physical elevation constraints, soil percolation limits, and groundwater quality safety gates.

---

## Table of Contents

1. [Overview & Problem Statement](#1-overview--problem-statement)
2. [Core Capabilities](#2-core-capabilities)
3. [Hydrological Formulation & Physics Engine](#3-hydrological-formulation--physics-engine)
4. [Hard Physical Constraints & Safety Gates](#4-hard-physical-constraints--safety-gates)
5. [System Architecture & Tech Stack](#5-system-architecture--tech-stack)
6. [Project Structure](#6-project-structure)
7. [Getting Started (Local Development)](#7-getting-started-local-development)
8. [Automated Verification & Back-Testing](#8-automated-verification--back-testing)
9. [AWS Cloud Integration & Deployment Guide](#9-aws-cloud-integration--deployment-guide)
10. [Statutory Engineering Disclaimer](#10-statutory-engineering-disclaimer)

---

## 1. Overview & Problem Statement

Urban wards in Delhi experience a recurring hydrological paradox:
- **Monsoon Inundation (July–September):** Intense convective rain events submerge arterial underpasses (e.g., Moolchand Underpass, Ring Road, Kushak Nala corridor) under knee-to-waist-deep water.
- **Aquifer Depletion (March–June):** The same neighborhoods face severe groundwater over-exploitation (**124.3% extraction stage** per CGWB Dynamic Groundwater Assessment), relying on water tankers as borewells run dry.

Conventional GIS siting tools often use naive Euclidean distance, inadvertently recommending recharge structures *uphill* from flood origins or inside sewage-contaminated drain corridors. **RechargeMatch** solves this by coupling Digital Elevation Model (DEM) gravity routing with Central Ground Water Board (CGWB) infiltration mechanics and transparent absorption-gap accounting.

---

## 2. Core Capabilities

- **Interactive Siting Map (`Satellite`, `Vector`, `Topo`):**
  - Dual-engine cartographic workspace featuring live Google Maps (`@vis.gl/react-google-maps`) alongside a custom vector topographic surveyor canvas.
  - Real-time overland flow accumulation heatmap with adjustable opacity, confidence filters (`Baseline`, `Verified`, `Crowdsourced`), and flood depth filters (`Waist`, `Knee`, `Ankle`).
- **Hotspot & Design Dossier Inspector:**
  - Detailed breakdown of upstream catchment area, impervious land cover, and recommended civil intervention (e.g., *Park Perimeter Infiltration Trench*, *Campus Recharge Shaft*, *Multi-Stage Infiltration Pit*, or *Bio-Detention Basin*).
  - One-click **Civil Engineering Siting Memorandum** generator formatted for Municipal Corporation of Delhi (MCD) and Delhi Jal Board (DJB) review.
- **Pre-Monsoon Priority Ledger:**
  - Ranked ward-level build schedule across all 10 hotspots and 32 candidate sites.
  - Multi-criteria sorting (Maximum Flood Relief, Annual Yield, Match Score, Elevation Drop, Shortest Flow Path) and interactive heuristic weight tuning.
- **Historical Storm Replay:**
  - Instantaneous re-computation across standard municipal design storms (30 mm, 60 mm, 100 mm) and real historical Delhi deluges (**28 June 2024 — 228 mm record onset**, **9 July 2023 — 153 mm surge**, **11 August 2024 — 74 mm cloudburst**).
- **Citizen Waterlogging Dispatch:**
  - 4-field crowd-sourced reporting workflow with browser GPS coordinate lock, photo attachment, and automatic EXIF metadata sanitization.
- **Automated Verification & Expert Back-Test:**
  - Built-in assertion suite verifying physical invariants and side-by-side blind back-test comparisons against senior drainage and groundwater engineers.

---

## 3. Hydrological Formulation & Physics Engine

All volume estimates are computed across three confidence bounds (`low`, `base`, `high`) following CGWB and CPWD urban drainage screening standards:

| Parameter | Equation | Variables & Units |
| :--- | :--- | :--- |
| **1. Catchment Sheet Runoff** | $$V_{\text{runoff}} = C \times P \times A$$ | $C$: Area-weighted runoff coefficient ($0.25$ green to $0.92$ paved)<br>$P$: Storm rainfall depth ($\text{m}$)<br>$A$: Delineated upstream catchment area ($\text{m}^2$) |
| **2. Physical Tank Storage** | $$V_{\text{store}} = L \times W \times D \times \eta_{\text{void}}$$ | $L, W, D$: Structure footprint dimensions ($\text{m}$)<br>$\eta_{\text{void}}$: Void ratio ($0.40\text{--}0.45$ gravel trench, $0.85$ shaft, $1.0$ open basin) |
| **3. 48-Hour Soil Percolation** | $$V_{\text{drain}} = f \times A_{\text{floor}} \times T$$ | $f$: Hydraulic conductivity ($\text{m/h}$, from $6\text{ mm/h}$ clay loam to $30\text{ mm/h}$ sandy loam)<br>$A_{\text{floor}}$: Effective infiltrating surface area ($\text{m}^2$)<br>$T$: Design drain-down window ($48\text{ hours}$) |
| **4. Structure Design Capacity** | $$V_{\text{design}} = \min(V_{\text{store}}, V_{\text{drain}})$$ | Governed by the stricter of geometric volume or 48-hour vadose percolation capacity |
| **5. Ward Absorption Gap** | $$V_{\text{gap}} = V_{\text{runoff}} - \sum V_{\text{captured}}$$ | Residual unabsorbed runoff volume requiring supplementary trunk drain conveyance |

---

## 4. Hard Physical Constraints & Safety Gates

1. **Gravity Reachability Constraint (Zero Uphill Flow):**
   - Any candidate site where $\text{Elevation}_{\text{site}} > \text{Elevation}_{\text{hotspot}} + 0.3\text{ m}$ (DEM noise tolerance) is automatically rejected. Water cannot flow uphill without mechanical pumping.
2. **Sewage & Nala Contamination Gate:**
   - Hotspots or candidate sites within $40\text{ m}$ of unlined sewage-carrying channels (such as Kushak Nala backflow zones) are prohibited from direct aquifer recharge and automatically downgraded to `DETENTION ONLY` ($0\text{ m}^3$ direct groundwater injection).
3. **Vadose Zone Protection ($>3.0\text{ m}$ BGL):**
   - Candidate sites with shallow water tables ($<3.0\text{ m}$ below ground level) are penalized and flagged to prevent direct contaminant short-circuiting into the unconfined aquifer.
4. **Mandatory Silt Trap & First-Flush Interceptor:**
   - 100% of recommended recharge structures enforce a dual-chamber desilting forebay to trap urban vehicular grit and suspended solids before infiltration.
5. **48-Hour Vector Control Drain-Down:**
   - Structures are checked to ensure standing water empties within 48 hours, preventing mosquito vector breeding.

---

## 5. System Architecture & Tech Stack

- **Frontend Framework:** React 19, TypeScript, Vite 8
- **Styling & Typography:** Tailwind CSS v4 (`Newsreader` editorial serif, `Instrument Sans` UI sans, `JetBrains Mono` tabular telemetry)
- **Geospatial & Mapping:** `@vis.gl/react-google-maps` (Google Maps JavaScript API) + Custom SVG Topographic Contour Engine
- **Icons:** `lucide-react`
- **Cloud Integration Layer:** AWS API Gateway, AWS Lambda, Amazon DynamoDB, Amazon S3 (`src/services/awsService.ts`)

---

## 6. Project Structure

```text
rechargematch/
├── index.html                        # Entry HTML & typography imports
├── package.json                      # Dependencies and build scripts
├── tsconfig.json                     # TypeScript configuration
├── vite.config.ts                    # Vite bundler configuration
├── .env.example                      # Environment variable template (Google Maps & AWS)
└── src/
    ├── main.tsx                      # React DOM root mount
    ├── App.tsx                       # Main application state, routing, and Siting Map workspace
    ├── index.css                     # Tailwind CSS v4 layer definitions
    ├── components/
    │   ├── Header.tsx                # Top navigation bar, storm selector, and CSV export trigger
    │   ├── LandingPage.tsx           # Full-bleed overview page & Ward 142 vector illustration
    │   ├── GisMap.tsx                # Google Maps & Topographic Surveyor canvas with flow heatmap
    │   ├── HotspotPanel.tsx          # Selected hotspot dossier, 3x3 spec grid, and Siting Memo modal
    │   ├── BuildListTable.tsx        # Pre-Monsoon Priority Ledger table, KPIs, and filters
    │   ├── ValidationTestsModal.tsx  # Automated physical constraint & formula verification suite
    │   ├── ExpertValidationModal.tsx # 10-hotspot blind peer-review comparison against DJB/IIT experts
    │   ├── StormReplaySelector.tsx   # Design storm & historical cloudburst replay modal
    │   ├── CitizenReportModal.tsx    # Geotagged waterlogging dispatch form with S3 upload support
    │   ├── WeightTuningModal.tsx     # Multi-criteria heuristic weight sliders
    │   ├── AssumptionsModal.tsx      # CGWB mathematical formulas & soil conductivity reference
    │   └── DemoScriptModal.tsx       # Interactive walkthrough controller
    ├── data/
    │   └── wardData.ts               # Seeded Ward 142 hotspots, 32 candidate sites, storms, and back-test data
    ├── services/
    │   └── awsService.ts             # AWS API Gateway, Lambda, DynamoDB, and S3 pre-signed upload client
    ├── types/
    │   └── hydrology.ts              # Core TypeScript interfaces for hydrology and siting results
    └── utils/
        ├── matchingEngine.ts         # Gravity filtering, multi-factor scoring, and capacity sizing engine
        ├── unitTests.ts              # Automated runtime verification suite
        └── csvExport.ts              # Municipal CSV schedule exporter
```

---

## 7. Getting Started (Local Development)

### Prerequisites
- **Node.js** `>= 18.x` and **npm** `>= 9.x`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yashvasudeva1/RechargeMatch.git
   cd RechargeMatch
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env` and add your Google Maps API key (and optional AWS API Gateway endpoint):
   ```bash
   cp .env.example .env
   ```
   ```env
   VITE_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"
   VITE_AWS_REGION="ap-south-1"
   VITE_AWS_API_GATEWAY_URL=""
   VITE_AWS_S3_BUCKET_URL=""
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Type-check and build for production:**
   ```bash
   npm run lint
   npm run build
   ```

---

## 8. Automated Verification & Back-Testing

Navigate to the **Verification** tab in the application to execute the 5 core engineering checks (`src/utils/unitTests.ts`):

1. **Constraint Correctness (`test-1-uphill-constraint`):** Verifies that `0` of the 30 recommended site matches across Ward 142 lie hydraulically uphill of their flood hotspot.
2. **Worked Example Reproduction (`test-2-worked-example`):** Confirms exact reproduction of the reference benchmark ($A = 20,000\text{ m}^2$, $P = 60\text{ mm}$, $C = 0.85 \implies V_{\text{runoff}} = 1,020\text{ m}^3$, $V_{\text{store}} = 300\text{ m}^3$, $V_{\text{drain}} = 96\text{ m}^3$, $V_{\text{design}} = 96\text{ m}^3$, $V_{\text{gap}} = 924\text{ m}^3$).
3. **Sewage Safety Gate (`test-3-safety-gate-sewage`):** Confirms that sewage-adjacent hotspots (`hs-2`, `hs-10`) are downgraded to `detention_only` with $0\text{ m}^3$ direct aquifer injection.
4. **Silt Trap Mandate (`test-4-silt-trap-gate`):** Confirms 100% of recommended structures include pre-settling silt traps and first-flush diverters.
5. **Ground-Truth Expert Back-Test (`test-5-expert-backtest`):** Validates `93%` top-3 ranking overlap (`28 / 30` slots) against blind evaluations by former DJB and IIT Delhi engineers, transparently documenting the 2 partial discrepancies.

---

## 9. AWS Cloud Integration & Deployment Guide

RechargeMatch includes a built-in AWS service adapter (`src/services/awsService.ts`) that connects the frontend to **Amazon API Gateway**, **AWS Lambda**, **Amazon DynamoDB**, and **Amazon S3** when `VITE_AWS_API_GATEWAY_URL` is provided.

### Architecture Overview

```text
┌──────────────────────────────┐         ┌───────────────────────────┐
│   Users / Municipal Planners │         │  AWS Amplify / CloudFront │
│     (Desktop & Mobile)       │────────▶│   + Amazon S3 (Frontend)  │
└──────────────┬───────────────┘         └───────────────────────────┘
               │ HTTPS (REST)
               ▼
┌──────────────────────────────┐
│     Amazon API Gateway       │
│  (/wards, /reports, /uploads)│
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│ AWS Lambda  │  │ AWS Lambda  │
│ (Ward/Report│  │ (S3 Presign │
│   Handler)  │  │   Generator)│
└──────┬──────┘  └──────┬──────┘
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│  Amazon     │  │  Amazon S3  │
│  DynamoDB   │  │ (Sanitized  │
│ (Reports &  │  │  Evidence   │
│  Hotspots)  │  │  Photos)    │
└─────────────┘  └─────────────┘
```

### Part A: Frontend Hosting via AWS Amplify (Recommended)

1. Push this repository to GitHub.
2. Open the **AWS Management Console** $\rightarrow$ **AWS Amplify** $\rightarrow$ **Create new app** $\rightarrow$ **GitHub**.
3. Select your `rechargematch` repository and `main` branch.
4. Amplify automatically detects Vite. Verify the build specification (`amplify.yml`):
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
5. Under **Environment variables** in AWS Amplify, add:
   - `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps JavaScript API key
   - `VITE_AWS_REGION`: `ap-south-1` (Mumbai)
   - `VITE_AWS_API_GATEWAY_URL`: Your API Gateway Invoke URL (from Part B)
6. Click **Save and deploy**. Amplify will provision an SSL-enabled global CloudFront distribution and redeploy automatically on every `git push`.

### Part B: Serverless Backend Setup (DynamoDB + S3 + Lambda + API Gateway)

#### Step 1: Create DynamoDB Table
1. Open **Amazon DynamoDB** (`ap-south-1`) $\rightarrow$ **Create table**:
   - **Table name:** `RechargeMatchReports`
   - **Partition key:** `wardId` (String)
   - **Sort key:** `id` (String)
   - **Capacity mode:** On-demand (Pay-per-request)

#### Step 2: Create S3 Bucket for Citizen Field Photos
1. Open **Amazon S3** $\rightarrow$ **Create bucket**:
   - **Bucket name:** `rechargematch-ward-evidence-ap-south-1`
   - Configure **CORS** under the bucket's **Permissions** tab:
     ```json
     [
       {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "PUT", "HEAD"],
         "AllowedOrigins": ["*"],
         "ExposeHeaders": ["ETag"]
       }
     ]
     ```

#### Step 3: Create AWS Lambda Function (`RechargeMatchApiHandler`)
1. Open **AWS Lambda** $\rightarrow$ **Create function** (`Node.js 20.x`, region `ap-south-1`).
2. Attach an IAM Role Policy granting `dynamodb:PutItem`, `dynamodb:Query`, and `s3:PutObject` on your table and bucket.
3. Deploy the following handler (`index.mjs`):
   ```javascript
   import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
   import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
   import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
   import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

   const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
   const s3 = new S3Client({ region: process.env.AWS_REGION });

   const TABLE_NAME = process.env.DDB_TABLE || "RechargeMatchReports";
   const BUCKET_NAME = process.env.S3_BUCKET || "rechargematch-ward-evidence-ap-south-1";

   const corsHeaders = {
     "Access-Control-Allow-Origin": "*",
     "Access-Control-Allow-Headers": "Content-Type",
     "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT"
   };

   export const handler = async (event) => {
     const method = event.requestContext?.http?.method || event.httpMethod;
     const path = event.rawPath || event.path || "";

     if (method === "OPTIONS") {
       return { statusCode: 200, headers: corsHeaders, body: "" };
     }

     try {
       // POST /reports - Store new citizen waterlogging dispatch
       if (method === "POST" && path.endsWith("/reports")) {
         const report = JSON.parse(event.body || "{}");
         const item = {
           wardId: "ward-142",
           id: report.id || `rep-${Date.now()}`,
           ...report,
           createdAt: new Date().toISOString()
         };
         await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
         return {
           statusCode: 201,
           headers: corsHeaders,
           body: JSON.stringify({ synced: true, id: item.id })
         };
       }

       // POST /uploads/presign - Generate S3 pre-signed URL for photo upload
       if (method === "POST" && path.endsWith("/uploads/presign")) {
         const { fileName, contentType } = JSON.parse(event.body || "{}");
         const key = `reports/${Date.now()}-${(fileName || "photo.jpg").replace(/[^a-zA-Z0-9._-]/g, "_")}`;
         const command = new PutObjectCommand({
           Bucket: BUCKET_NAME,
           Key: key,
           ContentType: contentType || "image/jpeg"
         });
         const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
         const publicFileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
         return {
           statusCode: 200,
           headers: corsHeaders,
           body: JSON.stringify({ uploadUrl, publicFileUrl })
         };
       }

       // GET /wards/ward-142 - Fetch stored citizen reports
       if (method === "GET" && path.includes("/wards/")) {
         const wardId = path.split("/").pop() || "ward-142";
         const result = await ddb.send(
           new QueryCommand({
             TableName: TABLE_NAME,
             KeyConditionExpression: "wardId = :w",
             ExpressionAttributeValues: { ":w": wardId }
           })
         );
         return {
           statusCode: 200,
           headers: corsHeaders,
           body: JSON.stringify({ reports: result.Items || [] })
         };
       }

       return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: "Not found" }) };
     } catch (err) {
       return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
     }
   };
   ```

#### Step 4: Expose via Amazon API Gateway (HTTP API)
1. Open **Amazon API Gateway** $\rightarrow$ **Create API** $\rightarrow$ **HTTP API**.
2. Add your `RechargeMatchApiHandler` Lambda integration and create routes:
   - `GET /wards/{wardId}`
   - `POST /reports`
   - `POST /uploads/presign`
3. Enable **CORS** (`Access-Control-Allow-Origin: *`, methods `GET, POST, PUT, OPTIONS`).
4. Copy the **Invoke URL** (e.g., `https://xyz123.execute-api.ap-south-1.amazonaws.com`) and set it as `VITE_AWS_API_GATEWAY_URL` in your `.env` or AWS Amplify Environment Variables.

---

## 10. Statutory Engineering Disclaimer

> **Screening-Level Civil Estimate:** All outputs generated by RechargeMatch are pre-feasibility hydrological screening estimates based on 30m DEM elevation models, IMD Safdarjung precipitation records, and CGWB alluvial soil conductivity tables. A 30m DEM cannot resolve micro-gutters, local compound walls, or kerb geometry. On-site dumpy-level topographical surveys, double-ring infiltrometer soil tests, and formal municipal approvals from MCD / DJB are mandatory prior to civil excavation.
