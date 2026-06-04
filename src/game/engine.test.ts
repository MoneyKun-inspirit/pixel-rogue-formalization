import { describe, expect, it } from "vitest";
import { applyUpgrade, buildUpgradeOptions, createInitialRun, updateRunState } from "@/game/engine";

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

  it("creates visible attack effects for learned active skills", () => {
    const run = createInitialRun("mage");
    run.enemies.push({
      id: 999,
      kind: "chaser",
      x: run.player.x + 80,
      y: run.player.y,
      hp: 120,
      maxHp: 120,
      radius: 14,
      speed: 0,
      contactDamage: 0,
      attackCooldown: 99,
      color: "#fff",
      xpReward: 0,
      status: { burnTimer: 0, slowTimer: 0, shockTimer: 0 },
    });

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
