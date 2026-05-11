"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createCustomerAction, updateCustomerAction } from "@/app/actions/customers";

export type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  customerType: string;
  accountNumber: string | null;
  notes: string | null;
  bookingCount: number;
};

const TYPES: { value: string; label: string }[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial",  label: "Commercial" },
  { value: "industrial",  label: "Industrial" },
  { value: "fleet",       label: "Fleet" },
];

const TYPE_BADGE: Record<string, "default" | "purple" | "warning" | "success"> = {
  residential: "default",
  commercial:  "purple",
  industrial:  "warning",
  fleet:       "success",
};

export default function CustomerManagement({ initialCustomers, searchQuery }: {
  initialCustomers: CustomerRow[];
  searchQuery: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<CustomerRow | "new" | null>(null);
  const [formError, setFormError] = useState("");

  function handleSubmit(formData: FormData) {
    setFormError("");
    startTransition(async () => {
      const isNew = dialog === "new";
      const result = isNew
        ? await createCustomerAction(formData)
        : await updateCustomerAction(formData);
      if (result.success) {
        setDialog(null);
        router.refresh();
      } else {
        setFormError(result.error);
      }
    });
  }

  const editing = dialog !== "new" ? dialog : null;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Customers</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{initialCustomers.length} result{initialCustomers.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => { setDialog("new"); setFormError(""); }}>
          <PlusCircle size={16} className="mr-2" /> New Customer
        </Button>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <Input name="q" defaultValue={searchQuery} placeholder="Search by name, email, phone…" className="max-w-sm" />
        <Button type="submit" variant="outline">Search</Button>
        {searchQuery && (
          <Button type="button" variant="outline" onClick={() => router.push("/booker/customers")}>
            Clear
          </Button>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)]">
            <tr>
              {["Name", "Type", "Email", "Phone", "City", "Bookings", ""].map((h) => (
                <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {initialCustomers.map((c) => (
              <tr key={c.id} className="hover:bg-[var(--color-surface-light)] transition-colors">
                <td className="py-3 px-4 font-medium">{c.name}</td>
                <td className="py-3 px-4">
                  <Badge variant={TYPE_BADGE[c.customerType] ?? "muted"}>
                    {c.customerType}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-[var(--color-text-muted)]">{c.email ?? "—"}</td>
                <td className="py-3 px-4 text-[var(--color-text-muted)]">{c.phone ?? "—"}</td>
                <td className="py-3 px-4 text-[var(--color-text-muted)]">{c.city ?? "—"}</td>
                <td className="py-3 px-4 text-center">{c.bookingCount}</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => { setDialog(c); setFormError(""); }}
                    className="p-1.5 rounded hover:bg-[var(--color-surface-light)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {initialCustomers.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[var(--color-text-muted)]">
                  {searchQuery ? `No customers matching "${searchQuery}".` : "No customers yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-2xl">
          <form action={handleSubmit}>
            {editing && <input type="hidden" name="customerId" value={editing.id} />}
            <DialogHeader>
              <DialogTitle>{dialog === "new" ? "New Customer" : "Edit Customer"}</DialogTitle>
            </DialogHeader>
            {formError && (
              <p className="mb-3 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{formError}</p>
            )}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Full Name / Company</Label>
                  <Input name="name" required defaultValue={editing?.name ?? ""} className="mt-1" />
                </div>
                <div>
                  <Label>Type</Label>
                  <select
                    name="customerType"
                    defaultValue={editing?.customerType ?? "residential"}
                    className="mt-1 flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    {TYPES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input name="email" type="email" defaultValue={editing?.email ?? ""} className="mt-1" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input name="phone" type="tel" defaultValue={editing?.phone ?? ""} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input name="address" defaultValue={editing?.address ?? ""} className="mt-1" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>City</Label>
                  <Input name="city" defaultValue={editing?.city ?? ""} className="mt-1" />
                </div>
                <div>
                  <Label>Province</Label>
                  <Input name="province" defaultValue={editing?.province ?? "AB"} maxLength={2} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Postal Code</Label>
                  <Input name="postalCode" defaultValue={editing?.postalCode ?? ""} className="mt-1" />
                </div>
                <div>
                  <Label>Account #</Label>
                  <Input name="accountNumber" defaultValue={editing?.accountNumber ?? ""} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea name="notes" rows={2} defaultValue={editing?.notes ?? ""} className="mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : dialog === "new" ? "Create" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
