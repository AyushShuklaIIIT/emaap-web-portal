# Legal Metrology System - Agent Instructions

## Project Overview
This project is the unified Legal Metrology Online Verification and Lifecycle Management System for the Department of Consumer Affairs (DoCA). It handles spatial routing for fixed instruments, offline-first field inspections, multi-tier stakeholder Identity and Access Management (IAM), and cryptographic Aadhaar eSignatures for digital certificates.

## Technology Stack
- **Frontend:** React.js, TailwindCSS, `react-hook-form`
- **Backend:** Node.js (TypeScript), API Gateway (Kong/Spring Cloud)
- **Database:** PostgreSQL with PostGIS extension, Prisma ORM
- **Package Manager:** Strictly use `pnpm` for all dependency installations, script executions, and CLI tool invocations. Never use `npm` or `yarn`. Replace all `npx` commands with `pnpm dlx` (or `pnpm exec`). For example, use `pnpm exec prisma migrate dev` instead of `pnpm exec prisma migrate dev`

## Security & Compliance Rules (CERT-In & GIGW 3.0)
- **Data Privacy & DPDP Act:** Never store or log raw Aadhaar, PAN, or GSTIN strings. All Personally Identifiable Information (PII) must be masked or hashed (SHA-256) locally before transmission or logging.
- **Traceability:** All backend microservice route handlers and HTTP requests must inject and log a UUIDv4 `x-correlation-id`.
- **Accessibility:** All React frontend components must strictly adhere to GIGW 3.0 and WCAG 2.1 AA standards. Ensure all interactive elements include proper ARIA labels and keyboard navigation support.

## Metrological and Cryptographic Logic
- **Spatial Routing:** Use PostGIS spatial types (e.g., `GEOMETRY(Point, 4326)`) and functions (`SI_Intersects`, `ST_DistanceSphere`) for all queries regarding fixed instruments
- **Error Calculations:** Metrological error margins must always calculate absolute deviation against the standard Maximum Permissible Error (MPE).
- **Cryptography:** Digital signatures must strictly implement SHA-256 PDF-A document hashing and embed PKCS#7 signature blocks in compliance with CCA eSign API standards. Never use SHA-1.

## AI Output Constraints (Token Optimization)
- **Code Only:** Provide strictly code. Do not include conversational filler, preamble, or explanations unless explicitly requested with the `/explain` command.
- **Formatting:** Favor concise, numbered bullet points over descriptive paragraphs.
- **Precision:** When modifying existing files, output only the modified methods or components rather than rewriting the entire file context.