# SECURITY PLAN & THREAT MODEL: NextGen Transport Management System

## 1. Authentication & Session Security
- **Algorithm:** Argon2id / bcrypt password hashing with per-user salt.
- **Session Handling:** HTTP-Only, Secure, SameSite=Strict cookies containing signed JWT or Supabase Auth session tokens.
- **Brute-Force Mitigation:** Rate limiting on `/api/v1/auth/login` (5 attempts per minute per IP) with temporary lockouts.

## 2. Multi-Tenant Authorization & Row Isolation
- **Tenant Scope:** Server-side verification on all endpoints — `organization_id` is always extracted from the verified session context and never accepted from raw request bodies.
- **Role Isolation:**
  - **Drivers:** Strict read/write access limited to trips explicitly assigned to their `driver_id`. Zero access to customer master ledgers, company P&L, or third-party vendor rates.
  - **Vendors:** Access restricted to their own submitted vehicles and freight bills.
  - **Accountants:** Access to financial modules; blocked from altering organization tenancy settings or deleting audit logs.

## 3. Financial Integrity & Fraud Prevention
- **Anti-Tamper Invoicing:** Generated customer invoices and driver settlements cannot be modified once closed. Correction requires an explicit adjustment credit/debit voucher.
- **Audit Trails:** Immutable logging of all status changes on trips, payments, and compliance records with timestamp, user ID, and client IP.

## 4. File Upload & Document Protection
- **POD & Document Uploads:** Restricted to JPEG, PNG, WEBP, and PDF files.
- **File Validation:** Magic-byte validation to prevent executable file uploads; maximum upload size capped at 10 MB.
- **Storage:** Uploaded documents stored in private cloud storage buckets with time-limited pre-signed URLs.
