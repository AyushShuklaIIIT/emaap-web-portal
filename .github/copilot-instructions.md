# Legal Metrology System - Global Engineering Standards
 
- **Technology Stack:** Node.js (TypeScript), React.js (Tailwind CSS), Prisma ORM, PostgreSQL with PostGIS extension.
- **Package Manager:** Strictly use `pnpm` for all dependency installations, script executions, and CLI tool invocations. Never use `npm` or `yarn`. Replace all `npx` commands with `pnpm dlx` (or `pnpm exec`). For example, use `pnpm exec prisma migrate dev` instead of `npx prisma migrate dev`.
- **Security Mandates (CERT-In):** Never log raw Aadhaar, PAN or GSTIN strings. Apply SHA-256 hashing to all Personally Identifiable Information (PII) prior to logging. All microservice API routes must utilize UUIDv4 correlation IDs for traceability.

- **Frontend Mandates (GIGW 3.0):** Enforce strict WCAG 2.1 AA accessibility guidelines. All interactive forms must utilize `react-hook-form` and include comprehensive, screen-reader-compliant ARIA labels.
- **Output Constraints:** Provide CODE ONLY. Do NOT wrap responses in conversational filler. Do NOT provide explanations unless explicitly requested with the `/explain` slash command. Favor numbered bullets over descriptive paragraphs.