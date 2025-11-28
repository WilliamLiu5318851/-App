/**
 * Poker Advisor Pro - Data Layer (v6.0 - Extended GTO Modules)
 * 核心升级：集成位置策略、高级牌面纹理、概率速查表与动态策略配置
 * Based on: William Liu's "Poker Analysis & Data" Doc
 */

window.PokerData = {};

// --- A. 基础常量 ---
window.PokerData.CONSTANTS = {
  SUITS: ['s', 'h', 'd', 'c'],
  RANKS: ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'],
  RANK_VALUES: { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 },
  STREETS: ['Pre-flop', 'Flop', 'Turn', 'River']
};

// --- B. 位置与起手牌策略 (Position Logic) ---
window.PokerData.POSITIONS = {
  EP: { 
    label: "前位 (EP)", 
    range_modifier: "Tight", 
    description: "⚠️ 危险位置：后方有大量对手。",
    action_plan: "只玩 AA/KK/AK 等怪兽牌。遇到反击通常弃牌。"
  },
  MP: { 
    label: "中位 (MP)", 
    range_modifier: "Normal", 
    description: "⚖️ 标准位置：可玩强高张(AQ)和中对子。",
    action_plan: "标准打法，注意观察后位玩家动作。"
  },
  LP: { 
    label: "后位 (LP/BTN)", 
    range_modifier: "Loose", 
    description: "🎯 黄金位置：拥有信息优势！",
    action_plan: "积极偷盲，利用位置施压，多玩同花连张。"
  },
  BLINDS: { 
    label: "盲注 (SB/BB)", 
    range_modifier: "Defensive", 
    description: "🛡️ 防守位置：被迫下注，不要造大底池。",
    action_plan: "赔率合适跟注看牌，没中就撤。"
  }
};

// --- C. 牌面纹理定义 (Board Texture Types) ---
window.PokerData.BOARD_TEXTURES = {
  dry: { 
    id: "dry",
    label: "干燥牌面 (Dry)", 
    features: ["Rainbow (杂色)", "Disconnected (不连张)"], 
    strategy_adjustment: "high_fold_equity", 
    cbet_freq: "High", 
    example: "Ks 7d 2h" 
  },
  wet: { 
    id: "wet",
    label: "潮湿牌面 (Wet)", 
    features: ["Suited (同花面)", "Connected (连张面)", "Paired (公对)"], 
    strategy_adjustment: "pot_control", 
    cbet_freq: "Low", 
    example: "9h 8h 7d" 
  }
};

// --- D. 牌面纹理新手教学 (Tooltips) ---
window.PokerData.TEXTURE_EXPLANATION = {
  dry: {
    title: "🌵 干燥牌面 (Dry)",
    desc: "牌与牌毫无联系。谁的对子大谁赢。",
    strategy: "适合诈唬！大胆持续下注 (C-Bet)。"
  },
  wet: {
    title: "🌧️ 潮湿牌面 (Wet)",
    desc: "牌面紧凑（连张/同花），极易成顺/花。",
    strategy: "务必小心！哪怕有AA也可能输给顺子。"
  }
};

// --- E. 数学概率与补牌速查表 (Math & Probabilities) ---
window.PokerData.PROBABILITIES = {
  // 翻牌击中概率
  flop_hit: {
    pocket_pair_to_set: { label: "中三条 (Set)", prob: 12, note: "8中1" },
    suited_to_flush: { label: "天胡同花", prob: 0.8, note: "极难" },
    suited_to_flush_draw: { label: "中听花", prob: 11, note: "主要价值" },
    any_two_to_pair: { label: "中一对", prob: 32, note: "最常见" }
  },
  // 听牌补牌数与胜率 (用于 UI 显示)
  outs_lookup: {
    straight_draw_gutshot: { 
      label: "卡顺 (Gutshot)", 
      outs: 4, 
      equity_flop: 16, 
      advice: "别追，除非极其便宜" 
    },
    overcards: { 
      label: "两张高牌 (Overcards)", 
      outs: 6, 
      equity_flop: 24, 
      advice: "有反超机会，但也可能输给底对" 
    },
    straight_draw_oesd: { 
      label: "两头顺 (OESD)", 
      outs: 8, 
      equity_flop: 32, 
      advice: "强听牌，可以积极玩" 
    },
    flush_draw: { 
      label: "同花听牌 (Flush Draw)", 
      outs: 9, 
      equity_flop: 36, 
      advice: "非常强，甚至可以加注半诈唬" 
    },
    flush_draw_nut: { 
      label: "坚果花听牌 (Nut FD)", 
      outs: 9, 
      equity_flop: 36, 
      advice: "极强！有摊牌价值+听牌价值" 
    },
    combo_draw: { 
      label: "双重听牌 (Combo Draw)", 
      outs: 15, 
      equity_flop: 54, 
      advice: "超级强牌！直接 All-in！" 
    }
  }
};

// --- F. 策略参数配置 (Strategy Config) ---
window.PokerData.STRATEGY_CONFIG = {
  preflop: {
    open_raise_base: 3.0, 
    iso_raise_per_limper: 1.0, 
    min_equity_to_call: 33 
  },
  postflop: {
    cbet_dry: 0.33, // 干燥面下 1/3
    cbet_wet: 0.66, // 潮湿面下 2/3
    value_bet: 0.75, 
    bluff_raise: 3.0 
  }
};

// --- G. 手牌分析库 (保留 v5.1 修复版) ---
window.PokerData.HAND_ANALYSIS_DEFINITIONS = {
  zh: {
    pre_monster_pair: { label: "超级对子 (Monster)", advice: "加注/4-Bet", reason: "起手最强牌，不要慢打！" },
    pre_strong_pair: { label: "强对子 (Strong Pair)", advice: "加注/跟注", reason: "有价值，但小心高牌翻出。" },
    pre_small_pair: { label: "小对子 (Set Mining)", advice: "投机/埋伏", reason: "目标是中三条(Set)，没中就扔。" },
    pre_premium_high: { label: "核心高牌 (Premium)", advice: "加注/价值", reason: "AK/AQ 强力压制，击中即领先。" },
    pre_suited_connector: { label: "同花连张 (Suited Conn)", advice: "投机/跟注", reason: "隐含赔率极高，适合深筹码博大牌。" },
    pre_suited_ace: { label: "同花A (Suited Ace)", advice: "半诈唬/阻断", reason: "有A阻断坚果，且能听顺，非常灵活。" },
    pre_broadway: { label: "广播道 (Broadways)", advice: "谨慎进攻", reason: "容易成顶对，但踢脚往往不如对手。" },
    pre_trash: { label: "杂牌 (Trash)", advice: "弃牌 (Fold)", reason: "长期玩这种牌是亏损的根源。" },

    made_straight_flush_nuts: { label: "坚果同花顺 (Nuts)", advice: "慢打/诱敌", reason: "无敌！想办法让对手送钱。" },
    made_straight_flush_lower: { label: "低端同花顺 (Low SF)", advice: "极度危险", reason: "🛑 警告：存在更大的同花顺！" },
    made_quads: { label: "四条 (Quads)", advice: "慢打", reason: "炸弹！极小概率输牌。" },
    made_full_house: { label: "满堂红 (Full House)", advice: "价值下注", reason: "除非撞上更大的葫芦，否则稳赢。" },
    made_flush_nuts: { label: "坚果同花 (Nut Flush)", advice: "价值下注", reason: "当前最大的同花，无惧对手。" },
    made_flush: { label: "同花 (Flush)", advice: "价值/保护", reason: "小心A花或公对(葫芦)。" },
    made_straight: { label: "顺子 (Straight)", advice: "积极进攻", reason: "大牌，但在同花面要小心。" },
    monster: { label: "三条 (Trips/Set)", advice: "强力价值", reason: "隐蔽性强，造大底池！" },
    
    top_pair: { label: "顶对 (Top Pair)", advice: "价值/控池", reason: "通常领先，湿润面别打太深。" },
    middle_pair: { label: "中对 (Middle Pair)", advice: "抓诈唬/过牌", reason: "打不过强牌，适合控池。" },
    bottom_pair: { label: "底对 (Bottom Pair)", advice: "过牌/弃牌", reason: "很难承受大额注码。" },
    pocket_pair_below: { label: "小口袋对 (Underpair)", advice: "过牌/弃牌", reason: "极易被压制，通常只能赢空气。" },
    
    flush_draw_nut: { label: "坚果花听牌 (Nut FD)", advice: "半诈唬/全压", reason: "即使没中也有机会赢 (A High)。" },
    flush_draw: { label: "同花听牌 (Flush Draw)", advice: "跟注/半诈唬", reason: "赔率合适可跟，或加注打走弱牌。" },
    straight_draw_oesd: { label: "两头顺听牌 (OESD)", advice: "积极进攻", reason: "8张补牌，强听牌。" },
    straight_draw_gutshot: { label: "卡顺听牌 (Gutshot)", advice: "谨慎跟注", reason: "只有4张补牌，别追。" },
    combo_draw: { label: "双重听牌 (Combo Draw)", advice: "全压/重注", reason: "胜率极高，甚至领先成牌！" },
    overcards: { label: "两张高牌 (Overcards)", advice: "观望/飘打", reason: "暂无成牌，可尝试诈唬。" },
    trash: { label: "空气牌 (Trash)", advice: "弃牌 (Fold)", reason: "毫无胜率，快跑。" }
  },
  en: {
    pre_monster_pair: { label: "Premium Pair", advice: "Raise/4-Bet", reason: "Build pot with AA/KK/QQ." },
    made_straight_flush_nuts: { label: "Nut Straight Flush", advice: "Slowplay", reason: "Invincible." },
    trash: { label: "Trash", advice: "Fold", reason: "No value." }
  }
};

// --- H. 具体纹理特征 (保留原有) ---
window.PokerData.TEXTURE_STRATEGIES = {
  TEX_PAIRED: { name: "公对面 (Paired)", desc: "有人可能中三条或葫芦。" },
  TEX_MONOTONE: { name: "单色面 (Monotone)", desc: "极度危险，易有同花。" },
  TEX_TWO_TONE: { name: "听花面 (Two-Tone)", desc: "听牌很多，需保护手牌。" },
  TEX_CONNECTED: { name: "连张面 (Connected)", desc: "顺子可能性大。" },
  TEX_RAINBOW_DRY: { name: "干燥面 (Dry)", desc: "安全，适合诈唬。" }
};

// --- I. UI 文本 (v5.1 完整版) ---
window.PokerData.TEXTS = {
  zh: {
    appTitle: '德州扑克智囊 Pro',
    heroStack: '我的筹码',
    bet: '本轮下注',
    potInfo: '底池追踪',
    mainPot: '主底池',
    spr: 'SPR',
    stackAfterBet: '下注后剩余',
    calculate: '计算胜率 & 获取建议',
    calculating: 'AI 思考中...',
    settle_title: '分池结算',
    settle_win: '赢',
    settle_loss: '输',
    settle_split: '平',
    settle_confirm: '确认并下一局',
    btn_fold: '弃牌 (Fold)',
    btn_check: '过牌 (Check)',
    btn_call: '跟注 (Call)',
    btn_call_allin: '全压 (All-In)',
    btn_allin: 'ALL-IN',
    equity: '真实胜率',
    game_settings: '游戏设置',
    deck_count: '牌副数',
    buy_in_amount: '买入额',
    rebuy: '补充筹码',
    selectCard: '选择一张牌',
    selecting_hero: '选择手牌',
    selecting_flop: '选择翻牌',
    selecting_turn: '选择转牌',
    selecting_river: '选择河牌',
    add_player: '添加对手',
    
    advice_raise: '建议加注 (Raise)',
    advice_call: '建议跟注 (Call)',
    advice_fold: '建议弃牌 (Fold)',
    advice_raise_bluff: '建议诈唬 (Bluff)',
    
    maniac: '疯鱼模式',
    aggressive: '激进模式',
    conservative: '保守模式',
    active: '入局',
    folded: '弃牌',
    street_pre: '翻牌前',
    street_flop: '翻牌圈',
    street_turn: '转牌圈',
    street_river: '河牌圈',
    nextStreet: '收池 & 下一轮',
    finishHand: '本局结束',
    segment_main: '主池',
    segment_side: '边池'
  },
  en: {
    appTitle: 'Poker Advisor Pro',
    heroStack: 'My Stack',
    bet: 'Bet This Rd',
    potInfo: 'Pot Tracker',
    mainPot: 'Main Pot',
    spr: 'SPR',
    stackAfterBet: 'Left',
    calculate: 'Calculate',
    calculating: 'Thinking...',
    settle_title: 'Settlement',
    settle_win: 'Win',
    settle_loss: 'Loss',
    settle_split: 'Chop',
    settle_confirm: 'Next Hand',
    btn_fold: 'Fold',
    btn_check: 'Check',
    btn_call: 'Call',
    btn_call_allin: 'Call/All-In',
    btn_allin: 'ALL-IN',
    equity: 'Equity',
    game_settings: 'Settings',
    deck_count: 'Decks',
    buy_in_amount: 'Buy-in',
    rebuy: 'Rebuy',
    selectCard: 'Select Card',
    selecting_hero: 'Select Hand',
    selecting_flop: 'Select Flop',
    selecting_turn: 'Select Turn',
    selecting_river: 'Select River',
    add_player: 'Add Opponent',
    
    advice_raise: 'Advice: Raise',
    advice_call: 'Advice: Call',
    advice_fold: 'Advice: Fold',
    advice_raise_bluff: 'Advice: Bluff',
    
    maniac: 'Maniac',
    aggressive: 'Aggressive',
    conservative: 'Conservative',
    active: 'Active',
    folded: 'Folded',
    street_pre: 'Pre-flop',
    street_flop: 'Flop',
    street_turn: 'Turn',
    street_river: 'River',
    nextStreet: 'Collect & Next',
    finishHand: 'Finish Hand',
    segment_main: 'Main Pot',
    segment_side: 'Side Pot'
  }
};