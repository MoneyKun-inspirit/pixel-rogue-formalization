import { Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RelicDefinition } from "@/game/types";

const rarityClass = {
  rare: "border-fuchsia-300/30 bg-fuchsia-400/10",
  epic: "border-amber-300/35 bg-amber-400/10",
} as const;

interface RelicPanelProps {
  relics: RelicDefinition[];
  onChoose: (relic: RelicDefinition) => void;
}

export function RelicPanel({ relics, onChoose }: RelicPanelProps) {
  if (relics.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 px-6">
      <div className="w-full max-w-5xl rounded-[32px] border border-fuchsia-200/20 bg-[#0d0818]/95 p-6 shadow-[0_30px_120px_rgba(16,8,32,0.8)]">
        <p className="font-display text-xs uppercase tracking-[0.42em] text-fuchsia-200/75">遗物流派</p>
        <div className="mt-2 flex items-center justify-between">
          <h3 className="font-display text-2xl text-white">遗物抉择</h3>
          <p className="text-sm text-slate-400">按 `1` `2` `3` 也可快速选择</p>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {relics.map((relic, index) => (
            <button
              key={relic.id}
              type="button"
              onClick={() => onChoose(relic)}
              className={cn(
                "rounded-[24px] border p-5 text-left transition hover:-translate-y-1 hover:border-fuchsia-200/50",
                rarityClass[relic.rarity],
              )}
            >
              <div className="flex items-start justify-between">
                <div className="rounded-2xl bg-black/25 p-3 text-white">
                  {relic.rarity === "epic" ? <Crown className="size-5" /> : <Sparkles className="size-5" />}
                </div>
                <span className="font-display text-xs text-slate-300/70">0{index + 1}</span>
              </div>
              <h4 className="mt-6 font-display text-xl text-white">{relic.name}</h4>
              <p className="mt-3 text-sm leading-6 text-slate-300">{relic.description}</p>
              <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-slate-400">
                <span>遗物</span>
                <span>{relic.rarity}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
