"use client";

import { useState, useTransition } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { addClient, type ActionResult } from "./actions";

export function ClientForm({ onDone }: { onDone: () => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result: ActionResult = await addClient(formData);
      if (result.success) {
        setErrors({});
        onDone();
      } else if (result.errors) {
        setErrors(result.errors);
      } else if (result.error) {
        setErrors({ form: result.error });
      }
    });
  }

  return (
    <div className="mb-8 rounded-2xl bg-white border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">New Client</h2>
      {errors.form && (
        <p className="mb-4 text-sm text-red-600">{errors.form}</p>
      )}
      <form action={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name *
            </label>
            <input
              name="name"
              type="text"
              placeholder="e.g. Acme Construction"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 outline-none ${
                errors.name
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name
            </label>
            <input
              name="contactName"
              type="text"
              placeholder="Primary contact"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              name="contactEmail"
              type="email"
              placeholder="email@company.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <input
              name="contactPhone"
              type="tel"
              placeholder="+61..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate Type
            </label>
            <select
              name="rateType"
              defaultValue="hourly"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate (AUD) *
            </label>
            <input
              name="rate"
              type="number"
              step="0.01"
              defaultValue="275"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 outline-none ${
                errors.rate
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              }`}
            />
            {errors.rate && (
              <p className="mt-1 text-xs text-red-600">{errors.rate}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Client
          </button>
        </div>
      </form>
    </div>
  );
}
