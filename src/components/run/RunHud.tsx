import { Bolt, Heart, Layers3, Sparkles } from "lucide-react";
import { affixPool, relicPool, skills } from "@/game/content";
import type { RunSnapshot } from "@/game/types";

interface RunHudProps {
  snapshot: RunSnapshot;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function buildHeroCorePanel(snapshot: RunSnapshot) {
  if (snapshot.heroId === "warrior") {
    const core = snapshot.heroCore.warrior;
    return {
      title: "怒焰值",
      value: `${Math.round(core.fury)} / ${core.maxFury}`,
      progress: (core.fury / core.maxFury) * 100,
      tone: "from-orange-400 to-rose-500",
      notes: [
        `点燃阈值 ${core.igniteThreshold}`,
        core.overdriveTimer > 0 ? `爆发剩余 ${core.overdriveTimer.toFixed(1)}s` : "贴身命中可快速积攒怒焰",
      ],
    };
  }

  if (snapshot.heroId === "ranger") {
    const core = snapshot.heroCore.ranger;
    const momentumRatio = core.momentum / core.momentumMax;
    return {
      title: "猎印节奏",
      value: `${Math.round(core.momentum)} / ${core.momentumMax}`,
      progress: momentumRatio * 100,
      tone: "from-emerald-400 to-cyan-400",
      notes: [
        `移动暴击加成 ${formatPercent(momentumRatio * core.critBonusFromMomentum)}，箭矢伤害加成 ${formatPercent(momentumRatio * 0.12)}`,
        core.markTargetId
          ? `锁定目标中，猎印层数 ${core.markStacks} / ${core.detonationThreshold}，剩余 ${core.markTimer.toFixed(1)}s`
          : "保持走位并连续命中可引爆猎印",
      ],
    };
  }

  const core = snapshot.heroCore.mage;
  return {
    title: "法印矩阵",
    value: `${core.sigils.length} / ${core.maxSigils}`,
    progress: (core.sigils.length / core.maxSigils) * 100,
    tone: "from-violet-400 to-indigo-400",
    notes: [
      core.sigils.length > 0 ? `当前法印 ${core.sigils.join(" / ")}` : "自动攻击与主动施法都会记录法印",
      core.resonanceTimer > 0
        ? `${core.resonanceLabel} 剩余 ${core.resonanceTimer.toFixed(1)}s，范围加成 ${formatPercent(core.resonanceAreaBonus)}`
        : "集满 3 枚法印可触发协鸣",
    ],
  };
}

export function RunHud({ snapshot }: RunHudProps) {
  const xpProgress = (snapshot.player.xp / snapshot.player.xpToNext) * 100;
  const heroCorePanel = buildHeroCorePanel(snapshot);
  const highlightedAffixes = snapshot.buildState.affixes
    .map((ownedAffix) => affixPool.find((affix) => affix.id === ownedAffix.id))
    .filter((affix) => affix !== undefined)
    .slice(0, 3);
  const highlightedRelics = snapshot.relics
    .map((ownedRelic) => relicPool.find((relic) => relic.id === ownedRelic.id))
    .filter((relic) => relic !== undefined)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/10 bg-slate-950/80 p-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-cyan-200/70">
          <span>{snapshot.hero.name}</span>
          <span>Wave {snapshot.wave}</span>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-2"><Heart className="size-4 text-rose-300" />生命</span>
              <span>{Math.round(snapshot.player.hp)} / {Math.round(snapshot.player.maxHp)}</span>
            </div>
            <div className="h-3 rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400" style={{ width: `${(snapshot.player.hp / snapshot.player.maxHp) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-2"><Sparkles className="size-4 text-cyan-300" />经验</span>
              <span>Lv.{snapshot.player.level}</span>
            </div>
            <div className="h-3 rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-slate-950/80 p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-cyan-200/70">
          <Sparkles className="size-4" />
          职业核心
        </div>
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
            <span>{heroCorePanel.title}</span>
            <span>{heroCorePanel.value}</span>
          </div>
          <div className="h-3 rounded-full bg-white/5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${heroCorePanel.tone}`}
              style={{ width: `${heroCorePanel.progress}%` }}
            />
          </div>
          <div className="mt-3 space-y-1 text-xs text-slate-400">
            {heroCorePanel.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-slate-950/80 p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-cyan-200/70">
          <Layers3 className="size-4" />
          当前构筑
        </div>
        <div className="mt-4 space-y-3">
          {snapshot.ownedSkills.map((skill) => (
            <div key={skill.id} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3">
              <div className="flex items-center justify-between text-sm text-white">
                <span>{skills[skill.id].name}</span>
                <span className="text-xs text-slate-400">Lv.{skill.level}</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">{skills[skill.id].description}</p>
              <div className="mt-2 inline-flex rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-amber-200/80">
                {skill.element}
              </div>
            </div>
          ))}
          <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3">
            <div className="flex items-center justify-between text-sm text-white">
              <span>核心词缀</span>
              <span className="text-xs text-slate-400">{snapshot.buildState.affixes.length} 项</span>
            </div>
            <div className="mt-3 space-y-2 text-xs text-slate-400">
              {highlightedAffixes.length > 0 ? (
                highlightedAffixes.map((affix) => (
                  <p key={affix.id}>
                    {affix.name}：{affix.description}
                  </p>
                ))
              ) : (
                <p>尚未获得通用词缀，优先关注弹射、冷却或范围方向。</p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3">
            <div className="flex items-center justify-between text-sm text-white">
              <span>本局遗物</span>
              <span className="text-xs text-slate-400">{snapshot.relics.length} 件</span>
            </div>
            <div className="mt-3 space-y-2 text-xs text-slate-400">
              {highlightedRelics.length > 0 ? (
                highlightedRelics.map((relic) => (
                  <p key={relic.id}>
                    {relic.name}：{relic.summary}
                  </p>
                ))
              ) : (
                <p>遗物会在中局阶段触发，决定这一局后半段的主打法。</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-slate-950/80 p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-cyan-200/70">
          <Bolt className="size-4" />
          操作
        </div>
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          <p>`WASD` 移动，自动锁定最近敌人。</p>
          <p>`Space` 同步释放已学主动技能。</p>
          <p>`1 / 2 / 3` 选择升级，目标是存活 4 分钟。</p>
        </div>
      </div>
    </div>
  );
}
