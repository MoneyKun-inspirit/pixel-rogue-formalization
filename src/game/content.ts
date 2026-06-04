import type { ElementType, HeroClass, HeroDefinition, SkillDefinition, UpgradeOption } from "@/game/types";

export const ARENA_WIDTH = 960;
export const ARENA_HEIGHT = 540;
export const DEMO_DURATION = 240;

export const heroes: Record<HeroClass, HeroDefinition> = {
  warrior: {
    id: "warrior",
    name: "灰烬卫士",
    title: "近战爆发",
    flavor: "挥舞巨刃冲进怪群，用贴身斩击和火焰震荡撕开缺口。",
    weapon: "裂火巨刃",
    color: "#ff9d5c",
    baseHp: 180,
    moveSpeed: 188,
    attackInterval: 0.7,
    starterSkillId: "ember-cleave",
    tags: ["高生命", "近身清场", "火焰联动"],
    trait: "近战命中时恢复少量生命，越靠近敌群越强。",
  },
  ranger: {
    id: "ranger",
    name: "星羽游侠",
    title: "远程弹幕",
    flavor: "利用高机动和穿透箭风筝敌群，适合叠投射物和感电效果。",
    weapon: "折光长弓",
    color: "#72f3c7",
    baseHp: 132,
    moveSpeed: 214,
    attackInterval: 0.42,
    starterSkillId: "ricochet-shot",
    tags: ["高攻速", "远程穿透", "连锁雷击"],
    trait: "保持移动时提升暴击率，适合边走位边打输出。",
  },
  mage: {
    id: "mage",
    name: "暮光术师",
    title: "法术构筑",
    flavor: "以法球和元素爆发清理战场，技能组合最丰富。",
    weapon: "棱镜法典",
    color: "#85a9ff",
    baseHp: 116,
    moveSpeed: 182,
    attackInterval: 0.9,
    starterSkillId: "arcane-orb",
    tags: ["高技能伤害", "元素附魔", "大范围 AOE"],
    trait: "每次主动施法会强化下一次自动攻击。",
  },
};

export const skills: Record<string, SkillDefinition> = {
  "ember-cleave": {
    id: "ember-cleave",
    name: "灰烬横斩",
    category: "auto",
    baseElement: "physical",
    baseDamage: 26,
    cooldown: 0.7,
    radius: 72,
    projectileSpeed: 0,
    duration: 0.1,
    description: "朝最近敌人方向挥出短距离横斩，适合叠范围和火焰附魔。",
  },
  "ricochet-shot": {
    id: "ricochet-shot",
    name: "折光箭",
    category: "auto",
    baseElement: "physical",
    baseDamage: 18,
    cooldown: 0.42,
    radius: 10,
    projectileSpeed: 360,
    duration: 1.6,
    description: "自动射出穿透箭矢，适合叠攻速、暴击与雷电链射。",
  },
  "arcane-orb": {
    id: "arcane-orb",
    name: "秘能法球",
    category: "auto",
    baseElement: "arcane",
    baseDamage: 28,
    cooldown: 0.9,
    radius: 16,
    projectileSpeed: 260,
    duration: 2.1,
    description: "发射缓慢法球，命中后爆开，适合法师的元素扩散玩法。",
  },
  "flame-nova": {
    id: "flame-nova",
    name: "烈焰新星",
    category: "active",
    baseElement: "fire",
    baseDamage: 42,
    cooldown: 5.6,
    radius: 110,
    projectileSpeed: 0,
    duration: 0.2,
    description: "按空格释放，围绕自身爆发火焰，快速清理近身敌群。",
  },
  "frost-lance": {
    id: "frost-lance",
    name: "霜棱穿刺",
    category: "active",
    baseElement: "ice",
    baseDamage: 34,
    cooldown: 4.8,
    radius: 12,
    projectileSpeed: 420,
    duration: 2.2,
    description: "向最近敌人方向射出三枚冰棱，命中时施加减速。",
  },
  "thunder-call": {
    id: "thunder-call",
    name: "雷链召引",
    category: "active",
    baseElement: "lightning",
    baseDamage: 38,
    cooldown: 6.2,
    radius: 170,
    projectileSpeed: 0,
    duration: 0.2,
    description: "按空格召落雷链，优先打击密集敌群并传播感电。",
  },
};

export const elementPalette: Record<ElementType, string> = {
  physical: "#f7d9a0",
  fire: "#ff7a45",
  ice: "#80d6ff",
  lightning: "#e4d06a",
  arcane: "#b48cff",
};

export const statUpgradePool = [
  {
    id: "stat-vitality",
    kind: "stat-mod" as const,
    title: "钢铁体魄",
    description: "最大生命 +24，并立刻回复 18 点生命。",
    rarity: "common" as const,
    value: 24,
  },
  {
    id: "stat-surge",
    kind: "stat-mod" as const,
    title: "疾行步法",
    description: "移动速度 +10%，走位更容易拉扯怪群。",
    rarity: "common" as const,
    value: 0.1,
  },
  {
    id: "stat-focus",
    kind: "stat-mod" as const,
    title: "战斗专注",
    description: "伤害 +12%，所有技能都吃到强化。",
    rarity: "rare" as const,
    value: 0.12,
  },
  {
    id: "stat-bloom",
    kind: "stat-mod" as const,
    title: "扩散回路",
    description: "范围 +12%，更容易打出 AOE 和元素扩散。",
    rarity: "rare" as const,
    value: 0.12,
  },
  {
    id: "stat-precision",
    kind: "stat-mod" as const,
    title: "致命校准",
    description: "暴击率 +8%，搭配游侠与法师收益更高。",
    rarity: "epic" as const,
    value: 0.08,
  },
];

export const elementChoices: { element: ElementType; label: string; description: string }[] = [
  {
    element: "fire",
    label: "余烬附魔",
    description: "主武器附带火焰，命中后施加燃烧持续伤害。",
  },
  {
    element: "ice",
    label: "寒潮附魔",
    description: "主武器附带寒冰，命中后大幅减速敌人。",
  },
  {
    element: "lightning",
    label: "雷霆附魔",
    description: "主武器附带雷电，命中后向附近敌人弹出电弧。",
  },
];

export const unlockableSkillIds = ["flame-nova", "frost-lance", "thunder-call"];

export const heroCoreUpgradePool: Record<HeroClass, UpgradeOption[]> = {
  warrior: [
    {
      id: "warrior-cinder-heart",
      kind: "hero-core",
      title: "炽心储焰",
      description: "怒焰上限 +20，点燃阈值 -8，更容易进入爆发窗口。",
      rarity: "rare",
    },
    {
      id: "warrior-berserk-drive",
      kind: "hero-core",
      title: "狂战推进",
      description: "怒焰爆发持续时间延长，并进一步提高爆发期间的斩击伤害。",
      rarity: "epic",
    },
    {
      id: "warrior-scorch-guard",
      kind: "hero-core",
      title: "灼痕护甲",
      description: "怒焰衰减变慢，近战命中时额外回复生命，适合贴身压场。",
      rarity: "rare",
    },
  ],
  ranger: [
    {
      id: "ranger-falcon-rhythm",
      kind: "hero-core",
      title: "猎鹰节律",
      description: "动量上限提高，移动蓄势带来的暴击收益更明显。",
      rarity: "rare",
    },
    {
      id: "ranger-weakpoint-burst",
      kind: "hero-core",
      title: "弱点引爆",
      description: "猎印更快引爆，并提高引爆半径与追加伤害。",
      rarity: "epic",
    },
    {
      id: "ranger-trail-sight",
      kind: "hero-core",
      title: "追迹视界",
      description: "猎印持续时间更长，保持走位时能更稳定锁定高价值目标。",
      rarity: "rare",
    },
  ],
  mage: [
    {
      id: "mage-prism-memory",
      kind: "hero-core",
      title: "棱镜记忆",
      description: "法印协鸣持续更久，并额外扩大协鸣期间的法术范围。",
      rarity: "rare",
    },
    {
      id: "mage-spellweave",
      kind: "hero-core",
      title: "织印施法",
      description: "主动施法会额外记录 1 枚同元素法印，更快形成法印矩阵。",
      rarity: "epic",
    },
    {
      id: "mage-arcane-surge",
      kind: "hero-core",
      title: "秘流奔涌",
      description: "法印协鸣的伤害强化提高，让法球和主动技都更具终结力。",
      rarity: "rare",
    },
  ],
};
