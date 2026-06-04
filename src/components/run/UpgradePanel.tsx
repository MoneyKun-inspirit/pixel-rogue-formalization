import { Gem, Sparkles, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UpgradeOption } from "@/game/types";

const rarityClass = {
  common: "border-white/10 bg-white/5",
  rare: "border-cyan-300/30 bg-cyan-400/10",
  epic: "border-amber-300/35 bg-amber-400/10",
};

const iconMap = {
  "new-skill": Sparkles,
  "skill-up": Swords,
  "element-mod": Gem,
  "stat-mod": Gem,
  "hero-core": Sparkles,
} as const;

interface UpgradePanelProps {
  options: UpgradeOption[];
  onChoose: (option: UpgradeOption) => void;
}

export function UpgradePanel({ options, onChoose }: UpgradePanelProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/65 px-6">
      <div className="w-full max-w-5xl rounded-[32px] border border-cyan-200/15 bg-[#080d1d]/95 p-6 shadow-[0_30px_120px_rgba(2,8,24,0.78)]">
        <p className="font-display text-xs uppercase tracking-[0.42em] text-cyan-200/70">构筑选择</p>
        <div className="mt-2 flex items-center justify-between">
          <h3 className="font-display text-2xl text-white">升级后选择 1 项强化</h3>
          <p className="text-sm text-slate-400">按 `1` `2` `3` 也可快速选择</p>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {options.map((option, index) => {
            const Icon = iconMap[option.kind];
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChoose(option)}
                className={cn(
                  "rounded-[24px] border p-5 text-left transition hover:-translate-y-1 hover:border-cyan-200/50",
                  rarityClass[option.rarity],
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-2xl bg-black/25 p-3 text-white">
                    <Icon className="size-5" />
                  </div>
                  <span className="font-display text-xs text-slate-300/70">0{index + 1}</span>
                </div>
                <h4 className="mt-6 font-display text-xl text-white">{option.title}</h4>
                <p className="mt-3 text-sm leading-6 text-slate-300">{option.description}</p>
                <div className="mt-4 text-[10px] uppercase tracking-[0.35em] text-slate-400">{option.rarity}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
