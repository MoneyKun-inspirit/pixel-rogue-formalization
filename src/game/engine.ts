import { ARENA_HEIGHT, ARENA_WIDTH, DEMO_DURATION, elementChoices, elementPalette, heroCoreUpgradePool, heroes, skills, statUpgradePool, unlockableSkillIds } from "@/game/content";
import type { ControlState, ElementType, EnemyState, HeroClass, ProjectileState, RunState, RunSummary, UpgradeOption } from "@/game/types";

const PLAYER_RADIUS = 14;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

function nextXpRequirement(level: number) {
  return 26 + level * 18;
}

function randomPick<T>(items: T[], count: number) {
  const pool = [...items];
  const result: T[] = [];

  while (pool.length > 0 && result.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(index, 1)[0]);
  }

  return result;
}

function getHeroSkill(run: RunState, skillId: string) {
  return run.ownedSkills.find((skill) => skill.id === skillId);
}

function getStarterSkill(run: RunState) {
  return getHeroSkill(run, heroes[run.heroId].starterSkillId)!;
}

function getCurrentCritChance(run: RunState) {
  if (run.heroId !== "ranger") {
    return run.player.critChance;
  }

  const core = run.heroCore.ranger;
  const momentumBonus = (core.momentum / core.momentumMax) * core.critBonusFromMomentum;
  return clamp(run.player.critChance + momentumBonus, 0, 0.95);
}

function getNearestEnemy(run: RunState, x = run.player.x, y = run.player.y) {
  return run.enemies.reduce<EnemyState | null>((closest, enemy) => {
    if (!closest) {
      return enemy;
    }

    return distance(enemy.x, enemy.y, x, y) < distance(closest.x, closest.y, x, y) ? enemy : closest;
  }, null);
}

function addFloatingText(run: RunState, x: number, y: number, value: string, color: string) {
  run.floatingTexts.push({
    id: run.nextFloatingTextId++,
    x,
    y,
    value,
    color,
    ttl: 0.55,
  });
}

function gainWarriorFury(run: RunState, amount: number) {
  const core = run.heroCore.warrior;
  core.fury = clamp(core.fury + amount, 0, core.maxFury);

  if (core.fury >= core.maxFury && core.overdriveTimer <= 0) {
    core.overdriveTimer = core.overdriveDuration;
    core.fury = Math.round(core.maxFury * 0.45);
    run.activeAnnouncement = "怒焰爆发，灰烬卫士进入压制状态";
    spawnAttackEffect(run, {
      kind: "burst",
      x: run.player.x,
      y: run.player.y,
      ttl: 0.3,
      maxTtl: 0.3,
      radius: 92,
      element: "fire",
    });
  }
}

function gainRangerMomentum(run: RunState, amount: number) {
  const core = run.heroCore.ranger;
  core.momentum = clamp(core.momentum + amount, 0, core.momentumMax);
}

function clearRangerMark(run: RunState) {
  const core = run.heroCore.ranger;
  core.markTargetId = null;
  core.markStacks = 0;
  core.markTimer = 0;
}

function detonateRangerMark(run: RunState, enemy: EnemyState, baseDamage: number) {
  const core = run.heroCore.ranger;
  spawnAttackEffect(run, {
    kind: "burst",
    x: enemy.x,
    y: enemy.y,
    ttl: 0.22,
    maxTtl: 0.22,
    radius: core.detonationRadius,
    element: "lightning",
  });

  run.enemies
    .filter((candidate) => distance(candidate.x, candidate.y, enemy.x, enemy.y) < core.detonationRadius + candidate.radius)
    .forEach((candidate) => damageEnemy(run, candidate, baseDamage * (1 + core.detonationDamageBonus), "lightning", candidate.id === enemy.id));

  run.activeAnnouncement = "猎印引爆，星羽游侠完成点杀";
  addFloatingText(run, enemy.x, enemy.y - 22, "引爆", "#72f3c7");
  clearRangerMark(run);
}

function applyRangerMark(run: RunState, enemy: EnemyState, baseDamage: number) {
  const core = run.heroCore.ranger;

  if (core.markTargetId !== enemy.id) {
    core.markTargetId = enemy.id;
    core.markStacks = 0;
  }

  core.markStacks += 1;
  core.markTimer = core.markDuration;

  if (core.markStacks >= core.detonationThreshold) {
    detonateRangerMark(run, enemy, baseDamage);
  }
}

function normalizeMageSigil(element: ElementType): ElementType {
  return element === "physical" ? "arcane" : element;
}

function triggerMageResonance(run: RunState) {
  const core = run.heroCore.mage;
  const sigils = core.sigils.map(normalizeMageSigil);
  const allSame = sigils.every((element) => element === sigils[0]);

  core.resonanceElement = allSame ? sigils[0] : "arcane";
  core.resonanceLabel = allSame ? `${sigils[0]} 协鸣` : "棱镜协鸣";
  core.resonanceTimer = core.resonanceDuration;
  core.resonancePulseTimer = 0;
  core.sigils = [];
  run.activeAnnouncement = allSame ? `法印矩阵成型：${core.resonanceLabel}` : "法印矩阵成型：棱镜协鸣";

  spawnAttackEffect(run, {
    kind: "burst",
    x: run.player.x,
    y: run.player.y,
    ttl: 0.28,
    maxTtl: 0.28,
    radius: allSame ? 86 : 110,
    element: core.resonanceElement,
  });
}

function appendMageSigil(run: RunState, element: ElementType) {
  const core = run.heroCore.mage;

  if (core.resonanceTimer > 0) {
    return;
  }

  core.sigils.push(normalizeMageSigil(element));

  if (core.sigils.length > core.maxSigils) {
    core.sigils.splice(0, core.sigils.length - core.maxSigils);
  }

  if (core.sigils.length >= core.maxSigils) {
    triggerMageResonance(run);
  }
}

function shouldOfferHeroCoreUpgrade(run: RunState) {
  if (run.player.level <= 3) {
    return true;
  }

  return run.player.level % 2 === 1;
}

function removeEnemy(run: RunState, enemyId: number) {
  run.enemies = run.enemies.filter((enemy) => enemy.id !== enemyId);
}

function gainXp(run: RunState, amount: number) {
  run.player.xp += amount;

  if (run.mode !== "running") {
    return;
  }

  while (run.player.xp >= run.player.xpToNext) {
    run.player.xp -= run.player.xpToNext;
    run.player.level += 1;
    run.player.xpToNext = nextXpRequirement(run.player.level);
    run.mode = "levelup";
    run.upgrades = buildUpgradeOptions(run);
    run.activeAnnouncement = `等级 ${run.player.level}，选择一项强化`;
    break;
  }
}

function applyElementStatus(enemy: EnemyState, element: ElementType) {
  if (element === "fire") {
    enemy.status.burnTimer = 2.2;
  }

  if (element === "ice") {
    enemy.status.slowTimer = 1.8;
  }

  if (element === "lightning") {
    enemy.status.shockTimer = 0.35;
  }
}

function handleEnemyDeath(run: RunState, enemy: EnemyState) {
  removeEnemy(run, enemy.id);
  run.stats.kills += 1;
  gainXp(run, enemy.xpReward);
  addFloatingText(run, enemy.x, enemy.y, "+XP", "#f2de84");

  if (run.heroCore.ranger.markTargetId === enemy.id) {
    clearRangerMark(run);
  }

  if (run.heroId === "warrior") {
    run.player.hp = Math.min(run.player.maxHp, run.player.hp + 3);
  }
}

function damageEnemy(run: RunState, enemy: EnemyState, amount: number, element: ElementType, allowArc = true) {
  const crit = Math.random() < getCurrentCritChance(run);
  const total = amount * (1 + run.player.damageBonus) * (crit ? 1.7 : 1);
  enemy.hp -= total;
  applyElementStatus(enemy, element);
  run.stats.damageDone += total;
  run.stats.peakDps = Math.max(run.stats.peakDps, total * 2.2);
  addFloatingText(run, enemy.x, enemy.y, `${Math.round(total)}${crit ? "!" : ""}`, elementPalette[element]);

  if (element === "lightning" && allowArc) {
    const nearby = run.enemies
      .filter((candidate) => candidate.id !== enemy.id && distance(candidate.x, candidate.y, enemy.x, enemy.y) < 90)
      .slice(0, 2);

    nearby.forEach((candidate) => damageEnemy(run, candidate, amount * 0.42, "lightning", false));
  }

  if (enemy.hp <= 0) {
    handleEnemyDeath(run, enemy);
  }

  return total;
}

function damagePlayer(run: RunState, amount: number) {
  if (run.mode !== "running") {
    return;
  }

  run.player.hp = clamp(run.player.hp - amount, 0, run.player.maxHp);
  addFloatingText(run, run.player.x, run.player.y - 18, `-${Math.round(amount)}`, "#ff9898");

  if (run.player.hp <= 0) {
    run.mode = "defeat";
    run.activeAnnouncement = "你被怪群淹没了";
  }
}

function spawnProjectile(run: RunState, projectile: Omit<ProjectileState, "id">) {
  run.projectiles.push({ id: run.nextProjectileId++, ...projectile });
}

function spawnAttackEffect(run: RunState, effect: Omit<RunState["attackEffects"][number], "id">) {
  run.attackEffects.push({
    id: run.nextAttackEffectId++,
    ...effect,
  });
}

function fireStarterSkill(run: RunState) {
  const hero = heroes[run.heroId];
  const starter = getStarterSkill(run);
  const definition = skills[starter.id];
  const target = getNearestEnemy(run);

  if (!target) {
    return;
  }

  let damage = definition.baseDamage + starter.level * 8;
  let radius = definition.radius * (1 + run.player.areaBonus);
  const angle = Math.atan2(target.y - run.player.y, target.x - run.player.x);

  if (hero.id === "warrior") {
    const core = run.heroCore.warrior;
    if (core.fury >= core.igniteThreshold) {
      damage *= 1.18;
      radius *= 1.08;
    }

    if (core.overdriveTimer > 0) {
      damage *= 1 + core.burstBonus;
      radius *= 1.16;
    }

    spawnAttackEffect(run, {
      kind: "slash",
      x: run.player.x,
      y: run.player.y,
      ttl: 0.18,
      maxTtl: 0.18,
      radius,
      angle,
      element: starter.element,
    });

    let hits = 0;
    run.enemies
      .filter((enemy) => distance(enemy.x, enemy.y, run.player.x, run.player.y) < radius + enemy.radius)
      .forEach((enemy) => {
        hits += 1;
        damageEnemy(run, enemy, damage, starter.element);
        if (core.healOnHit > 0) {
          run.player.hp = Math.min(run.player.maxHp, run.player.hp + core.healOnHit);
        }
      });

    if (hits > 0) {
      gainWarriorFury(run, 9 + hits * 6);
    }
  }

  if (hero.id === "ranger") {
    const momentumRatio = run.heroCore.ranger.momentum / run.heroCore.ranger.momentumMax;
    damage *= 1 + momentumRatio * 0.12;
    gainRangerMomentum(run, 4);

    spawnProjectile(run, {
      source: "hero",
      skillId: starter.id,
      x: run.player.x,
      y: run.player.y,
      vx: Math.cos(angle) * definition.projectileSpeed,
      vy: Math.sin(angle) * definition.projectileSpeed,
      radius,
      damage,
      ttl: definition.duration,
      pierce: 1 + Math.floor(starter.level / 2),
      element: starter.element,
    });
  }

  if (hero.id === "mage") {
    const core = run.heroCore.mage;
    if (core.resonanceTimer > 0) {
      damage *= 1 + core.resonanceDamageBonus;
      radius *= 1 + core.resonanceAreaBonus;
    }

    appendMageSigil(run, starter.element);
    spawnProjectile(run, {
      source: "hero",
      skillId: starter.id,
      x: run.player.x,
      y: run.player.y,
      vx: Math.cos(angle) * definition.projectileSpeed,
      vy: Math.sin(angle) * definition.projectileSpeed,
      radius,
      damage,
      ttl: definition.duration,
      pierce: core.resonanceTimer > 0 ? 1 : 0,
      element: starter.element,
    });
  }
}

function castActiveSkills(run: RunState) {
  const activeSkills = run.ownedSkills.filter((skill) => skills[skill.id].category === "active");

  if (run.player.castCooldown > 0 || activeSkills.length === 0) {
    return;
  }

  activeSkills.forEach((ownedSkill) => {
    const definition = skills[ownedSkill.id];
    let damage = definition.baseDamage + ownedSkill.level * 9;

    if (run.heroId === "warrior" && run.heroCore.warrior.overdriveTimer > 0) {
      damage *= 1 + run.heroCore.warrior.burstBonus;
    }

    if (run.heroId === "mage" && run.heroCore.mage.resonanceTimer > 0) {
      damage *= 1 + run.heroCore.mage.resonanceDamageBonus;
    }

    if (ownedSkill.id === "flame-nova") {
      spawnAttackEffect(run, {
        kind: "nova",
        x: run.player.x,
        y: run.player.y,
        ttl: 0.35,
        maxTtl: 0.35,
        radius: definition.radius * (1 + run.player.areaBonus),
        element: "fire",
      });

      run.enemies
        .filter((enemy) => distance(enemy.x, enemy.y, run.player.x, run.player.y) < definition.radius * (1 + run.player.areaBonus))
        .forEach((enemy) => damageEnemy(run, enemy, damage, "fire"));
    }

    if (ownedSkill.id === "frost-lance") {
      const target = getNearestEnemy(run);
      const baseAngle = target ? Math.atan2(target.y - run.player.y, target.x - run.player.x) : 0;

      [-0.2, 0, 0.2].forEach((offset) => {
        const currentAngle = baseAngle + offset;
        spawnProjectile(run, {
          source: "hero",
          skillId: ownedSkill.id,
          x: run.player.x,
          y: run.player.y,
          vx: Math.cos(currentAngle) * definition.projectileSpeed,
          vy: Math.sin(currentAngle) * definition.projectileSpeed,
          radius: definition.radius,
          damage,
          ttl: definition.duration,
          pierce: 1,
          element: "ice",
        });
        spawnAttackEffect(run, {
          kind: "lance",
          x: run.player.x,
          y: run.player.y,
          ttl: 0.22,
          maxTtl: 0.22,
          radius: 112,
          angle: currentAngle,
          element: "ice",
        });
      });
    }

    if (ownedSkill.id === "thunder-call") {
      run.enemies
        .slice()
        .sort((left, right) => distance(left.x, left.y, run.player.x, run.player.y) - distance(right.x, right.y, run.player.x, run.player.y))
        .slice(0, 4 + ownedSkill.level)
        .forEach((enemy) => {
          spawnAttackEffect(run, {
            kind: "lightning",
            x: run.player.x,
            y: run.player.y - 120,
            ttl: 0.18,
            maxTtl: 0.18,
            element: "lightning",
            targetX: enemy.x,
            targetY: enemy.y,
          });
          damageEnemy(run, enemy, damage, "lightning");
        });
    }

    if (run.heroId === "mage") {
      for (let index = 0; index < 1 + run.heroCore.mage.bonusSigilsOnActiveCast; index += 1) {
        appendMageSigil(run, definition.baseElement);
      }
    }
  });

  run.player.castCooldown = Math.min(...activeSkills.map((skill) => skills[skill.id].cooldown));
  run.activeAnnouncement = "主动技能已释放";
}

function spawnEnemy(run: RunState) {
  const side = Math.floor(Math.random() * 4);
  const padding = 18;
  const waveFactor = 1 + run.wave * 0.18;
  const shooter = run.time > 28 && Math.random() > 0.6;
  const x = side === 0 ? -padding : side === 1 ? ARENA_WIDTH + padding : Math.random() * ARENA_WIDTH;
  const y = side === 2 ? -padding : side === 3 ? ARENA_HEIGHT + padding : Math.random() * ARENA_HEIGHT;

  run.enemies.push({
    id: run.nextEnemyId++,
    kind: shooter ? "shooter" : "chaser",
    x,
    y,
    hp: (shooter ? 38 : 52) * waveFactor,
    maxHp: (shooter ? 38 : 52) * waveFactor,
    radius: shooter ? 12 : 14,
    speed: (shooter ? 58 : 72) * waveFactor,
    contactDamage: shooter ? 8 : 12,
    attackCooldown: 1.8,
    color: shooter ? "#b893ff" : "#ff8a78",
    xpReward: shooter ? 10 : 8,
    status: { burnTimer: 0, slowTimer: 0, shockTimer: 0 },
  });
}

function updateProjectiles(run: RunState, dt: number) {
  run.projectiles.forEach((projectile) => {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.ttl -= dt;
  });

  run.projectiles = run.projectiles.filter((projectile) => projectile.ttl > 0);

  run.projectiles.forEach((projectile) => {
    if (projectile.source === "enemy" && distance(projectile.x, projectile.y, run.player.x, run.player.y) < PLAYER_RADIUS + projectile.radius) {
      damagePlayer(run, projectile.damage);
      projectile.ttl = 0;
    }

    if (projectile.source === "hero") {
      run.enemies.forEach((enemy) => {
        if (projectile.ttl > 0 && distance(projectile.x, projectile.y, enemy.x, enemy.y) < enemy.radius + projectile.radius) {
          damageEnemy(run, enemy, projectile.damage, projectile.element);

          if (run.heroId === "ranger" && projectile.skillId === "ricochet-shot" && enemy.hp > 0) {
            gainRangerMomentum(run, 7);
            applyRangerMark(run, enemy, projectile.damage);
          }

          if (projectile.skillId === "arcane-orb") {
            run.enemies
              .filter((candidate) => candidate.id !== enemy.id && distance(candidate.x, candidate.y, enemy.x, enemy.y) < 54 + run.player.areaBonus * 38)
              .forEach((candidate) => damageEnemy(run, candidate, projectile.damage * 0.6, projectile.element, false));
          }

          projectile.pierce -= 1;
          if (projectile.pierce < 0) {
            projectile.ttl = 0;
          }
        }
      });
    }
  });
}

export function buildUpgradeOptions(run: RunState): UpgradeOption[] {
  const ownedIds = new Set(run.ownedSkills.map((skill) => skill.id));
  const options: UpgradeOption[] = [];
  const heroCoreOptions = heroCoreUpgradePool[run.heroId].filter((option) => !run.takenHeroCoreUpgrades.includes(option.id));

  unlockableSkillIds
    .filter((skillId) => !ownedIds.has(skillId))
    .forEach((skillId) => {
      options.push({
        id: `skill-${skillId}`,
        kind: "new-skill",
        title: `学习 ${skills[skillId].name}`,
        description: skills[skillId].description,
        rarity: "rare",
        targetId: skillId,
      });
    });

  run.ownedSkills.forEach((skill) => {
    options.push({
      id: `upgrade-${skill.id}`,
      kind: "skill-up",
      title: `${skills[skill.id].name} Lv.${skill.level + 1}`,
      description: "提升该技能伤害与效果范围，强化当前构筑核心。",
      rarity: skill.level >= 2 ? "epic" : "common",
      targetId: skill.id,
    });
  });

  elementChoices.forEach((choice) => {
    options.push({
      id: `element-${choice.element}`,
      kind: "element-mod",
      title: choice.label,
      description: choice.description,
      rarity: "rare",
      targetId: heroes[run.heroId].starterSkillId,
      element: choice.element,
    });
  });

  statUpgradePool.forEach((stat) => options.push(stat));
  const picks: UpgradeOption[] = [];
  const buildOptions = options.filter((option) => option.kind === "new-skill" || option.kind === "skill-up" || option.kind === "element-mod");
  const statOptions = options.filter((option) => option.kind === "stat-mod");

  if (heroCoreOptions.length > 0 && shouldOfferHeroCoreUpgrade(run)) {
    picks.push(...randomPick(heroCoreOptions, 1));
  }

  if (picks.some((option) => option.kind === "hero-core")) {
    const preferredBuild = randomPick(buildOptions.filter((option) => !picks.some((picked) => picked.id === option.id)), 1);
    picks.push(...preferredBuild);

    const preferredStat = randomPick(statOptions.filter((option) => !picks.some((picked) => picked.id === option.id)), 1);
    picks.push(...preferredStat);
  }

  const remainingOptions = options.filter((option) => !picks.some((picked) => picked.id === option.id));
  picks.push(...randomPick(remainingOptions, 3 - picks.length));
  return picks;
}

export function createInitialRun(heroId: HeroClass): RunState {
  const hero = heroes[heroId];

  return {
    heroId,
    mode: "running",
    time: 0,
    wave: 1,
    player: {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT / 2,
      hp: hero.baseHp,
      maxHp: hero.baseHp,
      moveSpeed: hero.moveSpeed,
      attackCooldown: 0.1,
      castCooldown: 0,
      xp: 0,
      level: 1,
      xpToNext: nextXpRequirement(1),
      damageBonus: 0,
      critChance: heroId === "ranger" ? 0.12 : 0.06,
      areaBonus: 0,
    },
    enemies: [],
    projectiles: [],
    attackEffects: [],
    ownedSkills: [{ id: hero.starterSkillId, level: 1, element: skills[hero.starterSkillId].baseElement }],
    heroCore: {
      warrior: {
        fury: 0,
        maxFury: 80,
        igniteThreshold: 54,
        overdriveTimer: 0,
        overdriveDuration: 2.6,
        furyDecayRate: 7,
        burstBonus: 0.28,
        healOnHit: 0,
      },
      ranger: {
        momentum: 0,
        momentumMax: 100,
        critBonusFromMomentum: 0.14,
        markTargetId: null,
        markStacks: 0,
        markTimer: 0,
        markDuration: 2.6,
        detonationThreshold: 3,
        detonationDamageBonus: 0.6,
        detonationRadius: 88,
      },
      mage: {
        sigils: [],
        maxSigils: 3,
        resonanceTimer: 0,
        resonanceDuration: 4,
        resonancePulseTimer: 0,
        resonancePulseInterval: 0.45,
        resonanceLabel: "",
        resonanceElement: "arcane",
        resonanceDamageBonus: 0.24,
        resonanceAreaBonus: 0.18,
        bonusSigilsOnActiveCast: 0,
      },
    },
    takenHeroCoreUpgrades: [],
    upgrades: [],
    floatingTexts: [],
    stats: { kills: 0, damageDone: 0, peakDps: 0 },
    nextEnemyId: 1,
    nextProjectileId: 1,
    nextAttackEffectId: 1,
    nextFloatingTextId: 1,
    spawnTimer: 1,
    activeAnnouncement: "撑过 4 分钟并构筑你的元素流派",
  };
}

export function updateRunState(run: RunState, controls: ControlState, dt: number) {
  run.attackEffects.forEach((effect) => {
    effect.ttl -= dt;
  });
  run.attackEffects = run.attackEffects.filter((effect) => effect.ttl > 0);

  run.floatingTexts.forEach((text) => {
    text.ttl -= dt;
    text.y -= dt * 20;
  });
  run.floatingTexts = run.floatingTexts.filter((text) => text.ttl > 0);

  if (run.mode !== "running") {
    return;
  }

  run.time += dt;
  run.wave = Math.min(9, Math.floor(run.time / 28) + 1);
  run.player.attackCooldown -= dt;
  run.player.castCooldown -= dt;
  run.spawnTimer -= dt;

  const horizontal = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
  const vertical = (controls.down ? 1 : 0) - (controls.up ? 1 : 0);
  const moving = Math.hypot(horizontal, vertical) || 1;
  const isMoving = horizontal !== 0 || vertical !== 0;
  const moveBonus = run.heroId === "ranger" && (horizontal !== 0 || vertical !== 0) ? 1.08 : 1;
  run.player.x = clamp(run.player.x + (horizontal / moving) * run.player.moveSpeed * moveBonus * dt, 24, ARENA_WIDTH - 24);
  run.player.y = clamp(run.player.y + (vertical / moving) * run.player.moveSpeed * moveBonus * dt, 24, ARENA_HEIGHT - 24);

  if (run.heroId === "warrior") {
    const core = run.heroCore.warrior;
    core.overdriveTimer = Math.max(0, core.overdriveTimer - dt);
    if (core.overdriveTimer <= 0) {
      core.fury = Math.max(0, core.fury - core.furyDecayRate * dt);
    }
  }

  if (run.heroId === "ranger") {
    const core = run.heroCore.ranger;
    gainRangerMomentum(run, (isMoving ? 58 : core.markTargetId ? -10 : -18) * dt);
    core.markTimer = Math.max(0, core.markTimer - dt);
    if (core.markTimer <= 0) {
      clearRangerMark(run);
    }
  }

  if (run.heroId === "mage") {
    const core = run.heroCore.mage;
    core.resonanceTimer = Math.max(0, core.resonanceTimer - dt);
    core.resonancePulseTimer = Math.max(0, core.resonancePulseTimer - dt);

    if (core.resonanceTimer > 0 && core.resonancePulseTimer <= 0) {
      spawnAttackEffect(run, {
        kind: "burst",
        x: run.player.x,
        y: run.player.y,
        ttl: 0.2,
        maxTtl: 0.2,
        radius: 78 + (1 - core.resonanceTimer / core.resonanceDuration) * 26,
        element: core.resonanceElement,
      });
      core.resonancePulseTimer = core.resonancePulseInterval;
    }

    if (core.resonanceTimer <= 0) {
      core.resonancePulseTimer = 0;
      core.resonanceLabel = "";
      core.resonanceElement = "arcane";
    }
  }

  if (run.spawnTimer <= 0) {
    spawnEnemy(run);
    if (run.wave >= 4) {
      spawnEnemy(run);
    }
    run.spawnTimer = Math.max(0.22, 1.05 - run.wave * 0.08);
  }

  if (run.player.attackCooldown <= 0) {
    fireStarterSkill(run);
    run.player.attackCooldown = heroes[run.heroId].attackInterval;
  }

  if (controls.cast) {
    castActiveSkills(run);
  }

  run.enemies.forEach((enemy) => {
    enemy.status.burnTimer = Math.max(0, enemy.status.burnTimer - dt);
    enemy.status.slowTimer = Math.max(0, enemy.status.slowTimer - dt);
    enemy.status.shockTimer = Math.max(0, enemy.status.shockTimer - dt);
    if (enemy.status.burnTimer > 0) {
      damageEnemy(run, enemy, dt * 7, "fire", false);
    }

    const angle = Math.atan2(run.player.y - enemy.y, run.player.x - enemy.x);
    const speedModifier = enemy.status.slowTimer > 0 ? 0.55 : 1;
    const isShooter = enemy.kind === "shooter";
    const targetDistance = distance(enemy.x, enemy.y, run.player.x, run.player.y);

    if (!isShooter || targetDistance > 180) {
      enemy.x += Math.cos(angle) * enemy.speed * speedModifier * dt;
      enemy.y += Math.sin(angle) * enemy.speed * speedModifier * dt;
    }

    if (targetDistance < enemy.radius + PLAYER_RADIUS + 4) {
      damagePlayer(run, enemy.contactDamage * dt * 2.2);
    }

    if (isShooter) {
      enemy.attackCooldown -= dt;
      if (enemy.attackCooldown <= 0 && targetDistance < 300) {
        spawnProjectile(run, {
          source: "enemy",
          skillId: "spore",
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * 200,
          vy: Math.sin(angle) * 200,
          radius: 8,
          damage: 10 + run.wave * 0.7,
          ttl: 2,
          pierce: 0,
          element: "physical",
        });
        enemy.attackCooldown = 1.4;
      }
    }
  });

  updateProjectiles(run, dt);

  if (run.time >= DEMO_DURATION) {
    run.mode = "victory";
    run.activeAnnouncement = "试玩胜利，构筑成功存活到最后";
  }
}

export function applyUpgrade(run: RunState, option: UpgradeOption) {
  if (option.kind === "new-skill" && option.targetId) {
    run.ownedSkills.push({
      id: option.targetId,
      level: 1,
      element: skills[option.targetId].baseElement,
    });
  }

  if (option.kind === "skill-up" && option.targetId) {
    const target = getHeroSkill(run, option.targetId);
    if (target) {
      target.level += 1;
    }
  }

  if (option.kind === "element-mod" && option.targetId && option.element) {
    const target = getHeroSkill(run, option.targetId);
    if (target) {
      target.element = option.element;
    }
  }

  if (option.kind === "stat-mod") {
    if (option.id === "stat-vitality") {
      run.player.maxHp += option.value ?? 0;
      run.player.hp = Math.min(run.player.maxHp, run.player.hp + 18);
    }
    if (option.id === "stat-surge") {
      run.player.moveSpeed *= 1 + (option.value ?? 0);
    }
    if (option.id === "stat-focus") {
      run.player.damageBonus += option.value ?? 0;
    }
    if (option.id === "stat-bloom") {
      run.player.areaBonus += option.value ?? 0;
    }
    if (option.id === "stat-precision") {
      run.player.critChance += option.value ?? 0;
    }
  }

  if (option.kind === "hero-core") {
    run.takenHeroCoreUpgrades.push(option.id);

    if (option.id === "warrior-cinder-heart") {
      run.heroCore.warrior.maxFury += 20;
      run.heroCore.warrior.igniteThreshold = Math.max(24, run.heroCore.warrior.igniteThreshold - 8);
    }
    if (option.id === "warrior-berserk-drive") {
      run.heroCore.warrior.overdriveDuration += 1;
      run.heroCore.warrior.burstBonus += 0.16;
    }
    if (option.id === "warrior-scorch-guard") {
      run.heroCore.warrior.furyDecayRate *= 0.72;
      run.heroCore.warrior.healOnHit += 1.5;
    }

    if (option.id === "ranger-falcon-rhythm") {
      run.heroCore.ranger.momentumMax += 25;
      run.heroCore.ranger.critBonusFromMomentum += 0.08;
    }
    if (option.id === "ranger-weakpoint-burst") {
      run.heroCore.ranger.detonationThreshold = Math.max(2, run.heroCore.ranger.detonationThreshold - 1);
      run.heroCore.ranger.detonationRadius += 18;
      run.heroCore.ranger.detonationDamageBonus += 0.28;
    }
    if (option.id === "ranger-trail-sight") {
      run.heroCore.ranger.markDuration += 1;
    }

    if (option.id === "mage-prism-memory") {
      run.heroCore.mage.resonanceDuration += 1.2;
      run.heroCore.mage.resonanceAreaBonus += 0.08;
    }
    if (option.id === "mage-spellweave") {
      run.heroCore.mage.bonusSigilsOnActiveCast += 1;
    }
    if (option.id === "mage-arcane-surge") {
      run.heroCore.mage.resonanceDamageBonus += 0.18;
    }
  }

  run.mode = "running";
  run.upgrades = [];
  run.activeAnnouncement = `${option.title} 已生效`;
}

export function buildRunSummary(run: RunState): RunSummary {
  return {
    heroId: run.heroId,
    heroName: heroes[run.heroId].name,
    survivedSeconds: Math.round(run.time),
    wave: run.wave,
    kills: run.stats.kills,
    damageDone: Math.round(run.stats.damageDone),
    ownedSkills: run.ownedSkills.map((skill) => `${skills[skill.id].name} Lv.${skill.level}`),
    ending: run.mode === "victory" ? "victory" : "defeat",
  };
}
