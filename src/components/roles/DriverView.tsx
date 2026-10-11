'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Truck,
  MapPin,
  Camera,
  UploadCloud,
  CheckCircle,
  PlusCircle,
  Fuel,
  Receipt,
  FileCheck2,
  AlertTriangle,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';
import { ExpenseCategory } from '../../types/tms';

export const DriverView: React.FC = () => {
  const {
    trips,
    drivers,
    expenses,
    advances,
    openLRPrint,
    advanceTripStatus,
    submitTripExpense,
    submitPOD,
  } = useDemoTMS();

  // Active driver selection (default to Mukesh Yadav or first driver)
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id || 'drv-01');
  const activeDriver = drivers.find((d) => d.id === selectedDriverId) || drivers[0];

  // Active trip for this driver
  const activeTrip = trips.find(
    (t) => t.driverId === activeDriver?.id && t.status !== 'closed' && t.status !== 'cancelled'
  ) || trips[0];

  // Driver expenses for current trip
  const driverTripExpenses = expenses.filter(
    (e) => e.tripId === activeTrip?.id || e.driverId === activeDriver?.id
  );

  // Driver advances
  const driverAdvances = advances.filter((a) => a.driverId === activeDriver?.id);
  const totalAdvances = driverAdvances.reduce((s, a) => s + a.amount, 0);

  // Form states
  const [activeTab, setActiveTab] = useState<'TRIP' | 'EXPENSE' | 'POD' | 'LEDGER'>('TRIP');
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Expense form
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Fuel');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expSlip, setExpSlip] = useState<string>('');
  const [expVendor, setExpVendor] = useState<string>('');

  // POD form
  const [receiverName, setReceiverName] = useState<string>('');
  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [shortageQty, setShortageQty] = useState<string>('0');
  const [damageNotes, setDamageNotes] = useState<string>('');
  const [podPhotoAttached, setPodPhotoAttached] = useState<boolean>(false);

  // Odometer Checkpoint form
  const [odometerInput, setOdometerInput] = useState<string>('');
  const [checkpointLocation, setCheckpointLocation] = useState<string>('');

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStartTrip = () => {
    if (!activeTrip) return;
    const odo = parseFloat(odometerInput) || activeTrip.startOdometerKm || 141680;
    const res = advanceTripStatus(activeTrip.id, 'in_transit', {
      odometerKm: odo,
      location: `${activeTrip.originCity} Terminal Gate`,
      note: 'Driver confirmed cargo loaded and departed terminal.',
    });

    if (res.success) {
      showNotice('success', '🚀 Trip Started! Status changed to IN TRANSIT.');
      setOdometerInput('');
    } else {
      showNotice('error', res.error || 'Failed to start trip.');
    }
  };

  const handleUpdateCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    const odo = parseFloat(odometerInput);
    const loc = checkpointLocation.trim();

    if (!loc) {
      showNotice('error', 'Please enter your current checkpoint location.');
      return;
    }

    const res = advanceTripStatus(activeTrip.id, 'in_transit', {
      odometerKm: odo || undefined,
      location: loc,
      note: `Checkpoint reached by driver. Odo: ${odo || 'N/A'} KM.`,
    });

    if (res.success) {
      showNotice('success', `📍 Checkpoint '${loc}' logged to dispatch timeline!`);
      setOdometerInput('');
      setCheckpointLocation('');
    } else {
      showNotice('error', res.error || 'Failed to record checkpoint.');
    }
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    const amt = parseFloat(expAmount);
    if (!amt || amt <= 0) {
      showNotice('error', 'Please enter a valid expense amount.');
      return;
    }

    const res = submitTripExpense({
      tripId: activeTrip.id,
      driverId: activeDriver?.id,
      expenseCategory: expCategory,
      amount: amt,
      paidBy: 'Driver_Advance',
      slipNumber: expSlip || undefined,
      vendorName: expVendor || undefined,
      receiptImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    });

    if (res.success) {
      showNotice('success', `✓ ₹${amt.toLocaleString('en-IN')} ${expCategory} expense submitted for accountant audit!`);
      setExpAmount('');
      setExpSlip('');
      setExpVendor('');
    } else {
      showNotice('error', res.error || 'Failed to submit expense.');
    }
  };

  const handleSubmitPOD = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip || activeTrip.assignedLRs.length === 0) {
      showNotice('error', 'No consignments assigned to this trip.');
      return;
    }

    if (!receiverName.trim()) {
      showNotice('error', 'Please enter receiver name.');
      return;
    }

    const targetLR = activeTrip.assignedLRs[0];
    const res = submitPOD(activeTrip.id, targetLR.id, {
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim() || undefined,
      shortageQuantity: parseInt(shortageQty) || 0,
      damageRemarks: damageNotes.trim() || undefined,
      podImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    });

    if (res.success) {
      showNotice('success', '📷 Digital POD submitted successfully! Ready for manager verification.');
      setReceiverName('');
      setReceiverPhone('');
      setShortageQty('0');
      setDamageNotes('');
      setPodPhotoAttached(false);
    } else {
      showNotice('error', res.error || 'Failed to submit POD.');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-12">
      {/* Mobile Driver Top Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-500/30 text-white shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Driver Field Assistant (Mobile App)</span>
          </div>

          {/* Offline Mode Toggle Simulation */}
          <button
            onClick={() => setIsOfflineSimulated(!isOfflineSimulated)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all ${
              isOfflineSimulated
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {isOfflineSimulated ? (
              <>
                <WifiOff className="w-3 h-3" />
                <span>OFFLINE QUEUE</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3" />
                <span>LIVE 4G SYNC</span>
              </>
            )}
          </button>
        </div>

        {/* Driver Profile & Switcher */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight">{activeDriver?.fullName}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Phone: {activeDriver?.phone} • Licence: <span className="font-mono text-white">{activeDriver?.licenseNumber}</span>
            </p>
          </div>

          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-white focus:outline-none"
          >
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                Switch: {d.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Advance Balance Card */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Unspent Advance Balance</span>
            <span className="text-base font-black font-mono text-emerald-400">
              ₹{(activeDriver?.currentAdvanceBalance || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Assigned Truck</span>
            <span className="font-mono font-bold text-white">
              {activeTrip?.vehicleNumber || activeDriver?.assignedVehicleNumber || 'Standby'}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}
        >
          <span>{notification.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Quick Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs">
        {[
          { id: 'TRIP', label: '🚚 Trip', icon: Truck },
          { id: 'EXPENSE', label: '⛽ Fuel/Toll', icon: Fuel },
          { id: 'POD', label: '📷 Delivery', icon: Camera },
          { id: 'LEDGER', label: '💳 Advances', icon: Receipt },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 rounded-xl font-bold transition-all text-center flex flex-col items-center gap-1 ${
              activeTab === tab.id
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: ACTIVE TRIP & CONTROLS */}
      {activeTab === 'TRIP' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl">
          {activeTrip ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {activeTrip.tripNumber}
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">
                    Cargo: {activeTrip.assignedLRs.length} Consignments
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    activeTrip.status === 'delivered'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : activeTrip.status === 'in_transit'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {activeTrip.status.replace('_', ' ')}
                </span>
              </div>

              {/* Route Map Visual */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Origin Pickup</span>
                    <span className="font-bold text-sm text-white">{activeTrip.originCity} Central Hub</span>
                    <p className="text-[11px] text-slate-400">Departed: {activeTrip.plannedDepartureDate || 'Scheduled'}</p>
                  </div>
                </div>

                <div className="w-0.5 h-4 bg-slate-700 ml-4"></div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Destination Delivery</span>
                    <span className="font-bold text-sm text-white">{activeTrip.destinationCity} Destination</span>
                    <p className="text-[11px] text-slate-400">ETA: {activeTrip.expectedArrivalDate || 'Next Day'}</p>
                  </div>
                </div>
              </div>

              {/* Status Action Buttons */}
              {activeTrip.status === 'scheduled' && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase">Ready for Departure?</h4>
                  <p className="text-xs text-slate-300">
                    Verify physical cargo loading and tyre pressure before starting trip.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={odometerInput}
                      onChange={(e) => setOdometerInput(e.target.value)}
                      placeholder="Start Odometer KM (e.g. 141680)"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                    <button
                      onClick={handleStartTrip}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40"
                    >
                      🚀 Start Trip
                    </button>
                  </div>
                </div>
              )}

              {activeTrip.status === 'in_transit' && (
                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase">En-Route Checkpoint Check-in</h4>
                  <form onSubmit={handleUpdateCheckpoint} className="space-y-2">
                    <input
                      type="text"
                      value={checkpointLocation}
                      onChange={(e) => setCheckpointLocation(e.target.value)}
                      placeholder="Current Location / Toll Plaza (e.g. Kishangarh Toll)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={odometerInput}
                        onChange={(e) => setOdometerInput(e.target.value)}
                        placeholder="Current Odo KM"
                        className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                      <button
                        type="submit"
                        className="w-1/2 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold"
                      >
                        📍 Log Checkpoint
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* View LR Action */}
              {activeTrip.assignedLRs[0] && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => openLRPrint(activeTrip.assignedLRs[0])}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline decoration-dotted"
                  >
                    📄 View Assigned 3-Copy LR Document ({activeTrip.assignedLRs[0].lrNumber})
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">No active trip assigned.</p>
          )}
        </div>
      )}

      {/* TAB 2: EN-ROUTE FUEL & EXPENSE ENTRY */}
      {activeTab === 'EXPENSE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Fuel className="w-4 h-4 text-amber-400" />
              <span>Submit Fuel / Toll / Loading Slip</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload slip immediately. Deducted from driver advance upon accountant verification.
            </p>
          </div>

          <form onSubmit={handleSubmitExpense} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Expense Type</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
              >
                <option value="Fuel">⛽ Diesel / Fuel (Petrol Pump)</option>
                <option value="Toll_FASTag">🛣️ Toll / FASTag Highway Fee</option>
                <option value="Loading">📦 Hamal / Loading Charges</option>
                <option value="Unloading">📦 Unloading / Labour</option>
                <option value="Repair">🔧 Emergency Workshop Repair</option>
                <option value="Driver_Allowance">🍽️ Food / Driver Daily Bhatta</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="e.g. 5400"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Receipt / Slip No.</label>
                <input
                  type="text"
                  value={expSlip}
                  onChange={(e) => setExpSlip(e.target.value)}
                  placeholder="e.g. IOCL-8821"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Vendor / Pump Name & City</label>
              <input
                type="text"
                value={expVendor}
                onChange={(e) => setExpVendor(e.target.value)}
                placeholder="e.g. Indian Oil, Kotputli Bypass"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Photo Attachment Simulation */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">📸 Camera Receipt Photo</span>
              <span className="text-[10px] text-emerald-400 font-mono">✓ High-res Slip Image Attached</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 text-white rounded-2xl font-bold shadow-lg shadow-amber-950/40 text-xs sm:text-sm"
            >
              + Submit Expense Slip
            </button>
          </form>

          {/* List of Recent Submissions */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <h4 className="text-[11px] font-bold uppercase text-slate-400">Recent Claims ({driverTripExpenses.length})</h4>
            {driverTripExpenses.map((exp) => (
              <div
                key={exp.id}
                className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white">{exp.expenseCategory.replace('_', ' ')}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        exp.approvalStatus === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : exp.approvalStatus === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {exp.approvalStatus.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                    Slip: {exp.slipNumber || 'N/A'} • {exp.vendorName || 'Highway Outlet'}
                  </span>
                </div>
                <span className="font-mono font-bold text-white">₹{exp.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: POD DELIVERY HANDOVER */}
      {activeTab === 'POD' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Digital Proof of Delivery (POD) Capture</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Take photo of physical signed and stamped LR copy at customer unloading point.
            </p>
          </div>

          <form onSubmit={handleSubmitPOD} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Receiver Person Name</label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="e.g. Praveen Kumar (Store Manager)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Receiver Phone Number (Optional)</label>
              <input
                type="tel"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                placeholder="+91 98110 44332"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Shortage Quantity (Pkgs)</label>
                <input
                  type="number"
                  min="0"
                  value={shortageQty}
                  onChange={(e) => setShortageQty(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Condition Remarks</label>
                <input
                  type="text"
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  placeholder="e.g. Clean delivery, no tears"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Photo Capture Preview Card */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-cyan-500/30 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <p className="text-[11px] text-slate-300">
                Ensure customer rubber stamp and signature are clearly visible in the photo frame.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                ✓ POD Image Captured (2.4 MB)
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-2xl font-bold shadow-lg shadow-cyan-950/40 text-xs sm:text-sm"
            >
              📷 Submit Signed POD & Confirm Delivery
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: ADVANCES LEDGER & PASSBOOK */}
      {activeTab === 'LEDGER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl text-xs">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Driver Advance Account & Passbook</span>
            </h3>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Verified record of money disbursed by office and en-route expenses approved.
            </p>
          </div>

          <div className="space-y-2">
            {driverAdvances.map((adv) => (
              <div
                key={adv.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono font-bold text-white">₹{adv.amount.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {adv.paymentMode} • Ref: {adv.transactionRef || 'Branch Cash'} • {adv.disbursedAt.split('T')[0]}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    adv.isSettled ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {adv.isSettled ? 'SETTLED' : 'ACTIVE ADVANCE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
