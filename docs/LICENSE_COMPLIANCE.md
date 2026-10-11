# LICENSE COMPLIANCE & LEGAL SAFETY REPORT

## 1. Third-Party Component Licensing Audit
All UI components, icons, and libraries integrated into NextGen TMS are strictly audited under permissive, commercial-friendly licenses (MIT, Apache 2.0, ISC, BSD-3-Clause).

| Dependency | Purpose | Upstream License | Commercial SaaS Safe? |
|---|---|---|---|
| **Next.js 16** | React SSR/SSG Framework | MIT | Yes |
| **React 19 & React-DOM** | Frontend UI Library | MIT | Yes |
| **Tailwind CSS 4** | Styling Engine | MIT | Yes |
| **Framer Motion / Motion** | Smooth UI Spring Physics | MIT | Yes |
| **Lucide React** | Feather Icon Set | ISC / MIT | Yes |
| **Supabase JS SDK** | Database & Real-time Client | MIT | Yes |
| **PostgreSQL / pgvector** | Database Engine | PostgreSQL License (BSD-like) | Yes |

## 2. Incompatible Licenses (Strictly Blacklisted for Code Integration)
- **AGPL-3.0 (e.g. Fleetbase core):** AGPL enforces source code disclosure upon network distribution. No raw code from AGPL repositories will be copied into this proprietary repository.
- **GPL-3.0 / GPL-2.0:** Copyleft viral licensing prohibits bundling within closed-source SaaS.
- **CC-BY-NC (Creative Commons Non-Commercial):** Prohibits commercial deployment.

## 3. Proprietary Intellectual Property Safeguards
- All business logic, algorithms for trip settlement, LR generation routines, GST tax calculators, and database schemas are developed from scratch as original works.
- No proprietary branding, trademarks, logos, or client data from reference websites are copied.
- Full commercial sovereignty and copyright remain with the software owner.
