import { fetchClients } from "./actions";
import { ClientsPageShell } from "./clients-page-shell";

export default async function ClientsPage() {
  const clients = await fetchClients();

  return <ClientsPageShell initialClients={clients} />;
}
