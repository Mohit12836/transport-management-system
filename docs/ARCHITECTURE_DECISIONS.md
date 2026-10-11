# ARCHITECTURE DECISION RECORDS (ADR)

## ADR-001: Selection of Next.js 16 (App Router) + TypeScript Stack
- **Context:** The reference demo (`tms.zdctech.in`) is built on legacy PHP/Bootstrap. We need an ultra-fast, responsive, reactive, and scalable framework for high-concurrency transport logistics.
- **Decision:** Use Next.js 16 (React 19 + TypeScript).
- **Rationale:** Unifies server-side data security with rich client-side interactivity (interactive role switchers, instant LR rendering, mobile driver interface) in a single codebase with type-safe contracts.
- **Consequences:** Faster development velocity, zero context switching between backend API and UI layer.

## ADR-002: Rejection of Direct AGPL-3.0 Code from Fleetbase
- **Context:** Fleetbase offers logistics dispatch capabilities, but is licensed under AGPL-3.0 and uses an Ember.js frontend.
- **Decision:** Do not copy or integrate raw source code from Fleetbase. Develop our own clean-room TypeScript/PostgreSQL implementation.
- **Rationale:** Protects intellectual property from copyleft contagion while avoiding the architectural mismatch of Ember.js with React 19.

## ADR-003: Double-Entry Immutability for Invoicing & Trip Settlement
- **Context:** Transport accounting involves complex multi-party money flows (Customer freight, Broker commission, Driver advances, Diesel pump credits). Direct edits to historical records create irrecoverable balance discrepancies.
- **Decision:** Enforce append-only ledgers and audited status transitions for all financial documents (LR, Invoices, Driver Settlements, Vendor Bills).
- **Rationale:** Ensures zero financial leakage and makes the software 100% audit-ready for chartered accountants and tax authorities.
