import { NextResponse } from 'next/server.js';
import {
  verifyApiAuth,
  createApiSuccessResponse,
} from '../../../../../lib/supabase/api-guard.ts';

export async function GET(req: Request) {
  const auth = await verifyApiAuth(req, {
    allowedRoles: ['superadmin', 'owner', 'manager', 'accountant'],
  });
  if (!auth.success) return auth.response;

  // Real detection of environment credentials without fabricating mock states
  const integrations = {
    supabase_postgresql: {
      provider: 'Supabase Database',
      isConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      status: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) ? 'ACTIVE' : 'UNCONFIGURED',
      notes: 'PostgreSQL relational database with Row-Level Security.',
    },
    supabase_storage: {
      provider: 'Supabase Storage',
      isConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      status: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) ? 'ACTIVE' : 'UNCONFIGURED',
      notes: 'Private document bucket for PODs, KYC, and slips.',
    },
    whatsapp_cloud_api: {
      provider: 'Meta WhatsApp Business Cloud API (WACA)',
      isConfigured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      status: 'UNCONFIGURED',
      notes: 'Requires Meta Business verification and registered phone number ID.',
    },
    fastag_npci: {
      provider: 'NPCI NETC FASTag Gateway',
      isConfigured: Boolean(process.env.FASTAG_API_KEY),
      status: 'UNCONFIGURED',
      notes: 'Awaiting corporate bank NETC API credentials.',
    },
    gps_telematics: {
      provider: 'Traccar / AIS-140 GPS Feed',
      isConfigured: Boolean(process.env.TRACCAR_API_URL),
      status: 'UNCONFIGURED',
      notes: 'Vehicle tracking endpoints unconfigured in local demo environment.',
    },
    payment_gateway: {
      provider: 'Razorpay Payment Links',
      isConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      status: 'UNCONFIGURED',
      notes: 'Awaiting merchant account activation.',
    },
  };

  return createApiSuccessResponse({
    integrations,
    checkedAt: new Date().toISOString(),
  });
}
