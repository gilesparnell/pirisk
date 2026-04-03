import { fetchInvoices, fetchClients } from "./actions";
import { InvoicesPageShell } from "./invoices-page-shell";

export default async function InvoicesPage() {
  const [invoices, clients] = await Promise.all([
    fetchInvoices(),
    fetchClients(),
  ]);

  return (
    <InvoicesPageShell initialInvoices={invoices} clients={clients} />
  );
}
