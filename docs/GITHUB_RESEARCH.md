# GITHUB RESEARCH & OPEN-SOURCE EVALUATION

## 1. Candidate Repositories Researched

### Candidate 1: Fleetbase (`fleetbase/fleetbase`)
- **Repository URL:** `https://github.com/fleetbase/fleetbase`
- **Core Stack:** Laravel (PHP 8.2), Ember.js frontend, PostgreSQL / MySQL, Docker, Redis.
- **License:** AGPL-3.0 (Affero General Public License v3).
- **Key Modules:** Fleet management, live driver tracking, routing algorithms, multi-tenant console, dispatch engine, webhook system.
- **Strengths:**
  - Highly mature dispatch engine and modern developer console.
  - Robust REST API and JS SDK (`@fleetbase/fleetbase-js`).
  - Pre-built support for drivers, vehicles, places, and waypoints.
- **Limitations:**
  - **License Hazard (AGPL-3.0):** AGPL-3.0 requires any SaaS modifying the source code to open-source the entire proprietary system under AGPL-3.0.
  - **Heavyweight Architecture:** Uses Ember.js on the frontend, which has high cognitive overhead and poor synergy with Next.js/React ecosystems.
  - **Missing Indian Localization:** Lacks native support for LR/Bilty formats, GST RCM/FCM calculations, TDS 194C vendor tax compliance, and FASTag integration.
- **Verdict / Decision:** **ADAPT ARCHITECTURAL PATTERNS ONLY / REJECT DIRECT CODE REUSE (Due to AGPL-3.0 & Ember.js stack mismatch)**.

---

### Candidate 2: Fleet Management System (`nelsonmpanju/Fleet-Management-System`)
- **Repository URL:** `https://github.com/nelsonmpanju/Fleet-Management-System` (Forked from `VVSD-LTD/vsd_fleet_ms`)
- **Core Stack:** Frappe Framework (Python, MariaDB, Jinja/Vue).
- **License:** GPL-3.0.
- **Key Modules:** Vehicle maintenance logs, fuel logs, driver assignments, expense tracking.
- **Strengths:** Frappe's declarative DocType engine makes entity relationships simple.
- **Limitations:**
  - High dependency on the monolithic Frappe ecosystem / ERPNext server runtime.
  - Lacks Indian logistics consignment billing, multi-stop dispatch, and digital POD capture workflows.
  - GPL-3.0 license constraints.
- **Verdict / Decision:** **REJECT AS CODEBASE / REFERENCE DATA MODELS ONLY**.

---

### Candidate 3: Kaporeal (`kaporeal.com` / Curated Fleet OS)
- **Status:** Proprietary commercial SaaS platform.
- **License:** Closed Source / Commercial Subscription.
- **Key Modules:** Fleet tracking, asset telematics, maintenance scheduling.
- **Limitations:** Closed-source API, recurring licensing fee, no source code customization.
- **Verdict / Decision:** **REJECT (Closed Commercial)**.

---

### Candidate 4: Traccar GPS Platform (`traccar/traccar`)
- **Repository URL:** `https://github.com/traccar/traccar`
- **Core Stack:** Java Backend, React Modern Web UI, MySQL/PostgreSQL.
- **License:** Apache 2.0 (Commercial Friendly).
- **Key Modules:** Real-time GPS protocol parsing (supporting 1500+ GPS hardware trackers like Teltonika, Coban, Concox), Geofencing, Speed alerts.
- **Strengths:**
  - Permissive Apache 2.0 license (safe for commercial proprietary SaaS).
  - Can be integrated via REST API/Webhooks as a standalone GPS microservice or telemetry provider.
- **Verdict / Decision:** **REUSE TELEMETRY CONCEPTS / ADAPT API INTERFACES**.

---

## 2. Comparison Matrix

| Repository / Tool | License | Stack | LR/Bilty & GST Ready? | Driver POD Mobile App? | License Commercial Risk | Recommendation |
|---|---|---|---|---|---|---|
| **Fleetbase** | AGPL-3.0 | Laravel + Ember.js | No (Global only) | Yes | High (AGPL contagion) | **ADAPT DESIGN PATTERNS** |
| **NelsonPanju Fleet** | GPL-3.0 | Frappe/Python | No | No | Moderate | **REJECT** |
| **Kaporeal** | Proprietary | SaaS | No | Limited | High (Vendor lock-in) | **REJECT** |
| **Traccar** | Apache 2.0 | Java + React | No (GPS Only) | Yes (Tracking) | Zero (Apache 2.0 safe) | **REUSE FOR GPS PROTOCOL** |
| **NextGen Custom TMS** | MIT / Proprietary | Next.js 16 + React 19 + TypeScript + Tailwind + Supabase | **100% Yes (Native)** | **100% Yes (Native)** | **Zero (Full Ownership)** | **BUILD AS BESPOKE PRODUCTION TMS** |

## 3. Final Strategic Decision
We will build a **bespoke, modern Next.js 16 + TypeScript + Tailwind CSS + Framer Motion full-stack Transport Management System**. We will borrow proven entity design patterns from enterprise logistics while retaining 100% proprietary code ownership, zero license risks, zero bloated dependencies, and complete native alignment with Indian & global transport realities (LR, GST, TDS, FASTag, Driver Ledgers).
