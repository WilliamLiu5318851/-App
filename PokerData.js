/**
 * Poker Advisor Pro - Data Layer (v5.0 Expanded Strategy)
 * 包含了更細分、更具體的戰術建議庫。
 */

window.PokerData = {};

// --- 常量定義 (Constants) ---
window.PokerData.CONSTANTS = {
  SUITS: ['s', 'h', 'd', 'c'],
  RANKS: ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'],
  RANK_VALUES: { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 },
  STREETS: ['Pre-flop', 'Flop', 'Turn', 'River']
};

// --- 手牌分析建議數據集 (Hand Analysis Definitions) ---
// 這裡定義了針對具體牌型（如頂對、聽牌、怪獸牌）的戰術建議
window.PokerData.HAND_ANALYSIS_DEFINITIONS = {
  zh: {
    // === Pre-flop (翻牌前) ===
    
    // 1. 口袋對子 (Pocket Pairs)
    pre_monster_pair: { 
        label: "超級對子 (AA/KK/QQ)", 
        advice: "加注/4-Bet (造大底池)", 
        reason: "起手巔峰牌力！不要慢打，除非對手極其激進。目標是在翻牌前就建立巨大底池，隔離對手。" 
    },
    pre_strong_pair: { 
        label: "強對子 (JJ/TT/99)", 
        advice: "加注/跟注 (小心高牌)", 
        reason: "有攤牌價值，但很怕翻出A/K/Q。如果翻前遭遇強烈反擊(4-Bet)，可以考慮棄牌。" 
    },
    pre_small_pair: { 
        label: "小對子 (22-88)", 
        advice: "投機/埋伏 (Set Mining)", 
        reason: "目標只有一個：中暗三條(Set)。如果賠率便宜(20倍以上籌碼深度)就看牌，沒中就跑，中了就清空對手。" 
    },

    // 2. 強力高牌 (Broadways & Premiums)
    pre_premium_high: { 
        label: "核心高牌 (AK/AQ)", 
        advice: "加注/價值 (強勢開局)", 
        reason: "這不是聽牌，這是壓制牌。擊中頂對通常是頂踢腳(TPTK)。即使沒中，也有足夠的勝率去半詐唬。" 
    },
    pre_broadway: { 
        label: "廣播道 (KJ/QJ/AT)", 
        advice: "謹慎進攻 (注意踢腳)", 
        reason: "容易被主導(Dominated)的牌。如果你擊中頂對但對手推All-in，你的踢腳可能不夠大，小心陷阱。" 
    },

    // 3. 投機牌 (Speculative Hands)
    pre_suited_ace: { 
        label: "同花A (A2s-A9s)", 
        advice: "半詐唬/阻斷 (Nut Potential)", 
        reason: "最強的投機牌！A是阻斷牌，且能聽堅果同花。非常適合用來做3-Bet詐唬，或者在多人底池中看花。" 
    },
    pre_suited_connector: { 
        label: "同花連張 (65s-JTs)", 
        advice: "投機/跟注 (由守轉攻)", 
        reason: "怪獸殺手！具有極強的成順/成花隱蔽性。適合深籌碼、有位置時入局，擊中後潛在賠率巨大。" 
    },
    pre_suited_gapper: { 
        label: "同花隔張 (T8s/97s)", 
        advice: "後位偷盲/棄牌", 
        reason: "比連張稍弱，但在後位(Button/CO)依然可以玩。如果前面有人加注，通常建議棄牌。" 
    },
    
    // 4. 垃圾牌
    pre_trash: { 
        label: "雜牌 (Trash)", 
        advice: "棄牌 (Fold)", 
        reason: "不要浪費籌碼。長期來看，玩這種牌是虧損的根源。耐心等待，不要因為無聊而入池。" 
    },

    // === Post-flop (翻牌後) ===
    
    // 1. 怪獸成牌 (Monsters) - 幾乎無敵
    made_straight_flush: { 
        label: "同花順 (Straight Flush)", 
        advice: "慢打/誘敵 (絕對堅果)", 
        reason: "你已經無敵了。現在唯一的問題是：怎麼演得像在詐唬，讓對手把錢全送給你？" 
    },
    made_quads: { 
        label: "四條 (Quads)", 
        advice: "慢打 (Slowplay)", 
        reason: "不需要保護手牌，因為對手幾乎不可能反超。給對手一點希望，讓他們中牌或詐唬。" 
    },
    made_full_house: { 
        label: "葫蘆 (Full House)", 
        advice: "價值下注 (Value Bet)", 
        reason: "極強的成牌。除非牌面有更大的公對子，否則你幾乎穩贏。開始建立底池吧。" 
    },
    made_flush: { 
        label: "同花 (Flush)", 
        advice: "價值/防守", 
        reason: "你已經完成了同花！注意：如果牌面有公對，對手可能有葫蘆；如果是A花，你是無敵的。" 
    },
    made_straight: { 
        label: "順子 (Straight)", 
        advice: "積極進攻 (Aggressive)", 
        reason: "順子是大牌，很容易被低估。在同花面要小心，否則請積極下注，不要讓聽牌便宜看牌。" 
    },
    monster: { 
        label: "三條 (Trips/Set)", 
        advice: "強力價值 (Fast Play)", 
        reason: "暗三條(Set)極其隱蔽，是贏取大底池的最佳牌型。除非牌面極其濕潤，否則應該快打。" 
    },
    
    // 2. 對子 (Pairs) - 需要技巧
    top_pair: { 
        label: "頂對 (Top Pair)", 
        advice: "價值下注/控池", 
        reason: "你有頂對，通常領先。如果在乾燥面，可以下注價值；在濕潤面(很多聽牌)，要注意保護手牌。" 
    },
    overpair: { 
        label: "超對 (Overpair)", 
        advice: "強勢價值", 
        reason: "你的口袋對子比公牌都大。這通常是很好的牌，但要警惕對手擊中暗三條或兩對。" 
    },
    middle_pair: { 
        label: "中對 (Middle Pair)", 
        advice: "抓詐唬/過牌 (Bluff Catch)", 
        reason: "具有攤牌價值，但很難承受大注。適合過牌控池，或者用來抓對手的純詐唬。" 
    },
    bottom_pair: { 
        label: "底對 (Bottom Pair)", 
        advice: "過牌/謹慎攤牌", 
        reason: "牌力較弱，只能贏詐唬。如果有任何進攻動作，通常建議棄牌。" 
    },
    pocket_pair_below: { 
        label: "小口袋對 (Underpair)", 
        advice: "過牌/棄牌", 
        reason: "你的對子小於公牌，極易被壓制(Counterfeited)或被詐唬。幾乎沒有價值。" 
    },
    
    // 3. 聽牌 (Draws) - 潛力與半詐唬
    combo_draw: { 
        label: "雙重聽牌 (Combo Draw)", 
        advice: "全壓/重注 (Monster Draw)", 
        reason: "同時聽花和順(甚至對子)！你的勝率往往比成牌還高(Flip)。這是最完美的半詐唬時機，推All-in吧！" 
    },
    flush_draw_nut: { 
        label: "堅果同花聽牌 (Nut Flush Draw)", 
        advice: "半詐唬/跟注", 
        reason: "A花聽牌！即使沒中也有機會靠A贏，且對手通常會忌憚A花。可以玩得非常激進。" 
    },
    flush_draw: { 
        label: "同花聽牌 (Flush Draw)", 
        advice: "跟注/半詐唬", 
        reason: "還需要1張同花(約19%機率下一張中)。賠率合適可跟注，或者加注奪取主動權(Fold Equity)。" 
    },
    straight_draw_oesd: { 
        label: "兩頭順聽牌 (OESD)", 
        advice: "積極進攻", 
        reason: "你有8張補牌成順(約17%機率)。這是很強的聽牌，不要玩得太被動。" 
    },
    straight_draw_gutshot: { 
        label: "卡順聽牌 (Gutshot)", 
        advice: "謹慎/半詐唬", 
        reason: "只有4張補牌(約9%機率)。除非極其便宜，或者你有額外的後門花權益，否則別重注追。" 
    },
    pair_plus_draw: {
        label: "對子+聽牌 (Pair + Draw)",
        advice: "強勢進攻",
        reason: "你有成牌(對子)作為保險，還有聽牌作為升級潛力。這是非常強大的牌型，不要怕打光籌碼。"
    },
    
    // 4. 空氣
    overcards: { 
        label: "兩張高牌 (Overcards)", 
        advice: "觀望/飄打 (Float)", 
        reason: "暫無成牌，但如果你有位置優勢，可以考慮飄打(Float)一條街，看轉牌是否能擊中。" 
    },
    trash: { 
        label: "空氣牌 (Trash)", 
        advice: "棄牌/純詐唬", 
        reason: "毫無勝率。除非你是為了偷底池(且確信對手很弱)，否則快跑，別浪費錢。" 
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

// --- 多語言文本 (Localization) - v5.0 ---
window.PokerData.TEXTS = {
  zh: {
    appTitle: '德州撲克智囊 Pro',
    heroHand: '我的手牌',
    communityCards: '公共牌',
    calculate: '計算勝率 & 獲取建議',
    calculating: '模擬計算中...',
    reset: '新的一局',
    settings: '設置',
    potInfo: '底池追蹤',
    mainPot: '主底池 (前幾輪)',
    currentBets: '本輪死錢',
    totalPot: '總底池',
    heroStack: '我的籌碼',
    stackAfterBet: '下注後剩餘',
    spr: 'SPR (籌碼底池比)',
    strategy: '策略風格',
    conservative: '保守 (Tight)',
    aggressive: '激進 (Aggressive)',
    maniac: '詐唬/超激進 (Bluff)',
    players: '對手動作',
    active: '入局',
    folded: '棄牌',
    bet: '本輪下注',
    equity: '真實勝率',
    advice: '行動指南',
    nextStreet: '收池 & 下一輪',
    finishHand: '結算本局',
    betSizing: '推薦加注額 (點擊應用)',
    potOdds: '底池賠率',
    requiredEquity: '所需勝率',
    advice_fold: '棄牌 (Fold)',
    advice_check_fold: '過牌/棄牌 (Check/Fold)',
    advice_check_call: '過牌/跟注 (Check/Call)',
    advice_call: '跟注 (Call)',
    advice_raise: '加注 (Raise)',
    advice_raise_bluff: '詐唬加注 (Bluff Raise)',
    advice_allin: '全壓 (All-In)',
    advice_allin_bluff: '全壓詐唬 (All-In Bluff)',
    reason_spr_low: 'SPR過低，您已套池(Committed)',
    reason_value: '強牌價值下注',
    reason_bluff_semi: '半詐唬：有聽牌，打退對手',
    reason_bluff_pure: '純詐唬：扮演強牌，利用棄牌率',
    reason_odds: '賠率合適，適合跟注聽牌',
    street_pre: '翻牌前',
    street_flop: '翻牌圈',
    street_turn: '轉牌圈',
    street_river: '河牌圈',
    add_player: '添加對手',
    bet_size_small: '小注 (1/3)',
    bet_size_med: '中注 (2/3)',
    bet_size_large: '滿池 (1.0)',
    bet_size_over: '超池 (1.5x)',
    settle_win: '贏',
    settle_loss: '輸',
    settle_split: '平',
    settle_title: '分池結算',
    settle_confirm: '確認結算結果',
    restart_hand: '開始下一手牌',
    btn_allin: 'ALL-IN',
    btn_fold: '棄牌 (Fold)',
    btn_call: '跟注 (Call)',
    btn_check: '過牌 (Check)',
    btn_call_allin: '全壓 (Call/All-In)',
    rebuy: '補充籌碼',
    deck_count: '牌副數 (Decks)',
    deck_info: '標準德撲為1副。多副牌會降低阻斷效應。',
    game_settings: '遊戲設置',
    selectCard: '選擇一張牌',
    pot_segment: '池',
    contestants: '參與人數',
    net_change: '本局變動',
    segment_main: '主池 (Main)',
    segment_side: '邊池 (Side)',
    buy_in_amount: '一手籌碼 (Buy-in)',
    buy_in_info: 'Rebuy 按鈕的默認補充金額。',
    selecting_flop: '選擇翻牌 (Flop)',
    selecting_turn: '選擇轉牌 (Turn)',
    selecting_river: '選擇河牌 (River)',
    selecting_hero: '選擇手牌'
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