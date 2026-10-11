# UI/UX SPECIFICATION: NextGen Transport Management System

## 1. Design System & Aesthetic Foundation
- **Theme:** High-contrast Dark & Clean Light Modern Hybrid (Slate/Zinc palette with Crimson/Amber energetic accents).
- **Typography:** `Plus Jakarta Sans` for Headings, `Inter` for data density & numeric tables.
- **Fluid Sizing:** 100% auto-responsive scaling using CSS `clamp()` formulas:
  - Hero Titles: `clamp(2rem, 4vw + 1rem, 3.5rem)`
  - Subheadings: `clamp(1.2rem, 2vw + 0.5rem, 1.8rem)`
  - Table & Data cells: `clamp(0.85rem, 0.5vw + 0.5rem, 0.95rem)`
- **Auto-Fit Containers:** Zero horizontal overflow (`overflow-x: clip`), wrapping flexboxes and dynamic `repeat(auto-fit, minmax(280px, 1fr))` grid structures.

## 2. Micro-Interactions & Motion.dev Physics
- **Buttons & Chips:** Spring physics (`stiffness: 400, damping: 30`, hover `scale: 1.02`, tap `scale: 0.97`).
- **Modals & Drawers:** Gentle entrance (`stiffness: 260, damping: 20`, smooth backdrop blur `backdrop-blur-md`).
- **Cards & Data Panels:** Subtle hover elevation (`translateY(-3px)`), delicate ambient rim borders (`border border-slate-200 dark:border-slate-800`).
- **Financial Counters:** Animated odometer number roll on initial view entrance.

## 3. High-Conversion Demo Landing Experience
- **Interactive Multi-Role Switcher:** 1-Click live simulation enabling visitors to experience the exact portal view as:
  1. `Super Admin` (Platform Control)
  2. `Fleet Owner` (Executive Metrics & P&L)
  3. `Dispatch Manager` (LR & Truck Allocation)
  4. `Accountant` (GST Invoices & Advance Settlements)
  5. `Driver` (Mobile Trip Task Sheet & POD Upload)
  6. `Vendor / Broker` (Freight Bills & TDS)
- **Live LR & Billing Previewer:** Interactive modal where users can type pickup/destination and see an instant real-time Indian 3-copy LR format generated on screen.
