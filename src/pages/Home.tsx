import { ArrowRight, Flame, Shield, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HeroCard } from "@/components/home/HeroCard";
import { heroes } from "@/game/content";
import { useGameStore } from "@/store/gameStore";

export default function Home() {
  const navigate = useNavigate();
  const selectedHeroId = useGameStore((state) => state.selectedHeroId);
  const setSelectedHero = useGameStore((state) => state.setSelectedHero);
  const lastSummary = useGameStore((state) => state.lastSummary);
  const selectedHero = heroes[selectedHeroId];

  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(77,208,225,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(255,122,69,0.18),_transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[36px] border border-white/10 bg-slate-950/75 p-8 shadow-[0_30px_120px_rgba(2,8,24,0.55)]">
            <p className="font-display text-xs uppercase tracking-[0.5em] text-cyan-200/70">Pixel Rogue Demo</p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight text-white lg:text-7xl">
              咒术构筑与像素割草
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
              选择近战、远程或法师职业，在 4 分钟试玩局里叠出技能与元素联动。每次升级提供三选一强化，目标是在越来越密集的怪潮中构筑出一套真正有爽感的流派。
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <Shield className="size-5 text-amber-300" />
                <p className="mt-4 font-display text-lg">3 个职业原型</p>
                <p className="mt-2 text-sm text-slate-400">近战、远程、法师各有完全不同的起手节奏和成长方向。</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <Sparkles className="size-5 text-cyan-300" />
                <p className="mt-4 font-display text-lg">技能与元素叠加</p>
                <p className="mt-2 text-sm text-slate-400">火焰燃烧、寒冰减速、雷电连锁都能绑定到你的主武器。</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <Flame className="size-5 text-orange-300" />
                <p className="mt-4 font-display text-lg">一局可玩闭环</p>
                <p className="mt-2 text-sm text-slate-400">从选人、战斗、升级到结算都已打通，可以直接试玩验证方向。</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/run")}
                className="inline-flex items-center gap-3 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-6 py-4 text-sm text-cyan-100 transition hover:bg-cyan-300/20"
              >
                开始试玩
                <ArrowRight className="size-4" />
              </button>
              <div className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-300">
                当前职业: <span className="text-white">{selectedHero.name}</span>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-slate-950/75 p-6">
              <p className="font-display text-xs uppercase tracking-[0.45em] text-cyan-200/70">本局规则</p>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
                <p>1. 使用 `WASD` 移动，角色会自动攻击最近敌人。</p>
                <p>2. 升级时从 3 张强化卡中选 1 张，叠高技能或元素词缀。</p>
                <p>3. `Space` 释放主动技能，撑过 4 分钟即试玩胜利。</p>
              </div>
            </div>

            {lastSummary ? (
              <div className="rounded-[32px] border border-amber-300/20 bg-amber-400/10 p-6">
                <p className="font-display text-xs uppercase tracking-[0.45em] text-amber-100/70">上局摘要</p>
                <div className="mt-4 space-y-2 text-sm text-amber-50">
                  <p>{lastSummary.heroName}</p>
                  <p>存活 {lastSummary.survivedSeconds} 秒，击杀 {lastSummary.kills}</p>
                  <p>波次 {lastSummary.wave}，总伤害 {lastSummary.damageDone}</p>
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {Object.values(heroes).map((hero) => (
            <HeroCard
              key={hero.id}
              hero={hero}
              active={hero.id === selectedHeroId}
              onSelect={() => setSelectedHero(hero.id)}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
