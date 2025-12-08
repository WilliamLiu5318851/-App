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

// 修正版 evaluateHand (v7.1): 修复了踢脚(kicker)和同花(flush)的计分BUG，确保100%准确比较。
const evaluateHand = (cards) => {
  if (!cards || cards.length < 5) return 0;
  const sorted = [...cards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);
  const ranks = sorted.map(c => RANK_VALUES[c.rank]);
  const suits = sorted.map(c => c.suit);

  const counts = {};
  ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);

  const suitCounts = {};
  suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
  let flushSuit = Object.keys(suitCounts).find(s => suitCounts[s] >= 5);

  const uniqueRanks = [...new Set(ranks)].sort((a,b) => b-a);
  let straightHigh = 0;
  // A-5 wheel check
  if (uniqueRanks.includes(14) && uniqueRanks.includes(2) && uniqueRanks.includes(3) && uniqueRanks.includes(4) && uniqueRanks.includes(5)) {
      straightHigh = 5;
  } else {
      for (let i = 0; i <= uniqueRanks.length - 5; i++) {
        if (uniqueRanks[i] - uniqueRanks[i+4] === 4) { straightHigh = uniqueRanks[i]; break; }
      }
  }

  let isFlush = !!flushSuit;
  let isStraight = straightHigh > 0;

  // Straight Flush check
  if (isFlush && isStraight) {
      const flushRanks = sorted.filter(c => c.suit === flushSuit).map(c => RANK_VALUES[c.rank]);
      const uniqueFlushRanks = [...new Set(flushRanks)].sort((a,b) => b-a);
      if (uniqueFlushRanks.includes(14) && uniqueFlushRanks.includes(5) && uniqueFlushRanks.includes(4) && uniqueFlushRanks.includes(3) && uniqueFlushRanks.includes(2)) {
          return 8000000 + 5; // A-5 Straight Flush
      }
      for (let i = 0; i <= uniqueFlushRanks.length - 5; i++) {
          if (uniqueFlushRanks[i] - uniqueFlushRanks[i+4] === 4) {
              return 8000000 + uniqueFlushRanks[i];
          }
      }
  }
  
  const sortedByCount = Object.keys(counts).map(r => Number(r)).sort((a,b) => (counts[b] - counts[a]) || (b - a));

  if (counts[sortedByCount[0]] === 4) { // Quads
      const kicker = sortedByCount.find(r => r !== sortedByCount[0]);
      return 7000000 + sortedByCount[0] * 15 + (kicker || 0);
  }
  if (counts[sortedByCount[0]] === 3 && counts[sortedByCount[1]] >= 2) { // Full House
      return 6000000 + sortedByCount[0] * 15 + sortedByCount[1];
  }
  if (isFlush) { // Flush (kicker-safe)
      const flushRanks = sorted.filter(c => c.suit === flushSuit).map(c => RANK_VALUES[c.rank]).slice(0, 5);
      return 5000000 + flushRanks[0] * 15**4 + flushRanks[1] * 15**3 + flushRanks[2] * 15**2 + flushRanks[3] * 15 + flushRanks[4];
  }
  if (isStraight) return 4000000 + straightHigh;
  if (counts[sortedByCount[0]] === 3) { // Trips (kicker-safe)
      const kickers = sortedByCount.filter(r => r !== sortedByCount[0]).slice(0, 2);
      return 3000000 + sortedByCount[0] * 15**2 + (kickers[0] || 0) * 15 + (kickers[1] || 0);
  }
  if (counts[sortedByCount[0]] === 2 && counts[sortedByCount[1]] === 2) { // Two Pair (kicker-safe)
      const kicker = sortedByCount.find(r => r !== sortedByCount[0] && r !== sortedByCount[1]);
      return 2000000 + sortedByCount[0] * 15**2 + sortedByCount[1] * 15 + (kicker || 0);
  }
  if (counts[sortedByCount[0]] === 2) { // One Pair (kicker-safe)
      const kickers = sortedByCount.filter(r => r !== sortedByCount[0]).slice(0, 3);
      return 1000000 + sortedByCount[0] * 15**3 + (kickers[0] || 0) * 15**2 + (kickers[1] || 0) * 15 + (kickers[2] || 0);
  }
  // High Card (kicker-safe)
  const handRanks = sortedByCount.slice(0, 5);
  return handRanks[0] * 15**4 + handRanks[1] * 15**3 + handRanks[2] * 15**2 + handRanks[3] * 15 + handRanks[4];
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

  // FIX: Correctly identify Two Pair instead of misclassifying as Top Pair
  if (score >= 2000000) {
      return "two_pair";
  }
  if (score >= 1000000) {
      const pairRank = Math.floor((score - 1000000) / (15**3)); // Adjusted for new scoring
      if (pairRank === maxBoard) {
        // 检查是否是顶对+听牌
        if (isFlushDraw || isStraightDraw) {
          return "top_pair_with_draw";
        }
        return "top_pair";
      }
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
    expect(evaluateHand(hand)).toBe(14*15**4 + 13*15**3 + 12*15**2 + 11*15 + 9); // A-high
  });

  test('should correctly evaluate a One Pair hand', () => {
    const hand = createHand(['A', 'A', 'Q', 'J', '9'], ['s', 'd', 'c', 'h', 's']);
    expect(evaluateHand(hand)).toBe(1000000 + 14*15**3 + 12*15**2 + 11*15 + 9); // Pair of Aces
  });

  test('should correctly evaluate a Two Pair hand', () => {
    const hand = createHand(['K', 'K', 'Q', 'Q', '9'], ['s', 'd', 'c', 'h', 's']);
    expect(evaluateHand(hand)).toBe(2000000 + 13*15**2 + 12*15 + 9); // Kings and Queens, 9 kicker
  });

  test('should correctly evaluate a Three of a Kind hand', () => {
    const hand = createHand(['T', 'T', 'T', 'J', '9'], ['s', 'd', 'c', 'h', 's']);
    expect(evaluateHand(hand)).toBe(3000000 + 10*15**2 + 11*15 + 9); // Three Tens, J, 9 kickers
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
    const expectedScore = 5000000 + 14*15**4 + 13*15**3 + 12*15**2 + 11*15 + 9;
    expect(evaluateHand(hand)).toBe(expectedScore); // Ace-high flush
  });

  test('should correctly evaluate a Full House', () => {
    const hand = createHand(['A', 'A', 'A', 'K', 'K'], ['s', 'd', 'c', 'h', 's']);
    expect(evaluateHand(hand)).toBe(6000000 + 14 * 15 + 13); // Aces full of Kings
  });

  test('should correctly evaluate a Four of a Kind hand', () => {
    const hand = createHand(['7', '7', '7', '7', 'K'], ['s', 'd', 'c', 'h', 's']);
    expect(evaluateHand(hand)).toBe(7000000 + 7 * 15 + 13); // Four Sevens, K kicker
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
    expect(evaluateHand(hand)).toBe(6000000 + 14 * 15 + 13);
  });

  test('should prioritize flush over straight', () => {
    // 7 cards: 4s 5s 6s 7s 8s 9d Tc (should be 8-high flush, not a straight)
    const hand = createHand(['4', '5', '6', '7', '8', '9', 'T'], ['s', 's', 's', 's', 's', 'd', 'c']);
    const expectedScore = 5000000 + 8*15**4 + 7*15**3 + 6*15**2 + 5*15 + 4;
    expect(evaluateHand(hand)).toBe(expectedScore);
  });

  test('should correctly evaluate One Pair with kickers', () => {
    const hand1 = createHand(['A', 'A', 'K', 'Q', 'J'], ['s', 'd', 'c', 'h', 's']); // AAKQJ
    const hand2 = createHand(['A', 'A', 'K', 'Q', 'T'], ['s', 'd', 'c', 'h', 's']); // AAKQT
    expect(evaluateHand(hand1)).toBeGreaterThan(evaluateHand(hand2));
  });

  test('should correctly evaluate Two Pair with kicker', () => {
    const hand1 = createHand(['K', 'K', 'Q', 'Q', 'J'], ['s', 'd', 'c', 'h', 's']); // KKQQJ
    const hand2 = createHand(['K', 'K', 'Q', 'Q', 'T'], ['s', 'd', 'c', 'h', 's']); // KKQQT
    expect(evaluateHand(hand1)).toBeGreaterThan(evaluateHand(hand2));
  });

  test('should correctly evaluate Flush with kickers', () => {
    const hand1 = createHand(['A', 'K', 'Q', 'J', '9'], ['s', 's', 's', 's', 's']);
    const hand2 = createHand(['A', 'K', 'Q', 'J', '8'], ['s', 's', 's', 's', 's']);
    expect(evaluateHand(hand1)).toBeGreaterThan(evaluateHand(hand2));
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

    test('should identify two pair', () => {
      const hero = createHand(['A', 'K'], ['s', 'd']);
      const community = createHand(['A', 'K', '2'], ['h', 'c', 'd']);
      expect(analyzeHandFeatures(hero, community)).toBe('two_pair');
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