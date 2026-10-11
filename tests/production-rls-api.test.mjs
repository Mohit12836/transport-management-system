import test from 'node:test';
import assert from 'node:assert/strict';

import { verifyApiAuth } from '../src/lib/supabase/api-guard.ts';
import { validateStorageFile, buildSecureStoragePath } from '../src/lib/supabase/storage.ts';
import { POST as loginHandler } from '../src/app/api/v1/auth/login/route.ts';
import { GET as authMeHandler } from '../src/app/api/v1/auth/me/route.ts';
import { GET as vehiclesHandler } from '../src/app/api/v1/fleet/vehicles/route.ts';
import { GET as tripsHandler } from '../src/app/api/v1/trips/route.ts';
import { PATCH as tripStatusHandler } from '../src/app/api/v1/trips/[id]/status/route.ts';
import { POST as tripExpenseHandler } from '../src/app/api/v1/trips/[id]/expenses/route.ts';
import { POST as tripPODHandler, PATCH as reviewPODHandler } from '../src/app/api/v1/trips/[id]/pod/route.ts';
import { POST as tripSettlementHandler } from '../src/app/api/v1/trips/[id]/settlement/route.ts';
import { POST as invoiceHandler } from '../src/app/api/v1/finance/invoices/route.ts';
import { GET as vendorBillsHandler, POST as createVendorBillHandler } from '../src/app/api/v1/finance/vendor-bills/route.ts';
import { GET as journalsHandler } from '../src/app/api/v1/finance/journals/route.ts';
import { GET as integrationsStatusHandler } from '../src/app/api/v1/integrations/status/route.ts';

// Helper to construct simulated HTTP Requests with explicit bearer token
function mockRequest(url, method = 'GET', headers = {}, body = null) {
  const reqInit = {
    method,
    headers: new Headers({
      'content-type': 'application/json',
      ...headers,
    }),
  };
  if (body) {
    reqInit.body = JSON.stringify(body);
  }
  return new Request(`http://localhost:3000${url}`, reqInit);
}

test('Security Guard - Enforces Default-Deny for Unauthenticated Requests', async () => {
  const unauthReq = mockRequest('/api/v1/auth/me', 'GET', {});
  const res = await authMeHandler(unauthReq);
  const json = await res.json();

  assert.equal(res.status, 401);
  assert.equal(json.success, false);
  assert.equal(json.error.code, 'UNAUTHORIZED');
});

test('Security Guard - Client Mock Headers Cannot Authenticate Production Requests (Regression)', async () => {
  // Simulate request attempting to bypass auth using client-supplied headers
  const spoofReq = mockRequest('/api/v1/fleet/vehicles', 'GET', {
    'x-mock-role': 'owner',
    'x-mock-org-id': 'org-demo-001',
  });

  // Verify directly against verifyApiAuth in production mode
  const originalEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    const authResult = await verifyApiAuth(spoofReq, { allowedRoles: ['owner'] });
    assert.equal(authResult.success, false);
    assert.equal(authResult.response.status, 403);
    const json = await authResult.response.json();
  } finally {
    if (originalEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalEnv;
    }
  }
});

test('Security Guard - Role-Based RBAC Blocks Unauthorized Roles', async () => {
  // Driver bearer token attempting to access Fleet Management (Only Owner, Manager, Accountant allowed)
  const driverReq = mockRequest('/api/v1/fleet/vehicles', 'GET', {
    authorization: 'Bearer demo-driver-token',
  });
  const res = await vehiclesHandler(driverReq);
  const json = await res.json();

  assert.equal(res.status, 403);
  assert.equal(json.success, false);
  assert.equal(json.error.code, 'FORBIDDEN_ROLE');
  assert.match(json.error.message, /Access Denied: Role 'driver'/);
});

test('Security Guard - Multi-Tenant Isolation Prevents Cross-Organization Leakage', async () => {
  // Request asserting Organization A with token belonging to Organization B
  const req = mockRequest('/api/v1/fleet/vehicles', 'GET', {
    authorization: 'Bearer demo-manager-token',
  });

  const authCheck = await verifyApiAuth(req, {
    allowedRoles: ['manager'],
    requireOrgMatch: 'org-competitor-999', // Tenant mismatch
  });

  assert.equal(authCheck.success, false);
  const json = await authCheck.response.json();
  assert.equal(authCheck.response.status, 403);
  assert.equal(json.error.code, 'TENANT_ISOLATION_VIOLATION');
});

test('Security Guard - Authentication Route Issues Verified Session Token', async () => {
  const loginReq = mockRequest('/api/v1/auth/login', 'POST', {}, {
    email: 'accountant@tms.com',
    password: 'password',
  });
  const res = await loginHandler(loginReq);
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.equal(json.data.user.role, 'accountant');
  assert.equal(json.data.token, 'demo-accountant-token');

  // Verify that the issued token authorizes /api/v1/auth/me
  const meReq = mockRequest('/api/v1/auth/me', 'GET', {
    authorization: `Bearer ${json.data.token}`,
  });
  const meRes = await authMeHandler(meReq);
  const meJson = await meRes.json();
  assert.equal(meRes.status, 200);
  assert.equal(meJson.data.user.role, 'accountant');
});

test('API Integration - Server-Side Invoice Gate Enforces Verified POD', async () => {
  // Attempt to invoice LR-102 which has pending_verification POD
  const invoiceReq = mockRequest('/api/v1/finance/invoices', 'POST', {
    authorization: 'Bearer demo-accountant-token',
  }, {
    customerName: 'Test Industries Ltd',
    selectedLRIds: ['lr-102'], // LR-102 has unverified POD
  });

  const res = await invoiceHandler(invoiceReq);
  const json = await res.json();

  assert.equal(res.status, 422);
  assert.equal(json.success, false);
  assert.equal(json.error.code, 'POD_VERIFICATION_REQUIRED');
  assert.match(json.error.message, /Invoice Gate Blocked/);
});

test('API Integration - Server-Side Duplicate Expense Rejection', async () => {
  // Attempt to submit an expense with an already-used slip number 'IOCL-KSH-8821'
  const expReq = mockRequest('/api/v1/trips/trip-001/expenses', 'POST', {
    authorization: 'Bearer demo-driver-token',
  }, {
    amount: 11500,
    expenseCategory: 'Fuel',
    slipNumber: 'IOCL-KSH-8821', // Duplicate slip!
  });

  const res = await tripExpenseHandler(expReq, {
    params: Promise.resolve({ id: 'trip-001' }),
  });
  const json = await res.json();

  assert.equal(res.status, 409);
  assert.equal(json.success, false);
  assert.equal(json.error.code, 'DUPLICATE_EXPENSE_CLAIM');
});

test('API Integration - Server-Side Trip State Machine Transition Enforcement', async () => {
  // Attempting an invalid reverse or illegal transition
  const statusReq = mockRequest('/api/v1/trips/trip-002/status', 'PATCH', {
    authorization: 'Bearer demo-manager-token',
  }, {
    targetStatus: 'closed', // Cannot close without verified POD
  });

  const res = await tripStatusHandler(statusReq, {
    params: Promise.resolve({ id: 'trip-002' }),
  });
  const json = await res.json();

  assert.equal(res.status, 422);
  assert.equal(json.success, false);
  assert.equal(json.error.code, 'UNVERIFIED_POD_BLOCK');
});

test('API Integration - Trip Settlement Reconciles and Generates Balanced Journal', async () => {
  const settleReq = mockRequest('/api/v1/trips/trip-001/settlement', 'POST', {
    authorization: 'Bearer demo-accountant-token',
  }, {
    shortageDeductions: 0,
    remarks: 'Automated settlement test',
  });

  const res = await tripSettlementHandler(settleReq, {
    params: Promise.resolve({ id: 'trip-001' }),
  });
  const json = await res.json();

  assert.equal(res.status, 201);
  assert.equal(json.success, true);
  assert.equal(json.data.journalEntry.isBalanced, true);
  assert.equal(json.data.journalEntry.totalDebit, json.data.journalEntry.totalCredit);
});

test('API Integration - Vendor Bills Apply Section 194C TDS & Vendor Isolation', async () => {
  // 1. Create vendor bill with 2% TDS
  const billReq = mockRequest('/api/v1/finance/vendor-bills', 'POST', {
    authorization: 'Bearer demo-accountant-token',
  }, {
    vendorName: 'Rajasthan Gujarat Roadlines Broker',
    grossFreight: 50000,
    advancePaid: 10000,
    tdsCategory: 'company',
    panNumber: 'AABCR8821F',
    shortageDeductions: 0,
  });

  const res = await createVendorBillHandler(billReq);
  const json = await res.json();

  assert.equal(res.status, 201);
  assert.equal(json.data.tds_rate_percent, 2);
  assert.equal(json.data.tds_amount, 1000); // 2% of 50,000
  // Net = 50,000 - 10,000 (adv) - 1,000 (tds) = 39,000
  assert.equal(json.data.net_payable, 39000);

  // 2. Vendor Confinement: Vendor can only see their own bills
  const vendorReq = mockRequest('/api/v1/finance/vendor-bills', 'GET', {
    authorization: 'Bearer demo-vendor-token',
  });
  const vendorRes = await vendorBillsHandler(vendorReq);
  const vendorJson = await vendorRes.json();
  assert.equal(vendorRes.status, 200);
  assert.ok(vendorJson.data.every((v) => v.vendorName.toLowerCase().includes('gujarat')));
});

test('API Integration - General Ledger Audit Verifies 100% Balanced Books', async () => {
  const journalsReq = mockRequest('/api/v1/finance/journals', 'GET', {
    authorization: 'Bearer demo-accountant-token',
  });
  const res = await journalsHandler(journalsReq);
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.meta.ledgerAudit.isBalanced, true);
  assert.equal(json.meta.ledgerAudit.discrepancy, 0);
  assert.equal(json.meta.ledgerAudit.unbalancedEntriesCount, 0);
});

test('Secure Storage - Validates File Types, Sizes, and Builds Tenant-Isolated Paths', () => {
  // Valid PDF
  const validDoc = validateStorageFile('application/pdf', 2 * 1024 * 1024);
  assert.equal(validDoc.isValid, true);

  // Invalid Executable
  const invalidExe = validateStorageFile('application/x-msdownload', 1000);
  assert.equal(invalidExe.isValid, false);
  assert.match(invalidExe.error, /Invalid file format/);

  // Oversized File (> 10MB)
  const oversized = validateStorageFile('image/jpeg', 15 * 1024 * 1024);
  assert.equal(oversized.isValid, false);
  assert.match(oversized.error, /exceeds the 10 MB limit/);

  // Tenant-isolated path structure
  const path = buildSecureStoragePath('org-demo-001', 'pod-documents', 'lr-101', 'stamp copy.png');
  assert.match(path, /^org-demo-001\/pod-documents\/lr-101_\d+_stamp_copy\.png$/);
});

test('External Integrations - Transparently Reports Real Unconfigured Statuses', async () => {
  const req = mockRequest('/api/v1/integrations/status', 'GET', {
    authorization: 'Bearer demo-owner-token',
  });
  const res = await integrationsStatusHandler(req);
  const json = await res.json();

  assert.equal(res.status, 200);
  // Confirms unconfigured integrations are transparently marked UNCONFIGURED rather than faking live connections
  assert.equal(json.data.integrations.whatsapp_cloud_api.status, 'UNCONFIGURED');
  assert.equal(json.data.integrations.fastag_npci.status, 'UNCONFIGURED');
  assert.equal(json.data.integrations.gps_telematics.status, 'UNCONFIGURED');
});
