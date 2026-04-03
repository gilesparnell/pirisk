"use client";

import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { formatCurrency, formatInvoiceDate } from "../format-invoice";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  gst: number;
  total: number;
  notes: string | null;
  clientId: string;
};

type LineItem = {
  id: string;
  description: string | null;
  quantity: number;
  quantityUnit: string;
  unitPrice: number;
  amount: number;
};

type Profile = {
  businessName: string | null;
  abn: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  bankName: string | null;
  bankBsb: string | null;
  bankAccount: string | null;
  gstRate: number | null;
  paymentTermsDays: number | null;
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
  overdue: "bg-red-50 text-red-700",
  void: "bg-gray-100 text-gray-400",
};

export function InvoicePrintView({
  invoice,
  lineItems,
  clientName,
  profile,
}: {
  invoice: Invoice;
  lineItems: LineItem[];
  clientName: string;
  profile: Profile;
}) {
  const isOverdue =
    invoice.status === "sent" && new Date(invoice.dueDate) < new Date();
  const displayStatus = isOverdue ? "overdue" : invoice.status;
  const paymentTerms = profile.paymentTermsDays
    ? `Net ${profile.paymentTermsDays}`
    : "Net 30";

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          nav,
          aside,
          header,
          .no-print {
            display: none !important;
          }
          .print-view {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      {/* Action bar — hidden in print */}
      <div className="no-print flex items-center gap-4 mb-6">
        <Link
          href="/app/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Link>
        <button
          onClick={() => window.print()}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print Invoice
        </button>
      </div>

      {/* Invoice card */}
      <div className="print-view bg-white border border-gray-200 rounded-2xl p-8 sm:p-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.businessName || "Your Business"}
            </h1>
            {profile.abn && (
              <p className="text-sm text-gray-500 mt-1">ABN: {profile.abn}</p>
            )}
            {profile.address && (
              <p className="text-sm text-gray-500 mt-0.5">{profile.address}</p>
            )}
            {profile.phone && (
              <p className="text-sm text-gray-500 mt-0.5">{profile.phone}</p>
            )}
            {profile.email && (
              <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>
            )}
          </div>
          <div className="text-left sm:text-right">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              INVOICE
            </h2>
            <p className="font-mono text-sm font-semibold text-gray-700 mt-1">
              {invoice.invoiceNumber}
            </p>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-2 ${statusColors[displayStatus] ?? statusColors.draft}`}
            >
              {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
            </span>
          </div>
        </div>

        {/* Bill To + Invoice Details */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Bill To
            </h3>
            <p className="text-sm font-semibold text-gray-900">{clientName}</p>
          </div>
          <div className="sm:text-right">
            <div className="space-y-1">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </span>
                <p className="text-sm text-gray-900">
                  {formatInvoiceDate(invoice.issueDate)}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </span>
                <p className="text-sm text-gray-900">
                  {formatInvoiceDate(invoice.dueDate)}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Terms
                </span>
                <p className="text-sm text-gray-900">{paymentTerms}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                  Description
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                  Qty
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                  Unit
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                  Unit Price
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3 text-sm text-gray-900">
                    {item.description || "—"}
                  </td>
                  <td className="py-3 text-sm text-gray-700 text-right">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-sm text-gray-500 text-right">
                    {item.quantityUnit}
                  </td>
                  <td className="py-3 text-sm text-gray-700 text-right">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3 text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
              {lineItems.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-sm text-gray-400"
                  >
                    No line items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                GST ({((profile.gstRate ?? 0.1) * 100).toFixed(0)}%)
              </span>
              <span className="text-gray-900">
                {formatCurrency(invoice.gst)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-teal-600">
                {formatCurrency(invoice.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        {(profile.bankName || profile.bankBsb || profile.bankAccount) && (
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Payment Details
            </h3>
            <div className="text-sm text-gray-700 space-y-0.5">
              {profile.bankName && <p>Bank: {profile.bankName}</p>}
              {profile.bankBsb && <p>BSB: {profile.bankBsb}</p>}
              {profile.bankAccount && (
                <p>Account: {profile.bankAccount}</p>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Notes
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
