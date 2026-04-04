"use client";

import { Mic } from "lucide-react";
import { useRouter } from "next/navigation";

export function MobileVoiceButton() {
  const router = useRouter();

  return (
    <div className="lg:hidden mb-6">
      <button
        onClick={() => router.push("/app/entries?voice=1")}
        className="group relative w-full flex items-center gap-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-4 shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-teal-400/50"
        aria-label="Press to enter time using voice"
      >
        <span className="relative flex-shrink-0 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
          <Mic className="h-7 w-7 text-white" strokeWidth={2} />
        </span>
        <span className="text-left">
          <span className="block text-lg font-bold text-white">Press to enter time</span>
          <span className="block text-sm text-white/70">Tap and speak naturally</span>
        </span>
      </button>
    </div>
  );
}
