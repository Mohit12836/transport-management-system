# DEPLOYMENT GUIDE: NextGen Transport Management System

## 1. Hosting Architecture
- **Frontend & API Edge:** Vercel or Node.js Container (Docker).
- **Database & Realtime Engine:** Supabase Managed PostgreSQL or Self-Hosted PostgreSQL 16 on Ubuntu with connection pooling (PgBouncer).
- **Blob / File Storage:** AWS S3 or Supabase Storage for encrypted POD images and compliance documents.

## 2. Environment Variables Configuration (`.env.example`)
```env
# Application
NEXT_PUBLIC_APP_NAME="NextGen TMS Pro"
NEXT_PUBLIC_APP_URL="https://tms.yourdomain.com"

# Supabase / PostgreSQL
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
DATABASE_URL="postgresql://postgres:password@db.yourhost.com:5432/postgres?pgbouncer=true"

# Secret Keys
JWT_SECRET="your-256-bit-secret-key"
ENCRYPTION_KEY="your-32-byte-hex-key"

# Integrations (Optional)
WHATSAPP_CLOUD_API_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
FASTAG_API_KEY=""
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
```

## 3. Production Build & Deployment Commands
```bash
# 1. Install clean dependencies
npm ci

# 2. Run TypeScript check & linting
npm run lint

# 3. Build optimized production bundle
npm run build

# 4. Start production server
npm run start
```
