export type HeroClass = "warrior" | "ranger" | "mage";
export type ElementType = "physical" | "fire" | "ice" | "lightning" | "arcane";
export type SkillCategory = "auto" | "active";
export type EnemyKind = "chaser" | "shooter";
export type UpgradeKind = "new-skill" | "skill-up" | "element-mod" | "stat-mod" | "hero-core" | "affix";
export type RunMode = "running" | "levelup" | "relic-choice" | "defeat" | "victory";
export type SkillTag = "projectile" | "burst" | "orbit" | "trap" | "close-range" | "tracking";
export type AffixCategory = "projectile" | "area" | "tempo" | "element";
export type RelicCategory = "active" | "projectile" | "stance" | "elemental" | "hero-bridge";
export type ReactionId = "overload-burst" | "steam-shock" | "conductive-shatter" | "melt-pierce";

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
  tags?: SkillTag[];
  shared?: boolean;
}

export interface OwnedSkill {
  id: string;
  level: number;
  element: ElementType;
}

export interface AffixDefinition {
  id: string;
  name: string;
  description: string;
  rarity: "common" | "rare" | "epic";
  category: AffixCategory;
}

export interface OwnedAffix {
  id: string;
  stacks: number;
}

export interface RelicDefinition {
  id: string;
  name: string;
  description: string;
  summary: string;
  rarity: "rare" | "epic";
  category: RelicCategory;
  focusSkillIds?: string[];
  focusElements?: ElementType[];
}

export interface OwnedRelic {
  id: string;
}

export interface ElementState {
  element: "fire" | "ice";
  timer: number;
  reactionLockTimer: number;
}

export interface ReactionDefinition {
  id: ReactionId;
  name: string;
  description: string;
  baseElement: "fire" | "ice";
  triggerElement: "fire" | "ice" | "lightning";
  damageMultiplier: number;
  radius: number;
  chainCount?: number;
  chainDamageMultiplier?: number;
  followupElementState?: ElementState;
  applyMelted?: boolean;
  meltedDuration?: number;
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
  category?: AffixCategory | "skill" | "utility";
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

export interface BuildState {
  affixes: OwnedAffix[];
  projectilePierceBonus: number;
  bounceShots: boolean;
  returningShots: boolean;
  activeDamageBonus: number;
  activeCooldownMultiplier: number;
  activeAreaBonus: number;
  killCooldownRefund: number;
  burnDurationBonus: number;
  shockArcRadiusBonus: number;
  orbitRadiusBonus: number;
  relicActiveDamageMultiplier: number;
  relicProjectileSplitCount: number;
  relicProjectileSplitDamageMultiplier: number;
  relicCloseRangeBonus: number;
  relicCloseRangeMitigation: number;
  relicCloseRangeRadius: number;
  relicCloseRangeActive: boolean;
  relicStationaryBonus: number;
  relicStationaryCharge: number;
  relicElementFocus?: ElementType;
  relicElementBonus: number;
  relicHeroBridgeEnabled: boolean;
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
  meltedTimer: number;
  elementState?: ElementState;
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
  homingStrength?: number;
  anchorToPlayer?: boolean;
  orbitAngle?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  explosionRadius?: number;
  explodeOnExpire?: boolean;
  hasReturned?: boolean;
  splitGeneration?: number;
}

export interface AttackEffect {
  id: number;
  kind: "slash" | "nova" | "lance" | "lightning" | "burst" | "steam" | "shatter" | "melt";
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
  buildState: BuildState;
  heroCore: HeroCoreState;
  takenHeroCoreUpgrades: string[];
  upgrades: UpgradeOption[];
  relics: OwnedRelic[];
  pendingRelicChoices: RelicDefinition[];
  floatingTexts: FloatingText[];
  stats: RunStats;
  nextEnemyId: number;
  nextProjectileId: number;
  nextAttackEffectId: number;
  nextFloatingTextId: number;
  spawnTimer: number;
  nextRelicTime: number;
  relicChoiceCount: number;
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
