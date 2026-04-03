import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchDashboardData } from "./actions";
import { computeDashboardStats } from "./dashboard-stats";
import {
  computeWeeklyHoursData,
  computeRevenueByClient,
  computeAgedReceivables,
} from "./chart-data";
import {
  WeeklyHoursChart,
  RevenueByClientChart,
  AgedReceivablesChart,
} from "./dashboard-charts";
import { Clock, DollarSign, FileText, TrendingUp } from "lucide-react";

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export default async function PiTimeDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { todayEntries, weekEntries, invoices, rateMap, projectMap, clients } =
    await fetchDashboardData();

  const stats = computeDashboardStats(
    todayEntries,
    weekEntries,
    invoices,
    rateMap
  );

  // Recent entries: last 5 from the week, sorted by date desc
  const recentEntries = [...weekEntries]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  // Chart data
  const monday = getMonday(new Date());
  const today = new Date().toISOString().split("T")[0];

  const weeklyData = computeWeeklyHoursData(weekEntries, monday);

  // Build projectId → clientId map and clientId → name map
  const projectToClient: Record<string, string> = {};
  const clientNameMap: Record<string, string> = {};
  for (const [projectId, info] of Object.entries(projectMap)) {
    // Find the client that owns this project
    const client = clients.find((c) => c.name === info.clientName);
    if (client) {
      projectToClient[projectId] = client.id;
      clientNameMap[client.id] = client.name;
    }
  }

  const revenueByClient = computeRevenueByClient(
    weekEntries,
    projectToClient,
    rateMap
  );
  const revenueData = revenueByClient.map((r) => ({
    name: clientNameMap[r.clientId] ?? "Unknown",
    amount: r.amount,
  }));

  const agedData = computeAgedReceivables(invoices, today);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {session.user.name || "there"}. Here&apos;s your
          overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          icon={Clock}
          title="Today"
          value={`${stats.todayHours.toFixed(1)}h`}
          subtitle={
            stats.todayHours === 0
              ? "No time logged today"
              : `${todayEntries.length} ${todayEntries.length === 1 ? "entry" : "entries"}`
          }
          color="teal"
        />
        <StatCard
          icon={TrendingUp}
          title="This Week"
          value={`${stats.weekHours.toFixed(1)}h`}
          subtitle={
            stats.weekHours === 0
              ? "Week starting Monday"
              : `${weekEntries.length} entries this week`
          }
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          title="Unbilled"
          value={`$${stats.unbilledAmount.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          subtitle="Ready to invoice"
          color="amber"
        />
        <StatCard
          icon={FileText}
          title="Outstanding"
          value={`$${stats.outstandingAmount.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          subtitle={
            invoices.filter(
              (i) => i.status === "sent" || i.status === "overdue"
            ).length + " unpaid invoices"
          }
          color="rose"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <WeeklyHoursChart data={weeklyData} />
        <RevenueByClientChart data={revenueData} />
      </div>
      <div className="mb-8">
        <AgedReceivablesChart data={agedData} />
      </div>

      {/* Quick Actions + Recent Entries */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white border border-gray-200 p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Quick Time Entry
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Use Wispr Flow voice input or type your entry. Try: &quot;4 hours
              contract review for Acme Tower Build&quot;
            </p>
            <div className="flex justify-center gap-3">
              <a
                href="/app/entries?new=1"
                className="inline-flex items-center rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
              >
                New Entry
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Recent Entries
          </h2>
          {recentEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">
                No time entries yet. Create your first entry to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => {
                const info = projectMap[entry.projectId];
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-900">
                          {info?.clientName ?? "Unknown"}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-600">
                          {info?.projectName ?? "Unknown"}
                        </span>
                      </div>
                      {entry.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {entry.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pl-4">
                      <span className="text-xs text-gray-400">
                        {entry.date}
                      </span>
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {entry.hours.toFixed(1)}h
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    teal: "bg-teal-50 text-teal-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}
