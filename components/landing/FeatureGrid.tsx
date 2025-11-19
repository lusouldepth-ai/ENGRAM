import { Mic, Zap, Circle } from "lucide-react";

export function FeatureGrid() {
  return (
    <section id="method" className="border-t border-black/5 py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-12">
        {/* Feature 1 */}
        <div className="space-y-4">
          <div className="w-10 h-10 bg-braun-bg rounded-lg flex items-center justify-center text-braun-text mb-2">
            <Mic className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-braun-text">Natural Language Control</h3>
          <p className="text-gray-500 leading-relaxed">
            Don't fill out forms. Just talk to ENGRAM. Tell it what to create, how to style it, and what accent to use.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="space-y-4">
          <div className="w-10 h-10 bg-braun-bg rounded-lg flex items-center justify-center text-braun-text mb-2">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-braun-text">Algorithmic Mastery</h3>
          <p className="text-gray-500 leading-relaxed">
            Powered by a modified FSRS algorithm. We calculate the exact moment you're about to forget, and remind you then.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="space-y-4">
          <div className="w-10 h-10 bg-braun-bg rounded-lg flex items-center justify-center text-braun-text mb-2">
            <Circle className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-braun-text">Dieter Rams Aesthetic</h3>
          <p className="text-gray-500 leading-relaxed">
            No gamification clutter. No cartoons. Just pure, functional design that respects your attention span.
          </p>
        </div>
      </div>
    </section>
  );
}

