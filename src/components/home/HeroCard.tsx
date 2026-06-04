import { Flame, Shield, Sparkles, Swords, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroDefinition } from "@/game/types";

const iconMap = {
  warrior: Swords,
  ranger: Sparkles,
  mage: Wand2,
} as const;

interface HeroCardProps {
  hero: HeroDefinition;
  active: boolean;
  onSelect: () => void;
}

export function HeroCard({ hero, active, onSelect }: HeroCardProps) {
  const Icon = iconMap[hero.id];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative overflow-hidden rounded-[28px] border px-6 py-6 text-left transition duration-200",
        "bg-slate-950/80 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_60px_rgba(3,7,18,0.55)]",
        active ? "border-amber-300/80" : "border-white/10 hover:border-cyan-300/60",
      )}
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{ background: `radial-gradient(circle at top right, ${hero.color}, transparent 45%)` }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="font-display text-[11px] uppercase tracking-[0.45em] text-cyan-200/70">{hero.title}</p>
          <h3 className="mt-3 font-display text-2xl text-white">{hero.name}</h3>
          <p className="mt-3 max-w-xs text-sm text-slate-300">{hero.flavor}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-white">
          <Icon className="size-6" />
        </div>
      </div>

      <div className="relative mt-5 flex items-center gap-3 text-xs text-slate-300">
        <Shield className="size-4 text-amber-300" />
        <span>生命 {hero.baseHp}</span>
        <Flame className="size-4 text-orange-300" />
        <span>武器 {hero.weapon}</span>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        {hero.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
            {tag}
          </span>
        ))}
      </div>

      <p className="relative mt-5 text-xs leading-6 text-slate-400">职业特性: {hero.trait}</p>
    </button>
  );
}
