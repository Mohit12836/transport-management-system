'use client';

import React, { useState, useEffect } from 'react';
import { useDemoTMS } from '../lib/demo-context';
import { Navbar, NavTab } from '../components/layout/Navbar';
import { SaaSLoginGateway } from '../components/auth/SaaSLoginGateway';
import { RoleSwitcher } from '../components/roles/RoleSwitcher';
import { SuperAdminView } from '../components/roles/SuperAdminView';
import { OwnerView } from '../components/roles/OwnerView';
import { ManagerView } from '../components/roles/ManagerView';
import { AccountantView } from '../components/roles/AccountantView';
import { DriverView } from '../components/roles/DriverView';
import { VendorView } from '../components/roles/VendorView';
import { LRBookingForm } from '../components/lr/LRBookingForm';
import { ThreeCopyLRPrint } from '../components/lr/ThreeCopyLRPrint';
import { VehicleRoster } from '../components/fleet/VehicleRoster';
import { VehicleDetailsModal } from '../components/fleet/VehicleDetailsModal';
import { VehicleFormModal } from '../components/fleet/VehicleFormModal';
import { DriverRoster } from '../components/fleet/DriverRoster';
import { DriverDetailsModal } from '../components/fleet/DriverDetailsModal';
import { DriverFormModal } from '../components/fleet/DriverFormModal';
import { DispatchBoard } from '../components/dispatch/DispatchBoard';
import { TripDetailsModal } from '../components/dispatch/TripDetailsModal';
import { TripAssignmentModal } from '../components/dispatch/TripAssignmentModal';
import { PODReviewQueue } from '../components/pod/PODReviewQueue';
import { ComplianceDashboard } from '../components/compliance/ComplianceDashboard';
import { UserRole } from '../types/tms';

export default function TMSDashboardPage() {
  const { activeRole, setActiveRole, activeLRForPrint, closeLRPrint } = useDemoTMS();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Modals state
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [isTripAssignmentOpen, setIsTripAssignmentOpen] = useState(false);

  // Sync initial tab with active role
  useEffect(() => {
    if (activeRole === 'driver') {
      setActiveTab('driver_app');
    } else if (activeRole === 'accountant') {
      setActiveTab('finance');
    } else if (activeRole === 'manager') {
      setActiveTab('dispatch');
    } else {
      setActiveTab('dashboard');
    }
  }, [activeRole]);

  const handleLoginAsRole = (role: UserRole) => {
    setActiveRole(role);
    setIsLoggedIn(true);
    if (role === 'driver') {
      setActiveTab('driver_app');
    } else if (role === 'accountant') {
      setActiveTab('finance');
    } else if (role === 'manager') {
      setActiveTab('dispatch');
    } else {
      setActiveTab('dashboard');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('tms_active_role', role);
      localStorage.setItem('tms_is_logged_in', 'true');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tms_is_logged_in');
    }
  };

  // If not logged in, render the SaaS Login Gateway where any role can sign into their dedicated portal
  if (!isLoggedIn) {
    return <SaaSLoginGateway onLoginAsRole={handleLoginAsRole} />;
  }

  return (
    <div className="min-h-screen flex flex-col atmosphere-canvas text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Role-Enforced Enterprise Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenBookingModal={() => setIsBookingModalOpen(true)}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area - Strictly Enforcing Role Boundaries */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* DRIVER PORTAL: 100% Isolated Mobile Field App */}
        {activeRole === 'driver' && <DriverView />}

        {/* ACCOUNTANT PORTAL */}
        {activeRole === 'accountant' && (
          <>
            {activeTab === 'pod_queue' ? <PODReviewQueue /> : <AccountantView />}
          </>
        )}

        {/* OPERATIONS MANAGER PORTAL */}
        {activeRole === 'manager' && (
          <>
            {activeTab === 'dispatch' && (
              <DispatchBoard onOpenTripAssignment={() => setIsTripAssignmentOpen(true)} />
            )}
            {activeTab === 'vehicles' && (
              <VehicleRoster onOpenAddVehicle={() => setIsAddVehicleOpen(true)} />
            )}
            {activeTab === 'drivers' && (
              <DriverRoster onOpenAddDriver={() => setIsAddDriverOpen(true)} />
            )}
            {activeTab === 'pod_queue' && <PODReviewQueue />}
            {activeTab === 'compliance' && <ComplianceDashboard />}
            {activeTab === 'dashboard' && <ManagerView onOpenLR={() => setIsBookingModalOpen(true)} />}
          </>
        )}

        {/* FLEET OWNER PORTAL */}
        {activeRole === 'owner' && (
          <>
            {activeTab === 'dashboard' && <OwnerView onOpenLR={() => setIsBookingModalOpen(true)} />}
            {activeTab === 'dispatch' && (
              <DispatchBoard onOpenTripAssignment={() => setIsTripAssignmentOpen(true)} />
            )}
            {activeTab === 'finance' && <AccountantView />}
            {activeTab === 'vehicles' && (
              <VehicleRoster onOpenAddVehicle={() => setIsAddVehicleOpen(true)} />
            )}
            {activeTab === 'compliance' && <ComplianceDashboard />}
          </>
        )}

        {/* VENDOR PARTNER PORTAL */}
        {activeRole === 'vendor' && <VendorView />}

        {/* SUPER ADMIN PORTAL */}
        {activeRole === 'superadmin' && (
          <>
            {activeTab === 'compliance' ? <ComplianceDashboard /> : <SuperAdminView />}
          </>
        )}
      </main>

      {/* Enterprise SaaS Footer */}
      <footer className="w-full border-t border-white/5 bg-slate-950/80 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 NextGen Transport Management System (TMS Pro). All rights reserved.</p>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Enterprise Multi-Tenant SaaS</span>
            <span>•</span>
            <button
              onClick={handleLogout}
              className="text-indigo-400 hover:text-cyan-300 font-semibold cursor-pointer underline"
            >
              Switch Role Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Slide-overs */}
      <RoleSwitcher
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
      />

      <LRBookingForm
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />

      <ThreeCopyLRPrint
        lr={activeLRForPrint}
        onClose={closeLRPrint}
      />

      <VehicleDetailsModal />
      <VehicleFormModal
        isOpen={isAddVehicleOpen}
        onClose={() => setIsAddVehicleOpen(false)}
      />

      <DriverDetailsModal />
      <DriverFormModal
        isOpen={isAddDriverOpen}
        onClose={() => setIsAddDriverOpen(false)}
      />

      <TripDetailsModal />
      <TripAssignmentModal
        isOpen={isTripAssignmentOpen}
        onClose={() => setIsTripAssignmentOpen(false)}
      />
    </div>
  );
}
