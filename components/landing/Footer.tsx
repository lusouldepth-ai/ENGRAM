import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="bg-braun-bg border-t border-black/5 py-12 text-center">
      <div className="flex justify-center mb-6">
        <Logo className="w-6 h-6" />
      </div>
      <p className="text-xs font-semibold text-gray-500 tracking-widest uppercase mb-2">
        Designed in California & Berlin
      </p>
      <p className="text-sm text-gray-400/60">
        &copy; {new Date().getFullYear()} ENGRAM Inc. All rights reserved.
      </p>
    </footer>
  );
}

