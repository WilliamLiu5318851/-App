// 1. 标准 ESM 导入 (对应 index.html 中的 importmap)
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { RefreshCw, Trophy, Users, Brain, Info, ArrowRight, Layers, HandMetal, Flame, Skull, Zap, RotateCcw, Settings, X, ShieldCheck, MousePointerClick, Flag, Lightbulb, CheckSquare, CheckCircle } from 'lucide-react';

// 2. 从 PokerData.js 安全获取数据
const PokerData = window.PokerData || { 
  CONSTANTS: { SUITS: [], RANKS: [], RANK_VALUES: {}, STREETS: [] },
  HAND_ANALYSIS_DEFINITIONS: { zh: {}, en: {} },
  TEXTS: { zh: {}, en: {} }
};
const { CONSTANTS, HAND_ANALYSIS_DEFINITIONS, TEXTS } = PokerData;
const { SUITS, RANKS, RANK_VALUES } = CONSTANTS;

/**
 * 德州扑克助手 Pro (ESM Version)
 * 包含：一键Call、Full House修复、手机端UI优化
 */

// --- 核心算法 ---

// 牌力评分引擎
const evaluateHand = (cards) => {
  if (!cards || cards.length < 5) return 0;
  // 简单排序
  const sorted = [...cards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);
  const ranks = sorted.map(c => RANK_VALUES[c.rank]);
  const suits = sorted.map(c => c.suit);
  
  // 统计
  const counts = {};
  ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
  const countValues = Object.values(counts);
  
  // 同花
  const suitCounts = {};
  suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
  let flushSuit = Object.keys(suitCounts).find(s => suitCounts[s] >= 5);
  
  // 顺子
  const uniqueRanks = [...new Set(ranks)].sort((a,b) => b-a);
  let straightHigh = 0;
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    if (uniqueRanks[i] - uniqueRanks[i+4] === 4) { straightHigh = uniqueRanks[i]; break; }
  }
  // A-2-3-4-5
  if (!straightHigh && uniqueRanks.includes(14) && uniqueRanks.includes(2) && uniqueRanks.includes(3) && uniqueRanks.includes(4) && uniqueRanks.includes(5)) straightHigh = 5;

  let isFlush = !!flushSuit;
  let isStraight = straightHigh > 0;

  // 判定
  if (isFlush && isStraight) return 8000000 + straightHigh; // 同花顺
  if (countValues.includes(4)) return 7000000; // 四条
  if (countValues.includes(3) && countValues.includes(2)) return 6000000; // 葫芦
  if (isFlush) return 5000000; // 同花
  if (isStraight) return 4000000 + straightHigh; // 顺子
  if (countValues.includes(3)) return 3000000; // 三条
  if (countValues.filter(c => c === 2).length >= 2) return 2000000; // 两对
  if (countValues.includes(2)) return 1000000; // 一对
  return ranks[0]; // 高牌
};

// 手牌特征分析器
const analyzeHandFeatures = (heroCards, communityCards) => {
  if (!heroCards[0] || !heroCards[1]) return null;
  
  const h1_rank = RANK_VALUES[heroCards[0].rank];
  const h2_rank = RANK_VALUES[heroCards[1].rank];
  const h1 = Math.max(h1_rank, h2_rank);
  const h2 = Math.min(h1_rank, h2_rank);
  const isPair = h1 === h2;
  const isSuited = heroCards[0].suit === heroCards[1].suit;

  // 1. 翻牌前 (Pre-flop)
  const board = communityCards.filter(Boolean);
  if (board.length === 0) {
      if (isPair) {
          if (h1 >= 12) return "pre_monster_pair"; // QQ+
          if (h1 >= 9) return "pre_strong_pair";   // 99-JJ
          return "pre_small_pair";                 // 22-88
      }
      if (h1 >= 13 && h2 >= 12) return "pre_premium_high"; // AK/AQ
      if (isSuited) {
          if (h1 === 14) return "pre_suited_ace";
          if (h1 - h2 === 1 && h1 <= 11) return "pre_suited_connector";
          if (h1 >= 10 && h2 >= 10) return "pre_broadway";
      }
      if (h1 >= 10 && h2 >= 10) return "pre_broadway";
      return "pre_trash";
  }

  // 2. 翻牌后 (Post-flop)
  const allCards = [...heroCards, ...board];
  const isRiver = board.length === 5;
  
  // 利用 evaluateHand 获取大牌型
  const score = evaluateHand(allCards);
  
  // 优先级 1: 成牌 (Made Hands)
  if (score >= 8000000) return "made_straight_flush";
  if (score >= 7000000) return "made_quads";
  if (score >= 6000000) return "made_full_house"; 
  if (score >= 5000000) return "made_flush";
  if (score >= 4000000) return "made_straight";
  if (score >= 3000000) return "monster"; // 三条

  // 优先级 2: 听牌 (仅当不是河牌时)
  if (!isRiver) {
      // 简易听牌检测
      const suits = {};
      const ranks = [];
      allCards.forEach(c => {
        suits[c.suit] = (suits[c.suit] || 0) + 1;
        ranks.push(RANK_VALUES[c.rank]);
      });
      
      const fdSuit = Object.keys(suits).find(s => suits[s] === 4);
      let isFlushDraw = !!fdSuit;
      let isNutFD = isFlushDraw && ((heroCards[0].suit === fdSuit && h1_rank === 14) || (heroCards[1].suit === fdSuit && h2_rank === 14));
      
      // 顺子听牌
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

  // 优先级 3: 对子 (Pairs)
  const boardRanks = board.map(c => RANK_VALUES[c.rank]).sort((a,b)=>b-a);
  const maxBoard = boardRanks[0];
  
  if (score >= 2000000) return "top_pair"; // 两对算强牌
  if (score >= 1000000) {
      // 只有一对，判断是不是顶对
      const pairRank = Math.floor((score - 1000000) / 100);
      if (pairRank > maxBoard) return "pocket_pair_below"; // 实际上是超对，暂且这样归类，可以优化
      if (pairRank === maxBoard) return "top_pair";
      if (pairRank > boardRanks[boardRanks.length-1]) return "middle_pair";
      return "bottom_pair";
  }

  return "overcards"; // 默认
};

// UI 组件: 扑克牌图标
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
  
  // Game Config
  const [deckCount, setDeckCount] = useState(1);
  const [buyInAmount, setBuyInAmount] = useState(1000);
  
  // Game State
  const [street, setStreet] = useState(0); 
  const [heroHand, setHeroHand] = useState([null, null]);
  const [communityCards, setCommunityCards] = useState([null, null, null, null, null]);
  
  // Chips
  const [heroStack, setHeroStack] = useState(1000); 
  const [heroBet, setHeroBet] = useState(0);
  const [heroTotalContributed, setHeroTotalContributed] = useState(0); 
  const [mainPot, setMainPot] = useState(0); 
  
  const [players, setPlayers] = useState([
    { id: 1, bet: 0, active: true },
    { id: 2, bet: 0, active: true },
    { id: 3, bet: 0, active: true }
  ]);
  
  const [result, setResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectingFor, setSelectingFor] = useState(null); 
  const [settlementMode, setSettlementMode] = useState(false);
  const [potSegments, setPotSegments] = useState([]);

  const t = TEXTS[lang] || TEXTS['zh'];

  // Derived
  const currentOpponentBets = players.reduce((sum, p) => sum + p.bet, 0); 
  const totalPot = mainPot + currentOpponentBets + heroBet;
  const maxBet = Math.max(heroBet, ...players.map(p => p.bet));
  const callAmount = maxBet - heroBet;
  const currentStack = heroStack - heroBet; 
  const spr = currentStack > 0 && totalPot > 0 ? (currentStack / totalPot).toFixed(2) : '∞';

  // --- Call Button Logic (一键 Call) ---
  const handleCall = () => {
    const maxOppBet = Math.max(0, ...players.map(p => p.bet));
    const safeAmount = Math.min(maxOppBet, heroStack);
    setHeroBet(safeAmount);
  };
  const isCallAction = maxBet > heroBet;
  const isCallAllIn = isCallAction && (maxBet >= heroStack);

  // --- Core Calculation ---
  const calculateEquity = () => {
    if (heroHand.some(c => c === null)) return;
    setIsCalculating(true);
    setResult(null);

    setTimeout(() => {
      const SIMULATIONS = 2000;
      let wins = 0, ties = 0;
      const activeOpponents = players.filter(p => p.active).length;
      
      let fullDeck = [];
      for (let d = 0; d < deckCount; d++) {
        for (let s of SUITS) for (let r of RANKS) fullDeck.push({ rank: r, suit: s });
      }
      
      const knownCards = [...heroHand, ...communityCards].filter(Boolean);
      
      for (let i = 0; i < SIMULATIONS; i++) {
        let deck = [...fullDeck];
        knownCards.forEach(kc => {
           const idx = deck.findIndex(c => c.rank === kc.rank && c.suit === kc.suit);
           if (idx !== -1) deck.splice(idx, 1);
        });
        
        for (let j = deck.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [deck[j], deck[k]] = [deck[k], deck[j]];
        }
        
        const runout = [...communityCards.filter(Boolean)];
        while (runout.length < 5) runout.push(deck.pop());
        
        const oppHands = [];
        for (let p = 0; p < activeOpponents; p++) oppHands.push([deck.pop(), deck.pop()]);
        
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
      
      // 生成建议
      const potOdds = totalPot > 0 ? (callAmount / (totalPot + callAmount)) * 100 : 0;
      const analysisKey = analyzeHandFeatures(heroHand, communityCards);
      const analysisData = analysisKey ? HAND_ANALYSIS_DEFINITIONS[lang][analysisKey] : null;
      
      let adviceKey = 'advice_fold';
      let reasonKey = ''; 
      
      // 简单策略逻辑
      if (equity > 70) adviceKey = 'advice_raise';
      else if (equity > potOdds * 1.2) adviceKey = 'advice_call';
      else adviceKey = 'advice_fold';

      // 调整策略模式
      if (strategy === 'maniac' && equity > 20) adviceKey = 'advice_raise_bluff';

      let finalAdvice = t[adviceKey];
      let finalReason = `Pot Odds: ${potOdds.toFixed(1)}%`;

      if (analysisData) {
         finalReason = analysisData.reason;
         // 强力牌覆盖建议
         if (analysisKey.startsWith('made_') || analysisKey === 'monster' || analysisKey === 'pre_monster_pair') {
             finalAdvice = analysisData.advice;
         }
      }

      // Bet Sizes
      let betSizes = null;
      if (adviceKey.includes('raise') || adviceKey.includes('allin')) {
         const p = totalPot, s = heroStack;
         const cap = (val) => Math.min(val, s);
         betSizes = { small: cap(Math.round(p*0.33)), med: cap(Math.round(p*0.66)), large: cap(Math.round(p*1.0)) };
      }

      setResult({
        equity: equity.toFixed(1),
        advice: finalAdvice,
        reason: finalReason,
        handTypeLabel: analysisData ? analysisData.label : null,
        betSizes,
        isBluff: adviceKey.includes('bluff')
      });
      setIsCalculating(false);
    }, 50);
  };

  // --- Handlers ---
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

  // Get Strategy UI
  const getStrategyStyle = () => {
    switch(strategy) {
      case 'maniac': return 'bg-purple-900/50 text-purple-400 border-purple-800';
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
                       if (selectingFor.type === 'hero') {
                         const h = [...heroHand]; h[selectingFor.index] = card; setHeroHand(h);
                         setSelectingFor(selectingFor.index === 0 ? {type:'hero', index:1} : null);
                       } else {
                         const b = [...communityCards]; b[selectingFor.index] = card; setCommunityCards(b);
                         setSelectingFor(selectingFor.index < 4 ? {type:'board', index: selectingFor.index+1} : null);
                       }
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
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30 shadow-md flex justify-between items-center">
         <div className="flex items-center gap-2 text-emerald-500 font-bold"><Trophy className="w-5 h-5"/> {t.appTitle}</div>
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
             {street < 3 ? (<button onClick={handleNextStreet} className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-emerald-900/50">{t.nextStreet} <ArrowRight className="w-3 h-3" /></button>) : (!settlementMode && <button onClick={enterSettlement} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full">{t.finishHand}</button>)}
          </div>
          <div className="flex gap-2 h-20 sm:h-24">
             {[0,1,2,3,4].map(i => (
               <div key={i} onClick={() => street >= (i<3?1:i===3?2:3) && handleCardClick('board', i)} className={`flex-1 rounded-lg border-2 flex items-center justify-center cursor-pointer relative ${street >= (i<3?1:i===3?2:3) ? 'bg-slate-800 border-slate-600' : 'bg-slate-900/50 border-slate-800 opacity-30'}`}>
                  {communityCards[i] ? <CardIcon rank={communityCards[i].rank} suit={communityCards[i].suit} /> : <span className="text-slate-700 text-xs">{i<3?'Flop':i===3?'Turn':'River'}</span>}
               </div>
             ))}
          </div>
        </div>

         {/* Hero & Actions */}
         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div className="flex gap-4 mb-4">
               {heroHand.map((c, i) => (
                  <div key={i} onClick={() => setSelectingFor({type:'hero', index:i})} className={`w-16 h-24 rounded-lg border-2 flex items-center justify-center cursor-pointer ${c ? 'bg-white' : 'bg-slate-700 border-slate-500'}`}>
                     {c ? <CardIcon rank={c.rank} suit={c.suit}/> : <span className="text-2xl text-slate-500">+</span>}
                  </div>
               ))}
               <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400"><span>{t.heroStack}</span><span>{heroStack}</span></div>
                  
                  {/* --- ★★★ 手机端 UI 修复: 独立按钮行 ★★★ --- */}
                  <div className="flex gap-2">
                     <button onClick={() => setHeroBet(0)} className="flex-1 bg-slate-600 hover:bg-slate-500 py-2 rounded text-xs flex items-center justify-center gap-1 text-slate-200"><Flag className="w-3 h-3"/> {t.btn_fold}</button>
                     
                     <button onClick={handleCall} className={`flex-1 py-2 rounded text-xs flex items-center justify-center gap-1 text-white ${isCallAllIn ? 'bg-red-800 animate-pulse' : 'bg-blue-600 hover:bg-blue-500'}`}>
                        {isCallAction ? <CheckSquare className="w-3 h-3"/> : <CheckCircle className="w-3 h-3"/>}
                        {isCallAction ? (isCallAllIn ? 'All-In' : 'Call') : 'Check'}
                     </button>
                     
                     <button onClick={() => setHeroBet(heroStack)} className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded text-xs flex items-center justify-center gap-1 text-white"><Zap className="w-3 h-3"/> All-In</button>
                  </div>

                  <input type="number" value={heroBet===0?'':heroBet} onChange={e => handleHeroBetChange(e.target.value)} placeholder="0" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-right font-mono"/>
               </div>
            </div>
         </div>

         {/* Opponents */}
         <div className="space-y-2">
            <div className="flex justify-between items-center px-1"><span className="text-xs font-bold text-slate-400">Opponents</span><button onClick={() => setPlayers([...players, {id: Date.now(), bet: 0, totalContributed: 0, active: true}])} className="text-[10px] bg-slate-800 border border-slate-600 px-2 py-0.5 rounded text-slate-300">+ Add</button></div>
            {players.map((p, idx) => (
               <div key={p.id} className={`flex items-center gap-3 bg-slate-800 p-2 rounded-lg border ${p.active ? 'border-slate-700' : 'opacity-50 border-transparent'}`}>
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">{idx+1}</div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                     <button onClick={() => { const n = [...players]; n[idx].active = !n[idx].active; setPlayers(n); }} className={`text-xs rounded py-1 ${p.active ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>{p.active ? t.active : t.folded}</button>
                     <div className="flex items-center bg-slate-900 rounded px-2 border border-slate-700"><span className="text-xs text-slate-500">$</span><input type="number" value={p.bet===0?'':p.bet} placeholder="0" onChange={e => handleOpponentBetChange(p.id, e.target.value)} className="w-full bg-transparent text-white text-sm py-1 font-mono focus:outline-none" /></div>
                  </div>
                  <button onClick={() => setPlayers(players.filter(x => x.id !== p.id))} className="text-slate-600 hover:text-red-400 px-2">×</button>
               </div>
            ))}
         </div>

         {/* Result */}
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
             <button onClick={confirmSettlement} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded font-bold text-white transition">{t.settle_confirm}</button>
          </div>
        )}

        {result && !settlementMode && (
          <div className={`border rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ${result.isBluff ? 'bg-purple-900/20 border-purple-500/50' : 'bg-slate-900 border-slate-700'}`}>
             <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
                <div>
                   <h2 className={`text-2xl font-bold ${result.isBluff ? 'text-purple-400 animate-pulse' : result.advice.includes('Fold') ? 'text-red-400' : 'text-emerald-400'}`}>{result.advice}</h2>
                   {result.handTypeLabel && <div className="mt-1 inline-block"><span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-blue-200 border border-blue-500/30 flex items-center gap-1"><Lightbulb className="w-3 h-3"/> {result.handTypeLabel}</span></div>}
                   <p className="text-xs text-slate-400 mt-1">{result.reason}</p>
                </div>
                <div className="text-right"><div className="text-3xl font-bold text-white">{result.equity}%</div><div className="text-xs text-slate-500">{t.equity}</div></div>
             </div>
             {result.betSizes && (
               <div className="p-4 grid grid-cols-3 gap-3 bg-slate-800/30">
                  {Object.entries(result.betSizes).map(([k, v]) => (
                    <button key={k} onClick={() => setHeroBet(v)} className="flex flex-col items-center p-2 rounded hover:bg-slate-700 transition border border-transparent hover:border-slate-600">
                      <div className="text-xs text-slate-500 mb-1 capitalize">{k}</div>
                      <div className={`font-mono font-bold ${v===heroStack?'text-red-400':'text-blue-300'}`}>{v}{v===heroStack&&<span className="text-[10px]"> (All-in)</span>}</div>
                    </button>
                  ))}
               </div>
             )}
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