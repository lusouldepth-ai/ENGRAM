import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="w-full px-6 py-6 md:px-12 flex justify-between items-center border-b border-black/5 bg-braun-bg/80 backdrop-blur-sm sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-3 select-none cursor-pointer">
        <Logo className="w-8 h-8" />
        <span className="text-xl font-bold tracking-tight text-braun-text">ENGRAM</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
        <Link href="#method" className="hover:text-braun-text transition-colors">Method</Link>
        <Link href="#pricing" className="hover:text-braun-text transition-colors">Pricing</Link>
        <Link href="/login" className="hover:text-braun-text transition-colors">Login</Link>
        <Link href="/dashboard">
          <Button className="bg-braun-text text-white px-6 rounded-full hover:bg-black transition-colors">
            Get Started
          </Button>
        </Link>
      </div>
    </nav>
  );
}

