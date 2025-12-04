// 为了在 Node.js 环境中运行测试，我们需要模拟一个全局的 PokerData 对象
// 在实际的浏览器环境中，这个对象由外部脚本提供
global.PokerData = {
  CONSTANTS: {
    SUITS: ['s', 'h', 'd', 'c'],
    RANKS: ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'],
    RANK_VALUES: { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 },
  }
};

// 由于 evaluateHand 是一个独立的函数，我们可以直接从模块中导入它。
// 注意：这需要你将 evaluateHand 从 PokerAdvisorPro.js 中导出。
// 你需要在 PokerAdvisorPro.js 文件末尾添加 `export { evaluateHand };`
// 或者，为了简单起见，我们可以直接将函数代码复制到这里进行测试。

const { RANK_VALUES } = global.PokerData.CONSTANTS;

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
      
      if (h1 >= 11) return "pre_high_card"; // J, Q, K, A 单张
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

  let isFlushDraw = false;
  let isNutFD = false;
  let isStraightDraw = false;

  if (!isRiver) {
      const suits = {};
      const ranks = [];
      allCards.forEach(c => {
        suits[c.suit] = (suits[c.suit] || 0) + 1;
        ranks.push(RANK_VALUES[c.rank]);
      });
      
      const fdSuit = Object.keys(suits).find(s => suits[s] === 4);
      isFlushDraw = !!fdSuit;
      isNutFD = isFlushDraw && ((heroCards[0].suit === fdSuit && h1_rank === 14) || (heroCards[1].suit === fdSuit && h2_rank === 14));
      
      const uRanks = [...new Set(ranks)].sort((a,b)=>a-b);
      for(let i=0; i<=uRanks.length-4; i++) {
          if (uRanks[i+3] - uRanks[i] <= 4) isStraightDraw = true;
      }
  }

  if (score >= 1000000) { // Includes two-pair
      const pairRank = Math.floor((score - 1000000) / 100);
      if (pairRank === maxBoard) return (isFlushDraw || isStraightDraw) ? "top_pair_with_draw" : "top_pair";
      if (pairRank > boardRanks[boardRanks.length-1]) return "middle_pair";
      return "bottom_pair";
  }

  if (isFlushDraw && isStraightDraw) return "combo_draw";
  if (isNutFD) return "flush_draw_nut";
  if (isFlushDraw) return "flush_draw";
  if (isStraightDraw) return "straight_draw_oesd";

  if (h1 > maxBoard && h2 > maxBoard) return "overcards"; 
  if (h1 >= 11) return "high_card_good";
  return "high_card_weak"; 
};

describe('evaluateHand', () => {
  const createHand = (ranks, suits) => ranks.map((r, i) => ({ rank: r, suit: suits[i] }));

  test('should return 0 for insufficient cards', () => {
    const hand = createHand(['A', 'K'], ['s', 'd']);
    expect(evaluateHand(hand)).toBe(0);
  });

  test('should correctly evaluate a High Card hand', () => {
    const hand = createHand(['A', 'K', 'Q', 'J', '9'], ['s', 'd', 'c', 'h', 's']);
    expect(evaluateHand(hand)).toBe(14); // A-high
  });

  test('should correctly evaluate a One Pair hand', () => {
    const hand = createHand(['A', 'A', 'Q', 'J', '9'], ['s', 'd', 'c', 'h', 's']);
    expect(evaluateHand(hand)).toBe(1000000 + 14 * 100); // Pair of Aces
  });

  test('should correctly evaluate a Two Pair hand', () => {
    const hand = createHand(['K', 'K', 'Q', 'Q', '9'], ['s', 'd', 'c', 'h', 's']);
    expect(evaluateHand(hand)).toBe(2000000 + 13 * 100 + 12); // Kings and Queens
  });

  test('should correctly evaluate a Three of a Kind hand', () => {
    const hand = createHand(['T', 'T', 'T', 'J', '9'], ['s', 'd', 'c', 'h', 's']);
    expect(evaluateHand(hand)).toBe(3000000 + 10); // Three Tens
  });

  test('should correctly evaluate a Straight', () => {
    const hand = createHand(['T', '9', '8', '7', '6'], ['s', 'd', 'c', 'h', 's']);
    expect(evaluateHand(hand)).toBe(4000000 + 10); // Ten-high straight
  });

  test('should correctly evaluate an Ace-low Straight (Wheel)', () => {
    const hand = createHand(['A', '2', '3', '4', '5'], ['s', 'd', 'c', 'h', 's']);
    expect(evaluateHand(hand)).toBe(4000000 + 5); // 5-high straight
  });

  test('should correctly evaluate a Flush', () => {
    const hand = createHand(['A', 'K', 'Q', 'J', '9'], ['s', 's', 's', 's', 's']);
    expect(evaluateHand(hand)).toBe(5000000 + 14); // Ace-high flush
  });

  test('should correctly evaluate a Full House', () => {
    const hand = createHand(['A', 'A', 'A', 'K', 'K'], ['s', 'd', 'c', 'h', 's']);
    expect(evaluateHand(hand)).toBe(6000000 + 14); // Aces full of Kings
  });

  test('should correctly evaluate a Four of a Kind hand', () => {
    const hand = createHand(['7', '7', '7', '7', 'K'], ['s', 'd', 'c', 'h', 's']);
    expect(evaluateHand(hand)).toBe(7000000 + 7); // Four Sevens
  });

  test('should correctly evaluate a Straight Flush', () => {
    const hand = createHand(['T', '9', '8', '7', '6'], ['d', 'd', 'd', 'd', 'd']);
    expect(evaluateHand(hand)).toBe(8000000 + 10); // Ten-high straight flush
  });

  test('should correctly evaluate a Royal Flush', () => {
    const hand = createHand(['A', 'K', 'Q', 'J', 'T'], ['h', 'h', 'h', 'h', 'h']);
    expect(evaluateHand(hand)).toBe(8000000 + 14); // Royal flush
  });

  test('should correctly evaluate a hand with 7 cards', () => {
    // 7 cards: 4s 5s 6s 7s 8s 9s Ts (should be Ts-high straight flush)
    const hand = createHand(['4', '5', '6', '7', '8', '9', 'T'], ['s', 's', 's', 's', 's', 's', 's']);
    expect(evaluateHand(hand)).toBe(8000000 + 10);
  });

  test('should correctly evaluate a full house from 7 cards', () => {
    // 7 cards: Ah Ad As Kh Kd 2c 3d (should be Aces full of Kings)
    const hand = createHand(['A', 'A', 'A', 'K', 'K', '2', '3'], ['h', 'd', 's', 'h', 'd', 'c', 'd']);
    expect(evaluateHand(hand)).toBe(6000000 + 14);
  });

  test('should prioritize flush over straight', () => {
    // 7 cards: 4s 5s 6s 7s 8s 9d Tc (should be 8-high flush, not a straight)
    const hand = createHand(['4', '5', '6', '7', '8', '9', 'T'], ['s', 's', 's', 's', 's', 'd', 'c']);
    expect(evaluateHand(hand)).toBe(5000000 + 8);
  });
});

describe('analyzeHandFeatures', () => {
  const createHand = (ranks, suits) => ranks.map((r, i) => ({ rank: r, suit: suits[i] }));

  // Pre-flop tests
  describe('Pre-flop Analysis', () => {
    const community = [];
    test('should identify monster pair', () => {
      expect(analyzeHandFeatures(createHand(['A', 'A'], ['s', 'd']), community)).toBe('pre_monster_pair');
      expect(analyzeHandFeatures(createHand(['K', 'K'], ['s', 'd']), community)).toBe('pre_monster_pair');
    });
    test('should identify strong pair', () => {
      expect(analyzeHandFeatures(createHand(['J', 'J'], ['s', 'd']), community)).toBe('pre_strong_pair');
    });
    test('should identify small pair for set mining', () => {
      expect(analyzeHandFeatures(createHand(['7', '7'], ['s', 'd']), community)).toBe('pre_small_pair');
    });
    test('should identify premium high cards', () => {
      expect(analyzeHandFeatures(createHand(['A', 'K'], ['s', 'd']), community)).toBe('pre_premium_high');
    });
    test('should identify suited ace', () => {
      expect(analyzeHandFeatures(createHand(['A', '5'], ['s', 's']), community)).toBe('pre_suited_ace');
    });
    test('should identify suited connector', () => {
      expect(analyzeHandFeatures(createHand(['8', '7'], ['h', 'h']), community)).toBe('pre_suited_connector');
    });
    test('should identify broadway cards', () => {
      expect(analyzeHandFeatures(createHand(['K', 'Q'], ['s', 'd']), community)).toBe('pre_broadway');
    });
    test('should identify a single high card hand', () => {
      expect(analyzeHandFeatures(createHand(['K', '9'], ['s', 'd']), community)).toBe('pre_high_card');
    });
    test('should identify trash hand', () => {
      expect(analyzeHandFeatures(createHand(['7', '2'], ['s', 'd']), community)).toBe('pre_trash');
    });
  });

  // Post-flop tests
  describe('Post-flop Analysis', () => {
    test('should identify top pair', () => {
      const hero = createHand(['A', 'Q'], ['s', 'd']);
      const community = createHand(['A', '7', '2'], ['h', 'c', 'd']);
      expect(analyzeHandFeatures(hero, community)).toBe('top_pair');
    });
    test('should identify top pair with flush draw', () => {
      const hero = createHand(['A', 'Q'], ['s', 's']);
      const community = createHand(['A', '7', '2'], ['h', 's', 's']);
      expect(analyzeHandFeatures(hero, community)).toBe('top_pair_with_draw');
    });
    test('should identify a set as a monster', () => {
      const hero = createHand(['8', '8'], ['s', 'd']);
      const community = createHand(['A', '8', '2'], ['h', 'c', 'd']);
      expect(analyzeHandFeatures(hero, community)).toBe('monster');
    });
    test('should identify a nut flush draw', () => {
      const hero = createHand(['A', '5'], ['s', 's']);
      const community = createHand(['K', '9', '2'], ['s', 'd', 's']);
      expect(analyzeHandFeatures(hero, community)).toBe('flush_draw_nut');
    });
    test('should identify an open-ended straight draw (OESD)', () => {
      const hero = createHand(['8', '7'], ['s', 'd']);
      const community = createHand(['6', '5', 'A'], ['h', 'c', 'd']);
      expect(analyzeHandFeatures(hero, community)).toBe('straight_draw_oesd');
    });
    test('should identify a combo draw', () => {
      const hero = createHand(['8', '7'], ['s', 's']);
      const community = createHand(['6', '5', 'A'], ['s', 'h', 's']);
      expect(analyzeHandFeatures(hero, community)).toBe('combo_draw');
    });
    test('should identify overcards', () => {
      const hero = createHand(['A', 'K'], ['s', 'd']);
      const community = createHand(['J', '7', '2'], ['h', 'c', 'd']);
      expect(analyzeHandFeatures(hero, community)).toBe('overcards');
    });
  });
});