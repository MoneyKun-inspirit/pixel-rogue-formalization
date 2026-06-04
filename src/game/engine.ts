import { ARENA_HEIGHT, ARENA_WIDTH, DEMO_DURATION, elementChoices, elementPalette, heroes, skills, statUpgradePool, unlockableSkillIds } from "@/game/content";
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

  if (run.heroId === "warrior") {
    run.player.hp = Math.min(run.player.maxHp, run.player.hp + 3);
  }
}

function damageEnemy(run: RunState, enemy: EnemyState, amount: number, element: ElementType, allowArc = true) {
  const crit = Math.random() < run.player.critChance;
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

  const damage = definition.baseDamage + starter.level * 8;
  const radius = definition.radius * (1 + run.player.areaBonus);
  const angle = Math.atan2(target.y - run.player.y, target.x - run.player.x);

  if (hero.id === "warrior") {
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

    run.enemies
      .filter((enemy) => distance(enemy.x, enemy.y, run.player.x, run.player.y) < radius + enemy.radius)
      .forEach((enemy) => damageEnemy(run, enemy, damage, starter.element));
  }

  if (hero.id === "ranger") {
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
      pierce: 0,
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
    const damage = definition.baseDamage + ownedSkill.level * 9;

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

  return randomPick(options, 3);
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
  const moveBonus = run.heroId === "ranger" && (horizontal !== 0 || vertical !== 0) ? 1.08 : 1;
  run.player.x = clamp(run.player.x + (horizontal / moving) * run.player.moveSpeed * moveBonus * dt, 24, ARENA_WIDTH - 24);
  run.player.y = clamp(run.player.y + (vertical / moving) * run.player.moveSpeed * moveBonus * dt, 24, ARENA_HEIGHT - 24);

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
