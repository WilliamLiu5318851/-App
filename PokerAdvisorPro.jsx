// 1. 图标库 (从 index.html 的 importmap 加载)
import { RefreshCw, Trophy, Users, Globe, Brain, Info, DollarSign, ArrowRight, Layers, HandMetal, AlertTriangle, CheckCircle, XCircle, Divide, Flame, Skull, Zap, RotateCcw, Settings, X, Coins, ShieldCheck, MousePointerClick, Flag, Lightbulb, CheckSquare } from 'lucide-react';

// 2. 从全局变量中获取 React 功能
const { useState, useEffect, useMemo } = React;
const { createRoot } = ReactDOM;

// 3. 从 PokerData.js 获取数据 (关键步骤)
// 确保 PokerData.js 已经在 HTML 中加载
const { CONSTANTS, HAND_ANALYSIS_DEFINITIONS, TEXTS } = window.PokerData || {
  // Fallback (防止文件加载失败时的空白页，虽然实际上应该通过 HTML 加载)
  CONSTANTS: { SUITS: [], RANKS: [], RANK_VALUES: {}, STREETS: [] },
  HAND_ANALYSIS_DEFINITIONS: { zh: {}, en: {} },
  TEXTS: { zh: {}, en: {} }
};

const { SUITS, RANKS, RANK_VALUES, STREETS } = CONSTANTS;

/**
 * 德州扑克助手 Pro (Texas Hold'em Advisor Pro)
 * Version 4.5 Update:
 * 1. Data Separation: Moved definitions to PokerData.js.
 * 2. Logic Optimization: Code is now much cleaner and focused on functionality.
 * 3. Mobile UI: Retained the optimized layout.
 */

// --- Poker Logic Helpers ---
const evaluateHand = (cards) => {
  if (!cards || cards.length < 5) return 0;
  const sorted = [...cards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);
  const ranks = sorted.map(c => RANK_VALUES[c.rank]);
  const suits = sorted.map(c => c.suit);
  const counts = {};
  ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
  const countValues = Object.values(counts);
  
  const suitCounts = {};
  suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
  let flushSuit = Object.keys(suitCounts).find(s => suitCounts[s] >= 5);
  let isFlush = !!flushSuit;
  let flushRanks = isFlush ? sorted.filter(c => c.suit === flushSuit).map(c => RANK_VALUES[c.rank]) : [];

  const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => b - a);
  let straightHigh = 0;
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    const slice = uniqueRanks.slice(i, i + 5);
    if (slice[0] - slice[4] === 4) { straightHigh = slice[0]; break; }
  }
  if (!straightHigh && uniqueRanks.includes(14) && uniqueRanks.includes(2) && uniqueRanks.includes(3) && uniqueRanks.includes(4) && uniqueRanks.includes(5)) straightHigh = 5;

  let isStraightFlush = false; 
  if (isFlush && straightHigh) {
     isStraightFlush = true; 
  }

  if (isStraightFlush) return 8000000 + straightHigh;
  if (countValues.includes(4)) return 7000000;
  if (countValues.includes(3) && countValues.includes(2)) return 6000000;
  if (isFlush) return 5000000 + flushRanks[0];
  if (straightHigh) return 4000000 + straightHigh;
  if (countValues.includes(3)) return 3000000;
  if (countValues.filter(c => c === 2).length >= 2) return 2000000;
  if (countValues.includes(2)) return 1000000;
  return ranks[0];
};

// --- 核心分析函数 ---
const analyzeHandFeatures = (heroCards, communityCards) => {
  if (!heroCards[0] || !heroCards[1]) return null;
  
  // Hero的牌值
  const h1_rank = RANK_VALUES[heroCards[0].rank];
  const h2_rank = RANK_VALUES[heroCards[1].rank];
  const h1 = Math.max(h1_rank, h2_rank);
  const h2 = Math.min(h1_rank, h2_rank);
  
  const isSuited = heroCards[0].suit === heroCards[1].suit;
  const isPair = h1 === h2;

  // === 1. Pre-flop Analysis (翻牌前) ===
  const board = communityCards.filter(Boolean);
  if (board.length === 0) {
      if (isPair) {
          if (h1 >= 12) return "pre_monster_pair"; // QQ+
          if (h1 >= 9) return "pre_strong_pair";   // 99-JJ
          return "pre_small_pair";                 // 22-88
      }
      
      if (h1 >= 13 && h2 >= 12) return "pre_premium_high"; // AK, AQ, KQ? (Strictly AK/AQ usually)
      if (h1 === 14 && h2 >= 10) return "pre_premium_high"; // AT+

      if (isSuited) {
          if (h1 === 14) return "pre_suited_ace"; // A2s-A9s
          if (h1 - h2 === 1 && h1 <= 11) return "pre_suited_connector"; // JTs, T9s ... 54s
          if (h1 >= 10 && h2 >= 10) return "pre_broadway"; // KJs, QJs
      }

      if (h1 >= 10 && h2 >= 10) return "pre_broadway"; // Offsuit broadways
      
      return "pre_trash";
  }

  // === 2. Post-flop Analysis (翻牌后) ===
  const isRiver = board.length === 5;
  const allCards = [...heroCards, ...board];
  
  // 基础统计
  const suits = {};
  const ranks = [];
  allCards.forEach(c => {
    suits[c.suit] = (suits[c.suit] || 0) + 1;
    ranks.push(RANK_VALUES[c.rank]);
  });
  ranks.sort((a, b) => a - b);
  const uniqueRanks = [...new Set(ranks)];
  
  const boardRanks = board.map(c => RANK_VALUES[c.rank]).sort((a,b)=>b-a);
  const maxBoardRank = boardRanks[0];

  // 1. Made Hands Detection (优先判定成牌)
  const rankCounts = {};
  ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
  const countsArr = Object.values(rankCounts);
  
  // Flush
  const flushSuitMade = Object.keys(suits).find(s => suits[s] >= 5);
  // Full House (3+2 or 3+3)
  const hasTripsTotal = countsArr.includes(3);
  const hasQuads = countsArr.includes(4);
  const hasFullHouse = (hasTripsTotal && countsArr.includes(2)) || (countsArr.filter(c => c >= 3).length >= 2);
  
  // Straight (Simple check)
  let straightHigh = 0;
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    const slice = uniqueRanks.slice(i, i + 5);
    if (slice[0] - slice[4] === 4) { straightHigh = slice[0]; break; }
  }
  // Wheel straight (A,2,3,4,5)
  if (!straightHigh && uniqueRanks.includes(14) && uniqueRanks.includes(2) && uniqueRanks.includes(3) && uniqueRanks.includes(4) && uniqueRanks.includes(5)) straightHigh = 5;

  // --- Priority Level 1: Monsters & Strong Made Hands ---
  if (straightHigh && flushSuitMade) return "made_straight_flush"; // Rare
  if (hasQuads) return "made_quads";
  if (hasFullHouse) return "made_full_house";
  if (flushSuitMade) return "made_flush";
  if (straightHigh) return "made_straight";
  
  // Hero Specific Trips check (If not FH, but Hero has Trips)
  const heroRankCounts = { [h1_rank]: 0, [h2_rank]: 0 };
  allCards.forEach(c => {
    const r = RANK_VALUES[c.rank];
    if (r === h1_rank) heroRankCounts[h1_rank]++;
    if (r === h2_rank) heroRankCounts[h2_rank]++;
  });
  const hitCount = Math.max(heroRankCounts[h1_rank], heroRankCounts[h2_rank]);
  if (hitCount >= 3) return "monster"; // Trips

  // --- Priority Level 2: Draws (Only if NOT River) ---
  if (!isRiver) {
    // Flush Draw
    const fdSuit = Object.keys(suits).find(s => suits[s] === 4);
    let flushDrawType = null;
    if (fdSuit) {
      const hasNutAttr = (heroCards[0].suit === fdSuit && h1_rank === 14) || (heroCards[1].suit === fdSuit && h2_rank === 14);
      flushDrawType = hasNutAttr ? "flush_draw_nut" : "flush_draw";
    }

    // Straight Draw
    let straightDrawType = null;
    for (let i = 0; i <= uniqueRanks.length - 4; i++) {
      const window = uniqueRanks.slice(i, i + 4);
      const span = window[window.length - 1] - window[0];
      if (span <= 4) { 
        straightDrawType = (span === 3) ? "straight_draw_oesd" : "straight_draw_gutshot";
      }
    }

    if (flushDrawType && straightDrawType) return "combo_draw";
    if (flushDrawType) return flushDrawType;
    if (straightDrawType) return straightDrawType;
  }

  // --- Priority Level 3: Pairs (Marginal) ---
  if (hitCount === 2) {
    if (isPair) {
      return h1 > maxBoardRank ? "top_pair" : "pocket_pair_below"; 
    } else {
      const pairRank = heroRankCounts[h1_rank] === 2 ? h1_rank : h2_rank;
      if (pairRank === maxBoardRank) return "top_pair";
      if (pairRank > boardRanks[boardRanks.length-1]) return "middle_pair";
      return "bottom_pair";
    }
  }

  // Fallback
  if (h1 > maxBoardRank && h2 > maxBoardRank) return "overcards";
  
  return "trash";
};

const CardIcon = ({ rank, suit, className = "" }) => {
  const isRed = suit === 'h' || suit === 'd';
  const suitSymbol = { s: '♠', h: '♥', d: '♦', c: '♣' }[suit];
  return (
    <div className={`bg-white border border-gray-300 rounded-md flex flex-col items-center justify-center select-none shadow-sm ${isRed ? 'text-red-600' : 'text-slate-900'} ${className}`}>
      <span className="font-bold text-sm leading-none">{rank}</span>
      <span className="text-base leading-none">{suitSymbol}</span>
    </div>
  );
};

// --- Main Component ---

function TexasHoldemAdvisor() {
  const [lang, setLang] = useState('zh');
  const [strategy, setStrategy] = useState('conservative'); 
  const [showSettings, setShowSettings] = useState(false);
  const [deckCount, setDeckCount] = useState(1);
  const [buyInAmount, setBuyInAmount] = useState(1000);
  
  // Game State
  const [street, setStreet] = useState(0); 
  const [heroHand, setHeroHand] = useState([null, null]);
  const [communityCards, setCommunityCards] = useState([null, null, null, null, null]);
  
  // Bankroll State
  const [heroStack, setHeroStack] = useState(1000); 
  const [heroBet, setHeroBet] = useState(0);
  const [heroTotalContributed, setHeroTotalContributed] = useState(0); 
  
  // Pot State
  const [mainPot, setMainPot] = useState(0); 
  
  const [players, setPlayers] = useState([
    { id: 1, bet: 0, totalContributed: 0, active: true },
    { id: 2, bet: 0, totalContributed: 0, active: true },
    { id: 3, bet: 0, totalContributed: 0, active: true }
  ]);
  
  const [result, setResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectingFor, setSelectingFor] = useState(null); // { type: 'hero'|'board', index: number }
  
  // Settlement State
  const [settlementMode, setSettlementMode] = useState(false);
  const [potSegments, setPotSegments] = useState([]);

  const t = TEXTS[lang];

  // Derived Values
  const currentOpponentBets = players.reduce((sum, p) => sum + p.bet, 0); 
  const totalPot = mainPot + currentOpponentBets + heroBet;
  
  const maxBet = Math.max(heroBet, ...players.map(p => p.bet));
  const callAmount = maxBet - heroBet;
  const currentStack = heroStack - heroBet; 
  
  const spr = currentStack > 0 && totalPot > 0 ? (currentStack / totalPot).toFixed(2) : '∞';

  // --- Logic for Call Button ---
  const maxOpponentBet = Math.max(0, ...players.map(p => p.bet));
  const amountToCall = Math.max(0, maxOpponentBet); // The absolute amount Hero needs to have in 'bet' input
  const isCallAction = amountToCall > heroBet; // Need to put more money?
  
  // Logic: Can we afford the call?
  // If maxOpponentBet > heroStack (Total Stack), then we can only go All-In (set bet to heroStack)
  const safeCallAmount = Math.min(amountToCall, heroStack);
  const isCallAllIn = safeCallAmount >= heroStack;
  
  const handleCall = () => {
    setHeroBet(safeCallAmount);
  };

  // --- Actions ---

  const handleHeroBetChange = (val) => {
    if (val === '') {
      setHeroBet(0);
      return;
    }
    let newBet = Number(val);
    if (newBet < 0) newBet = 0;
    if (newBet > heroStack) newBet = heroStack;
    setHeroBet(newBet);
  };

  const handleStackChange = (val) => {
    if (val === '') {
      setHeroStack(0);
      return;
    }
    let newStack = Number(val);
    if (newStack < 0) newStack = 0;
    setHeroStack(newStack);
  };

  const handleBuyInChange = (val) => {
    if (val === '') {
      setBuyInAmount(0);
      return;
    }
    setBuyInAmount(Number(val));
  };

  const handleOpponentBetChange = (id, val) => {
    let newBet = val === '' ? 0 : Number(val);
    setPlayers(players.map(p => p.id === id ? { ...p, bet: newBet } : p));
  };

  const handleFold = () => {
    const remainingStack = heroStack - heroBet;
    setHeroStack(Math.max(0, remainingStack));
    
    setStreet(0);
    setMainPot(0);
    setHeroBet(0);
    setHeroTotalContributed(0);
    setPlayers(players.map(p => ({ ...p, bet: 0, totalContributed: 0, active: true })));
    setHeroHand([null, null]);
    setCommunityCards([null, null, null, null, null]);
    setResult(null);
    setSettlementMode(false);
    setPotSegments([]);
  };

  const cycleStrategy = () => {
    if (strategy === 'conservative') setStrategy('aggressive');
    else if (strategy === 'aggressive') setStrategy('maniac');
    else setStrategy('conservative');
  };

  const getStrategyStyle = () => {
    switch(strategy) {
      case 'maniac': return 'bg-purple-900/50 text-purple-400 border-purple-800 shadow-[0_0_15px_rgba(168,85,247,0.3)]';
      case 'aggressive': return 'bg-red-900/50 text-red-400 border-red-800';
      default: return 'bg-blue-900/50 text-blue-400 border-blue-800';
    }
  };

  const getStrategyLabel = () => {
    switch(strategy) {
      case 'maniac': return t.maniac;
      case 'aggressive': return t.aggressive;
      default: return t.conservative;
    }
  };

  const nextStreet = () => {
    setMainPot(totalPot); 
    setHeroTotalContributed(prev => prev + heroBet);
    setPlayers(players.map(p => ({
      ...p,
      totalContributed: (p.totalContributed || 0) + p.bet,
      bet: 0 
    })));

    setHeroStack(prev => Math.max(0, prev - heroBet));
    setHeroBet(0);
    
    if (street < 3) {
      setStreet(street + 1);
      setResult(null);
    } else {
      enterSettlement();
    }
  };

  // --- Logic: Pot Segmentation ---
  const enterSettlement = () => {
    const heroTotal = heroTotalContributed + heroBet;
    const opps = players.map(p => ({ ...p, finalTotal: (p.totalContributed || 0) + p.bet }));
    
    const activeCaps = [...opps.filter(p => p.active).map(p => p.finalTotal), heroTotal].filter(v => v > 0);
    const uniqueCaps = [...new Set(activeCaps)].sort((a, b) => a - b);

    const segments = [];
    let prevCap = 0;

    uniqueCaps.forEach((cap) => {
      const amount = cap - prevCap;
      if (amount <= 0) return;

      let potSize = 0;
      let contributors = 0;
      let heroInvolved = false;

      if (heroTotal > prevCap) {
        potSize += Math.min(amount, heroTotal - prevCap);
        heroInvolved = true;
        contributors++;
      }

      opps.forEach(p => {
        if (p.finalTotal > prevCap) {
          potSize += Math.min(amount, p.finalTotal - prevCap);
          if (p.active) contributors++; 
        }
      });

      if (potSize > 0 && heroInvolved) {
        segments.push({
          id: cap,
          amount: potSize,
          contestants: contributors,
          result: 'loss' // default
        });
      }
      prevCap = cap;
    });

    setPotSegments(segments);
    setSettlementMode(true);
  };

  const updateSegmentResult = (idx, res) => {
    const newSegments = [...potSegments];
    newSegments[idx].result = res;
    setPotSegments(newSegments);
  };

  const confirmSettlement = () => {
    let winnings = 0;
    potSegments.forEach(seg => {
      if (seg.result === 'win') winnings += seg.amount;
      else if (seg.result === 'split') winnings += Math.floor(seg.amount / seg.contestants); 
    });

    const finalStack = (heroStack - heroBet) + winnings;
    setHeroStack(Math.max(0, finalStack));

    // Reset
    setStreet(0);
    setMainPot(0);
    setHeroBet(0);
    setHeroTotalContributed(0);
    setPlayers(players.map(p => ({ ...p, bet: 0, totalContributed: 0, active: true })));
    setHeroHand([null, null]);
    setCommunityCards([null, null, null, null, null]);
    setResult(null);
    setSettlementMode(false);
  };

  const calculateEquity = () => {
    if (heroHand.some(c => c === null)) return;
    setIsCalculating(true);
    setResult(null);

    setTimeout(() => {
      const SIMULATIONS = 1500;
      let wins = 0;
      let ties = 0;
      const activeOpponents = players.filter(p => p.active).length;
      
      let fullDeck = [];
      for (let d = 0; d < deckCount; d++) {
        for (let s of SUITS) for (let r of RANKS) fullDeck.push({ rank: r, suit: s });
      }

      const knownCards = [...heroHand, ...communityCards].filter(Boolean);
      
      for (let i = 0; i < SIMULATIONS; i++) {
        let currentDeck = [...fullDeck];
        knownCards.forEach(kc => {
          const idx = currentDeck.findIndex(c => c.rank === kc.rank && c.suit === kc.suit);
          if (idx !== -1) currentDeck.splice(idx, 1);
        });

        for (let j = currentDeck.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [currentDeck[j], currentDeck[k]] = [currentDeck[k], currentDeck[j]];
        }
        
        const runout = [...communityCards.filter(Boolean)];
        while (runout.length < 5) runout.push(currentDeck.pop());
        
        const oppHands = [];
        for (let p = 0; p < activeOpponents; p++) oppHands.push([currentDeck.pop(), currentDeck.pop()]);
        
        const heroScore = evaluateHand([...heroHand, ...runout]);
        let heroWins = true; 
        let isTie = false;
        
        for (let oh of oppHands) {
          const s = evaluateHand([...oh, ...runout]);
          if (s > heroScore) { heroWins = false; break; }
          if (s === heroScore) isTie = true;
        }
        if (heroWins && !isTie) wins++;
        if (heroWins && isTie) ties++;
      }

      const equity = ((wins + (ties/2)) / SIMULATIONS) * 100;
      
      const potOdds = totalPot > 0 ? (callAmount / (totalPot + callAmount)) * 100 : 0;
      let adviceKey = 'advice_fold';
      let reasonKey = 'reason_odds';
      let betSizes = null;

      let buffer = 1.1; 
      if (strategy === 'aggressive') buffer = 0.9;
      if (strategy === 'maniac') buffer = 0.6; 

      const requiredEquity = potOdds * buffer;
      const isManiac = strategy === 'maniac';

      if (parseFloat(spr) < 1.5 && equity > (isManiac ? 15 : 30)) {
        adviceKey = isManiac ? 'advice_allin_bluff' : 'advice_allin';
        reasonKey = 'reason_spr_low';
      } else if (callAmount === 0) {
        if (equity > 65) {
          adviceKey = 'advice_raise';
          reasonKey = 'reason_value';
        } else if (equity > 45 && strategy !== 'conservative') {
          adviceKey = 'advice_raise';
          reasonKey = 'reason_bluff_semi';
        } else if (isManiac && equity > 20) {
          adviceKey = 'advice_raise_bluff';
          reasonKey = 'reason_bluff_pure';
        } else {
          adviceKey = 'advice_check_call';
          reasonKey = 'reason_odds';
        }
      } else {
        if (equity > requiredEquity + 15) {
           adviceKey = 'advice_raise';
           reasonKey = 'reason_value';
        } else if (equity >= requiredEquity) {
           adviceKey = 'advice_call';
           reasonKey = 'reason_odds';
        } else if (isManiac && equity > 15 && equity < requiredEquity) {
           adviceKey = 'advice_raise_bluff';
           reasonKey = 'reason_bluff_pure';
        } else if (strategy === 'aggressive' && equity > requiredEquity * 0.8) {
           adviceKey = 'advice_call'; 
           reasonKey = 'reason_bluff_semi';
        } else {
           adviceKey = 'advice_fold';
        }
      }

      // Bet Sizing Logic with Capping
      if (adviceKey.includes('raise') || adviceKey.includes('allin')) {
        const p = totalPot;
        const s = heroStack;
        
        const cap = (val) => Math.min(val, s);

        let smallBase, medBase, largeBase;

        // Hybrid Sizing Logic
        if (strategy === 'maniac') {
           smallBase = Math.max(p * 0.33, s * 0.05);
           medBase   = Math.max(p * 0.66, s * 0.10);
           largeBase = Math.max(p * 1.5,  s * 0.20); 
        } else if (strategy === 'aggressive') {
           smallBase = Math.max(p * 0.33, s * 0.03);
           medBase   = Math.max(p * 0.66, s * 0.06);
           largeBase = Math.max(p * 1.0,  s * 0.12);
        } else {
           smallBase = Math.max(p * 0.33, s * 0.02);
           medBase   = Math.max(p * 0.66, s * 0.04);
           largeBase = Math.max(p * 1.0,  s * 0.08);
        }
        
        betSizes = {
          small: cap(Math.round(smallBase)),
          med:   cap(Math.round(medBase)),
          large: cap(Math.round(largeBase))
        };
      }

      // --- 位置 C: 集成调用分析函数 ---
      const analysisKey = analyzeHandFeatures(heroHand, communityCards);
      const analysisData = analysisKey ? HAND_ANALYSIS_DEFINITIONS[lang][analysisKey] : null;

      let finalAdvice = t[adviceKey];
      let finalReason = t[reasonKey];

      // 如果有具体的牌型分析，覆盖Reason，有时覆盖Advice
      if (analysisData) {
        finalReason = analysisData.reason;
        // 对于极强的牌或极好的听牌，强制建议进攻，覆盖默认的赔率逻辑
        // 修正：包含所有成牌 (Made Hands)
        if (analysisKey.startsWith('made_') || analysisKey === 'monster' || analysisKey === 'pre_monster_pair' || analysisKey === 'combo_draw' || analysisKey === 'flush_draw_nut') {
           finalAdvice = analysisData.advice;
        }
        // 如果是垃圾牌，且目前建议不是弃牌（因为随机模拟可能偶尔胜率高），强制建议弃牌 (除非是诈唬模式)
        if (analysisKey === 'pre_trash' && strategy !== 'maniac' && callAmount > 0) {
            finalAdvice = t.advice_fold;
        }
      }

      setResult({
        equity: equity.toFixed(1),
        potOdds: potOdds.toFixed(1),
        requiredEquity: requiredEquity.toFixed(1),
        advice: finalAdvice,
        reason: finalReason,
        handTypeLabel: analysisData ? analysisData.label : null, // 传递给UI显示
        betSizes,
        isBluff: adviceKey.includes('bluff')
      });
      setIsCalculating(false);
    }, 100);
  };

  const unavailableCards = useMemo(() => [...heroHand, ...communityCards].filter(Boolean), [heroHand, communityCards]);

  const CardSelector = () => {
    if (!selectingFor) return null;

    // Dynamic Title for Selector
    let title = t.selectCard;
    if (selectingFor.type === 'hero') title = `${t.selecting_hero} ${selectingFor.index + 1}/2`;
    if (selectingFor.type === 'board') {
        if (selectingFor.index < 3) title = `${t.selecting_flop} ${selectingFor.index + 1}/3`;
        else if (selectingFor.index === 3) title = t.selecting_turn;
        else title = t.selecting_river;
    }

    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectingFor(null)}>
        <div className="bg-slate-800 rounded-xl p-4 max-w-lg w-full max-h-[80vh] overflow-y-auto border border-slate-600 shadow-2xl" onClick={e => e.stopPropagation()}>
          <h3 className="text-white font-bold mb-4 flex justify-between items-center">
            <span>{title}</span>
            <button onClick={() => setSelectingFor(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {SUITS.map(suit => (
              <div key={suit} className="flex flex-col gap-2">
                {RANKS.map(rank => {
                  const takenCount = unavailableCards.filter(c => c.rank === rank && c.suit === suit).length;
                  const isTaken = takenCount >= deckCount;
                  
                  return (
                    <button
                      key={`${rank}${suit}`}
                      disabled={isTaken}
                      onClick={() => {
                        const card = { rank, suit };
                        let nextState = null;

                        if (selectingFor.type === 'hero') {
                          const h = [...heroHand];
                          h[selectingFor.index] = card;
                          setHeroHand(h);
                          // Auto-advance Hero: 0 -> 1 -> Close
                          if (selectingFor.index === 0) nextState = { type: 'hero', index: 1 };
                        } else {
                          const b = [...communityCards];
                          b[selectingFor.index] = card;
                          setCommunityCards(b);
                          // Auto-advance Board: Flop 0->1->2->Close
                          if (selectingFor.index < 2) nextState = { type: 'board', index: selectingFor.index + 1 };
                        }
                        
                        setSelectingFor(nextState);
                      }}
                      className={`p-1 rounded flex justify-center hover:bg-slate-700 ${isTaken ? 'opacity-20 cursor-not-allowed' : ''}`}
                    >
                      <CardIcon rank={rank} suit={suit} className="w-10 h-14" />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Settlement UI Helpers
  const getPotSplit = () => {
    const heroTotal = heroTotalContributed + heroBet;
    const sidePot = players.reduce((sum, p) => {
      const oppTotal = (p.totalContributed || 0) + p.bet;
      const excess = Math.max(0, oppTotal - heroTotal);
      return sum + excess;
    }, 0);
    const eligiblePot = Math.max(0, totalPot - sidePot);
    return { sidePot, eligiblePot };
  };

  const { sidePot, eligiblePot } = settlementMode ? getPotSplit() : { sidePot: 0, eligiblePot: 0 };

  function handleCardClick(type, index) {
    setSelectingFor({ type, index });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-10">
      
      {/* Navbar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="text-emerald-500 w-5 h-5" />
            <span className="font-bold text-lg tracking-tight">{t.appTitle}</span>
          </div>
          <div className="flex gap-2 text-xs font-medium items-center">
            <button onClick={cycleStrategy} 
              className={`px-3 py-1.5 rounded-full transition border flex items-center gap-1 ${getStrategyStyle()}`}>
              {strategy === 'maniac' && <Flame className="w-3 h-3 animate-pulse" />}
              {getStrategyLabel()}
            </button>
            <button onClick={() => setShowSettings(true)} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')} className="bg-slate-800 px-3 py-1.5 rounded-full hover:bg-slate-700 border border-slate-700">
              {lang === 'zh' ? 'EN' : '中'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-6">

        {/* Pot & Stats Tracker */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-inner grid grid-cols-2 gap-4">
          <div>
            <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider">{t.mainPot}</div>
            <div className="text-2xl font-mono font-bold text-slate-200">
              {mainPot} <span className="text-sm text-slate-600">+ {currentOpponentBets + heroBet}</span>
            </div>
            <div className="text-emerald-500 text-sm font-bold mt-1">= {totalPot}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider flex items-center justify-end gap-1">
              {t.spr} <Info className="w-3 h-3"/>
            </div>
            <div className={`text-2xl font-mono font-bold ${Number(spr) < 3 ? 'text-red-400' : 'text-blue-400'}`}>
              {spr}
            </div>
            <div className="text-slate-500 text-xs mt-1">{t.stackAfterBet}: {currentStack}</div>
          </div>
        </div>

        {/* Board (Streets) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
             <span className="text-xs font-bold text-slate-400 uppercase">{t[`street_${['pre','flop','turn','river'][street]}`]}</span>
             {street < 3 ? (
               <button onClick={nextStreet} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-full flex items-center gap-1 transition shadow-lg shadow-emerald-900/50">
                 {t.nextStreet} <ArrowRight className="w-3 h-3" />
               </button>
             ) : (
               !settlementMode && (
                 <button onClick={enterSettlement} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-full flex items-center gap-1 transition">
                   {t.finishHand}
                 </button>
               )
             )}
          </div>
          
          <div className="flex gap-2 h-20 sm:h-24">
             {[0,1,2].map(i => (
               <div key={i} 
                    onClick={() => street >= 1 && handleCardClick('board', i)}
                    className={`flex-1 rounded-lg border-2 flex items-center justify-center cursor-pointer transition relative
                      ${street >= 1 ? 'bg-slate-800 border-slate-600 hover:border-slate-400' : 'bg-slate-900/50 border-slate-800 opacity-30 cursor-not-allowed'}`}>
                  {communityCards[i] ? <CardIcon rank={communityCards[i].rank} suit={communityCards[i].suit} className="w-full h-full" /> : <span className="text-slate-700 text-xs">Flop</span>}
               </div>
             ))}
             <div 
               onClick={() => street >= 2 && handleCardClick('board', 3)}
               className={`flex-1 rounded-lg border-2 flex items-center justify-center cursor-pointer transition relative
                 ${street >= 2 ? 'bg-slate-800 border-slate-600 hover:border-slate-400' : 'bg-slate-900/50 border-slate-800 opacity-30 cursor-not-allowed'}`}>
                {communityCards[3] ? <CardIcon rank={communityCards[3].rank} suit={communityCards[3].suit} className="w-full h-full" /> : <span className="text-slate-700 text-xs">Turn</span>}
             </div>
             <div 
               onClick={() => street >= 3 && handleCardClick('board', 4)}
               className={`flex-1 rounded-lg border-2 flex items-center justify-center cursor-pointer transition relative
                 ${street >= 3 ? 'bg-slate-800 border-slate-600 hover:border-slate-400' : 'bg-slate-900/50 border-slate-800 opacity-30 cursor-not-allowed'}`}>
                {communityCards[4] ? <CardIcon rank={communityCards[4].rank} suit={communityCards[4].suit} className="w-full h-full" /> : <span className="text-slate-700 text-xs">River</span>}
             </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-2 opacity-10"><HandMetal className="w-24 h-24" /></div>
           <div className="flex gap-4 relative z-10">
              <div className="flex gap-2">
                {[0,1].map(i => (
                  <div key={i} onClick={() => setSelectingFor({ type: 'hero', index: i })} className="w-14 h-20 sm:w-16 sm:h-24 bg-slate-700 rounded-lg border-2 border-slate-500 hover:border-yellow-500 cursor-pointer flex items-center justify-center shadow-lg transition">
                    {heroHand[i] ? <CardIcon rank={heroHand[i].rank} suit={heroHand[i].suit} className="w-full h-full" /> : <span className="text-2xl text-slate-500">+</span>}
                  </div>
                ))}
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-3">
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-slate-400">{t.heroStack} (Start of St.)</label>
                      {heroStack === 0 && (
                        <button 
                          onClick={() => setHeroStack(buyInAmount)}
                          className="flex items-center gap-1 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded shadow animate-pulse"
                        >
                          <RotateCcw className="w-3 h-3" /> {t.rebuy} {buyInAmount}
                        </button>
                      )}
                    </div>
                    <input 
                      type="number" 
                      value={heroStack === 0 ? '' : heroStack} 
                      onChange={e => handleStackChange(e.target.value)} 
                      placeholder="0"
                      className={`w-full bg-slate-950 border rounded px-2 py-1 font-mono transition focus:outline-none 
                        ${heroStack === 0 ? 'border-red-500 text-red-400 placeholder-red-700' : 'border-slate-700 text-yellow-400'}`} 
                    />
                 </div>
                 
                 {/* --- HERO ACTION ROW (Mobile Optimized) --- */}
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-slate-400">{t.bet}</label>
                    </div>
                    
                    {/* Buttons moved to their own row for max width */}
                    <div className="flex gap-1 mb-1">
                        <button 
                          onClick={handleFold} 
                          className="flex-1 flex items-center justify-center gap-1 text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 py-1.5 rounded shadow-sm transition font-bold tracking-wider border border-slate-600"
                        >
                           <Flag className="w-3 h-3" /> {t.btn_fold}
                        </button>

                        <button 
                           onClick={handleCall}
                           disabled={heroStack === 0}
                           className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 rounded shadow-sm transition font-bold tracking-wider
                             ${isCallAllIn 
                                ? 'bg-red-800 text-red-100 hover:bg-red-700 border border-red-600 animate-pulse' 
                                : 'bg-blue-600 text-white hover:bg-blue-500 border border-blue-500' 
                             }
                             ${heroStack === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                           `}
                        >
                           {isCallAction ? (
                              isCallAllIn 
                                ? <><Zap className="w-3 h-3 fill-current"/> {t.btn_call_allin} ${safeCallAmount}</>
                                : <><CheckSquare className="w-3 h-3"/> {t.btn_call} ${safeCallAmount}</>
                           ) : (
                              <><CheckCircle className="w-3 h-3"/> {t.btn_check}</>
                           )}
                        </button>

                        <button 
                          onClick={() => handleHeroBetChange(heroStack)} 
                          disabled={heroStack === 0}
                          className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 rounded shadow-sm transition font-bold tracking-wider 
                            ${heroStack === 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                        >
                           <Zap className="w-3 h-3 fill-current" /> {t.btn_allin}
                        </button>
                    </div>

                    <input 
                      type="number" 
                      value={heroBet === 0 ? '' : heroBet} 
                      onChange={(e) => handleHeroBetChange(e.target.value)} 
                      disabled={heroStack === 0}
                      placeholder="0"
                      className={`w-full bg-slate-950 border border-slate-700 rounded px-2 py-2 font-mono transition focus:outline-none 
                         ${heroStack === 0 ? 'opacity-50 cursor-not-allowed text-slate-500' : 'text-white focus:border-red-500'}`}
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Opponents */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2"><Users className="w-4 h-4"/> {t.players}</h3>
            <button onClick={() => setPlayers([...players, {id: Date.now(), bet: 0, totalContributed: 0, active: true}])} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700">+ {t.add_player}</button>
          </div>
          <div className="grid grid-cols-1 gap-2">
             {players.map((p, idx) => (
               <div key={p.id} className={`flex items-center gap-3 bg-slate-800 p-2 rounded-lg border ${p.active ? 'border-slate-700' : 'opacity-50 border-transparent'}`}>
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">{idx+1}</div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                     <button onClick={() => { const n = [...players]; n[idx].active = !n[idx].active; setPlayers(n); }} 
                       className={`text-xs rounded py-1 ${p.active ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                       {p.active ? t.active : t.folded}
                     </button>
                     <div className="flex items-center gap-2 bg-slate-900 rounded px-2">
                        <span className="text-slate-500 text-xs">$</span>
                        <input 
                          type="number" 
                          value={p.bet === 0 ? '' : p.bet} 
                          placeholder="0"
                          onChange={e => handleOpponentBetChange(p.id, e.target.value)} 
                          className="w-full bg-transparent text-white text-sm py-1 font-mono focus:outline-none" 
                        />
                     </div>
                  </div>
                  <button onClick={() => setPlayers(players.filter(x => x.id !== p.id))} className="text-slate-600 hover:text-red-400 px-2">×</button>
               </div>
             ))}
          </div>
        </div>

        {/* Settlement or Calculate */}
        {settlementMode ? (
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-4 bg-indigo-900/20 border-b border-indigo-900/50">
              <h2 className="text-xl font-bold text-center text-indigo-200">{t.settle_title}</h2>
              <div className="text-center text-3xl font-bold mt-2 text-white"><span className="text-sm text-slate-400">$</span> {totalPot}</div>
            </div>
            
            <div className="p-4 space-y-3">
              {potSegments.map((seg, idx) => (
                <div key={idx} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-300 font-bold flex items-center gap-2">
                      {idx === 0 ? <ShieldCheck className="w-4 h-4 text-emerald-400"/> : <Layers className="w-4 h-4 text-blue-400"/>}
                      {idx === 0 ? t.segment_main : `${t.segment_side} #${idx}`}
                    </span>
                    <span className="font-mono text-lg text-white">${seg.amount}</span>
                  </div>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => updateSegmentResult(idx, 'win')}
                        className={`flex-1 py-1 rounded text-xs font-bold transition border ${seg.result === 'win' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}>
                        {t.settle_win}
                     </button>
                     <button 
                        onClick={() => updateSegmentResult(idx, 'split')}
                        className={`flex-1 py-1 rounded text-xs font-bold transition border ${seg.result === 'split' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}>
                        {t.settle_split}
                     </button>
                     <button 
                        onClick={() => updateSegmentResult(idx, 'loss')}
                        className={`flex-1 py-1 rounded text-xs font-bold transition border ${seg.result === 'loss' ? 'bg-red-900/50 border-red-800 text-red-200' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}>
                        {t.settle_loss}
                     </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={confirmSettlement}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-center transition border-t border-emerald-500">
              {t.settle_confirm}
            </button>
          </div>
        ) : (
          <button 
            onClick={calculateEquity}
            disabled={isCalculating}
            className={`w-full font-bold py-4 rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2
              ${strategy === 'maniac' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-900/30' 
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-blue-900/20'}`}>
            {isCalculating ? <RefreshCw className="animate-spin w-5 h-5"/> : (strategy === 'maniac' ? <Skull className="w-5 h-5" /> : <Brain className="w-5 h-5"/>)}
            {isCalculating ? t.calculating : t.calculate}
          </button>
        )}

        {/* Result Display */}
        {result && !settlementMode && (
          <div className={`border rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ${result.isBluff ? 'bg-purple-900/20 border-purple-500/50' : 'bg-slate-900 border-slate-700'}`}>
             <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
                <div>
                   <h2 className={`text-2xl font-bold ${
                     result.isBluff ? 'text-purple-400 animate-pulse' :
                     result.advice.includes('Fold') ? 'text-red-400' : 'text-emerald-400'
                   }`}>{result.advice}</h2>
                   
                   {/* --- 位置 D: 显示牌型分析结果 --- */}
                   {result.handTypeLabel && (
                     <div className="inline-block bg-slate-700 text-blue-200 text-xs px-2 py-0.5 rounded my-1 border border-blue-500/30">
                       <span className="flex items-center gap-1"><Lightbulb className="w-3 h-3"/> {result.handTypeLabel}</span>
                     </div>
                   )}

                   <p className="text-xs text-slate-400 mt-1">{result.reason}</p>
                </div>
                <div className="text-right">
                   <div className="text-3xl font-bold text-white">{result.equity}%</div>
                   <div className="text-xs text-slate-500">{t.equity}</div>
                </div>
             </div>
             
             {result.betSizes && (
               <div>
                 <div className="px-4 pt-2 pb-1 text-xs text-slate-400 flex items-center gap-1">
                   <MousePointerClick className="w-3 h-3" /> {t.betSizing}
                 </div>
                 <div className="p-4 grid grid-cols-3 gap-3 bg-slate-800/30">
                    <button 
                      onClick={() => setHeroBet(result.betSizes.small)}
                      className="flex flex-col items-center p-2 rounded hover:bg-slate-700/50 active:bg-slate-700 transition border border-transparent hover:border-slate-600"
                    >
                      <div className="text-xs text-slate-500 mb-1">{t.bet_size_small}</div>
                      <div className={`font-mono font-bold ${result.betSizes.small === heroStack ? 'text-red-400' : 'text-blue-300'}`}>
                        {result.betSizes.small}
                        {result.betSizes.small === heroStack && <span className="text-[10px] block"> (All-In)</span>}
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setHeroBet(result.betSizes.med)}
                      className="flex flex-col items-center p-2 rounded hover:bg-slate-700/50 active:bg-slate-700 transition border border-transparent hover:border-slate-600 border-x border-slate-700/50"
                    >
                      <div className="text-xs text-slate-500 mb-1">{t.bet_size_med}</div>
                      <div className={`font-mono font-bold ${result.betSizes.med === heroStack ? 'text-red-400' : 'text-blue-300'}`}>
                        {result.betSizes.med}
                        {result.betSizes.med === heroStack && <span className="text-[10px] block"> (All-In)</span>}
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setHeroBet(result.betSizes.large)}
                      className="flex flex-col items-center p-2 rounded hover:bg-slate-700/50 active:bg-slate-700 transition border border-transparent hover:border-slate-600"
                    >
                      <div className="text-xs text-slate-500 mb-1">{strategy === 'maniac' ? t.bet_size_over : t.bet_size_large}</div>
                      <div className={`font-mono font-bold ${strategy === 'maniac' ? 'text-purple-300' : 'text-blue-300'} ${result.betSizes.large === heroStack ? 'text-red-400' : ''}`}>
                        {result.betSizes.large}
                        {result.betSizes.large === heroStack && <span className="text-[10px] block"> (All-In)</span>}
                      </div>
                    </button>
                 </div>
               </div>
             )}
          </div>
        )}

      </div>
      
      <CardSelector />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
           <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-slate-600 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                 <h3 className="font-bold text-lg text-white flex items-center gap-2"><Settings className="w-5 h-5" /> {t.game_settings}</h3>
                 <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <div>
                 <label className="block text-sm text-slate-400 mb-2">{t.deck_count}: <span className="text-white font-mono font-bold text-lg">{deckCount}</span></label>
                 <input 
                   type="range" 
                   min="1" max="8" step="1" 
                   value={deckCount} 
                   onChange={(e) => setDeckCount(Number(e.target.value))}
                   className="w-full accent-blue-500"
                 />
                 <div className="flex justify-between text-xs text-slate-500 mt-1 font-mono">
                   <span>1</span><span>8</span>
                 </div>
                 <p className="text-xs text-slate-500 mt-2 bg-slate-900/50 p-2 rounded border border-slate-700/50 flex gap-2">
                   <Info className="w-4 h-4 shrink-0 mt-0.5" /> {t.deck_info}
                 </p>
              </div>
              
              {/* Buy-in Amount Setting */}
              <div>
                 <label className="block text-sm text-slate-400 mb-2">{t.buy_in_amount}:</label>
                 <div className="flex items-center bg-slate-900 rounded border border-slate-700">
                    <span className="px-3 text-slate-500">$</span>
                    <input 
                      type="number" 
                      value={buyInAmount === 0 ? '' : buyInAmount} 
                      onChange={(e) => handleBuyInChange(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent py-2 text-white font-mono focus:outline-none"
                    />
                 </div>
                 <p className="text-xs text-slate-500 mt-2 bg-slate-900/50 p-2 rounded border border-slate-700/50 flex gap-2">
                   <Info className="w-4 h-4 shrink-0 mt-0.5" /> {t.buy_in_info}
                 </p>
              </div>
           </div>
        </div>
      )}

    </div>
  );
  
  function handleCardClick(type, index) {
    setSelectingFor({ type, index });
  }
}

// ⚠️ 核心修复逻辑：Singleton Root Pattern (单例模式)
// 检查 'root' 容器上是否已经绑定了 React Root
const container = document.getElementById('root');

if (container) {
  // 如果容器上还没有 _reactRoot，创建一个并挂载
  if (!container._reactRoot) {
    container._reactRoot = createRoot(container);
  }
  // 复用已有的 Root 进行渲染
  container._reactRoot.render(<TexasHoldemAdvisor />);
}