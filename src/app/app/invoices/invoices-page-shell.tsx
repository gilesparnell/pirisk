"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  Loader2,
  CheckCircle,
  Send,
  DollarSign,
  Ban,
  Eye,
} from "lucide-react";
import {
  createInvoiceForClient,
  changeInvoiceStatus,
  type ActionResult,
} from "./actions";

type Invoice = {
  id: string;
  clientId: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  gst: number;
  total: number;
  notes: string | null;
  paidAt: string | null;
};

type Client = {
  id: string;
  name: string;
  rate: number;
  rateType: string;
};

export function InvoicesPageShell({
  initialInvoices,
  clients,
}: {
  initialInvoices: Invoice[];
  clients: Client[];
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage invoices from your time entries
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </button>
      </div>

      {showForm && (
        <NewInvoiceForm
          clients={clients}
          onDone={() => setShowForm(false)}
        />
      )}

      <InvoiceList invoices={initialInvoices} clients={clients} />
    </div>
  );
}

function NewInvoiceForm({
  clients,
  onDone,
}: {
  clients: Client[];
  onDone: () => void;
}) {
  const [clientId, setClientId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .split("T")[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedClientId = formData.get("clientId") as string;
    const issueDate = formData.get("issueDate") as string;
    const dueDate = formData.get("dueDate") as string;
    const notes = (formData.get("notes") as string) || undefined;

    if (!selectedClientId) {
      setError("Please select a client");
      return;
    }

    startTransition(async () => {
      const result = await createInvoiceForClient(
        selectedClientId,
        issueDate,
        dueDate,
        notes
      );
      if (result.success) {
        onDone();
      } else {
        setError(result.error || "Failed to create invoice");
      }
    });
  }

  return (
    <div className="mb-8 rounded-2xl bg-white border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">New Invoice</h2>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client *
            </label>
            <select
              name="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            >
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <input
              name="notes"
              type="text"
              placeholder="Optional notes"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue Date
            </label>
            <input
              name="issueDate"
              type="date"
              defaultValue={today}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              name="dueDate"
              type="date"
              defaultValue={thirtyDaysLater}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
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
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
}

function InvoiceList({
  invoices,
  clients,
}: {
  invoices: Invoice[];
  clients: Client[];
}) {
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-gray-200">
        <div className="p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400 mb-2">No invoices yet.</p>
          <p className="text-xs text-gray-400">
            Track time entries first, then generate invoices from billable
            hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <InvoiceRow
          key={invoice.id}
          invoice={invoice}
          clientName={clientMap[invoice.clientId] ?? "Unknown"}
        />
      ))}
    </div>
  );
}

function InvoiceRow({
  invoice,
  clientName,
}: {
  invoice: Invoice;
  clientName: string;
}) {
  const [isPending, startTransition] = useTransition();

  const isOverdue =
    invoice.status === "sent" && new Date(invoice.dueDate) < new Date();

  function handleStatusChange(newStatus: Invoice["status"]) {
    startTransition(async () => {
      await changeInvoiceStatus(
        invoice.id,
        newStatus as "draft" | "sent" | "paid" | "void"
      );
    });
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    sent: "bg-blue-50 text-blue-700",
    paid: "bg-green-50 text-green-700",
    overdue: "bg-red-50 text-red-700",
    void: "bg-gray-100 text-gray-400",
  };

  const displayStatus = isOverdue ? "overdue" : invoice.status;

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-5 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-gray-900">
            {invoice.invoiceNumber}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[displayStatus] ?? statusColors.draft}`}
          >
            {displayStatus}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{clientName}</p>
        <p className="text-xs text-gray-400">
          Issued {invoice.issueDate} · Due {invoice.dueDate}
        </p>
      </div>
      <div className="text-right">
        <p className="font-mono text-lg font-bold text-gray-900">
          ${invoice.total.toFixed(2)}
        </p>
        <p className="text-xs text-gray-400">
          ${invoice.subtotal.toFixed(2)} + ${invoice.gst.toFixed(2)} GST
        </p>
      </div>
      <div className="flex gap-1">
        <Link
          href={`/app/invoices/${invoice.id}`}
          title="View invoice"
          className="p-2 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
        >
          <Eye className="h-4 w-4" />
        </Link>
        {invoice.status === "draft" && (
          <button
            onClick={() => handleStatusChange("sent")}
            disabled={isPending}
            title="Mark as sent"
            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
        {(invoice.status === "sent" || isOverdue) && (
          <button
            onClick={() => handleStatusChange("paid")}
            disabled={isPending}
            title="Mark as paid"
            className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            <DollarSign className="h-4 w-4" />
          </button>
        )}
        {invoice.status !== "void" && invoice.status !== "paid" && (
          <button
            onClick={() => handleStatusChange("void")}
            disabled={isPending}
            title="Void invoice"
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Ban className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
