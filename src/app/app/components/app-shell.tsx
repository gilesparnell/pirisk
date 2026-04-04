"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Clock,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Keyboard, HelpCircle } from "lucide-react";
import { signOutAction } from "./sign-out-action";

const navItems = [
  { href: "/app", label: "Dashboard", icon: BarChart3 },
  { href: "/app/entries?voice=1", label: "Time Entries", icon: Clock },
  { href: "/app/clients", label: "Clients", icon: Users },
  { href: "/app/invoices", label: "Invoices", icon: FileText },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  function handleSignOut() {
    setShowLogoutModal(true);
    setTimeout(() => {
      signOutAction();
    }, 2500);
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      // Ctrl+N / Cmd+N → New time entry
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        router.push("/app/entries?new=1");
        return;
      }

      // Skip remaining shortcuts if focused on an input
      if (isInput) return;

      // ? → Toggle help
      if (e.key === "?") {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // Escape → Close help/modals
      if (e.key === "Escape") {
        setShowHelp(false);
        return;
      }

      // g then d → Dashboard, g then t → Time entries, etc.
      // Simple single-key nav shortcuts
      if (e.key === "g") {
        // We'll use Alt+key for navigation to avoid conflicts
        return;
      }
    },
    [router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-800">
          <Link href="/app" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="PiRisk"
              width={100}
              height={28}
              className="h-7 w-auto brightness-200"
            />
            <span className="text-sm font-bold text-teal-400">PiTime</span>
          </Link>
          <button
            className="lg:hidden text-gray-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/app" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-teal-500/10 text-teal-400"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-teal-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-teal-400">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userName}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-gray-500 hover:text-gray-300"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button
              className="lg:hidden text-gray-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1" />
            <a
              href="/app/help"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="User Guide"
            >
              <HelpCircle className="h-5 w-5" />
            </a>
            <button
              onClick={() => setShowHelp(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>

      {/* Help / Shortcuts Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="rounded-2xl bg-white shadow-2xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <ShortcutRow keys={["Ctrl", "N"]} description="New time entry" />
              <ShortcutRow keys={["?"]} description="Show this help" />
              <ShortcutRow keys={["Esc"]} description="Close modal" />
            </div>
            <div className="px-6 py-3 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-400 text-center">
                Press <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-mono text-[10px]">?</kbd> anywhere to toggle this panel
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="animate-fade-in rounded-2xl bg-white px-10 py-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center">
              <LogOut className="h-6 w-6 text-teal-600" />
            </div>
            <p className="text-lg font-bold text-gray-900 mb-1">
              Logging out of PiTime
            </p>
            <p className="text-sm text-gray-500">
              Giles for President!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ShortcutRow({
  keys,
  description,
}: {
  keys: string[];
  description: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i}>
            {i > 0 && <span className="text-gray-300 mx-0.5">+</span>}
            <kbd className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-mono font-medium text-gray-700">
              {key}
            </kbd>
          </span>
        ))}
      </div>
    </div>
  );
}
