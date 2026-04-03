import { notFound } from "next/navigation";
import { fetchInvoiceWithLineItems, fetchClients } from "../actions";
import { fetchProfile } from "@/app/app/settings/actions";
import { InvoicePrintView } from "./invoice-print-view";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [data, clients, profile] = await Promise.all([
    fetchInvoiceWithLineItems(id),
    fetchClients(),
    fetchProfile(),
  ]);

  if (!data) {
    notFound();
  }

  const clientName =
    clients.find((c) => c.id === data.invoice.clientId)?.name ?? "Unknown";

  return (
    <InvoicePrintView
      invoice={data.invoice}
      lineItems={data.lineItems}
      clientName={clientName}
      profile={profile}
    />
  );
}
