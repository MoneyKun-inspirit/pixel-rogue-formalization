import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { heroes } from "@/game/content";
import { applyRelic, applyUpgrade, buildRunSummary, createInitialRun, updateRunState } from "@/game/engine";
import type { HeroClass, RelicDefinition, RunSnapshot, UpgradeOption } from "@/game/types";

function cloneSnapshot(snapshot: RunSnapshot) {
  return {
    ...snapshot,
    player: { ...snapshot.player },
    enemies: snapshot.enemies.map((enemy) => ({
      ...enemy,
      status: {
        ...enemy.status,
        elementState: enemy.status.elementState ? { ...enemy.status.elementState } : undefined,
      },
    })),
    projectiles: snapshot.projectiles.map((projectile) => ({ ...projectile })),
    attackEffects: snapshot.attackEffects.map((effect) => ({ ...effect })),
    ownedSkills: snapshot.ownedSkills.map((skill) => ({ ...skill })),
    buildState: {
      ...snapshot.buildState,
      affixes: snapshot.buildState.affixes.map((affix) => ({ ...affix })),
    },
    heroCore: {
      warrior: { ...snapshot.heroCore.warrior },
      ranger: { ...snapshot.heroCore.ranger },
      mage: { ...snapshot.heroCore.mage, sigils: [...snapshot.heroCore.mage.sigils] },
    },
    takenHeroCoreUpgrades: [...snapshot.takenHeroCoreUpgrades],
    upgrades: snapshot.upgrades.map((upgrade) => ({ ...upgrade })),
    relics: snapshot.relics.map((relic) => ({ ...relic })),
    pendingRelicChoices: snapshot.pendingRelicChoices.map((relic) => ({ ...relic })),
    floatingTexts: snapshot.floatingTexts.map((text) => ({ ...text })),
    stats: { ...snapshot.stats },
    hero: snapshot.hero,
  };
}

export function useRunSimulation(heroId: HeroClass, controls: { up: boolean; down: boolean; left: boolean; right: boolean; cast: boolean }, onFinish: (ending: "defeat" | "victory", summaryText: string[]) => void) {
  const initialSnapshot = useMemo<RunSnapshot>(() => {
    const run = createInitialRun(heroId);
    return { ...run, hero: heroes[heroId] };
  }, [heroId]);

  const [snapshot, setSnapshot] = useState<RunSnapshot>(initialSnapshot);
  const runRef = useRef(createInitialRun(heroId));
  const finishRef = useRef(false);

  useEffect(() => {
    runRef.current = createInitialRun(heroId);
    finishRef.current = false;
    setSnapshot({ ...runRef.current, hero: heroes[heroId] });
  }, [heroId]);

  useEffect(() => {
    let lastTime = performance.now();
    let frame = 0;
    let rafId = 0;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;
      updateRunState(runRef.current, controls, dt);
      frame += 1;

      if (frame % 2 === 0) {
        setSnapshot({ ...cloneSnapshot({ ...runRef.current, hero: heroes[heroId] }) });
      }

      if (!finishRef.current && (runRef.current.mode === "defeat" || runRef.current.mode === "victory")) {
        const summary = buildRunSummary(runRef.current);
        finishRef.current = true;
        onFinish(summary.ending, summary.ownedSkills);
      }

      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [controls, heroId, onFinish]);

  const chooseUpgrade = useCallback((option: UpgradeOption) => {
    applyUpgrade(runRef.current, option);
    setSnapshot({ ...cloneSnapshot({ ...runRef.current, hero: heroes[heroId] }) });
  }, [heroId]);

  const chooseRelic = useCallback((relic: RelicDefinition) => {
    applyRelic(runRef.current, relic);
    setSnapshot({ ...cloneSnapshot({ ...runRef.current, hero: heroes[heroId] }) });
  }, [heroId]);

  return {
    snapshot,
    chooseUpgrade,
    chooseRelic,
  };
}
