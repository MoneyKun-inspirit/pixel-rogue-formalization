import { describe, expect, it } from "vitest";
import { applyRelic, applyUpgrade, buildRelicOptions, buildUpgradeOptions, createInitialRun, updateRunState } from "@/game/engine";
import { relicPool } from "@/game/content";
import type { EnemyState } from "@/game/types";

function createDummyEnemy(x: number, y: number): EnemyState {
  return {
    id: Math.floor(Math.random() * 100000) + 1000,
    kind: "chaser" as const,
    x,
    y,
    hp: 1000,
    maxHp: 1000,
    radius: 14,
    speed: 0,
    contactDamage: 0,
    attackCooldown: 99,
    color: "#fff",
    xpReward: 0,
    status: { burnTimer: 0, slowTimer: 0, shockTimer: 0, meltedTimer: 0 },
  };
}

describe("game engine", () => {
  it("creates three unique upgrade options on level up", () => {
    const run = createInitialRun("mage");
    const upgrades = buildUpgradeOptions(run);

    expect(upgrades).toHaveLength(3);
    expect(new Set(upgrades.map((option) => option.id)).size).toBe(3);
  });

  it("applies element and stat upgrades to the run state", () => {
    const run = createInitialRun("warrior");
    const previousHp = run.player.maxHp;

    applyUpgrade(run, {
      id: "element-fire",
      kind: "element-mod",
      title: "余烬附魔",
      description: "主武器火焰化",
      rarity: "rare",
      targetId: "ember-cleave",
      element: "fire",
    });

    applyUpgrade(run, {
      id: "stat-vitality",
      kind: "stat-mod",
      title: "钢铁体魄",
      description: "提升生命",
      rarity: "common",
      value: 24,
    });

    expect(run.ownedSkills[0].element).toBe("fire");
    expect(run.player.maxHp).toBe(previousHp + 24);
  });

  it("offers a hero core upgrade in early levels while hero upgrades remain", () => {
    const run = createInitialRun("warrior");
    const upgrades = buildUpgradeOptions(run);

    expect(upgrades.some((option) => option.kind === "hero-core")).toBe(true);
    expect(upgrades.some((option) => option.kind === "stat-mod" || option.kind === "hero-core")).toBe(true);
    expect(upgrades.some((option) => ["new-skill", "skill-up"].includes(option.kind))).toBe(true);
    expect(upgrades.some((option) => ["affix", "element-mod"].includes(option.kind))).toBe(true);
  });

  it("does not force a hero core upgrade on later even levels", () => {
    const run = createInitialRun("warrior");
    run.player.level = 4;
    const upgrades = buildUpgradeOptions(run);

    expect(upgrades.some((option) => option.kind === "hero-core")).toBe(false);
  });

  it("warrior gains fury from close-range hits", () => {
    const run = createInitialRun("warrior");
    run.enemies.push(createDummyEnemy(run.player.x + 40, run.player.y));
    run.player.attackCooldown = 0;

    updateRunState(
      run,
      { up: false, down: false, left: false, right: false, cast: false },
      0.016,
    );

    expect(run.heroCore.warrior.fury).toBeGreaterThan(0);
  });

  it("ranger builds momentum while moving", () => {
    const run = createInitialRun("ranger");

    updateRunState(
      run,
      { up: false, down: false, left: false, right: true, cast: false },
      0.5,
    );

    expect(run.heroCore.ranger.momentum).toBeGreaterThan(0);
  });

  it("ranger gains extra momentum when arrows connect", () => {
    const run = createInitialRun("ranger");
    run.enemies.push(createDummyEnemy(run.player.x + 20, run.player.y));
    run.player.attackCooldown = 0;

    updateRunState(
      run,
      { up: false, down: false, left: false, right: false, cast: false },
      0.1,
    );

    expect(run.heroCore.ranger.momentum).toBeGreaterThan(4);
  });

  it("mage triggers resonance after collecting three sigils", () => {
    const run = createInitialRun("mage");
    run.enemies.push(createDummyEnemy(run.player.x + 120, run.player.y));

    for (let count = 0; count < 3; count += 1) {
      run.player.attackCooldown = 0;
      updateRunState(
        run,
        { up: false, down: false, left: false, right: false, cast: false },
        0.016,
      );
    }

    expect(run.heroCore.mage.resonanceTimer).toBeGreaterThan(0);
    expect(run.heroCore.mage.sigils).toHaveLength(0);
  });

  it("mage emits resonance pulses while resonance is active", () => {
    const run = createInitialRun("mage");
    run.heroCore.mage.resonanceTimer = 2;
    run.heroCore.mage.resonanceDuration = 2;
    run.heroCore.mage.resonanceElement = "arcane";
    run.heroCore.mage.resonancePulseTimer = 0;

    updateRunState(
      run,
      { up: false, down: false, left: false, right: false, cast: false },
      0.016,
    );

    expect(run.attackEffects.some((effect) => effect.kind === "burst" && effect.element === "arcane")).toBe(true);
  });

  it("mage does not rebuild sigils during active resonance", () => {
    const run = createInitialRun("mage");
    run.heroCore.mage.resonanceTimer = 2;
    run.heroCore.mage.sigils = [];
    run.enemies.push(createDummyEnemy(run.player.x + 120, run.player.y));
    run.player.attackCooldown = 0;

    updateRunState(
      run,
      { up: false, down: false, left: false, right: false, cast: false },
      0.016,
    );

    expect(run.heroCore.mage.sigils).toHaveLength(0);
  });

  it("creates visible attack effects for learned active skills", () => {
    const run = createInitialRun("mage");
    run.enemies.push(createDummyEnemy(run.player.x + 80, run.player.y));

    applyUpgrade(run, {
      id: "skill-flame-nova",
      kind: "new-skill",
      title: "学习 烈焰新星",
      description: "",
      rarity: "rare",
      targetId: "flame-nova",
    });

    updateRunState(
      run,
      { up: false, down: false, left: false, right: false, cast: true },
      0.016,
    );

    expect(run.attackEffects.some((effect) => effect.kind === "nova")).toBe(true);
  });

  it("learns and casts shared active skills", () => {
    const run = createInitialRun("warrior");
    run.enemies.push(createDummyEnemy(run.player.x + 30, run.player.y));

    applyUpgrade(run, {
      id: "skill-whirling-guard",
      kind: "new-skill",
      title: "学习 贴身旋刃",
      description: "",
      rarity: "rare",
      targetId: "whirling-guard",
    });

    updateRunState(
      run,
      { up: false, down: false, left: false, right: false, cast: true },
      0.016,
    );

    expect(run.attackEffects.some((effect) => effect.kind === "nova" && effect.element === "physical")).toBe(true);
  });

  it("applies affix upgrades to build state", () => {
    const run = createInitialRun("ranger");

    applyUpgrade(run, {
      id: "affix-cooldown-weave",
      kind: "affix",
      title: "冷却压缩",
      description: "",
      rarity: "rare",
      category: "tempo",
    });

    expect(run.buildState.activeCooldownMultiplier).toBeLessThan(1);
    expect(run.buildState.affixes.some((affix) => affix.id === "affix-cooldown-weave")).toBe(true);
  });

  it("affix upgrades modify projectile behavior", () => {
    const run = createInitialRun("ranger");

    applyUpgrade(run, {
      id: "affix-deep-pierce",
      kind: "affix",
      title: "贯穿整列",
      description: "",
      rarity: "rare",
      category: "projectile",
    });

    run.enemies.push(createDummyEnemy(run.player.x + 80, run.player.y));
    run.player.attackCooldown = 0;
    updateRunState(
      run,
      { up: false, down: false, left: false, right: false, cast: false },
      0.016,
    );

    expect(run.projectiles[0]?.pierce).toBeGreaterThanOrEqual(3);
  });

  it("triggers relic choices at the configured mid-run timing", () => {
    const run = createInitialRun("ranger");
    run.time = 79.98;

    updateRunState(
      run,
      { up: false, down: false, left: false, right: false, cast: false },
      0.05,
    );

    expect(run.mode).toBe("relic-choice");
    expect(run.pendingRelicChoices).toHaveLength(3);
  });

  it("pauses combat progression while relic choice is pending", () => {
    const run = createInitialRun("warrior");
    run.mode = "relic-choice";
    run.pendingRelicChoices = buildRelicOptions(run);
    run.spawnTimer = 0;
    const previousTime = run.time;

    updateRunState(
      run,
      { up: false, down: false, left: false, right: false, cast: false },
      0.2,
    );

    expect(run.time).toBe(previousTime);
    expect(run.enemies).toHaveLength(0);
  });

  it("applies relic effects and schedules the next relic node", () => {
    const run = createInitialRun("mage");
    const relic = relicPool.find((entry) => entry.id === "relic-overload-codex");

    expect(relic).toBeDefined();
    applyRelic(run, relic!);

    expect(run.relics.some((ownedRelic) => ownedRelic.id === "relic-overload-codex")).toBe(true);
    expect(run.buildState.relicActiveDamageMultiplier).toBeGreaterThan(1);
    expect(run.nextRelicTime).toBe(175);
    expect(run.mode).toBe("running");
  });

  it("split plume relic creates follow-up split projectiles on hit", () => {
    const run = createInitialRun("ranger");
    run.enemies.push(createDummyEnemy(run.player.x + 60, run.player.y));
    run.enemies.push(createDummyEnemy(run.player.x + 90, run.player.y + 20));
    applyRelic(run, relicPool.find((entry) => entry.id === "relic-split-plume")!);
    run.player.attackCooldown = 0;
    let sawSplitProjectile = false;

    for (let frame = 0; frame < 20; frame += 1) {
      updateRunState(
        run,
        { up: false, down: false, left: false, right: false, cast: false },
        0.016,
      );
      sawSplitProjectile = sawSplitProjectile || run.projectiles.some((projectile) => projectile.splitGeneration === 1);
    }

    expect(sawSplitProjectile).toBe(true);
  });

  it("triggers overload burst from fire into lightning", () => {
    const run = createInitialRun("ranger");
    const target = createDummyEnemy(run.player.x + 24, run.player.y);
    const nearby = createDummyEnemy(run.player.x + 42, run.player.y + 42);
    target.status.burnTimer = 1.2;
    target.status.elementState = { element: "fire", timer: 1.2, reactionLockTimer: 0 };
    run.enemies.push(target, nearby);
    applyUpgrade(run, {
      id: "element-lightning",
      kind: "element-mod",
      title: "雷霆附魔",
      description: "",
      rarity: "rare",
      targetId: "ricochet-shot",
      element: "lightning",
    });
    const nearbyHpBefore = nearby.hp;
    run.player.attackCooldown = 0;

    updateRunState(
      run,
      { up: false, down: false, left: false, right: false, cast: false },
      0.08,
    );

    expect(target.status.elementState).toBeUndefined();
    expect(nearby.hp).toBeLessThan(nearbyHpBefore);
  });

  it("triggers steam shock from fire into ice and leaves a short ice follow-up", () => {
    const run = createInitialRun("ranger");
    const target = createDummyEnemy(run.player.x + 24, run.player.y);
    const nearby = createDummyEnemy(run.player.x + 44, run.player.y + 24);
    target.status.burnTimer = 1.4;
    target.status.elementState = { element: "fire", timer: 1.4, reactionLockTimer: 0 };
    run.enemies.push(target, nearby);
    applyUpgrade(run, {
      id: "element-ice",
      kind: "element-mod",
      title: "寒潮附魔",
      description: "",
      rarity: "rare",
      targetId: "ricochet-shot",
      element: "ice",
    });
    run.player.attackCooldown = 0;

    updateRunState(
      run,
      { up: false, down: false, left: false, right: false, cast: false },
      0.08,
    );

    expect(target.status.elementState?.element).toBe("ice");
    expect(nearby.status.slowTimer).toBeGreaterThan(0);
  });

  it("triggers conductive shatter from ice into lightning", () => {
    const run = createInitialRun("ranger");
    const target = createDummyEnemy(run.player.x + 24, run.player.y);
    const nearby = createDummyEnemy(run.player.x + 46, run.player.y + 18);
    target.status.slowTimer = 1.1;
    target.status.elementState = { element: "ice", timer: 1.1, reactionLockTimer: 0 };
    run.enemies.push(target, nearby);
    applyUpgrade(run, {
      id: "element-lightning",
      kind: "element-mod",
      title: "雷霆附魔",
      description: "",
      rarity: "rare",
      targetId: "ricochet-shot",
      element: "lightning",
    });
    const nearbyHpBefore = nearby.hp;
    run.player.attackCooldown = 0;

    updateRunState(
      run,
      { up: false, down: false, left: false, right: false, cast: false },
      0.08,
    );

    expect(target.status.elementState).toBeUndefined();
    expect(nearby.hp).toBeLessThan(nearbyHpBefore);
  });

  it("triggers melt pierce from ice into fire", () => {
    const run = createInitialRun("warrior");
    const target = createDummyEnemy(run.player.x + 32, run.player.y);
    target.status.slowTimer = 1.1;
    target.status.elementState = { element: "ice", timer: 1.1, reactionLockTimer: 0 };
    run.enemies.push(target);
    applyUpgrade(run, {
      id: "element-fire",
      kind: "element-mod",
      title: "余烬附魔",
      description: "",
      rarity: "rare",
      targetId: "ember-cleave",
      element: "fire",
    });
    run.player.attackCooldown = 0;

    updateRunState(
      run,
      { up: false, down: false, left: false, right: false, cast: false },
      0.08,
    );

    expect(target.status.meltedTimer).toBeGreaterThan(0);
  });

  it("does not trigger reactions while reaction lock is active", () => {
    const run = createInitialRun("ranger");
    const target = createDummyEnemy(run.player.x + 24, run.player.y);
    target.status.burnTimer = 1.2;
    target.status.elementState = { element: "fire", timer: 1.2, reactionLockTimer: 0.2 };
    run.enemies.push(target);
    applyUpgrade(run, {
      id: "element-lightning",
      kind: "element-mod",
      title: "雷霆附魔",
      description: "",
      rarity: "rare",
      targetId: "ricochet-shot",
      element: "lightning",
    });
    run.player.attackCooldown = 0;

    updateRunState(
      run,
      { up: false, down: false, left: false, right: false, cast: false },
      0.08,
    );

    expect(target.status.burnTimer).toBeGreaterThan(0);
    expect(target.status.meltedTimer).toBe(0);
  });
});
