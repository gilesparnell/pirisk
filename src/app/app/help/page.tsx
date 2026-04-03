import {
  Clock,
  Users,
  FileText,
  BarChart3,
  Settings,
  Keyboard,
  Mic,
  HelpCircle,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  DollarSign,
  Shield,
} from "lucide-react";

export default function HelpPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          PiTime User Guide
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Everything you need to know about using PiTime
        </p>
      </div>

      <div className="space-y-8">
        {/* Getting Started */}
        <Section
          icon={<HelpCircle className="h-5 w-5 text-teal-600" />}
          title="Getting Started"
        >
          <p className="text-sm text-gray-600 mb-3">
            PiTime is a voice-activated timesheet and invoice app. The fastest
            way to log time is with voice — press <Kbd>Ctrl</Kbd>+<Kbd>N</Kbd>{" "}
            from anywhere, speak naturally, and hit Parse.
          </p>
          <div className="rounded-lg bg-teal-50 border border-teal-200 px-4 py-3">
            <p className="text-sm text-teal-800">
              <strong>Quick start:</strong> Set up your business profile in
              Settings first, then add clients and projects. After that, you can
              start logging time with voice or manual entry.
            </p>
          </div>
        </Section>

        {/* Voice Entry */}
        <Section
          icon={<Mic className="h-5 w-5 text-teal-600" />}
          title="Voice / Quick Entry"
        >
          <p className="text-sm text-gray-600 mb-4">
            Use Wispr Flow (OS-level speech-to-text) or just type naturally.
            PiTime&apos;s fuzzy parser extracts hours, client, project, mileage,
            and description from plain English.
          </p>
          <table className="w-full text-sm border-collapse mb-4">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">
                  You Say
                </th>
                <th className="text-left py-2 text-gray-500 font-medium">
                  PiTime Extracts
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">
                  &quot;4 hours contract review for Acme&quot;
                </td>
                <td className="py-2">4h · Acme · description</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">&quot;all day Metro Rail&quot;</td>
                <td className="py-2">8h · Metro Rail</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">
                  &quot;sixty hours Parnell Systems&quot;
                </td>
                <td className="py-2">60h · ParnellSystems</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">
                  &quot;two and a half hours plus 85km&quot;
                </td>
                <td className="py-2">2.5h · 85km mileage</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">
                  &quot;a hundred and sixty hours total&quot;
                </td>
                <td className="py-2">160h (full month)</td>
              </tr>
            </tbody>
          </table>
          <div className="space-y-2">
            <Tip>
              <strong>Fuzzy matching:</strong> The parser handles spelling
              variations, typos, and speech-to-text quirks. &quot;Tessie&quot;
              matches &quot;Tess&quot;, &quot;Akme&quot; matches
              &quot;Acme&quot;, and PascalCase names like
              &quot;TessTantrums&quot; are split automatically.
            </Tip>
            <Tip>
              <strong>Word-form numbers:</strong> PiTime understands spoken
              numbers from &quot;one&quot; through &quot;three hundred and
              twenty&quot;, including compounds like &quot;forty five&quot;.
              Digit form (60, 160) also works.
            </Tip>
            <Tip>
              <strong>Mileage:</strong> Say &quot;plus 85 km&quot; and
              PiTime adds a mileage entry at the ATO rate ($0.91/km).
            </Tip>
          </div>
        </Section>

        {/* Time Entries */}
        <Section
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          title="Time Entries"
        >
          <ActionTable
            rows={[
              [
                "Log via voice",
                "Time Entries → speak into voice field → Parse → review → Save",
              ],
              [
                "Log manually",
                "Time Entries → fill date, client, project, hours, description → Save",
              ],
              [
                "Add mileage",
                "Enter km in the mileage field (invoiced at $0.91/km)",
              ],
              [
                "Mark non-billable",
                "Uncheck the 'Billable' toggle — won't appear on invoices",
              ],
              [
                "Delete entry",
                "Click the trash icon on any entry → confirm deletion",
              ],
            ]}
          />
        </Section>

        {/* Clients & Projects */}
        <Section
          icon={<Users className="h-5 w-5 text-blue-600" />}
          title="Clients & Projects"
        >
          <ActionTable
            rows={[
              [
                "Add client",
                "Clients page → Add Client → fill name, contact, rate type, rate → Save",
              ],
              [
                "Edit client",
                "Click the pencil icon on a client card → modify fields → Save Changes",
              ],
              [
                "Delete client",
                "Click the trash icon → confirm. Cannot delete clients with time entries.",
              ],
              [
                "View projects",
                "Click any client card to expand → shows projects with status badges",
              ],
              [
                "Add project",
                "Expand a client → Add Project → enter name and optional code → Add",
              ],
              [
                "Rate types",
                "Hourly (e.g. $250/hr) or Daily (e.g. $1,800/day). Daily converts via Standard Day Hours.",
              ],
            ]}
          />
          <Tip>
            <strong>Delete protection:</strong> Clients with time entries cannot
            be deleted. This prevents accidental loss of billing data. Remove the
            entries first if you need to delete the client.
          </Tip>
        </Section>

        {/* Invoices */}
        <Section
          icon={<FileText className="h-5 w-5 text-green-600" />}
          title="Invoices"
        >
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 flex-wrap">
            <Step label="Select client" />
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <Step label="Set dates & notes" />
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <Step label="Create invoice" />
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <Step label="Add line items" />
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <Step label="Send" />
          </div>
          <ActionTable
            rows={[
              [
                "Invoice number",
                "Auto-generated: INV-YYYYMM-NNN (e.g. INV-202604-001)",
              ],
              [
                "GST",
                "10% applied automatically to all line items including mileage",
              ],
              [
                "Status flow",
                "Draft → Sent → Paid (or Overdue if past due date, Void to cancel)",
              ],
              [
                "Payment terms",
                "Configurable in Settings (default: 30 days)",
              ],
            ]}
          />
        </Section>

        {/* Dashboard */}
        <Section
          icon={<BarChart3 className="h-5 w-5 text-amber-600" />}
          title="Dashboard"
        >
          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            <StatInfo label="Today" desc="Total hours logged today" />
            <StatInfo label="This Week" desc="Running total Mon–Sun" />
            <StatInfo label="Unbilled" desc="Billable time not yet invoiced" />
            <StatInfo
              label="Outstanding"
              desc="Sent invoices awaiting payment"
            />
          </div>
          <Tip>
            <strong>Quick entry:</strong> Click &quot;New Entry&quot; on the
            dashboard card — it opens Time Entries with the voice field focused
            and ready.
          </Tip>
        </Section>

        {/* Settings */}
        <Section
          icon={<Settings className="h-5 w-5 text-gray-600" />}
          title="Settings"
        >
          <ActionTable
            rows={[
              [
                "Business profile",
                "Business name, ABN, address, email, phone — appears on invoices",
              ],
              [
                "Invoice settings",
                "Standard day hours, mileage rate, GST rate, prefix, payment terms",
              ],
              [
                "Bank details",
                "Bank name, BSB, account number — shown on invoices for payment",
              ],
              [
                "Xero connection",
                "Connect to Xero for invoice syncing (coming soon)",
              ],
            ]}
          />
          <Tip>
            <strong>Set up your profile first.</strong> Go to Settings and fill
            in your business details and bank info before generating your first
            invoice.
          </Tip>
        </Section>

        {/* Keyboard Shortcuts */}
        <Section
          icon={<Keyboard className="h-5 w-5 text-blue-600" />}
          title="Keyboard Shortcuts"
        >
          <p className="text-sm text-gray-600 mb-4">
            Press <Kbd>?</Kbd> anywhere in the app to see the shortcuts panel.
          </p>
          <ActionTable
            rows={[
              ["Ctrl+N / Cmd+N", "New time entry (voice field focused)"],
              ["?", "Toggle keyboard shortcuts help"],
              ["Esc", "Close any open modal"],
            ]}
          />
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ActionTable({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full text-sm border-collapse mb-3">
      <tbody>
        {rows.map(([action, how], i) => (
          <tr key={i} className="border-b border-gray-100 last:border-0">
            <td className="py-2.5 pr-4 font-medium text-gray-900 whitespace-nowrap align-top">
              {action}
            </td>
            <td className="py-2.5 text-gray-600">{how}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-teal-50 border border-teal-200 px-4 py-2.5 text-sm text-teal-800">
      {children}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-xs font-mono font-medium text-gray-700">
      {children}
    </kbd>
  );
}

function Step({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
      {label}
    </span>
  );
}

function StatInfo({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="rounded-lg border border-gray-100 px-4 py-3">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
  );
}
