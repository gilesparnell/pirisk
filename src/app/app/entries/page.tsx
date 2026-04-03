import { fetchClientsWithProjects, fetchEntriesForDate } from "./actions";
import { EntriesPageShell } from "./entries-page-shell";

export default async function EntriesPage() {
  const today = new Date().toISOString().split("T")[0];
  const [clients, todayEntries] = await Promise.all([
    fetchClientsWithProjects(),
    fetchEntriesForDate(today),
  ]);

  // Build a project→{projectName, clientName} lookup for display
  const projectMap: Record<
    string,
    { projectId: string; projectName: string; clientName: string }
  > = {};
  for (const client of clients) {
    for (const project of client.projects) {
      projectMap[project.id] = {
        projectId: project.id,
        projectName: project.name,
        clientName: client.name,
      };
    }
  }

  return (
    <EntriesPageShell
      clients={clients}
      todayEntries={todayEntries}
      projectMap={projectMap}
    />
  );
}
