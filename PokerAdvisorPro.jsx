import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { RefreshCw, Trophy, Users, Brain, Info, ArrowRight, Flame, Zap, Settings, X, ShieldCheck, Flag, Lightbulb, Grid, MapPin, Calculator, HelpCircle, RotateCcw, CheckSquare, CheckCircle, MousePointerClick } from 'lucide-react';

// 安全获取数据层
const PokerData = window.PokerData || { 
  CONSTANTS: { SUITS: [], RANKS: [], RANK_VALUES: {}, STREETS: [] },
  HAND_ANALYSIS_DEFINITIONS: { zh: {}, en: {} },
  TEXTURE_STRATEGIES: {},
  POSITIONS: {},
  BOARD_TEXTURES: {},
  TEXTURE_EXPLANATION: {},
  PROBABILITIES: { outs_lookup: {} },
  STRATEGY_CONFIG: { preflop: {}, postflop: {} },
  TEXTS: { zh: {}, en: {} }
};
const { CONSTANTS, HAND_ANALYSIS_DEFINITIONS, TEXTURE_STRATEGIES, POSITIONS, BOARD_TEXTURES, TEXTURE_EXPLANATION, PROBABILITIES, STRATEGY_CONFIG, TEXTS } = PokerData;
const { SUITS, RANKS, RANK_VALUES } = CONSTANTS;

/**
 * 德州扑克助手 Pro (v6.2 - UX Polish)
 * 修复：转牌(Turn)选完后不再自动跳到河牌，优化选牌器自动关闭逻辑
 */

// --- 核心算法 ---
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
  
  const uniqueRanks = [...new Set(ranks)].sort((a,b) => b-a);
  let straightHigh = 0;
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    if (uniqueRanks[i] - uniqueRanks[i+4] === 4) { straightHigh = uniqueRanks[i]; break; }
  }
  if (!straightHigh && uniqueRanks.includes(14) && uniqueRanks.includes(2) && uniqueRanks.includes(3) && uniqueRanks.includes(4) && uniqueRanks.includes(5)) straightHigh = 5;

  let isFlush = !!flushSuit;
  let isStraight = straightHigh > 0;

  if (isFlush && isStraight) return 8000000 + straightHigh; 
  if (countValues.includes(4)) {
      const quadRank = Object.keys(counts).find(r => counts[r] === 4);
      return 7000000 + Number(quadRank);
  }
  if (countValues.includes(3) && countValues.includes(2)) {
      const tripRank = Object.keys(counts).find(r => counts[r] === 3);
      return 6000000 + Number(tripRank);
  }
  if (isFlush) return 5000000 + ranks[0]; 
  if (isStraight) return 4000000 + straightHigh;
  if (countValues.includes(3)) {
      const tripRank = Object.keys(counts).find(r => counts[r] === 3);
      return 3000000 + Number(tripRank);
  }
  if (countValues.filter(c => c === 2).length >= 2) {
      const pairs = Object.keys(counts).filter(r => counts[r] === 2).map(Number).sort((a,b)=>b-a);
      return 2000000 + (pairs[0] * 100) + pairs[1];
  }
  if (countValues.includes(2)) {
      const pairRank = Object.keys(counts).find(r => counts[r] === 2);
      return 1000000 + (Number(pairRank) * 100);
  }
  return ranks[0];
};

const analyzeBoardTexture = (communityCards) => {
  const board = communityCards.filter(Boolean);
  if (board.length < 3) return { pattern: null, type: null };

  const suits = {};
  const ranks = [];
  board.forEach(c => {
    suits[c.suit] = (suits[c.suit] || 0) + 1;
    ranks.push(RANK_VALUES[c.rank]);
  });
  
  const maxSuitCount = Math.max(...Object.values(suits));
  const uniqueRanks = [...new Set(ranks)].sort((a,b)=>a-b);
  const isPaired = ranks.length !== uniqueRanks.length;

  let isConnected = false;
  for(let i=0; i<=uniqueRanks.length-3; i++) {
      if (uniqueRanks[i+2] - uniqueRanks[i] <= 4) isConnected = true;
  }

  let patternKey = 'TEX_RAINBOW_DRY';
  let typeKey = 'dry';

  if (maxSuitCount >= 3) { patternKey = 'TEX_MONOTONE'; typeKey = 'wet'; }
  else if (maxSuitCount === 2) { patternKey = 'TEX_TWO_TONE'; typeKey = 'wet'; }
  else if (isPaired) { patternKey = 'TEX_PAIRED'; typeKey = 'wet'; }
  else if (isConnected) { patternKey = 'TEX_CONNECTED'; typeKey = 'wet'; }
  else { patternKey = 'TEX_RAINBOW_DRY'; typeKey = 'dry'; }

  return { pattern: patternKey, type: typeKey };
};

const analyzeHandFeatures = (heroCards, communityCards) => {
  if (!heroCards[0] || !heroCards[1]) return null;
  const h1_rank = RANK_VALUES[heroCards[0].rank];
  const h2_rank = RANK_VALUES[heroCards[1].rank];
  const h1 = Math.max(h1_rank, h2_rank);
  const h2 = Math.min(h1_rank, h2_rank);
  const isPair = h1 === h2;
  const isSuited = heroCards[0].suit === heroCards[1].suit;

  const board = communityCards.filter(Boolean);
  if (board.length === 0) {
      if (isPair) {
          if (h1 >= 12) return "pre_monster_pair"; 
          if (h1 >= 9) return "pre_strong_pair";   
          return "pre_small_pair";                 
      }
      if (h1 >= 13 && h2 >= 12) return "pre_premium_high"; 
      if (isSuited) {
          if (h1 === 14) return "pre_suited_ace";
          if ((h1 - h2 <= 2)) return "pre_suited_connector"; 
          if (h1 >= 10 && h2 >= 10) return "pre_broadway";
      }
      if (h1 >= 10 && h2 >= 10) return "pre_broadway";
      return "pre_trash";
  }

  const allCards = [...heroCards, ...board];
  const isRiver = board.length === 5;
  const score = evaluateHand(allCards);
  const boardRanks = board.map(c => RANK_VALUES[c.rank]).sort((a,b)=>b-a);
  const maxBoard = boardRanks[0];

  if (score >= 8000000) return "made_straight_flush_nuts"; 
  if (score >= 7000000) return "made_quads";
  if (score >= 6000000) return "made_full_house";
  if (score >= 5000000) return "made_flush";
  if (score >= 4000000) return "made_straight";
  if (score >= 3000000) return "monster"; 

  if (!isRiver) {
      const suits = {};
      const ranks = [];
      allCards.forEach(c => {
        suits[c.suit] = (suits[c.suit] || 0) + 1;
        ranks.push(RANK_VALUES[c.rank]);
      });
      
      const fdSuit = Object.keys(suits).find(s => suits[s] === 4);
      let isFlushDraw = !!fdSuit;
      let isNutFD = isFlushDraw && ((heroCards[0].suit === fdSuit && h1_rank === 14) || (heroCards[1].suit === fdSuit && h2_rank === 14));
      
      const uRanks = [...new Set(ranks)].sort((a,b)=>a-b);
      let isStraightDraw = false;
      for(let i=0; i<=uRanks.length-4; i++) {
          if (uRanks[i+3] - uRanks[i] <= 4) isStraightDraw = true;
      }

      if (isFlushDraw && isStraightDraw) return "combo_draw";
      if (isNutFD) return "flush_draw_nut";
      if (isFlushDraw) return "flush_draw";
      if (isStraightDraw) return "straight_draw_oesd";
  }

  if (score >= 2000000) return "top_pair"; 
  if (score >= 1000000) {
      const pairRank = Math.floor((score - 1000000) / 100);
      if (pairRank === maxBoard) return "top_pair";
      if (pairRank > boardRanks[boardRanks.length-1]) return "middle_pair";
      return "bottom_pair";
  }

  return "overcards";
};

// UI 组件
const CardIcon = ({ rank, suit }) => {
  const isRed = suit === 'h' || suit === 'd';
  const suitSymbol = { s: '♠', h: '♥', d: '♦', c: '♣' }[suit];
  return (
    <div className={`bg-white border border-gray-300 rounded-md flex flex-col items-center justify-center select-none shadow-sm w-full h-full ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
      <span className="font-bold text-sm leading-none">{rank}</span>
      <span className="text-base leading-none">{suitSymbol}</span>
    </div>
  );
};

// --- 主程序 ---
function TexasHoldemAdvisor() {
  const [lang, setLang] = useState('zh');
  const [strategy, setStrategy] = useState('conservative'); 
  const [showSettings, setShowSettings] = useState(false);
  const [heroPosition, setHeroPosition] = useState(null); 
  
  const [deckCount, setDeckCount] = useState(1);
  const [buyInAmount, setBuyInAmount] = useState(1000);
  
  const [street, setStreet] = useState(0); 
  const [heroHand, setHeroHand] = useState([null, null]);
  const [communityCards, setCommunityCards] = useState([null, null, null, null, null]);
  
  const [heroStack, setHeroStack] = useState(1000); 
  const [heroBet, setHeroBet] = useState(0);
  const [heroTotalContributed, setHeroTotalContributed] = useState(0); 
  const [mainPot, setMainPot] = useState(0); 
  
  const [players, setPlayers] = useState([
    { id: 1, bet: 0, totalContributed: 0, active: true },
    { id: 2, bet: 0, totalContributed: 0, active: true },
    { id: 3, bet: 0, totalContributed: 0, active: true }
  ]);
  
  const [result, setResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectingFor, setSelectingFor] = useState(null); 
  const [settlementMode, setSettlementMode] = useState(false);
  const [potSegments, setPotSegments] = useState([]);

  const t = TEXTS[lang] || TEXTS['zh'];
  const currentOpponentBets = players.reduce((sum, p) => sum + p.bet, 0); 
  const totalPot = mainPot + currentOpponentBets + heroBet;
  const maxBet = Math.max(heroBet, ...players.map(p => p.bet));
  const callAmount = maxBet - heroBet;
  const currentStack = heroStack - heroBet; 
  const spr = currentStack > 0 && totalPot > 0 ? (currentStack / totalPot).toFixed(2) : '∞';
  
  // Call Action Logic
  const isCallAction = maxBet > heroBet;
  const safeCallAmount = Math.min(maxBet - heroBet, heroStack);
  const isCallAllIn = isCallAction && (maxBet >= heroStack);

  const calculateEquity = () => {
    if (heroHand.some(c => c === null)) return;
    setIsCalculating(true);
    setResult(null);

    setTimeout(() => {
      // 1. 蒙特卡洛模拟
      const SIMULATIONS = 1500;
      let wins = 0, ties = 0;
      const activeOpponents = players.filter(p => p.active).length;
      let fullDeck = [];
      for (let d = 0; d < deckCount; d++) for (let s of SUITS) for (let r of RANKS) fullDeck.push({ rank: r, suit: s });
      const knownCards = [...heroHand, ...communityCards].filter(Boolean);
      for (let i = 0; i < SIMULATIONS; i++) {
        let deck = [...fullDeck];
        knownCards.forEach(kc => { const idx = deck.findIndex(c => c.rank === kc.rank && c.suit === kc.suit); if (idx !== -1) deck.splice(idx, 1); });
        for (let j = deck.length - 1; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1)); [deck[j], deck[k]] = [deck[k], deck[j]]; }
        const runout = [...communityCards.filter(Boolean)];
        while (runout.length < 5) runout.push(deck.pop());
        const oppHands = [];
        for (let p = 0; p < activeOpponents; p++) oppHands.push([deck.pop(), deck.pop()]);
        const heroScore = evaluateHand([...heroHand, ...runout]);
        let heroWins = true; let isTie = false;
        for (let oh of oppHands) { const s = evaluateHand([...oh, ...runout]); if (s > heroScore) { heroWins = false; break; } if (s === heroScore) isTie = true; }
        if (heroWins && !isTie) wins++; if (heroWins && isTie) ties++;
      }
      const equity = ((wins + (ties/2)) / SIMULATIONS) * 100;
      
      // 2. 特征与纹理分析
      const potOdds = totalPot > 0 ? (callAmount / (totalPot + callAmount)) * 100 : 0;
      const analysisKey = analyzeHandFeatures(heroHand, communityCards);
      const textureRes = analyzeBoardTexture(communityCards); 
      const textureKey = textureRes.pattern;
      const textureType = textureRes.type;

      // 3. 数据获取
      const analysisData = analysisKey ? HAND_ANALYSIS_DEFINITIONS[lang][analysisKey] : null;
      const textureStrategy = textureKey ? TEXTURE_STRATEGIES[textureKey] : null;
      const posData = heroPosition ? POSITIONS[heroPosition] : null;
      
      // 4. 生成建议
      let adviceKey = 'advice_fold';
      let finalReason = `Pot Odds: ${potOdds.toFixed(1)}%`;

      if (equity > 70) adviceKey = 'advice_raise';
      else if (equity > potOdds * 1.1) adviceKey = 'advice_call';
      else adviceKey = 'advice_fold';

      if (strategy === 'maniac' && equity > 20) adviceKey = 'advice_raise_bluff';

      // 位置修正
      if (posData) {
         finalReason += `\n[${posData.label}]: ${posData.action_plan}`;
         if (posData.range_modifier === 'Tight' && adviceKey === 'advice_call' && equity < 45) adviceKey = 'advice_fold';
         if (posData.range_modifier === 'Loose' && adviceKey === 'advice_fold' && equity > 25 && callAmount === 0) adviceKey = 'advice_check'; 
      }

      let finalAdvice = t[adviceKey] || "Advice N/A";

      // 听牌数学
      let drawStats = null;
      if (PROBABILITIES && PROBABILITIES.outs_lookup && PROBABILITIES.outs_lookup[analysisKey]) {
         const d = PROBABILITIES.outs_lookup[analysisKey];
         drawStats = {
            label: d.label,
            outs: d.outs,
            equityFlop: d.equityFlop,
            advice: d.advice
         };
         finalReason += `\n🎲 ${d.label}: ${d.outs} Outs (~${d.outs * 4}% Equity)`;
      }

      // 纹理建议
      if (textureStrategy && callAmount === 0 && !analysisKey?.startsWith('made_')) {
          finalReason += `\n[${textureStrategy.name}]: ${textureStrategy.desc}`;
          if (textureType === 'wet') finalReason += " (Wet Board)";
      }

      // 手牌库覆盖
      if (analysisData) {
         if (analysisKey.startsWith('made_') || analysisKey.includes('monster') || analysisKey === 'pre_monster_pair') {
             finalAdvice = analysisData.advice;
         }
         if (!drawStats) finalReason = `${analysisData.reason}\n` + finalReason;
      }

      // 5. 动态下注尺度
      let betSizes = null;
      if (adviceKey.includes('raise') || adviceKey.includes('allin')) {
         const p = totalPot, s = heroStack;
         const cap = (val) => Math.min(val, s);
         const cfg = STRATEGY_CONFIG?.postflop || { cbet_dry: 0.33, cbet_wet: 0.66, value_bet: 0.75 };
         
         const cbetRatio = textureType === 'wet' ? cfg.cbet_wet : cfg.cbet_dry;
         betSizes = { 
           smart: cap(Math.round(p * cbetRatio)), 
           value: cap(Math.round(p * cfg.value_bet)),
           pot: cap(Math.round(p * 1.0)) 
         };
      }

      setResult({
        equity: equity.toFixed(1),
        advice: finalAdvice,
        reason: finalReason,
        handTypeLabel: analysisData ? analysisData.label : null,
        textureLabel: textureStrategy ? textureStrategy.name : null,
        textureType,
        drawStats,
        betSizes,
        isBluff: adviceKey.includes('bluff')
      });
      setIsCalculating(false);
    }, 50);
  };

  const handleHeroBetChange = (val) => setHeroBet(val === '' ? 0 : Math.min(Number(val), heroStack));
  const handleStackChange = (val) => setHeroStack(val === '' ? 0 : Math.max(0, Number(val)));
  const handleOpponentBetChange = (id, val) => setPlayers(players.map(p => p.id === id ? { ...p, bet: val === '' ? 0 : Number(val) } : p));
  const handleBuyInChange = (val) => setBuyInAmount(val === '' ? 0 : Math.max(0, Number(val)));

  const handleNextStreet = () => {
    setMainPot(totalPot);
    setHeroTotalContributed(p => p + heroBet);
    setPlayers(players.map(p => ({ ...p, totalContributed: (p.totalContributed || 0) + p.bet, bet: 0 })));
    setHeroStack(currentStack);
    setHeroBet(0);
    if (street < 3) { setStreet(street + 1); setResult(null); } else { enterSettlement(); }
  };

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
      let potSize = 0; let contributors = 0; let heroInvolved = false;
      if (heroTotal > prevCap) { potSize += Math.min(amount, heroTotal - prevCap); heroInvolved = true; contributors++; }
      opps.forEach(p => { if (p.finalTotal > prevCap) { potSize += Math.min(amount, p.finalTotal - prevCap); if (p.active) contributors++; } });
      if (potSize > 0 && heroInvolved) segments.push({ id: cap, amount: potSize, contestants: contributors, result: 'loss' });
      prevCap = cap;
    });
    setPotSegments(segments); setSettlementMode(true);
  };

  const confirmSettlement = () => {
    let winnings = 0;
    potSegments.forEach(seg => { if (seg.result === 'win') winnings += seg.amount; else if (seg.result === 'split') winnings += Math.floor(seg.amount / seg.contestants); });
    setHeroStack(Math.max(0, (heroStack - heroBet) + winnings));
    setHeroBet(0); setStreet(0); setMainPot(0); setHeroTotalContributed(0);
    setPlayers(players.map(p => ({ ...p, bet: 0, totalContributed: 0, active: true })));
    setHeroHand([null, null]); setCommunityCards([null, null, null, null, null]);
    setResult(null); setSettlementMode(false); setPotSegments([]);
  };

  const updateSegmentResult = (idx, res) => {
    const newSegments = [...potSegments]; newSegments[idx].result = res; setPotSegments(newSegments);
  };

  const unavailableCards = useMemo(() => [...heroHand, ...communityCards].filter(Boolean), [heroHand, communityCards]);
  const handleCardClick = (type, index) => setSelectingFor({ type, index });

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

  const CardSelector = () => {
    if (!selectingFor) return null;
    let title = t.selectCard;
    if (selectingFor.type === 'hero') title = `${t.selecting_hero} ${selectingFor.index + 1}/2`;
    if (selectingFor.type === 'board') title = selectingFor.index < 3 ? `${t.selecting_flop} ${selectingFor.index + 1}/3` : selectingFor.index === 3 ? t.selecting_turn : t.selecting_river;
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectingFor(null)}>
        <div className="bg-slate-800 p-4 rounded-xl max-w-lg w-full overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
           <div className="flex justify-between mb-4 text-white font-bold"><span>{title}</span><X onClick={() => setSelectingFor(null)}/></div>
           <div className="grid grid-cols-4 gap-2">
             {SUITS.map(suit => (
               <div key={suit} className="flex flex-col gap-2">
                 {RANKS.map(rank => {
                   const takenCount = unavailableCards.filter(c => c.rank === rank && c.suit === suit).length;
                   return (<button key={rank+suit} disabled={takenCount >= deckCount} onClick={() => {
                       const card = { rank, suit };
                       let nextState = null;
                       
                       if (selectingFor.type === 'hero') {
                         const h = [...heroHand]; h[selectingFor.index] = card; setHeroHand(h);
                         if (selectingFor.index === 0) nextState = {type:'hero', index:1};
                       } else {
                         const b = [...communityCards]; b[selectingFor.index] = card; setCommunityCards(b);
                         // 修复逻辑：只有翻牌圈(Index < 2)才自动跳转，Turn(3)和River(4)选完即停
                         if (selectingFor.index < 2) nextState = {type:'board', index: selectingFor.index+1};
                       }
                       
                       setSelectingFor(nextState);
                     }} className={`p-1 rounded flex justify-center hover:bg-slate-700 ${takenCount >= deckCount ? 'opacity-20 cursor-not-allowed' : ''}`}><CardIcon rank={rank} suit={suit} /></button>);
                 })}
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-10">
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30 shadow-md flex justify-between items-center">
         <div className="flex items-center gap-2 text-emerald-500 font-bold"><Trophy className="w-5 h-5"/> {t.appTitle} <span className="text-[10px] bg-slate-800 px-1 rounded text-slate-500">v6.2</span></div>
         <div className="flex gap-2">
            <button onClick={() => setStrategy(s => s==='conservative'?'aggressive':s==='aggressive'?'maniac':'conservative')} className={`px-3 py-1.5 rounded-full border flex gap-1 items-center text-xs ${getStrategyStyle()}`}>{strategy==='maniac'&&<Flame className="w-3 h-3"/>}{getStrategyLabel()}</button>
            <button onClick={() => setShowSettings(true)} className="p-2 bg-slate-800 rounded-full border border-slate-700"><Settings className="w-4 h-4"/></button>
            <button onClick={() => setLang(l => l==='zh'?'en':'zh')} className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-xs">{lang==='zh'?'EN':'中'}</button>
         </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-6">
         {/* Pot Info */}
         <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 grid grid-cols-2 gap-4">
            <div>
               <div className="text-xs text-slate-500">{t.mainPot}</div>
               <div className="text-2xl font-mono font-bold text-slate-200">{mainPot} <span className="text-sm text-slate-600">+ {currentOpponentBets + heroBet}</span></div>
               <div className="text-emerald-500 text-sm font-bold">= {totalPot}</div>
            </div>
            <div className="text-right">
               <div className="text-xs text-slate-500 mb-1 flex justify-end gap-1">{t.spr} <Info className="w-3 h-3"/></div>
               <div className={`text-2xl font-mono font-bold ${Number(spr)<3?'text-red-400':'text-blue-400'}`}>{spr}</div>
               <div className="text-slate-500 text-xs mt-1">{t.stackAfterBet}: {currentStack}</div>
            </div>
         </div>

         {/* Board */}
         <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
               <span className="text-xs font-bold text-slate-400 uppercase">{t[`street_${['pre','flop','turn','river'][street]}`]}</span>
               {street < 3 ? <button onClick={handleNextStreet} className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-emerald-900/50">{t.nextStreet} <ArrowRight className="w-3 h-3" /></button> : !settlementMode && <button onClick={enterSettlement} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full">{t.finishHand}</button>}
            </div>
            <div className="flex gap-2 h-20 sm:h-24">
               {[0,1,2,3,4].map(i => (
                 <div key={i} onClick={() => street >= (i<3?1:i===3?2:3) && handleCardClick('board', i)} className={`flex-1 rounded-lg border-2 flex items-center justify-center cursor-pointer relative ${street >= (i<3?1:i===3?2:3) ? communityCards[i] ? 'bg-slate-800 border-slate-600' : 'bg-slate-800/50 border-slate-700 border-dashed' : 'bg-slate-900/50 border-slate-800 opacity-30'}`}>
                    {communityCards[i] ? <CardIcon rank={communityCards[i].rank} suit={communityCards[i].suit} /> : null}
                 </div>
               ))}
            </div>
         </div>

         {/* Hero Hand & Position Selector (Combined) */}
         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 font-bold flex gap-1"><MapPin className="w-3 h-3"/> My Position</span>
              <div className="flex bg-slate-900 rounded p-1">
                {['EP','MP','LP','BLINDS'].map(pos => (
                  <button key={pos} onClick={() => setHeroPosition(pos)} className={`px-3 py-1 text-[10px] rounded ${heroPosition===pos ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{pos}</button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
               {heroHand.map((c, i) => (
                  <div key={i} onClick={() => setSelectingFor({type:'hero', index:i})} className={`w-16 h-24 rounded-lg border-2 flex items-center justify-center cursor-pointer ${c ? 'bg-white' : 'bg-slate-700 border-slate-500'}`}>
                     {c ? <CardIcon rank={c.rank} suit={c.suit}/> : <span className="text-2xl text-slate-500">+</span>}
                  </div>
               ))}
               <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400"><span>{t.heroStack}</span><span>{heroStack}</span></div>
                  <div className="flex gap-2">
                     <button onClick={() => setHeroBet(0)} className="flex-1 bg-slate-600 hover:bg-slate-500 py-2 rounded text-xs text-slate-200">{t.btn_fold}</button>
                     <button onClick={() => setHeroBet(safeCallAmount)} className={`flex-1 py-2 rounded text-xs flex items-center justify-center gap-1 text-white ${isCallAllIn ? 'bg-red-800 animate-pulse' : 'bg-blue-600 hover:bg-blue-500'}`}>
                        {isCallAction ? (isCallAllIn ? 'All-In' : `Call ${safeCallAmount}`) : 'Check'}
                     </button>
                     <button onClick={() => setHeroBet(heroStack)} className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded text-xs text-white">All-In</button>
                  </div>
                  <input type="number" value={heroBet===0?'':heroBet} onChange={e => handleHeroBetChange(e.target.value)} placeholder="Bet Amount" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-right font-mono"/>
               </div>
            </div>
         </div>

         <div className="space-y-2">
            <div className="flex justify-between items-center px-1"><span className="text-xs font-bold text-slate-400">Opponents</span><button onClick={() => setPlayers([...players, {id: Date.now(), bet: 0, totalContributed: 0, active: true}])} className="text-[10px] bg-slate-800 border border-slate-600 px-2 py-0.5 rounded text-slate-300">+ {t.add_player}</button></div>
            {players.map((p, idx) => (
               <div key={p.id} className={`flex items-center gap-3 bg-slate-800 p-2 rounded-lg border ${p.active ? 'border-slate-700' : 'opacity-50 border-transparent'}`}>
                  <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-400">{idx+1}</div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                     <button onClick={() => { const n = [...players]; n[idx].active = !n[idx].active; setPlayers(n); }} className={`text-xs rounded py-1 ${p.active ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>{p.active ? t.active : t.folded}</button>
                     <div className="flex items-center bg-slate-900 rounded px-2 border border-slate-700"><span className="text-xs text-slate-500">$</span><input type="number" value={p.bet===0?'':p.bet} placeholder="0" onChange={e => handleOpponentBetChange(p.id, e.target.value)} className="w-full bg-transparent text-white text-sm py-1 font-mono focus:outline-none" /></div>
                  </div>
                  <button onClick={() => setPlayers(players.filter(x => x.id !== p.id))} className="text-slate-600 hover:text-red-400 px-2">×</button>
               </div>
            ))}
         </div>

         {!settlementMode ? (
            <button onClick={calculateEquity} disabled={isCalculating} className="w-full font-bold py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg flex justify-center items-center gap-2 hover:brightness-110 active:scale-95 transition">
              {isCalculating ? <RefreshCw className="animate-spin w-5 h-5"/> : <Brain className="w-5 h-5"/>} {t.calculate}
            </button>
         ) : (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
              <h2 className="text-center text-xl font-bold text-indigo-200">{t.settle_title}</h2>
              {potSegments.map((seg, idx) => (
               <div key={idx} className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center">
                 <span className="text-sm font-bold text-slate-300 flex gap-2 items-center"><ShieldCheck className="w-4 h-4"/> {idx===0?t.segment_main:`${t.segment_side} ${idx}`} (${seg.amount})</span>
                 <div className="flex gap-1">
                   <button onClick={() => updateSegmentResult(idx, 'win')} className={`px-2 py-1 text-xs rounded border ${seg.result==='win'?'bg-emerald-600 text-white border-emerald-500':'bg-slate-700 text-slate-400 border-slate-600'}`}>{t.settle_win}</button>
                   <button onClick={() => updateSegmentResult(idx, 'split')} className={`px-2 py-1 text-xs rounded border ${seg.result==='split'?'bg-blue-600 text-white border-blue-500':'bg-slate-700 text-slate-400 border-slate-600'}`}>{t.settle_split}</button>
                   <button onClick={() => updateSegmentResult(idx, 'loss')} className={`px-2 py-1 text-xs rounded border ${seg.result==='loss'?'bg-red-900/50 text-red-200 border-red-800':'bg-slate-700 text-slate-400 border-slate-600'}`}>{t.settle_loss}</button>
                 </div>
               </div>
             ))}
              <button onClick={confirmSettlement} className="w-full bg-emerald-600 py-3 rounded text-white font-bold">{t.settle_confirm}</button>
            </div>
         )}

         {result && !settlementMode && (
          <div className={`border rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ${result.isBluff ? 'bg-purple-900/20 border-purple-500/50' : 'bg-slate-900 border-slate-700'}`}>
             <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
                <div>
                   <h2 className={`text-2xl font-bold ${result.isBluff ? 'text-purple-400 animate-pulse' : result.advice?.includes('Fold') ? 'text-red-400' : 'text-emerald-400'}`}>{result.advice}</h2>
                   <div className="mt-1 flex flex-wrap gap-1">
                      {result.handTypeLabel && <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-blue-200 border border-blue-500/30 flex items-center gap-1"><Lightbulb className="w-3 h-3"/> {result.handTypeLabel}</span>}
                      {result.textureLabel && (
                        <span className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 ${result.textureType==='wet' ? 'bg-amber-900/30 text-amber-200 border-amber-600/50' : 'bg-slate-700 text-indigo-200 border-indigo-500/30'}`}>
                           <Grid className="w-3 h-3"/> {result.textureLabel} {result.textureType==='wet'?'(Wet)':'(Dry)'}
                        </span>
                      )}
                      {heroPosition && <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300 border border-slate-600 flex items-center gap-1"><MapPin className="w-3 h-3"/> {heroPosition}</span>}
                   </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{result.equity}%</div>
                  <div className="text-xs text-slate-500">{t.equity}</div>
                </div>
             </div>
             
             <div className="p-4 space-y-3">
               <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed font-mono">{result.reason}</p>
               
               {result.drawStats && (
                 <div className="bg-slate-800 p-2 rounded border border-slate-700 flex items-center gap-3">
                    <div className="bg-indigo-900/50 p-2 rounded text-indigo-300"><Calculator className="w-5 h-5"/></div>
                    <div>
                       <div className="text-sm font-bold text-indigo-200">{result.drawStats.label}</div>
                       <div className="text-xs text-slate-400">Outs: <span className="text-white font-bold">{result.drawStats.outs}</span> | Approx Equity: <span className="text-white font-bold">~{result.drawStats.outs * (street===1?4:2)}%</span></div>
                    </div>
                 </div>
               )}
               
               {result.betSizes && (
                 <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800/50">
                    <button onClick={() => setHeroBet(result.betSizes.smart)} className="flex flex-col items-center p-2 rounded bg-emerald-900/20 border border-emerald-500/30 hover:bg-emerald-900/40 transition">
                      <div className="text-[10px] text-emerald-400 mb-1 uppercase tracking-wider flex items-center gap-1"><Zap className="w-3 h-3"/> Smart</div>
                      <div className="font-mono font-bold text-emerald-300">{result.betSizes.smart}</div>
                    </button>
                    <button onClick={() => setHeroBet(result.betSizes.value)} className="flex flex-col items-center p-2 rounded hover:bg-slate-800 border border-transparent hover:border-slate-700">
                      <div className="text-[10px] text-slate-500 mb-1">Value</div>
                      <div className="font-mono font-bold text-blue-300">{result.betSizes.value}</div>
                    </button>
                    <button onClick={() => setHeroBet(result.betSizes.pot)} className="flex flex-col items-center p-2 rounded hover:bg-slate-800 border border-transparent hover:border-slate-700">
                      <div className="text-[10px] text-slate-500 mb-1">Pot</div>
                      <div className="font-mono font-bold text-blue-300">{result.betSizes.pot}</div>
                    </button>
                 </div>
               )}
             </div>
          </div>
        )}
      </div>

      <CardSelector />
      {showSettings && (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between mb-4"><h3 className="font-bold text-white flex items-center gap-2"><Settings className="w-4 h-4"/> {t.game_settings}</h3><button onClick={() => setShowSettings(false)}><X/></button></div>
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm text-slate-400 mb-2">{t.deck_count}: <span className="text-white font-mono">{deckCount}</span></label>
                     <input type="range" min="1" max="8" value={deckCount} onChange={e => setDeckCount(Number(e.target.value))} className="w-full accent-blue-500"/>
                     <div className="flex justify-between text-xs text-slate-600 font-mono"><span>1</span><span>8</span></div>
                  </div>
                  <div>
                     <label className="block text-sm text-slate-400 mb-2">{t.buy_in_amount}</label>
                     <div className="flex items-center bg-slate-900 rounded border border-slate-700"><span className="px-3 text-slate-500">$</span><input type="number" value={buyInAmount} onChange={e => setBuyInAmount(Number(e.target.value))} className="w-full bg-transparent py-2 text-white font-mono focus:outline-none"/></div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded text-xs text-slate-500 border border-slate-700">
                     <p>GTO Engine v6.2 Active</p>
                     <p className="mt-1 text-emerald-500">• Smart Card Selector</p>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  if (!container._reactRoot) container._reactRoot = createRoot(container);
  container._reactRoot.render(<TexasHoldemAdvisor />);
}