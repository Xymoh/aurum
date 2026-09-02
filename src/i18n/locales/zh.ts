import type { Dictionary } from "./en";

/** Stat and element names follow the game's own Simplified Chinese wording. */
const zh: Dictionary = {
  nav: {
    howScoringWorks: "评分说明",
    toggleTheme: "切换主题",
    language: "语言",
  },

  home: {
    tagline: "像高手一样评价你的圣遗物",
    intro: "输入 UID，立即评估你展示柜中每位角色、每一件圣遗物的品质。",
    recentLookups: "最近查询",
    howItWorks: "使用方式",
    step1Title: "输入 UID",
    step1Body:
      "展示柜数据来自 Enka.Network，也就是你在游戏中公开展示的角色。我们不保存任何数据，也无需登录。",
    step2Title: "逐件评分",
    step2Body:
      "每件圣遗物的副词条会按照实际佩戴角色的需求加权：暴击对主 C 有价值，元素精通则对副 C 有价值。",
    step3Title: "给出结论",
    step3Body:
      "每件圣遗物都会标记为重塑、更换或保持不变，并附上使用启示之尘重塑真正划算的概率。",
    dataTitle: "数据来源",
    dataShowcase: "你的展示柜",
    dataShowcaseBody:
      "，读取你在游戏中设置展示的角色。仅能获取公开的展示柜数据，因此私密档案或空展示柜无法评分。",
    dataStats: "角色数值",
    dataStatsBody: " 的开源数据集自动同步。",
    dataStatsPrefix: " - 自动来自 ",
    dataWeights: "副词条权重",
    dataWeightsBody:
      " - 依据社区研究逐个角色人工整理，参考 KQM、Game8、Prydwen 与 Icy Veins。这属于主观判断，当各家攻略存在分歧时，我们采用最主流的配装。",
    limitTitle: "这是一个快速评估工具，而非权威配装指南。",
    limitBody:
      "评分只衡量一件圣遗物对单个角色的词条好坏，不考虑队伍增益、反应伤害、充能需求或循环长度。本工具评分较低的圣遗物，在你的队伍中仍可能是正确选择。",
    limitFooter: "请用它找出仍有提升空间的圣遗物，而不是当作最终结论。若需精确优化，可以考虑 ",
  },

  uid: {
    placeholder: "输入原神 UID",
    lookUp: "查询",
    invalid: "UID 必须为 9 位数字。",
  },

  player: {
    share: "分享",
    refresh: "刷新",
    ar: "冒险等阶 {level}",
    wl: "世界等级 {level}",
    chars: "{count} 名角色",
    justNow: "刚刚",
    minutesAgo: "{n} 分钟前",
    hoursAgo: "{n} 小时前",
    daysAgo: "{n} 天前",
  },

  showcase: {
    roomToImprove: "可提升之处",
    roomToImproveSub: "最值得优先处理的项目，按花费从低到高",
    jumpTo: "跳转至 {name}",
    buildScore: "配装评分",
    artifacts: "圣遗物",
    setBonuses: "套装效果",
    statsOverview: "属性总览",
    constellation: "命之座",
    talents: "天赋",
    score: "评分",
    empty: "空",
    searchPlaceholder: "搜索角色…",
    allElements: "全部元素",
    shown: "显示 {visible}/{total}",
    noMatch: "没有符合筛选条件的角色。",
    noCharacters: "此展示柜中未找到角色。",
    noCharactersHint: "该玩家可能需要在游戏中设置角色展示柜。",
    noArtifacts: "此角色未装备圣遗物。",
    incompleteScore: "评分不完整，仅基于 5 个部位中的 {count} 件。",
    mainStats: "主词条 {correct}/{total}",
    noSetBonus: "没有生效的套装效果",
    fullMatch: "完全匹配",
    partialMatch: "部分匹配",
    pieces: "{count} 件",
    travelerNotice:
      "无法从展示柜数据判断旅行者的元素，因此本次评分使用通用权重，而非针对你当前神之眼调整的权重。",
    sortScoreDesc: "评分（从高到低）",
    sortScoreAsc: "评分（从低到高）",
    sortLevelDesc: "等级（从高到低）",
    sortNameAsc: "名称（A → Z）",
  },

  verdict: {
    rerollNow: "建议重塑",
    worthRerolling: "值得重塑",
    lowPriority: "优先级较低",
    farmReplacement: "建议更换",
    wellRolled: "词条已很好",
    levelTo20: "强化至 +20 才能重塑",
    erAtRisk: "充能有风险",
    perTry: " / 次",
    dust: "{n} 启示之尘",
    blurbHigh: "本账号中启示之尘性价比最高的选择之一。",
    blurbMedium: "收益尚可，但需要准备多次尝试。",
    blurbLow: "启示之尘用在其他圣遗物上更划算。",
    reasonReplaceNoValue: "这些副词条对该角色都没有帮助，重塑无法改变这一点。",
    reasonReplaceWeak: "目前偏弱，即使重塑运气好也只能到 {ceiling}% 左右，建议刷取更好的圣遗物。",
    reasonNone: "强化次数已经落在合适的词条上，可提升的空间不大。",
    reasonLevelUp: "重塑需要 +20 的圣遗物，请先强化。",
    tipCost: "每次重塑消耗 {dust} 启示之尘，有 {chance} 的概率提升 5% 以上评分。",
    tipTries: "{tries} 次（{dust} 启示之尘）：约 {chance} 概率成功",
    tipNominate: "选定词条：{stats}",
    tipMedianGain: "成功时的典型提升：+{gain}%",
    tipCeiling: "现实中的理想结果：{ceiling}%",
    tipWellRolled: "重塑仅有 {chance} 的概率提升 5% 以上评分，启示之尘用在别处更好。",
    erNote:
      "有 {chance} 的重塑结果会让你低于该角色所需的 {threshold}% 元素充能效率 - 少放一次元素爆发的损失，远超重塑换来的暴击词条。重塑时请将元素充能效率选为两个指定词条之一加以保护。该需求值只是粗略参考，会随队伍、命座和武器变化，请结合自己的循环判断。",
    mainStatWarning: "主词条与推荐不符。可以考虑刷取主词条更合适的圣遗物。",
  },

  explainer: {
    potentialTitle: "潜力百分比",
    potentialBody:
      "每件圣遗物的副词条会按其对佩戴角色的价值加权，再与该角色理论上的理想词条分布比较。结果是 0–200% 的区间：100% 代表一件扎实可用的圣遗物（约相当于 4.5 次满值强化），200% 则是几乎不可能出现的完美词条。主词条不直接影响评分 - 生之花与死之羽的主词条是固定的，而时之沙、空之杯、理之冠的主词条是否合适会单独标示。",
    gradeTitle: "评级标准",
    mainStatTitle: "主词条与套装效果",
    mainStatBody:
      "主词条旁的警告图标表示它与该部位推荐的主词条不符。角色卡片上的套装效果面板会显示当前生效的 2 件套 / 4 件套，以及是否与推荐套装一致。两者都仅供参考，不影响圣遗物评分。",
    rerollTitle: "重塑建议",
    rerollP1:
      "自 5.7 版本起，启示之尘可以重塑 +20 的五星圣遗物，将其 5 次强化重新分配到已有的 4 条副词条上。它无法改变圣遗物上是哪些词条。你可以指定两条副词条，并保证这两条合计至少获得两次强化。结果不满意还可以放弃并保留原状，因此重塑绝不会让圣遗物变差 - 唯一的成本就是启示之尘。",
    rerollP2:
      "由于启示之尘稀缺，真正有用的问题不是「理想情况下它能有多好」，而是「重塑真正改善这件圣遗物的可能性有多大」。我们为每件圣遗物模拟 1500 次重塑，统计其中有多少次以有意义的幅度超过当前词条。这个比例就是每个标记上显示的「% / 次」- 单次重塑的确切概率，而不是对假想尝试取的平均值。",
    rerollP3:
      "每次尝试的花费是固定的：生之花或死之羽为 1 启示之尘，时之沙、空之杯或理之冠为 2 启示之尘。优先级会将概率与花费一同权衡，因此便宜的部位在概率较低时也能获得更高优先级：",
    dustAvg: "平均 ≤{n} 启示之尘",
    tierReplaceNote: "副词条过弱",
    tierWellRolledNote: "保持不变",
    rerollP4:
      "「词条已很好」表示强化次数已经落在关键词条上，重塑几乎没有机会超越现状 - 通常只有几个百分点的差距。这不是分析的缺失，而正是结论。每件 +20 的五星圣遗物都会得到这四种结论之一。",
    rerollP5:
      "这些启示之尘数值是长期平均值，仅用于排序 - 你无法一次在空之杯上花掉 9 启示之尘，每次只能花 2。将鼠标悬停在任意标记上即可看到真实数字：单次重塑的概率、指定次数尝试的实际花费，以及应当选定哪两条词条。只有当四条副词条本身足以支撑起好结果时，这件圣遗物才值得花费启示之尘；如果连运气好的重塑都无法让它变强，它会被标记为「建议更换」。",
    erTitle: "关于元素充能效率的提醒",
    erP1:
      "元素充能效率是唯一一个「越多越好」不成立的副词条。一旦超过元素爆发能按时释放所需的数值，它几乎不再带来收益；但一旦低于该数值，你每个循环都会少放一次元素爆发，损失远大于重塑换来的暴击词条。其他所有属性都是平滑曲线，所以只有充能会被特别对待：暴击率的目标值是为了与暴击伤害保持平衡，而攻击力或元素精通的目标值只是在描述一套好配装的样子。它们都没有临界点。",
    erP2:
      "因此，当一件圣遗物的充能确实在发挥作用时，它会被标记为「充能有风险」并附上独立概率 - 即会让你充能不足的重塑比例。这个数字与重塑概率并列显示，而不是混入其中，因为充能需求对每个角色只是一个粗略数值，而真实数值会随队伍、命座和武器变化：单雷的芙林斯所需远高于双雷，而带有回复能量被动的专武本身就能把需求降低 20-30%。让一个近似值悄悄否决建议，不如把两个数字都摆出来，交由你自己权衡。",
    erP3: "如果你确实要重塑被标记的圣遗物，请将元素充能效率选为两个指定词条之一，让保底机制保护它。",
    disclaimer:
      "这是一个快速评估工具，而非权威配装指南 - 评分反映的是通用副词条优先级，未必适用于每种队伍或玩法。",
  },

  errors: {
    title: "展示柜加载失败",
    tryAgain: "重试",
    noUid: "未提供 UID。",
    generic: "无法加载展示柜数据。",
  },

  elements: {
    Pyro: "火",
    Hydro: "水",
    Anemo: "风",
    Electro: "雷",
    Dendro: "草",
    Cryo: "冰",
    Geo: "岩",
  },

  stats: {
    maxHp: "生命值上限",
    atk: "攻击力",
    def: "防御力",
    em: "元素精通",
    critRate: "暴击率",
    critDmg: "暴击伤害",
    er: "元素充能效率",
    elemDmg: "元素伤害加成",
  },

  slots: {
    FLOWER: "生之花",
    PLUME: "死之羽",
    SANDS: "时之沙",
    GOBLET: "空之杯",
    CIRCLET: "理之冠",
  },

  weapons: {
    Sword: "单手剑",
    Claymore: "双手剑",
    Polearm: "长柄武器",
    Catalyst: "法器",
    Bow: "弓",
    /** Level badge, e.g. "Lv. 90". */
    level: "Lv.{n}",
  },
};

export default zh;
