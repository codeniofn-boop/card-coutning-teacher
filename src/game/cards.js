/**
 * cards.js — card primitives shared by every other module.
 *
 * A card is a plain, immutable object:
 *   { rank: 'A' | '2' … '10' | 'J' | 'Q' | 'K', suit: 'S' | 'H' | 'D' | 'C', id: 'KS' }
 *
 * Nothing here knows about counting systems; see countingSystems.js for that.
 */

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SUITS = ['S', 'H', 'D', 'C'];

export const SUIT_INFO = {
  S: { name: 'Spades', symbol: '♠', color: 'black' },
  H: { name: 'Hearts', symbol: '♥', color: 'red' },
  D: { name: 'Diamonds', symbol: '♦', color: 'red' },
  C: { name: 'Clubs', symbol: '♣', color: 'black' },
};

export function makeCard(rank, suit) {
  return { rank, suit, id: `${rank}${suit}` };
}

export function isRed(card) {
  return SUIT_INFO[card.suit].color === 'red';
}

/** True for 10, J, Q, K — the "ten-value" cards every counting system groups together. */
export function isTenValue(rank) {
  return rank === '10' || rank === 'J' || rank === 'Q' || rank === 'K';
}

/** Blackjack point value of a single rank. Aces count 11 here; handValue() handles soft totals. */
export function pointValue(rank) {
  if (rank === 'A') return 11;
  if (isTenValue(rank)) return 10;
  return Number(rank);
}

/**
 * Best blackjack total for a hand.
 * Returns { total, soft, bust } where `soft` means an ace is still counted as 11.
 */
export function handValue(cards) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += pointValue(card.rank);
    if (card.rank === 'A') aces += 1;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0, bust: total > 21 };
}

/** Short human label such as "K♠" or "10♥". */
export function cardLabel(card) {
  return `${card.rank}${SUIT_INFO[card.suit].symbol}`;
}

/** A fresh, ordered 52-card deck. */
export function fullDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push(makeCard(rank, suit));
  }
  return deck;
}
