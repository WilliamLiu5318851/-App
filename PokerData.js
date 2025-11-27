/**
 * Poker Advisor Pro - Data Layer (v5.0 Simplified Chinese)
 * 包含了更细分、更具体的战术建议库。
 */

window.PokerData = {};

// --- 常量定义 (Constants) ---
window.PokerData.CONSTANTS = {
  SUITS: ['s', 'h', 'd', 'c'],
  RANKS: ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'],
  RANK_VALUES: { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 },
  STREETS: ['Pre-flop', 'Flop', 'Turn', 'River']
};

// --- 手牌分析建议数据集 (Hand Analysis Definitions) ---
// 这里定义了针对具体牌型（如顶对、听牌、怪兽牌）的战术建议
window.PokerData.HAND_ANALYSIS_DEFINITIONS = {
  zh: {
    // === Pre-flop (翻牌前) ===
    
    // 1. 口袋对子 (Pocket Pairs)
    pre_monster_pair: { 
        label: "超级对子 (AA/KK/QQ)", 
        advice: "加注/4-Bet (造大底池)", 
        reason: "起手巅峰牌力！不要慢打，除非对手极其激进。目标是在翻牌前就建立巨大底池，隔离对手。" 
    },
    pre_strong_pair: { 
        label: "强对子 (JJ/TT/99)", 
        advice: "加注/跟注 (小心高牌)", 
        reason: "有摊牌价值，但很怕翻出A/K/Q。如果翻前遭遇强烈反击(4-Bet)，可以考虑弃牌。" 
    },
    pre_small_pair: { 
        label: "小对子 (22-88)", 
        advice: "投机/埋伏 (Set Mining)", 
        reason: "目标只有一个：中暗三条(Set)。如果赔率便宜(20倍以上筹码深度)就看牌，没中就跑，中了就清空对手。" 
    },

    // 2. 强力高牌 (Broadways & Premiums)
    pre_premium_high: { 
        label: "核心高牌 (AK/AQ)", 
        advice: "加注/价值 (强势开局)", 
        reason: "这不是听牌，这是压制牌。击中顶对通常是顶踢脚(TPTK)。即使没中，也有足够的胜率去半诈唬。" 
    },
    pre_broadway: { 
        label: "广播道 (KJ/QJ/AT)", 
        advice: "谨慎进攻 (注意踢脚)", 
        reason: "容易被主导(Dominated)的牌。如果你击中顶对但对手推All-in，你的踢脚可能不够大，小心陷阱。" 
    },

    // 3. 投机牌 (Speculative Hands)
    pre_suited_ace: { 
        label: "同花A (A2s-A9s)", 
        advice: "半诈唬/阻断 (Nut Potential)", 
        reason: "最强的投机牌！A是阻断牌，且能听坚果同花。非常适合用来做3-Bet诈唬，或者在多人底池中看花。" 
    },
    pre_suited_connector: { 
        label: "同花连张 (65s-JTs)", 
        advice: "投机/跟注 (由守转攻)", 
        reason: "怪兽杀手！具有极强的成顺/成花隐蔽性。适合深筹码、有位置时入局，击中后潜在赔率巨大。" 
    },
    pre_suited_gapper: { 
        label: "同花隔张 (T8s/97s)", 
        advice: "后位偷盲/弃牌", 
        reason: "比连张稍弱，但在后位(Button/CO)依然可以玩。如果前面有人加注，通常建议弃牌。" 
    },
    
    // 4. 垃圾牌
    pre_trash: { 
        label: "杂牌 (Trash)", 
        advice: "弃牌 (Fold)", 
        reason: "不要浪费筹码。长期来看，玩这种牌是亏损的根源。耐心等待，不要因为无聊而入池。" 
    },

    // === Post-flop (翻牌后) ===
    
    // 1. 怪兽成牌 (Monsters) - 几乎无敌
    made_straight_flush: { 
        label: "同花顺 (Straight Flush)", 
        advice: "慢打/诱敌 (绝对坚果)", 
        reason: "你已经无敌了。现在唯一的问题是：怎么演得像在诈唬，让对手把钱全送给你？" 
    },
    made_quads: { 
        label: "四条 (Quads)", 
        advice: "慢打 (Slowplay)", 
        reason: "不需要保护手牌，因为对手几乎不可能反超。给对手一点希望，让他们中牌或诈唬。" 
    },
    made_full_house: { 
        label: "葫芦 (Full House)", 
        advice: "价值下注 (Value Bet)", 
        reason: "极强的成牌。除非牌面有更大的公对子，否则你几乎稳赢。开始建立底池吧。" 
    },
    made_flush: { 
        label: "同花 (Flush)", 
        advice: "价值/防守", 
        reason: "你已经完成了同花！注意：如果牌面有公对，对手可能有葫芦；如果是A花，你是无敌的。" 
    },
    made_straight: { 
        label: "顺子 (Straight)", 
        advice: "积极进攻 (Aggressive)", 
        reason: "顺子是大牌，很容易被低估。在同花面要小心，否则请积极下注，不要让听牌便宜看牌。" 
    },
    monster: { 
        label: "三条 (Trips/Set)", 
        advice: "强力价值 (Fast Play)", 
        reason: "暗三条(Set)极其隐蔽，是赢取大底池的最佳牌型。除非牌面极其湿润，否则应该快打。" 
    },
    
    // 2. 对子 (Pairs) - 需要技巧
    top_pair: { 
        label: "顶对 (Top Pair)", 
        advice: "价值下注/控池", 
        reason: "你有顶对，通常领先。如果在干燥面，可以下注价值；在湿润面(很多听牌)，要注意保护手牌。" 
    },
    overpair: { 
        label: "超对 (Overpair)", 
        advice: "强势价值", 
        reason: "你的口袋对子比公牌都大。这通常是很好的牌，但要警惕对手击中暗三条或两对。" 
    },
    middle_pair: { 
        label: "中对 (Middle Pair)", 
        advice: "抓诈唬/过牌 (Bluff Catch)", 
        reason: "具有摊牌价值，但很难承受大注。适合过牌控池，或者用来抓对手的纯诈唬。" 
    },
    bottom_pair: { 
        label: "底对 (Bottom Pair)", 
        advice: "过牌/谨慎摊牌", 
        reason: "牌力较弱，只能赢诈唬。如果有任何进攻动作，通常建议弃牌。" 
    },
    pocket_pair_below: { 
        label: "小口袋对 (Underpair)", 
        advice: "过牌/弃牌", 
        reason: "你的对子小于公牌，极易被压制(Counterfeited)或被诈唬。几乎没有价值。" 
    },
    
    // 3. 听牌 (Draws) - 潜力与半诈唬
    combo_draw: { 
        label: "双重听牌 (Combo Draw)", 
        advice: "全压/重注 (Monster Draw)", 
        reason: "同时听花和顺(甚至对子)！你的胜率往往比成牌还高(Flip)。这是最完美的半诈唬时机，推All-in吧！" 
    },
    flush_draw_nut: { 
        label: "坚果同花听牌 (Nut Flush Draw)", 
        advice: "半诈唬/跟注", 
        reason: "A花听牌！即使没中也有机会靠A赢，且对手通常会忌惮A花。可以玩得非常激进。" 
    },
    flush_draw: { 
        label: "同花听牌 (Flush Draw)", 
        advice: "跟注/半诈唬", 
        reason: "还需要1张同花(约19%机率下一张中)。赔率合适可跟注，或者加注夺取主动权(Fold Equity)。" 
    },
    straight_draw_oesd: { 
        label: "两头顺听牌 (OESD)", 
        advice: "积极进攻", 
        reason: "你有8张补牌成顺(约17%机率)。这是很强的听牌，不要玩得太被动。" 
    },
    straight_draw_gutshot: { 
        label: "卡顺听牌 (Gutshot)", 
        advice: "谨慎/半诈唬", 
        reason: "只有4张补牌(约9%机率)。除非极其便宜，或者你有额外的后门花权益，否则别重注追。" 
    },
    pair_plus_draw: {
        label: "对子+听牌 (Pair + Draw)",
        advice: "强势进攻",
        reason: "你有成牌(对子)作为保险，还有听牌作为升级潜力。这是非常强大的牌型，不要怕打光筹码。"
    },
    
    // 4. 空气
    overcards: { 
        label: "两张高牌 (Overcards)", 
        advice: "观望/飘打 (Float)", 
        reason: "暂无成牌，但如果你有位置优势，可以考虑飘打(Float)一条街，看转牌是否能击中。" 
    },
    trash: { 
        label: "空气牌 (Trash)", 
        advice: "弃牌/纯诈唬", 
        reason: "毫无胜率。除非你是为了偷底池(且确信对手很弱)，否则快跑，别浪费钱。" 
    }
  },
  
  en: {
    // --- Pre-flop ---
    pre_monster_pair: { label: "Premium Pair (AA-QQ)", advice: "Raise/4-Bet", reason: "Absolute powerhouses. Build a massive pot immediately to isolate opponents." },
    pre_strong_pair: { label: "Strong Pair (JJ-99)", advice: "Raise/Call", reason: "Good value, but vulnerable to overcards (A/K/Q). Proceed with caution facing aggression." },
    pre_small_pair: { label: "Set Mining (88-22)", advice: "Call Cheap", reason: "Goal: Hit a Set (Three of a Kind). Implicit odds are huge, but fold if you miss." },
    pre_premium_high: { label: "Premium High (AK/AQ)", advice: "Raise for Value", reason: "Dominating hands. If you hit top pair, you usually have the best kicker (TPTK)." },
    pre_broadway: { label: "Broadways (KJ/QJ)", advice: "Proceed with Caution", reason: "Good top pair potential, but easily dominated by AK/AQ. Be careful if resistance is heavy." },
    
    pre_suited_ace: { label: "Suited Ace (Axs)", advice: "Semi-Bluff/Blocker", reason: "Nut flush potential + Ace blocker. Excellent candidate for 3-bet bluffs." },
    pre_suited_connector: { label: "Suited Connector", advice: "Speculate/Call", reason: "Monster killers! Great playability post-flop. Play them in position with deep stacks." },
    pre_suited_gapper: { label: "Suited Gapper", advice: "Steal/Fold", reason: "Weaker than connectors, but playable from late position to steal blinds." },
    pre_trash: { label: "Trash", advice: "Fold", reason: "Negative EV. Save your chips for better spots. Discipline wins games." },

    // --- Post-flop ---
    made_straight_flush: { label: "Straight Flush", advice: "Slowplay/Trap", reason: "The nuts! Focus solely on extracting maximum value from your opponent." },
    made_quads: { label: "Quads", advice: "Slowplay", reason: "Invincible. Give opponents a chance to catch a hand so they can pay you off." },
    made_full_house: { label: "Full House", advice: "Value Bet", reason: "Monster hand. Bet for value unless you fear a bigger boat." },
    made_flush: { label: "Flush", advice: "Value/Defend", reason: "Strong hand. Beware of paired boards (Full House possibility). If Ace-high flush, you're golden." },
    made_straight: { label: "Straight", advice: "Aggressive", reason: "Strong hand. Bet to deny equity to flush draws or extract value from sets." },
    monster: { label: "Trips/Set", advice: "Fast Play", reason: "Sets are hidden monsters. Build the pot fast before the board gets scary." },

    top_pair: { label: "Top Pair", advice: "Value/Pot Control", reason: "You likely have the best hand. Bet for value on dry boards; protect on wet boards." },
    overpair: { label: "Overpair", advice: "Strong Value", reason: "Your pair is bigger than the board. Very strong, but watch out for sets." },
    middle_pair: { label: "Middle Pair", advice: "Bluff Catch", reason: "Showdown value. Keep the pot small and try to get to showdown cheaply." },
    bottom_pair: { label: "Bottom Pair", advice: "Check/Fold", reason: "Weak value. Only beats a bluff. Fold to significant aggression." },
    pocket_pair_below: { label: "Underpair", advice: "Check/Fold", reason: "Your hand is counterfeited. Very little value." },
    
    combo_draw: { label: "Combo Draw", advice: "All-In/Jam", reason: "Flush + Straight draw. You often have >50% equity even against top pair. Aggression pays off!" },
    flush_draw_nut: { label: "Nut Flush Draw", advice: "Semi-Bluff", reason: "Drawing to the Ace-high flush. Huge equity and fold equity combined." },
    flush_draw: { label: "Flush Draw", advice: "Call/Raise", reason: "9 outs to a flush. Playable, but don't overcommit without the right odds." },
    straight_draw_oesd: { label: "Open-Ended Straight", advice: "Aggressive", reason: "8 outs. A very solid draw that can be played aggressively." },
    straight_draw_gutshot: { label: "Gutshot", advice: "Caution", reason: "Only 4 outs. Don't chase unless you have pot odds or backdoor equity." },
    pair_plus_draw: { label: "Pair + Draw", advice: "Strong Aggression", reason: "Current value + Future potential. A very robust hand to play for stacks." },

    overcards: { label: "Overcards", advice: "Float/Check", reason: "No made hand, but 6 outs to top pair. Play carefully." },
    trash: { label: "Trash", advice: "Fold/Pure Bluff", reason: "Zero equity. Give up unless you have a specific read to bluff." }
  }
};

// --- 多语言文本 (Localization) - v5.0 Simplified Chinese ---
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