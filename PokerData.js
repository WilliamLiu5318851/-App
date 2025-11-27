/**
 * Poker Advisor Pro - Data Layer (v6.0 Theoretical Architecture)
 * 基于《德州扑克牌局分析与数据》文档构建。
 * 包含：组合学矩阵、GTO范围分层、牌面纹理策略、精准权益表。
 */

window.PokerData = {};

// --- 1. 基础常量定义 (Constants) ---
window.PokerData.CONSTANTS = {
  SUITS: ['s', 'h', 'd', 'c'],
  RANKS: ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'],
  RANK_VALUES: { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 },
  STREETS: ['Pre-flop', 'Flop', 'Turn', 'River'],
  // 位置定义 (Doc 2.3)
  POSITIONS: ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB']
};

// --- 2. 听牌权益速查表 (Draw Equity Reference - Doc 6.2) ---
// 用于修正 "4-2法则" 的偏差，提供精确到小数点的胜率
window.PokerData.DRAW_ODDS = {
  gutshot: { outs: 4, flop_turn: 8.5, turn_river: 8.7, all_in: 16.5, label: "卡顺 (Gutshot)" },
  overcards: { outs: 6, flop_turn: 12.8, turn_river: 13.0, all_in: 24.1, label: "两高张 (Overcards)" },
  oesd: { outs: 8, flop_turn: 17.0, turn_river: 17.4, all_in: 31.5, label: "两头顺 (OESD)" },
  flush_draw: { outs: 9, flop_turn: 19.1, turn_river: 19.6, all_in: 35.0, label: "同花听牌 (Flush Draw)" },
  gutshot_flush: { outs: 12, flop_turn: 25.5, turn_river: 26.1, all_in: 45.0, label: "卡顺+同花 (Combo Draw)" },
  monster_draw: { outs: 15, flop_turn: 31.9, turn_river: 32.6, all_in: 54.1, label: "超级听牌 (Monster Draw)" }
};

// --- 3. 牌面纹理策略表 (Texture Strategies - Doc 6.3) ---
// 用于指导翻牌圈的 C-bet 频率和尺度
window.PokerData.TEXTURE_STRATEGIES = {
  TEX_RAINBOW_DRY: {
    name: "彩虹不连张 (Rainbow Dry)",
    freq: "高频 (70%+)",
    sizing: "小注 (33% Pot)",
    desc: "干燥牌面，很少有听牌。极度利好激进者(Aggressor)，建议高频小注持续下注。"
  },
  TEX_TWO_TONE: {
    name: "双色牌面 (Two-Tone)",
    freq: "中频 (45-60%)",
    sizing: "中/大注 (66% Pot)",
    desc: "牌面潮湿，存在同花听牌。需要更大的注码来保护手牌权益，拒绝免费看牌。"
  },
  TEX_MONOTONE: {
    name: "单色牌面 (Monotone)",
    freq: "低频 (30-40%)",
    sizing: "小注 (25-33% Pot)",
    desc: "极度潮湿！天花可能存在。权益分布紧缩，顶级对子价值缩水，建议控池防守。"
  },
  TEX_PAIRED: {
    name: "公对牌面 (Paired)",
    freq: "极高频 (80%+)",
    sizing: "极小注 (25% Pot)",
    desc: "极度干燥，很难有人击中。适合用全范围进行高频小注诈唬。"
  },
  TEX_CONNECTED: {
    name: "连张牌面 (Connected)",
    freq: "低频 (35-45%)",
    sizing: "重注 (75%+ Pot)",
    desc: "顺子面(如9-8-7)。坚果优势通常在防守方(BB)，激进者应谨慎行事或使用两极化大注。"
  }
};

// --- 4. 手牌分析与建议库 (Hand Analysis Definitions - Doc 6.1 & 5.1) ---
window.PokerData.HAND_ANALYSIS_DEFINITIONS = {
  zh: {
    // === Pre-flop: 起手牌矩阵 (基于 Doc 6.1 G1-G6 分类) ===
    pre_monster_pair: { 
        label: "G1: 超级对子 (Premium Pair)", 
        advice: "加注/4-Bet (价值)", 
        reason: "AA/KK/QQ。处于起手牌金字塔顶端(Top 1.4%)。翻前胜率77%-85%。目标：造大底池，隔离对手。" 
    },
    pre_premium_high: { 
        label: "G2: 核心高牌 (Strong Linear)", 
        advice: "加注/3-Bet (价值/压制)", 
        reason: "AKs/AKo/AQs/JJ。强线性范围，压制大多数起手牌。击中顶对通常具有踢脚优势(Domination)。" 
    },
    pre_strong_pair: { 
        label: "G3/G4: 中强对子 (TT-77)", 
        advice: "加注/跟注 (混合)", 
        reason: "有摊牌价值，但惧怕高张。主要价值在于阻断牌效应和翻牌后击中暗三条(Set Mining, 11.8%概率)。" 
    },
    pre_suited_ace: { 
        label: "G6: 同花A (Wheel Aces)", 
        advice: "半诈唬/平衡 (Bluff Candidate)", 
        reason: "A2s-A5s。具有极佳的板面覆盖性(Board Coverage)。A是坚果阻断牌，且能听顺子和坚果花，是完美的3-Bet诈唬牌。" 
    },
    pre_suited_connector: { 
        label: "G5: 同花连张 (Speculative)", 
        advice: "投机/跟注 (深筹码)", 
        reason: "T9s/98s/87s。怪兽杀手。虽然翻前胜率只有40%左右，但击中后隐含赔率巨大。适合在有位置且筹码深时入局。" 
    },
    pre_broadway: { 
        label: "广播道 (Broadways)", 
        advice: "谨慎进攻", 
        reason: "KJ/QJ/AT。容易形成顶对，但也容易被AK/AQ压制。在面对紧的对手时要小心踢脚问题(Kicker Problem)。" 
    },
    pre_trash: { 
        label: "杂牌 (Trash)", 
        advice: "弃牌 (Fold)", 
        reason: "GTO策略会放弃约70%的起手牌。长期来看，玩这些牌是负EV行为。保持纪律性。" 
    },

    // === Post-flop: 成牌与听牌 (基于 Doc 3.2 & 4.1) ===
    
    // Monsters
    made_straight_flush: { 
        label: "同花顺 (Straight Flush)", 
        advice: "慢打/诱敌 (绝对坚果)", 
        reason: "扑克中的皇帝！你已经无敌。现在的目标是利用反向阻断原理，引诱对手诈唬或支付。" 
    },
    made_quads: { 
        label: "四条 (Quads)", 
        advice: "慢打 (Slowplay)", 
        reason: "极小概率输牌(0.24%击中率)。不需要保护。给对手发牌，让他们中第二好的牌。" 
    },
    made_full_house: { 
        label: "葫芦 (Full House)", 
        advice: "价值下注 (Value)", 
        reason: "极强成牌。除非公牌有更大的对子，否则稳赢。开始建立底池，准备全压。" 
    },
    made_flush: { 
        label: "同花 (Flush)", 
        advice: "价值/防守", 
        reason: "已成同花！注意：公牌若有对子，对手可能有葫芦。如果你是A花(坚果)，可以更激进。" 
    },
    made_straight: { 
        label: "顺子 (Straight)", 
        advice: "积极进攻", 
        reason: "顺子是大牌。在单色面或公对面要小心，否则请积极下注，拒绝听牌的权益实现。" 
    },
    monster: { 
        label: "三条 (Set/Trips)", 
        advice: "强力价值 (Fast Play)", 
        reason: "暗三条极隐蔽。在湿润牌面必须快打，防止被听牌反超；干燥面可慢打。" 
    },
    
    // Pairs
    top_pair: { 
        label: "顶对 (Top Pair)", 
        advice: "价值/控池", 
        reason: "通常领先。干燥面下注获取价值；湿润面下注进行保护。注意踢脚大小。" 
    },
    middle_pair: { 
        label: "中对 (Middle Pair)", 
        advice: "抓诈唬 (Bluff Catch)", 
        reason: "具有摊牌价值，但难以承受大注。适合过牌控池，利用MDF原理抓对手纯诈唬。" 
    },
    bottom_pair: { 
        label: "底对 (Bottom Pair)", 
        advice: "谨慎摊牌/弃牌", 
        reason: "牌力较弱。除非对手极度激进且你在有利位置，否则面对强攻建议弃牌。" 
    },
    pocket_pair_below: { 
        label: "小口袋对 (Underpair)", 
        advice: "过牌/弃牌", 
        reason: "你的对子小于公牌，已被压制(Counterfeited)。几乎没有胜率，除非转诈唬。" 
    },
    
    // Draws (基于 Doc 4.1 & 6.2)
    combo_draw: { 
        label: "双重听牌 (Monster Draw)", 
        advice: "全压/重注 (54% Equity)", 
        reason: "花顺双听！根据数据，你有15张补牌，胜率超过50%，甚至领先顶对。这是最完美的半诈唬全压时机！" 
    },
    flush_draw_nut: { 
        label: "坚果同花听牌 (Nut FD)", 
        advice: "半诈唬/跟注", 
        reason: "A花听牌！有9张补牌成花，且A本身有摊牌价值。具有极高的弃牌率(Fold Equity)和胜率。" 
    },
    flush_draw: { 
        label: "同花听牌 (Flush Draw)", 
        advice: "跟注/半诈唬", 
        reason: "9张补牌 (约35%胜率)。如果赔率合适可跟注；如果对手示弱，可加注半诈唬。" 
    },
    straight_draw_oesd: { 
        label: "两头顺听牌 (OESD)", 
        advice: "积极进攻", 
        reason: "8张补牌 (约31.5%胜率)。这是一个强听牌，不要玩得太被动，给对手压力。" 
    },
    straight_draw_gutshot: { 
        label: "卡顺听牌 (Gutshot)", 
        advice: "谨慎/半诈唬", 
        reason: "只有4张补牌 (约16.5%胜率)。胜率较低，除非有后门花权益或底池赔率极好，否则不要重注追。" 
    },
    
    // Air
    overcards: { 
        label: "两张高牌 (Overcards)", 
        advice: "飘打/过牌 (Float)", 
        reason: "暂无成牌，但有6张补牌成顶对。利用位置优势飘打(Float)，看转牌是否能击中或诈唬。" 
    },
    trash: { 
        label: "空气牌 (Trash)", 
        advice: "弃牌/纯诈唬", 
        reason: "毫无胜率。除非你有极强的读牌认为对手也是空气，否则根据MDF理论，这里应该弃牌。" 
    }
  },
  
  en: {
    // --- Pre-flop (Based on Doc 6.1) ---
    pre_monster_pair: { label: "G1: Premium Pair", advice: "Raise/4-Bet", reason: "AA/KK/QQ. Top 1.4% of hands. 77-85% Equity. Build a massive pot immediately." },
    pre_premium_high: { label: "G2: Strong Linear", advice: "Raise/3-Bet", reason: "AK/AQ/JJ. Dominates most ranges. High equity realization and potential for Top Pair Top Kicker." },
    pre_strong_pair: { label: "G3/G4: Medium Pair", advice: "Raise/Call", reason: "TT-77. Vulnerable to overcards. Main value is Set Mining (11.8% chance)." },
    pre_suited_ace: { label: "G6: Suited Ace", advice: "Bluff/Balance", reason: "A2s-A5s. Nut flush potential + Ace blocker. Perfect candidates for board coverage and bluffs." },
    pre_suited_connector: { label: "G5: Suited Connector", advice: "Speculate/Call", reason: "T9s-65s. Monster killers. 40% equity pre-flop but huge implied odds deep stacked." },
    pre_broadway: { label: "Broadways", advice: "Caution", reason: "KJ/QJ. Good top pair potential but beware of kicker domination (Reverse Implied Odds)." },
    pre_trash: { label: "Trash", advice: "Fold", reason: "GTO folds bottom 70% range. Playing these is -EV long term." },

    // --- Post-flop ---
    made_straight_flush: { label: "Straight Flush", advice: "Slowplay", reason: "The Emperor hand! You are invincible. Induce bluffs or value bet small." },
    made_quads: { label: "Quads", advice: "Slowplay", reason: "0.24% hit rate. Invulnerable. Let opponents catch up to pay you off." },
    made_full_house: { label: "Full House", advice: "Value Bet", reason: "Monster hand. Bet for value unless board is paired with higher cards." },
    made_flush: { label: "Flush", advice: "Value/Defend", reason: "Strong hand. Beware of paired boards (Full House). Nut flush should play aggressively." },
    made_straight: { label: "Straight", advice: "Aggressive", reason: "Strong hand. Fast play on flush-draw boards to deny equity." },
    monster: { label: "Set/Trips", advice: "Fast Play", reason: "Sets are hidden monsters. Build pot fast on wet textures; trap on dry ones." },

    top_pair: { label: "Top Pair", advice: "Value/Control", reason: "Usually the best hand. Bet for value on dry boards; protect on wet boards." },
    middle_pair: { label: "Middle Pair", advice: "Bluff Catch", reason: "Showdown value. Pot control and catch bluffs based on MDF logic." },
    bottom_pair: { label: "Bottom Pair", advice: "Check/Fold", reason: "Weak value. Only beats a bluff. Fold to significant aggression." },
    pocket_pair_below: { label: "Underpair", advice: "Check/Fold", reason: "Counterfeited pair. Very low equity. Fold or turn into a bluff." },
    
    combo_draw: { label: "Monster Draw", advice: "All-In (54% Eq)", reason: "Flush + Straight draw. 15 Outs! You are often a favorite against Top Pair. Jam for fold equity + equity." },
    flush_draw_nut: { label: "Nut Flush Draw", advice: "Semi-Bluff", reason: "9 Outs + Ace High. Huge equity and fold equity combined. Play aggressively." },
    flush_draw: { label: "Flush Draw", advice: "Call/Raise", reason: "9 Outs (~35%). Call with odds, or raise to apply pressure." },
    straight_draw_oesd: { label: "OESD", advice: "Aggressive", reason: "8 Outs (~31.5%). Strong draw. Don't play passively." },
    straight_draw_gutshot: { label: "Gutshot", advice: "Caution", reason: "4 Outs (~16.5%). Low equity. Only continue with great odds or backdoor potential." },

    overcards: { label: "Overcards", advice: "Float/Check", reason: "6 Outs to Top Pair. Float in position if opponent shows weakness." },
    trash: { label: "Trash", advice: "Fold/Bluff", reason: "Zero equity. Fold unless you have a specific read to bluff." }
  }
};

// --- 5. UI 文本 (Localization) ---
window.PokerData.TEXTS = {
  zh: {
    appTitle: '德州扑克智囊 Pro',
    heroHand: '我的手牌',
    communityCards: '公共牌',
    calculate: '计算胜率 & 获取建议',
    calculating: '模拟计算中...',
    reset: '新的一局',
    settings: '设置',
    potInfo: '底池追踪',
    mainPot: '主底池 (前几轮)',
    currentBets: '本轮死钱',
    totalPot: '总底池',
    heroStack: '我的筹码',
    stackAfterBet: '下注后剩余',
    spr: 'SPR (筹码底池比)',
    strategy: '策略风格',
    conservative: '保守 (Tight)',
    aggressive: '激进 (Aggressive)',
    maniac: '诈唬/超激进 (Bluff)',
    players: '对手动作',
    active: '入局',
    folded: '弃牌',
    bet: '本轮下注',
    equity: '真实胜率',
    advice: '行动指南',
    nextStreet: '收池 & 下一轮',
    finishHand: '结算本局',
    betSizing: '推荐加注额 (点击应用)',
    potOdds: '底池赔率',
    requiredEquity: '所需胜率',
    advice_fold: '弃牌 (Fold)',
    advice_check_fold: '过牌/弃牌 (Check/Fold)',
    advice_check_call: '过牌/跟注 (Check/Call)',
    advice_call: '跟注 (Call)',
    advice_raise: '加注 (Raise)',
    advice_raise_bluff: '诈唬加注 (Bluff Raise)',
    advice_allin: '全压 (All-In)',
    advice_allin_bluff: '全压诈唬 (All-In Bluff)',
    reason_spr_low: 'SPR过低，您已套池(Committed)',
    reason_value: '强牌价值下注',
    reason_bluff_semi: '半诈唬：有听牌，打退对手',
    reason_bluff_pure: '纯诈唬：扮演强牌，利用弃牌率',
    reason_odds: '赔率合适，适合跟注听牌',
    street_pre: '翻牌前',
    street_flop: '翻牌圈',
    street_turn: '转牌圈',
    street_river: '河牌圈',
    add_player: '添加对手',
    bet_size_small: '小注 (1/3)',
    bet_size_med: '中注 (2/3)',
    bet_size_large: '满池 (1.0)',
    bet_size_over: '超池 (1.5x)',
    settle_win: '赢',
    settle_loss: '输',
    settle_split: '平',
    settle_title: '分池结算',
    settle_confirm: '确认结算结果',
    restart_hand: '开始下一手牌',
    btn_allin: 'ALL-IN',
    btn_fold: '弃牌 (Fold)',
    btn_call: '跟注 (Call)',
    btn_check: '过牌 (Check)',
    btn_call_allin: '全压 (Call/All-In)',
    rebuy: '补充筹码',
    deck_count: '牌副数 (Decks)',
    deck_info: '标准德扑为1副。多副牌会降低阻断效应。',
    game_settings: '游戏设置',
    selectCard: '选择一张牌',
    pot_segment: '池',
    contestants: '参与人数',
    net_change: '本局变动',
    segment_main: '主池 (Main)',
    segment_side: '边池 (Side)',
    buy_in_amount: '一手筹码 (Buy-in)',
    buy_in_info: 'Rebuy 按钮的默认补充金额。',
    selecting_flop: '选择翻牌 (Flop)',
    selecting_turn: '选择转牌 (Turn)',
    selecting_river: '选择河牌 (River)',
    selecting_hero: '选择手牌'
  },
  en: {
    appTitle: 'Poker Advisor Pro',
    heroHand: 'Hero Hand',
    communityCards: 'Board',
    calculate: 'Calculate & Advise',
    calculating: 'Simulating...',
    reset: 'New Hand',
    settings: 'Settings',
    potInfo: 'Pot Tracker',
    mainPot: 'Main Pot',
    currentBets: 'Current Bets',
    totalPot: 'Total Pot',
    heroStack: 'My Stack',
    stackAfterBet: 'Left',
    spr: 'SPR',
    strategy: 'Strategy',
    conservative: 'Tight',
    aggressive: 'Aggressive',
    maniac: 'Bluff / Maniac',
    players: 'Opponents',
    active: 'Active',
    folded: 'Folded',
    bet: 'Bet This Rd',
    equity: 'Raw Equity',
    advice: 'Action Advice',
    nextStreet: 'Collect & Deal',
    finishHand: 'Finish Hand',
    betSizing: 'Bet Sizing (Click to Apply)',
    potOdds: 'Pot Odds',
    requiredEquity: 'Req. Equity',
    advice_fold: 'Fold',
    advice_check_fold: 'Check/Fold',
    advice_check_call: 'Check/Call',
    advice_call: 'Call',
    advice_raise: 'Raise',
    advice_raise_bluff: 'Bluff Raise',
    advice_allin: 'All-In',
    advice_allin_bluff: 'All-In Bluff',
    reason_spr_low: 'Low SPR, Pot Committed',
    reason_value: 'Value Bet',
    reason_bluff_semi: 'Semi-Bluff: Draw + Fold Equity',
    reason_bluff_pure: 'Pure Bluff: Rep Strength',
    reason_odds: 'Good Odds to Call',
    street_pre: 'Pre-flop',
    street_flop: 'Flop',
    street_turn: 'Turn',
    street_river: 'River',
    add_player: 'Add Opp',
    bet_size_small: 'Small (1/3)',
    bet_size_med: 'Med (2/3)',
    bet_size_large: 'Pot (1.0)',
    bet_size_over: 'Overbet (1.5x)',
    settle_win: 'Win',
    settle_loss: 'Loss',
    settle_split: 'Chop',
    settle_title: 'Pot Settlement',
    settle_confirm: 'Confirm & Next Hand',
    restart_hand: 'Next Hand',
    btn_allin: 'ALL-IN',
    btn_fold: 'Fold',
    btn_call: 'Call',
    btn_check: 'Check',
    btn_call_allin: 'Call/All-In',
    rebuy: 'Rebuy',
    deck_count: 'Deck Count',
    deck_info: 'Standard is 1. More decks dilute card removal.',
    game_settings: 'Game Settings',
    selectCard: 'Select Card',
    pot_segment: 'Pot',
    contestants: 'Contestants',
    net_change: 'Net Change',
    segment_main: 'Main Pot',
    segment_side: 'Side Pot',
    buy_in_amount: 'Buy-in Amount',
    buy_in_info: 'Default amount for Rebuy button.',
    selecting_flop: 'Select Flop',
    selecting_turn: 'Select Turn',
    selecting_river: 'Select River',
    selecting_hero: 'Select Hand'
  }
};