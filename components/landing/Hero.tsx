import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Command, Sparkles, Check } from "lucide-react";

export function Hero() {
  return (
    <section className="flex-grow flex flex-col items-center px-4 pt-20 md:pt-28 pb-20">
      <div className="text-center max-w-3xl mx-auto animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 mb-8">
          <div className="w-2 h-2 rounded-full bg-braun-accent"></div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Version 1.0 Now Available</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-braun-text mb-6 leading-[1.1]">
          Carve it in <br className="hidden md:block" /> your mind.
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          The friction-free learning tool. <br />
          Turn any text into <span className="text-braun-text font-medium">permanent memory</span> with one command.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <Link href="/dashboard" className="w-full md:w-auto">
            <Button className="w-full md:w-auto bg-braun-accent text-white px-8 py-6 rounded-full font-medium text-lg hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl">
              Start Learning — It's Free
            </Button>
          </Link>
          <Link href="#method" className="w-full md:w-auto">
             <Button variant="ghost" className="w-full md:w-auto text-gray-500 px-8 py-6 rounded-full font-medium text-lg hover:text-braun-text transition-colors hover:bg-transparent">
               How it works
             </Button>
          </Link>
        </div>
      </div>

      {/* Visual Demo */}
      <div className="mt-20 w-full max-w-4xl relative animate-fade-up [animation-delay:300ms]">
        {/* Abstract Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-b from-gray-200/30 to-transparent rounded-[50%] blur-3xl -z-10 pointer-events-none"></div>

        {/* App Container */}
        <div className="bg-braun-surface border border-gray-200 rounded-2xl shadow-xl overflow-hidden relative">
          
          {/* Header */}
          <div className="border-b border-gray-200 p-4 md:p-6 flex flex-col gap-2 bg-white/50 backdrop-blur-sm">
             <div className="flex items-center gap-4 text-gray-400 text-sm mb-2 font-medium">
                <span className="text-braun-accent">Input</span>
                <span>Review</span>
                <span>Decks</span>
             </div>
             <div className="flex items-center gap-3 text-lg md:text-2xl font-medium text-braun-text">
                <Command className="w-6 h-6 text-gray-300" />
                <span className="relative">
                   Generate cards for <span className="border-b-2 border-braun-accent/30">IELTS Vocabulary</span>
                   <span className="animate-pulse ml-1 inline-block w-0.5 h-6 bg-braun-accent align-middle"></span>
                </span>
             </div>
          </div>

          {/* Body */}
          <div className="grid md:grid-cols-2 h-[400px] bg-[#F9F9F7]">
            
            {/* Left List */}
            <div className="p-6 border-r border-gray-200 hidden md:block overflow-y-auto">
               <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Generated List</div>
               <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                     <div className="flex gap-3 items-center">
                        <div className="w-5 h-5 rounded bg-braun-accent flex items-center justify-center text-white">
                           <Check className="w-3 h-3" />
                        </div>
                        <div>
                           <p className="font-medium text-sm text-braun-text">Ephemeral</p>
                           <p className="text-xs text-gray-500">短暂的，转瞬即逝的</p>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm opacity-60">
                     <div className="flex gap-3 items-center">
                        <div className="w-5 h-5 rounded border border-gray-200"></div>
                        <div>
                           <p className="font-medium text-sm text-braun-text">Serendipity</p>
                           <p className="text-xs text-gray-500">机缘凑巧</p>
                        </div>
                     </div>
                  </div>
                   <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm opacity-40">
                     <div className="flex gap-3 items-center">
                        <div className="w-5 h-5 rounded border border-gray-200"></div>
                        <div>
                           <p className="font-medium text-sm text-braun-text">Eloquent</p>
                           <p className="text-xs text-gray-500">雄辩的</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Preview */}
            <div className="p-6 md:p-12 flex flex-col items-center justify-center relative">
               <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 absolute top-6 left-6">Preview</div>
               
               <div className="w-full max-w-xs aspect-[4/5] bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col items-center justify-center text-center p-8 relative hover:-translate-y-1 transition-transform duration-300 cursor-pointer group">
                  <div className="mb-2 text-gray-400 text-sm font-mono">/əˈfem.ər.əl/</div>
                  <h3 className="text-3xl font-bold text-braun-text mb-4 tracking-tight">Ephemeral</h3>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 absolute bottom-8 inset-x-0">
                     <p className="text-braun-accent font-medium text-sm">Click to flip</p>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

