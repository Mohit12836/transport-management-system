# REFERENCE DEMO AUDIT: https://tms.zdctech.in/

## 1. Audit Metadata & Environment
- **Reference URL:** `https://tms.zdctech.in/`
- **Provided By:** ZDC Tech Global Solutions Private Limited (`www.zdctechglobalsolutions.com`)
- **Technology Fingerprint:**
  - Frontend: Bootstrap 5.3, FontAwesome 6.4/6.5, Plus Jakarta Sans & Inter fonts, Custom CSS (`web-home.css`, `animate.css`).
  - Backend Architecture: Laravel PHP Framework (indicated by CSRF token input `name="_token"`, Blade templating patterns, and standard Laravel auth structure).
  - Server / Deployment: Hosted on Apache/Nginx web server with HTTPS SSL certificate.

## 2. Public Facing Audit & Features Discovered
### A. Landing Page Structure
1. **Hero Carousel:** 4 high-impact slides highlighting:
   - Live fleet control & profit clarity (98% on-time, 40% faster trip closing).
   - Billing + LR automation (1-Click LR flow, tax-ready documents).
   - Driver App + Payroll (Mobile POD uploads, attendance, salary slips).
   - Analytics + Reports (Trip-wise P&L, fuel tracking, PDF/Excel exports).
2. **About / Advantage Section:** Emphasizes multi-branch management, role-based access, and Indian logistics workflows.
3. **Core Modules Showcase:**
   - Fleet Management (RC, Insurance, PUC, Fitness, Service history).
   - Driver Management (Licence, attendance, advances, payroll).
   - Trip Monitoring (Dispatch to delivery lifecycle).
   - LR / Bilty (Consignment notes with customer branding).
   - Auto Billing (GST-ready invoices, payment ledgers).
   - Expense Tracker (Fuel, tolls, repairs, vendor charges).
   - Profit & Loss (Trip-wise & vehicle-wise margin analysis).
   - Fuel Analytics (Mileage, consumption, fuel variance).
   - Vendor Portal (Brokers, attached vehicles, settlements).
   - Loan & EMI Tracker (Vehicle financing ledgers & reminders).
   - Smart Alerts (SMS/Email notifications for compliance & milestones).
   - Live Reports (Exportable PDF/Excel logs).
4. **Interactive Demo Lead Generation Form:** Fields for Name, Email, Company, Phone, Fleet Size (1-10, 11-50, 50+), Team Size (Up to 20, 20-50, 50+), and Requirements.

## 3. Reference Role & Credential Matrix
| Role Identified | Reference Username | Password | Intended Permission Scope |
|---|---|---|---|
| **Super Admin** | `superadmin@tms.com` | `password` | Global tenant management, subscription tiers, platform logs |
| **Owner** | `owner@tms.com` | `password` | Complete organization access, financial P&L, executive metrics |
| **Manager** | `manager@tms.com` | `password` | Dispatch, LR creation, vehicle assignment, driver scheduling |
| **Accountant** | `accountant@tms.com` | `password` | Billing, customer invoices, driver advances, vendor payouts, GST |
| **Driver** | `driver@tms.com` | `password` | Mobile task sheet, trip updates, POD uploads, expense logs |
| **Vendor** | `vendor@tms.com` | `password` | Attached vehicle status, freight bills, commission payouts |

## 4. Key Gaps & Inefficiencies in Reference Platform
1. **Monolithic Blade Rendering:** Page transitions require full reload; lacks optimistic UI updates and rich real-time WebSockets/SSE for live trip updates.
2. **Standard CSS/Bootstrap 5 UI:** Lacks modern fluid clamp typography, dynamic glassmorphism, spring physics on buttons/drawers, and Apple/Linear-grade micro-interactions.
3. **Missing Automated Validations:** FASTag API integration, real-time GST verification, and e-Way Bill direct portal sync are manual or unverified.
4. **Mobile Driver Experience:** Traditional web-view rather than an ergonomically optimized mobile web app with offline-capable POD uploads.

## 5. Audit Conclusion
The reference platform provides a solid foundation for Indian logistics requirements. Our NextGen TMS product will adopt all verified business rules (LR formats, trip sheets, driver settlements, vehicle compliance) while implementing a vastly superior, modern Next.js/TypeScript architecture with fluid UI/UX, instant calculations, and role-enforced security.
