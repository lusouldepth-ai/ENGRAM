import { CommandBar } from "@/components/creator/CommandBar";
import { Logo } from "@/components/ui/Logo";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-braun-bg">
      <div className="w-full max-w-md text-center mb-12 space-y-6">
        <div className="flex justify-center">
          <Logo className="w-24 h-24" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-braun-text">ENGRAM</h1>
          <p className="text-gray-500 text-lg">Carve it in your mind.</p>
        </div>
      </div>
      
      <CommandBar />
      
      <div className="fixed bottom-8 text-xs text-gray-400">
        <p>Press <kbd className="px-2 py-1 bg-white rounded border shadow-sm font-mono text-xs">Cmd + K</kbd> to start</p>
      </div>
    </main>
  );
}
