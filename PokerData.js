/**
 * Poker Advisor Pro - Data Layer (v5.0)
 * 核心升级：细分同花顺等级、引入牌面纹理分析、GTO 风格建议
 */

window.PokerData = {};

// --- A. 基础常量 ---
window.PokerData.CONSTANTS = {
  SUITS: ['s', 'h', 'd', 'c'],
  RANKS: ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'],
  RANK_VALUES: { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 },
  STREETS: ['Pre-flop', 'Flop', 'Turn', 'River']
};

// --- B. 手牌分析建议库 (全面升级) ---
window.PokerData.HAND_ANALYSIS_DEFINITIONS = {
  zh: {
    // --- Pre-flop (翻牌前) ---
    pre_monster_pair: { label: "超级对子 (Premium Pair)", advice: "加注/4-Bet", reason: "AA/KK/QQ 是起手最强牌，不要慢打，造大底池！" },
    pre_strong_pair: { label: "强对子 (Strong Pair)", advice: "加注/跟注", reason: "JJ/TT/99 有摊牌价值，但容易被翻出的高牌(Overcards)压制。" },
    pre_small_pair: { label: "小对子 (Set Mining)", advice: "投机/埋伏", reason: "目标是中三条(Set)。赔率便宜就看，没中就扔，不要留恋。" },
    pre_premium_high: { label: "核心高牌 (Premium High)", advice: "加注/价值", reason: "AK/AQ 强力起手，击中顶对通常领先，适合强力压制。" },
    pre_suited_connector: { label: "同花连张 (Suited Connector)", advice: "投机/跟注", reason: "极强的成顺/成花潜力，隐含赔率极高，适合深筹码博大牌。" },
    pre_suited_ace: { label: "同花A (Suited Ace)", advice: "半诈唬/阻断", reason: "有A阻断坚果花，且能听顺(Wheel)，非常灵活的手牌。" },
    pre_broadway: { label: "广播道 (Broadways)", advice: "谨慎进攻", reason: "两张大牌(KJ/QJ)容易成顶对，但踢脚往往不如对手，小心被压制。" },
    pre_trash: { label: "杂牌 (Trash)", advice: "弃牌 (Fold)", reason: "长期玩这种牌是亏损的根源。省下筹码等待良机。" },

    // --- Post-flop: Made Hands (成牌) ---
    made_straight_flush_nuts: { label: "坚果同花顺 (Nut Straight Flush)", advice: "慢打/诱敌", reason: "绝对无敌！现在的目标是怎么让对手把钱全输给你。" },
    made_straight_flush_lower: { label: "低端同花顺 (Low End SF)", advice: "极度危险/控池", reason: "⚠️ 警告：虽然是同花顺，但牌面允许更大的同花顺存在！如果对手激进，可能你已经输了(Cooler)。" },
    
    made_quads: { label: "四条 (Quads)", advice: "慢打/诱敌", reason: "炸弹！极小概率输牌，允许对手中牌后再加注。" },
    made_full_house: { label: "满堂红 (Full House)", advice: "价值下注", reason: "极强的成牌。除非对手有更大的葫芦(Over Full)，否则你赢定了。" },
    made_flush_nuts: { label: "坚果同花 (Nut Flush)", advice: "价值下注", reason: "你是当前最大的同花。只要牌面没公对，你就是无敌的。" },
    made_flush: { label: "同花 (Flush)", advice: "价值/保护", reason: "你中了同花！但不是坚果，小心A花或公对(葫芦)的可能性。" },
    made_straight: { label: "顺子 (Straight)", advice: "积极进攻", reason: "顺子是大牌。在同花面要小心，否则请以此收池。" },
    monster: { label: "三条 (Trips/Set)", advice: "强力价值", reason: "三条很强。如果是暗三条(Set)则非常隐蔽，造大底池！" },
    
    // --- Post-flop: Pairs (对子) ---
    top_pair: { label: "顶对 (Top Pair)", advice: "价值/控池", reason: "顶对通常领先。但在湿润面(Wet Board)要小心，别打太深。" },
    middle_pair: { label: "中对 (Middle Pair)", advice: "抓诈唬/过牌", reason: "有摊牌价值，但打不过强牌。适合过牌控池(Pot Control)。" },
    bottom_pair: { label: "底对 (Bottom Pair)", advice: "过牌/弃牌", reason: "牌力较弱，很难承受大额注码，只能抓极度诈唬。" },
    pocket_pair_below: { label: "小口袋对 (Underpair)", advice: "过牌/弃牌", reason: "你的对子小于公牌，极易被压制，基本上只能赢空气。" },
    
    // --- Post-flop: Draws (听牌) ---
    flush_draw_nut: { label: "坚果同花听牌 (Nut FD)", advice: "半诈唬/全压", reason: "A花听牌！即使没中也有机会赢，适合激进打法(Semi-Bluff)。" },
    flush_draw: { label: "同花听牌 (Flush Draw)", advice: "跟注/半诈唬", reason: "还需要1张同花。赔率合适可跟注，或加注打走弱牌。" },
    straight_draw_oesd: { label: "两头顺听牌 (OESD)", advice: "积极进攻", reason: "8张补牌成顺，这是很强的听牌。" },
    straight_draw_gutshot: { label: "卡顺听牌 (Gutshot)", advice: "谨慎跟注", reason: "只有4张补牌。除非极其便宜，否则别追。" },
    combo_draw: { label: "双重听牌 (Combo Draw)", advice: "全压/重注", reason: "花顺双听(12+补牌)，胜率极高，甚至领先很多成牌！" },
    overcards: { label: "两张高牌 (Overcards)", advice: "观望/飘打", reason: "暂无成牌。若对手示弱，可尝试诈唬；对手强打则弃牌。" },
    trash: { label: "空气牌 (Trash)", advice: "弃牌 (Fold)", reason: "毫无胜率。除非你是为了偷底池，否则快跑。" }
  },
  en: {
    // English Fallback (Simplified)
    pre_monster_pair: { label: "Premium Pair", advice: "Raise/4-Bet", reason: "Build the pot early with AA/KK/QQ." },
    made_straight_flush_nuts: { label: "Nut Straight Flush", advice: "Slowplay", reason: "Invincible hand. Extract maximum value." },
    made_straight_flush_lower: { label: "Low End SF", advice: "Caution", reason: "Warning: Higher Straight Flush possible!" },
    // ... others fallback to logic key if missing
  }
};

// --- C. 牌面纹理策略 (Board Texture Strategies) ---
window.PokerData.TEXTURE_STRATEGIES = {
  TEX_PAIRED: { name: "公对面 (Paired)", desc: "有人可能中三条或葫芦，诈唬需谨慎。" },
  TEX_MONOTONE: { name: "单色面 (Monotone)", desc: "极度危险，对手极易已中同花。" },
  TEX_TWO_TONE: { name: "听花面 (Two-Tone)", desc: "很多听牌可能，需要下重注保护手牌。" },
  TEX_CONNECTED: { name: "连张面 (Connected)", desc: "顺子可能性大，两对和暗三条也很常见。" },
  TEX_RAINBOW_DRY: { name: "干燥面 (Dry/Rainbow)", desc: "非常安全，适合持续下注(C-Bet)诈唬。" }
};

// --- D. UI 文本 ---
window.PokerData.TEXTS = {
  zh: {
    appTitle: '德州扑克智囊 Pro',
    heroStack: '我的筹码',
    bet: '本轮下注',
    potInfo: '底池追踪',
    mainPot: '主底池',
    spr: 'SPR (筹码底池比)',
    stackAfterBet: '下注后剩余',
    calculate: '计算胜率 & 获取建议',
    calculating: '模拟计算中...',
    settle_title: '分池结算',
    settle_win: '赢',
    settle_loss: '输',
    settle_split: '平',
    settle_confirm: '确认并下一局',
    btn_fold: '弃牌 (Fold)',
    btn_check: '过牌 (Check)',
    btn_call: '跟注 (Call)',
    btn_call_allin: '全压 (Call/All-In)',
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
    add_player: '添加对手'
  },
  en: {
    appTitle: 'Poker Advisor Pro',
    heroStack: 'My Stack',
    bet: 'Bet This Rd',
    potInfo: 'Pot Tracker',
    mainPot: 'Main Pot',
    spr: 'SPR',
    stackAfterBet: 'Left',
    calculate: 'Calculate Equity',
    calculating: 'Simulating...',
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
    add_player: 'Add Opponent'
  }
};