export type HeroClass = "warrior" | "ranger" | "mage";
export type ElementType = "physical" | "fire" | "ice" | "lightning" | "arcane";
export type SkillCategory = "auto" | "active";
export type EnemyKind = "chaser" | "shooter";
export type UpgradeKind = "new-skill" | "skill-up" | "element-mod" | "stat-mod" | "hero-core";
export type RunMode = "running" | "levelup" | "defeat" | "victory";

export interface HeroDefinition {
  id: HeroClass;
  name: string;
  title: string;
  flavor: string;
  weapon: string;
  color: string;
  baseHp: number;
  moveSpeed: number;
  attackInterval: number;
  starterSkillId: string;
  tags: string[];
  trait: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  category: SkillCategory;
  baseElement: ElementType;
  baseDamage: number;
  cooldown: number;
  radius: number;
  projectileSpeed: number;
  duration: number;
  description: string;
}

export interface OwnedSkill {
  id: string;
  level: number;
  element: ElementType;
}

export interface UpgradeOption {
  id: string;
  kind: UpgradeKind;
  title: string;
  description: string;
  rarity: "common" | "rare" | "epic";
  targetId?: string;
  value?: number;
  element?: ElementType;
}

export interface WarriorCoreState {
  fury: number;
  maxFury: number;
  igniteThreshold: number;
  overdriveTimer: number;
  overdriveDuration: number;
  furyDecayRate: number;
  burstBonus: number;
  healOnHit: number;
}

export interface RangerCoreState {
  momentum: number;
  momentumMax: number;
  critBonusFromMomentum: number;
  markTargetId: number | null;
  markStacks: number;
  markTimer: number;
  markDuration: number;
  detonationThreshold: number;
  detonationDamageBonus: number;
  detonationRadius: number;
}

export interface MageCoreState {
  sigils: ElementType[];
  maxSigils: number;
  resonanceTimer: number;
  resonanceDuration: number;
  resonancePulseTimer: number;
  resonancePulseInterval: number;
  resonanceLabel: string;
  resonanceElement: ElementType;
  resonanceDamageBonus: number;
  resonanceAreaBonus: number;
  bonusSigilsOnActiveCast: number;
}

export interface HeroCoreState {
  warrior: WarriorCoreState;
  ranger: RangerCoreState;
  mage: MageCoreState;
}

export interface PlayerState {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  moveSpeed: number;
  attackCooldown: number;
  castCooldown: number;
  xp: number;
  level: number;
  xpToNext: number;
  damageBonus: number;
  critChance: number;
  areaBonus: number;
}

export interface StatusState {
  burnTimer: number;
  slowTimer: number;
  shockTimer: number;
}

export interface EnemyState {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  contactDamage: number;
  attackCooldown: number;
  color: string;
  xpReward: number;
  status: StatusState;
}

export interface ProjectileState {
  id: number;
  source: "hero" | "enemy";
  skillId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  ttl: number;
  pierce: number;
  element: ElementType;
}

export interface AttackEffect {
  id: number;
  kind: "slash" | "nova" | "lance" | "lightning" | "burst";
  x: number;
  y: number;
  ttl: number;
  maxTtl: number;
  radius?: number;
  angle?: number;
  element: ElementType;
  targetX?: number;
  targetY?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: string;
  color: string;
  ttl: number;
}

export interface RunStats {
  kills: number;
  damageDone: number;
  peakDps: number;
}

export interface RunState {
  heroId: HeroClass;
  mode: RunMode;
  time: number;
  wave: number;
  player: PlayerState;
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  attackEffects: AttackEffect[];
  ownedSkills: OwnedSkill[];
  heroCore: HeroCoreState;
  takenHeroCoreUpgrades: string[];
  upgrades: UpgradeOption[];
  floatingTexts: FloatingText[];
  stats: RunStats;
  nextEnemyId: number;
  nextProjectileId: number;
  nextAttackEffectId: number;
  nextFloatingTextId: number;
  spawnTimer: number;
  activeAnnouncement: string;
}

export interface ControlState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  cast: boolean;
}

export interface RunSnapshot extends RunState {
  hero: HeroDefinition;
}

export interface RunSummary {
  heroId: HeroClass;
  heroName: string;
  survivedSeconds: number;
  wave: number;
  kills: number;
  damageDone: number;
  ownedSkills: string[];
  ending: "defeat" | "victory";
}
