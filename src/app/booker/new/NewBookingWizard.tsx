"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, ChevronLeft, Check, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  searchCustomersAction, getCustomerVehiclesAction,
  createCustomerAction, createVehicleAction,
  type CustomerSearchItem, type VehicleItem,
} from "@/app/actions/customers";
import { createBookingAction } from "@/app/actions/bookings";

export type ServiceOption = {
  id: string; name: string; category: string;
  durationMinutes: number; basePrice: string;
};
export type InstallerOption = { id: string; name: string };

const VEHICLE_TYPES = [
  { value: "heavy_truck", label: "Heavy Truck" }, { value: "light_truck", label: "Light Truck" },
  { value: "pickup", label: "Pickup" }, { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" }, { value: "rv", label: "RV" },
  { value: "motorhome", label: "Motorhome" }, { value: "fifth_wheel", label: "5th Wheel" },
  { value: "boat", label: "Boat" }, { value: "heavy_equipment", label: "Heavy Equipment" },
  { value: "fleet_vehicle", label: "Fleet Vehicle" }, { value: "atv_side_by_side", label: "ATV/SxS" },
  { value: "other", label: "Other" },
];

const CAT_LABELS: Record<string, string> = {
  two_way_radio: "Two-Way Radio", poc_radio: "POC Radio",
  cell_booster: "Cell Booster", fleet_tracking_eld: "Fleet / ELD", satellite: "Satellite",
};

function timeSlots() {
  const slots: { value: string; label: string }[] = [];
  for (let h = 7; h <= 18; h++) {
    for (const m of [0, 30]) {
      if (h === 18 && m === 30) continue;
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      slots.push({ value: `${hh}:${mm}`, label: `${h12}:${mm} ${h >= 12 ? "PM" : "AM"}` });
    }
  }
  return slots;
}

const TIME_SLOTS = timeSlots();

function calcEndISO(date: string, startTime: string, durationMins: number) {
  const dt = new Date(`${date}T${startTime}:00`);
  dt.setMinutes(dt.getMinutes() + durationMins);
  return dt.toISOString();
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

type Step = 1 | 2 | 3 | 4 | 5;

export default function NewBookingWizard({
  services,
  installers,
}: {
  services: ServiceOption[];
  installers: InstallerOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Step
  const [step, setStep] = useState<Step>(1);

  // Step 1 — Customer
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerSearchItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustError, setNewCustError] = useState("");

  // Step 2 — Vehicle
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newVehType, setNewVehType] = useState("pickup");
  const [newVehYear, setNewVehYear] = useState("");
  const [newVehMake, setNewVehMake] = useState("");
  const [newVehModel, setNewVehModel] = useState("");
  const [newVehColor, setNewVehColor] = useState("");
  const [vehError, setVehError] = useState("");

  // Step 3 — Services
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Step 4 — Schedule
  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState("09:00");
  const [installerId, setInstallerId] = useState(installers[0]?.id ?? "");

  // Step 5 — Review
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [doneBookingId, setDoneBookingId] = useState<string | null>(null);

  // Derived
  const totalDuration = selectedServiceIds.reduce((sum, id) => {
    return sum + (services.find((s) => s.id === id)?.durationMinutes ?? 0);
  }, 0);
  const totalPrice = selectedServiceIds.reduce((sum, id) => {
    return sum + parseFloat(services.find((s) => s.id === id)?.basePrice ?? "0");
  }, 0);

  // ── Step 1 handlers ─────────────────────────────────────────

  function handleSearch() {
    startTransition(async () => {
      const results = await searchCustomersAction(searchQuery);
      setSearchResults(results);
    });
  }

  function selectCustomer(id: string, name: string) {
    setCustomerId(id);
    setCustomerName(name);
  }

  function handleCreateCustomer(formData: FormData) {
    setNewCustError("");
    startTransition(async () => {
      const result = await createCustomerAction(formData);
      if (result.success) {
        const name = formData.get("name") as string;
        selectCustomer(result.customerId, name);
        setShowNewCustomer(false);
      } else {
        setNewCustError(result.error);
      }
    });
  }

  function proceedToVehicles() {
    startTransition(async () => {
      const veh = await getCustomerVehiclesAction(customerId);
      setVehicles(veh);
      setVehicleId(null);
      setStep(2);
    });
  }

  // ── Step 2 handlers ─────────────────────────────────────────

  function handleAddVehicle() {
    if (!newVehType) return;
    setVehError("");
    startTransition(async () => {
      const result = await createVehicleAction(
        customerId,
        newVehType,
        newVehYear ? parseInt(newVehYear) : null,
        newVehMake || null,
        newVehModel || null,
        newVehColor || null
      );
      if (result.success) {
        const veh = await getCustomerVehiclesAction(customerId);
        setVehicles(veh);
        setVehicleId(result.vehicleId);
        setShowNewVehicle(false);
      } else {
        setVehError(result.error);
      }
    });
  }

  // ── Step 5 handlers ─────────────────────────────────────────

  function handleSubmit() {
    setSubmitError("");
    const scheduledEnd = calcEndISO(date, startTime, totalDuration || 60);
    const scheduledStart = new Date(`${date}T${startTime}:00`).toISOString();

    startTransition(async () => {
      const result = await createBookingAction(
        customerId,
        installerId,
        scheduledStart,
        scheduledEnd,
        selectedServiceIds,
        vehicleId,
        notes,
        address,
        "America/Edmonton"
      );
      if (result.success) {
        setDoneBookingId(result.bookingId);
      } else {
        setSubmitError(result.error);
      }
    });
  }

  // ── Success screen ───────────────────────────────────────────
  if (doneBookingId) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600 mb-2">
          <Check size={28} />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text)]">Booking Created</h2>
        <p className="text-[var(--color-text-muted)]">
          The job has been scheduled for <strong>{customerName}</strong>.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button onClick={() => router.push("/booker/schedule")}>View Schedule</Button>
          <Button variant="outline" onClick={() => router.push("/booker/new")}>
            New Booking
          </Button>
        </div>
      </div>
    );
  }

  // ── Step indicator ───────────────────────────────────────────
  const STEPS = ["Customer", "Vehicle", "Services", "Schedule", "Review"];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">New Booking</h1>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => {
          const n = (i + 1) as Step;
          const done = step > n;
          const active = step === n;
          return (
            <div key={label} className="flex items-center gap-1 flex-1 min-w-0">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done ? "bg-[var(--color-primary)] text-white" :
                  active ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-2 border-[var(--color-primary)]" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {done ? <Check size={12} /> : n}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${active ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text-muted)]"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? "bg-[var(--color-primary)]" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Customer ── */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-4">
          <h2 className="font-semibold text-[var(--color-text)]">Select Customer</h2>

          {customerId && (
            <div className="flex items-center justify-between bg-[var(--color-primary)]/5 rounded-lg px-4 py-3 border border-[var(--color-primary)]/20">
              <div>
                <p className="font-medium text-[var(--color-primary)]">{customerName}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Selected</p>
              </div>
              <button onClick={() => { setCustomerId(""); setCustomerName(""); }} className="text-xs text-[var(--color-text-muted)] hover:text-red-500">
                Change
              </button>
            </div>
          )}

          {!customerId && (
            <>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or phone…"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button type="button" variant="outline" onClick={handleSearch} disabled={isPending}>
                  <Search size={16} />
                </Button>
              </div>

              {searchResults.length > 0 && (
                <ul className="border border-[var(--color-border)] rounded-lg overflow-hidden divide-y divide-[var(--color-border)]">
                  {searchResults.map((c) => (
                    <li
                      key={c.id}
                      onClick={() => selectCustomer(c.id, c.name)}
                      className="px-4 py-2.5 flex items-center justify-between hover:bg-[var(--color-surface-light)] cursor-pointer"
                    >
                      <div>
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {[c.email, c.phone, c.city].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <Badge variant="muted">{c.customerType}</Badge>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => setShowNewCustomer(!showNewCustomer)}
                className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
              >
                <PlusCircle size={15} />
                {showNewCustomer ? "Cancel" : "Create new customer"}
              </button>

              {showNewCustomer && (
                <form action={handleCreateCustomer} className="border border-[var(--color-border)] rounded-lg p-4 space-y-3">
                  {newCustError && <p className="text-sm text-red-600">{newCustError}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Full Name</Label>
                      <Input name="name" required className="mt-1" />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <select name="customerType" className="mt-1 flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="industrial">Industrial</option>
                        <option value="fleet">Fleet</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Email</Label><Input name="email" type="email" className="mt-1" /></div>
                    <div><Label>Phone</Label><Input name="phone" type="tel" className="mt-1" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>City</Label><Input name="city" defaultValue="Grande Prairie" className="mt-1" /></div>
                    <div><Label>Province</Label><Input name="province" defaultValue="AB" maxLength={2} className="mt-1" /></div>
                  </div>
                  <Button type="submit" size="sm" disabled={isPending}>Create Customer</Button>
                </form>
              )}
            </>
          )}

          <div className="flex justify-end">
            <Button onClick={proceedToVehicles} disabled={!customerId || isPending}>
              Next: Vehicle <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Vehicle ── */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-4">
          <h2 className="font-semibold text-[var(--color-text)]">Select Vehicle</h2>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-[var(--color-surface-light)] transition-colors"
              style={{ borderColor: vehicleId === null ? "var(--color-primary)" : "var(--color-border)" }}>
              <input type="radio" name="vehicle" value="" checked={vehicleId === null} onChange={() => setVehicleId(null)} />
              <span className="text-sm font-medium">No vehicle / not applicable</span>
            </label>

            {vehicles.map((v) => {
              const typeLabel = VEHICLE_TYPES.find((t) => t.value === v.vehicleType)?.label ?? v.vehicleType;
              const label = [v.year, v.make, v.model, v.color].filter(Boolean).join(" ") || typeLabel;
              return (
                <label key={v.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-[var(--color-surface-light)] transition-colors"
                  style={{ borderColor: vehicleId === v.id ? "var(--color-primary)" : "var(--color-border)" }}>
                  <input type="radio" name="vehicle" value={v.id} checked={vehicleId === v.id} onChange={() => setVehicleId(v.id)} />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{VEHICLE_TYPES.find((t) => t.value === v.vehicleType)?.label}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowNewVehicle(!showNewVehicle)}
            className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
          >
            <PlusCircle size={15} /> {showNewVehicle ? "Cancel" : "Add new vehicle"}
          </button>

          {showNewVehicle && (
            <div className="border border-[var(--color-border)] rounded-lg p-4 space-y-3">
              {vehError && <p className="text-sm text-red-600">{vehError}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Vehicle Type</Label>
                  <select value={newVehType} onChange={(e) => setNewVehType(e.target.value)}
                    className="mt-1 flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                    {VEHICLE_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div><Label>Year</Label><Input value={newVehYear} onChange={(e) => setNewVehYear(e.target.value)} placeholder="2022" className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Make</Label><Input value={newVehMake} onChange={(e) => setNewVehMake(e.target.value)} placeholder="Ford" className="mt-1" /></div>
                <div><Label>Model</Label><Input value={newVehModel} onChange={(e) => setNewVehModel(e.target.value)} placeholder="F-150" className="mt-1" /></div>
                <div><Label>Color</Label><Input value={newVehColor} onChange={(e) => setNewVehColor(e.target.value)} placeholder="White" className="mt-1" /></div>
              </div>
              <Button type="button" size="sm" onClick={handleAddVehicle} disabled={isPending}>Add Vehicle</Button>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft size={16} className="mr-1" /> Back</Button>
            <Button onClick={() => setStep(3)}>Next: Services <ChevronRight size={16} className="ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Services ── */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-4">
          <h2 className="font-semibold text-[var(--color-text)]">Select Services</h2>
          {selectedServiceIds.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">Select at least one service.</p>
          )}

          <div className="space-y-2">
            {services.map((s) => {
              const selected = selectedServiceIds.includes(s.id);
              return (
                <label key={s.id} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-[var(--color-surface-light)] transition-colors"
                  style={{ borderColor: selected ? "var(--color-primary)" : "var(--color-border)" }}>
                  <input type="checkbox" checked={selected} onChange={(e) => {
                    setSelectedServiceIds(e.target.checked
                      ? [...selectedServiceIds, s.id]
                      : selectedServiceIds.filter((id) => id !== s.id));
                  }} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-sm font-semibold text-[var(--color-primary)] shrink-0">
                        ${parseFloat(s.basePrice).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {CAT_LABELS[s.category] ?? s.category} · {s.durationMinutes} min
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {selectedServiceIds.length > 0 && (
            <div className="bg-[var(--color-surface-light)] rounded-lg px-4 py-3 flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">{totalDuration} min total</span>
              <span className="font-semibold">${totalPrice.toFixed(2)} estimate</span>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft size={16} className="mr-1" /> Back</Button>
            <Button onClick={() => setStep(4)} disabled={selectedServiceIds.length === 0}>
              Next: Schedule <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Schedule ── */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-4">
          <h2 className="font-semibold text-[var(--color-text)]">Set Schedule</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <input
                type="date"
                value={date}
                min={todayStr()}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <Label>Start Time</Label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {TIME_SLOTS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Installer</Label>
            <select
              value={installerId}
              onChange={(e) => setInstallerId(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {installers.length === 0 && <option value="">No active installers</option>}
              {installers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>

          {totalDuration > 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">
              Estimated end:{" "}
              <strong>
                {new Date(calcEndISO(date, startTime, totalDuration)).toLocaleTimeString("en-CA", {
                  hour: "numeric", minute: "2-digit",
                })}
              </strong>
            </p>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}><ChevronLeft size={16} className="mr-1" /> Back</Button>
            <Button onClick={() => setStep(5)} disabled={!installerId || !date}>
              Review <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 5: Review ── */}
      {step === 5 && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-5">
          <h2 className="font-semibold text-[var(--color-text)]">Review & Confirm</h2>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><dt className="text-[var(--color-text-muted)]">Customer</dt><dd className="font-medium">{customerName}</dd></div>
            <div><dt className="text-[var(--color-text-muted)]">Installer</dt><dd className="font-medium">{installers.find((i) => i.id === installerId)?.name}</dd></div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Date & Time</dt>
              <dd className="font-medium">
                {new Date(`${date}T${startTime}:00`).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}
                {" at "}
                {new Date(`${date}T${startTime}:00`).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}
              </dd>
            </div>
            <div><dt className="text-[var(--color-text-muted)]">Duration</dt><dd className="font-medium">{totalDuration} min</dd></div>
            <div className="col-span-2">
              <dt className="text-[var(--color-text-muted)]">Services</dt>
              <dd className="font-medium flex flex-wrap gap-1 mt-1">
                {selectedServiceIds.map((id) => {
                  const s = services.find((sv) => sv.id === id);
                  return s ? <Badge key={id} variant="default">{s.name}</Badge> : null;
                })}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[var(--color-text-muted)]">Estimate</dt>
              <dd className="font-bold text-lg text-[var(--color-primary)]">${totalPrice.toFixed(2)}</dd>
            </div>
          </dl>

          <div className="space-y-3">
            <div>
              <Label>Job Site Address <span className="text-[var(--color-text-muted)]">(if different from customer address)</span></Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Grande Prairie, AB" className="mt-1" />
            </div>
            <div>
              <Label>Notes for Installer</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any special instructions…" className="mt-1" />
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{submitError}</p>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(4)}><ChevronLeft size={16} className="mr-1" /> Back</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Creating…" : "Confirm Booking"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
