"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { saveProfile, type ActionResult } from "./actions";

type Profile = {
  id: string;
  businessName: string;
  abn: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  standardDayHours: number;
  mileageRate: number;
  gstRate: number;
  invoicePrefix: string;
  paymentTermsDays: number;
  bankName: string | null;
  bankBsb: string | null;
  bankAccount: string | null;
};

export function SettingsForm({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result: ActionResult = await saveProfile(formData);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error ?? "Failed to save");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none";

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Business Profile */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Business Profile
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              name="businessName"
              type="text"
              defaultValue={profile.businessName}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ABN
            </label>
            <input
              name="abn"
              type="text"
              defaultValue={profile.abn ?? ""}
              placeholder="XX XXX XXX XXX"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              name="address"
              type="text"
              defaultValue={profile.address ?? ""}
              placeholder="Business address"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              defaultValue={profile.email ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              name="phone"
              type="tel"
              defaultValue={profile.phone ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Invoice Settings */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Invoice Settings
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Standard Day (hours)
            </label>
            <input
              name="standardDayHours"
              type="number"
              step="0.5"
              defaultValue={profile.standardDayHours}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              Used to convert hours to days for daily-rate clients
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mileage Rate ($/km)
            </label>
            <input
              name="mileageRate"
              type="number"
              step="0.01"
              defaultValue={profile.mileageRate}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              ATO rate for 2025-26
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Terms (days)
            </label>
            <input
              name="paymentTermsDays"
              type="number"
              defaultValue={profile.paymentTermsDays}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Prefix
            </label>
            <input
              name="invoicePrefix"
              type="text"
              defaultValue={profile.invoicePrefix}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              Format: {profile.invoicePrefix}-YYYYMM-001
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GST Rate (%)
            </label>
            <input
              name="gstRate"
              type="number"
              step="0.1"
              defaultValue={profile.gstRate * 100}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Bank Details
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Displayed on invoices for payment
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name
            </label>
            <input
              name="bankName"
              type="text"
              defaultValue={profile.bankName ?? ""}
              placeholder="e.g. Commonwealth Bank"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              BSB
            </label>
            <input
              name="bankBsb"
              type="text"
              defaultValue={profile.bankBsb ?? ""}
              placeholder="XXX-XXX"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number
            </label>
            <input
              name="bankAccount"
              type="text"
              defaultValue={profile.bankAccount ?? ""}
              placeholder="XXXX XXXX"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Xero Integration */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Xero Integration
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Connect to Xero for automatic invoice syncing and payment tracking
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Connect Xero
        </button>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Saved
          </span>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Settings
        </button>
      </div>
    </form>
  );
}
