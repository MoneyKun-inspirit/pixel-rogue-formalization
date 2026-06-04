import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { CanvasArena } from "@/components/run/CanvasArena";
import { RelicPanel } from "@/components/run/RelicPanel";
import { RunHud } from "@/components/run/RunHud";
import { RunSummaryPanel } from "@/components/run/RunSummaryPanel";
import { UpgradePanel } from "@/components/run/UpgradePanel";
import { useKeyboardControls } from "@/components/run/useKeyboardControls";
import { useRunSimulation } from "@/components/run/useRunSimulation";
import { buildRunSummary } from "@/game/engine";
import { useGameStore } from "@/store/gameStore";

export default function RunPage() {
  const heroId = useGameStore((state) => state.selectedHeroId);
  const saveSummary = useGameStore((state) => state.saveSummary);
  const controls = useKeyboardControls();
  const [ending, setEnding] = useState<"defeat" | "victory" | null>(null);
  const [summaryLines, setSummaryLines] = useState<string[]>([]);

  const handleFinish = useCallback((result: "defeat" | "victory", ownedSkills: string[]) => {
    setEnding(result);
    setSummaryLines(ownedSkills);
  }, []);

  const { snapshot, chooseUpgrade, chooseRelic } = useRunSimulation(heroId, controls, handleFinish);

  useEffect(() => {
    if (!ending) {
      return;
    }

    saveSummary(buildRunSummary(snapshot));
  }, [ending, saveSummary, snapshot]);

  useEffect(() => {
    function handleUpgradeShortcut(event: KeyboardEvent) {
      const index = Number(event.key) - 1;
      if (snapshot.mode === "levelup" && index >= 0 && index < snapshot.upgrades.length) {
        chooseUpgrade(snapshot.upgrades[index]);
      }

      if (snapshot.mode === "relic-choice" && index >= 0 && index < snapshot.pendingRelicChoices.length) {
        chooseRelic(snapshot.pendingRelicChoices[index]);
      }
    }

    window.addEventListener("keydown", handleUpgradeShortcut);
    return () => window.removeEventListener("keydown", handleUpgradeShortcut);
  }, [chooseRelic, chooseUpgrade, snapshot.mode, snapshot.pendingRelicChoices, snapshot.upgrades]);

  const summaryTitle = useMemo(() => {
    return [
      `存活时间 ${Math.round(snapshot.time)} 秒`,
      `击杀 ${snapshot.stats.kills}，总伤害 ${Math.round(snapshot.stats.damageDone)}`,
      `最终波次 ${snapshot.wave}`,
      ...summaryLines,
    ];
  }, [snapshot.stats.damageDone, snapshot.stats.kills, snapshot.time, snapshot.wave, summaryLines]);

  return (
    <main className="min-h-screen bg-[#050816] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.45em] text-cyan-200/70">试玩战斗</p>
            <h1 className="mt-2 font-display text-3xl text-white">{snapshot.hero.name}</h1>
            <p className="mt-2 text-sm text-slate-400">{snapshot.activeAnnouncement}</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/50 hover:text-cyan-100"
          >
            <ChevronLeft className="size-4" />
            返回选角
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative">
            <CanvasArena snapshot={snapshot} />
            {snapshot.mode === "levelup" ? <UpgradePanel options={snapshot.upgrades} onChoose={chooseUpgrade} /> : null}
            {snapshot.mode === "relic-choice" ? <RelicPanel relics={snapshot.pendingRelicChoices} onChoose={chooseRelic} /> : null}
            {ending ? (
              <RunSummaryPanel
                heroName={snapshot.hero.name}
                ending={ending}
                summaryLines={summaryTitle}
                onRestart={() => window.location.reload()}
              />
            ) : null}
          </div>
          <RunHud snapshot={snapshot} />
        </div>
      </div>
    </main>
  );
}
