import { Bolt, Heart, Layers3, Sparkles } from "lucide-react";
import { skills } from "@/game/content";
import type { RunSnapshot } from "@/game/types";

interface RunHudProps {
  snapshot: RunSnapshot;
}

export function RunHud({ snapshot }: RunHudProps) {
  const xpProgress = (snapshot.player.xp / snapshot.player.xpToNext) * 100;

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
