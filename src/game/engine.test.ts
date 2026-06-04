import { describe, expect, it } from "vitest";
import { applyUpgrade, buildUpgradeOptions, createInitialRun, updateRunState } from "@/game/engine";

function createDummyEnemy(x: number, y: number) {
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
    status: { burnTimer: 0, slowTimer: 0, shockTimer: 0 },
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
});
