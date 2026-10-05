/**
 * basicStrategy.js — multi-deck basic strategy tables.
 *
 * Tables cover 4–8 decks, double after split allowed, late surrender allowed,
 * in both S17 (dealer stands on soft 17) and H17 (dealer hits soft 17) flavours.
 * They follow the commonly published charts (Wizard of Odds / Blackjack Apprenticeship).
 *
 * Each row is a 10-character string indexed by dealer upcard 2,3,4,5,6,7,8,9,10,A.
 * Action codes:
 *   H  hit
 *   S  stand
 *   D  double, otherwise hit
 *   Y  double, otherwise stand
 *   P  split
 *   R  surrender, otherwise hit
 *   Z  surrender, otherwise stand
 *   W  surrender, otherwise split
 *
 * resolveAction() turns a code into a concrete action given what the table
 * allows (e.g. no doubling after split, or surrender not offered).
 */
import { handValue, isTenValue } from './cards.js';

export const UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

export const ACTION_LABELS = {
  H: 'Hit',
  S: 'Stand',
  D: 'Double',
  P: 'Split',
  R: 'Surrender',
};

const S17 = {
  hard: {
    5: 'HHHHHHHHHH',
    6: 'HHHHHHHHHH',
    7: 'HHHHHHHHHH',
    8: 'HHHHHHHHHH',
    9: 'HDDDDHHHHH',
    10: 'DDDDDDDDHH',
    11: 'DDDDDDDDDH',
    12: 'HHSSSHHHHH',
    13: 'SSSSSHHHHH',
    14: 'SSSSSHHHHH',
    15: 'SSSSSHHHRH',
    16: 'SSSSSHHRRR',
    17: 'SSSSSSSSSS',
    18: 'SSSSSSSSSS',
    19: 'SSSSSSSSSS',
    20: 'SSSSSSSSSS',
    21: 'SSSSSSSSSS',
  },
  // Soft totals keyed by total (A+2 = 13 … A+9 = 20).
  soft: {
    13: 'HHHDDHHHHH',
    14: 'HHHDDHHHHH',
    15: 'HHDDDHHHHH',
    16: 'HHDDDHHHHH',
    17: 'HDDDDHHHHH',
    18: 'SYYYYSSHHH',
    19: 'SSSSSSSSSS',
    20: 'SSSSSSSSSS',
    21: 'SSSSSSSSSS',
  },
  // Pairs keyed by the rank of one card ("10" covers J/Q/K too).
  pairs: {
    A: 'PPPPPPPPPP',
    2: 'PPPPPPPHHH',
    3: 'PPPPPPPHHH',
    4: 'HHHPPHHHHH',
    5: 'DDDDDDDDHH',
    6: 'PPPPPHHHHH',
    7: 'PPPPPPHHHH',
    8: 'PPPPPPPPPP',
    9: 'PPPPPSPPSS',
    10: 'SSSSSSSSSS',
  },
};

// H17 differs from S17 in only a handful of cells.
const H17 = {
  hard: {
    ...S17.hard,
    11: 'DDDDDDDDDD', // double 11 vs A
    15: 'SSSSSHHHRR', // surrender 15 vs A
    17: 'SSSSSSSSSZ', // surrender 17 vs A (else stand)
  },
  soft: {
    ...S17.soft,
    18: 'YYYYYSSHHH', // double soft 18 vs 2
    19: 'SSSSYSSSSS', // double soft 19 vs 6
  },
  pairs: {
    ...S17.pairs,
    8: 'PPPPPPPPPW', // surrender 8,8 vs A (else split)
  },
};

export const TABLES = { S17, H17 };

export const DEFAULT_RULES = {
  dealerHitsSoft17: false,
  doubleAfterSplit: true,
  surrender: true,
  decks: 6,
};

function upcardIndex(rank) {
  return UPCARDS.indexOf(isTenValue(rank) ? '10' : rank);
}

/**
 * Look up the raw table code for a hand.
 * `cards` is an array of card objects, `dealerRank` the dealer's upcard rank.
 */
export function strategyCode(cards, dealerRank, rules = DEFAULT_RULES) {
  const table = rules.dealerHitsSoft17 ? H17 : S17;
  const col = upcardIndex(dealerRank);
  const { total, soft } = handValue(cards);

  if (cards.length === 2 && pairRank(cards[0]) === pairRank(cards[1])) {
    return table.pairs[pairRank(cards[0])][col];
  }
  if (soft && total <= 21) {
    return table.soft[Math.max(13, Math.min(21, total))][col];
  }
  const hardTotal = Math.max(5, Math.min(21, total));
  return table.hard[hardTotal][col];
}

function pairRank(card) {
  return isTenValue(card.rank) ? '10' : card.rank;
}

/**
 * Resolve a code into one of H/S/D/P/R given what is allowed in this spot.
 *   allowed = { double: bool, split: bool, surrender: bool }
 */
export function resolveAction(code, allowed = { double: true, split: true, surrender: true }) {
  switch (code) {
    case 'H':
    case 'S':
      return code;
    case 'D':
      return allowed.double ? 'D' : 'H';
    case 'Y':
      return allowed.double ? 'D' : 'S';
    case 'P':
      return allowed.split ? 'P' : 'H';
    case 'R':
      return allowed.surrender ? 'R' : 'H';
    case 'Z':
      return allowed.surrender ? 'R' : 'S';
    case 'W':
      return allowed.surrender ? 'R' : allowed.split ? 'P' : 'H';
    default:
      throw new Error(`Unknown strategy code ${code}`);
  }
}

/** Convenience: the concrete correct action for a hand. */
export function basicStrategyAction(cards, dealerRank, rules = DEFAULT_RULES, allowed) {
  const canDouble = cards.length === 2;
  const canSplit = cards.length === 2 && pairRank(cards[0]) === pairRank(cards[1]);
  return resolveAction(
    strategyCode(cards, dealerRank, rules),
    allowed || { double: canDouble, split: canSplit, surrender: rules.surrender && cards.length === 2 },
  );
}
