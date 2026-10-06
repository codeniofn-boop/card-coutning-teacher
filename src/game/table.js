/**
 * table.js — a small blackjack engine for the full-table simulator.
 *
 * Pure functions over plain data. The UI owns timing and animation; the
 * engine answers "what happens next" and "what was the right thing to do".
 *
 * Hand: { cards, bet, done, outcome, doubled, surrendered, split, fromSplit, isUser, seat }
 */
import { handValue, isTenValue } from './cards.js';
import { basicStrategyAction, DEFAULT_RULES, ACTION_LABELS } from './basicStrategy.js';
import { ILLUSTRIOUS_18, FAB_4, deviationApplies } from './deviations.js';

export function newHand(seat, bet, isUser = false) {
  return { seat, bet, isUser, cards: [], done: false, outcome: null, doubled: false, surrendered: false, split: false, fromSplit: false, actions: [] };
}

export function isBlackjack(hand) {
  return hand.cards.length === 2 && !hand.fromSplit && handValue(hand.cards).total === 21;
}

export function canSplit(hand) {
  return hand.cards.length === 2 && !hand.fromSplit && pairKey(hand.cards[0]) === pairKey(hand.cards[1]);
}

export function canDouble(hand) {
  return hand.cards.length === 2;
}

export function canSurrender(hand, rules = DEFAULT_RULES) {
  return rules.surrender !== false && hand.cards.length === 2 && !hand.fromSplit;
}

function pairKey(card) {
  return isTenValue(card.rank) ? '10' : card.rank;
}

/** Deal order for the opening round: one card each to every seat then the dealer, twice. */
export function openingDealOrder(seatCount) {
  const order = [];
  for (let pass = 0; pass < 2; pass++) {
    for (let s = 0; s < seatCount; s++) order.push({ seat: s });
    order.push({ seat: 'dealer', hidden: pass === 1 });
  }
  return order;
}

/**
 * The correct action for a hand given the count. Hi-Lo users are graded on
 * index plays (Illustrious 18 + Fab 4) when one applies; everyone else (and
 * every other spot) is graded on basic strategy.
 */
export function correctAction(hand, dealerRank, { rules = DEFAULT_RULES, trueCount = null, useIndices = false } = {}) {
  const allowed = { double: canDouble(hand), split: canSplit(hand), surrender: canSurrender(hand, rules) };
  const basic = basicStrategyAction(hand.cards, dealerRank, rules, allowed);
  if (useIndices && trueCount != null) {
    const dev = findDeviation(hand, dealerRank);
    // A stand/hit index (e.g. 16 vs 10 at 0) is for hands that can no longer
    // surrender. When basic strategy says surrender and surrender is still on
    // the table, only the Fab 4 surrender indices may override it.
    if (dev && basic === 'R' && !FAB_4.includes(dev)) return { code: basic, deviation: null };
    if (dev) {
      const label = deviationApplies(dev, trueCount) ? dev.action : dev.fallback;
      const code = labelToCode(label);
      if ((code === 'D' && !allowed.double) || (code === 'P' && !allowed.split) || (code === 'R' && !allowed.surrender)) {
        return { code: basic, deviation: null };
      }
      return { code, deviation: dev };
    }
  }
  return { code: basic, deviation: null };
}

function labelToCode(label) {
  return { Hit: 'H', Stand: 'S', Double: 'D', Split: 'P', Surrender: 'R' }[label] || 'H';
}

/** Find an index play for this spot (surrender indices take priority when the hand is two cards). */
export function findDeviation(hand, dealerRank) {
  const up = isTenValue(dealerRank) ? '10' : dealerRank;
  const { total, soft } = handValue(hand.cards);
  if (soft) return null;
  const pair = canSplit(hand) && pairKey(hand.cards[0]) === '10' ? '10,10' : null;
  const key = pair || String(total);
  if (hand.cards.length === 2 && !hand.fromSplit) {
    const fab = FAB_4.find((d) => d.hand === key && d.upcard === up);
    if (fab) return fab;
  }
  return ILLUSTRIOUS_18.find((d) => d.hand === key && d.upcard === up && d.hand !== 'Insurance') || null;
}

/** Should insurance be taken? Hi-Lo index is TC ≥ +3; everyone else declines. */
export function insuranceCorrect(trueCount, useIndices) {
  return !!useIndices && trueCount != null && trueCount >= 3;
}

/** Apply a player action; returns { hand(s), draws } where draws is how many cards to deal next. */
export function applyAction(hand, code, drawCard) {
  const h = { ...hand, cards: hand.cards.slice(), actions: [...hand.actions, code] };
  switch (code) {
    case 'H':
      h.cards.push(drawCard());
      if (handValue(h.cards).total >= 21) h.done = true;
      return [h];
    case 'S':
      h.done = true;
      return [h];
    case 'D':
      h.cards.push(drawCard());
      h.bet *= 2;
      h.doubled = true;
      h.done = true;
      return [h];
    case 'R':
      h.surrendered = true;
      h.done = true;
      return [h];
    case 'P': {
      const a = { ...h, cards: [h.cards[0]], split: true, fromSplit: true, actions: [...h.actions] };
      const b = { ...h, cards: [h.cards[1]], split: true, fromSplit: true, actions: [] };
      a.cards.push(drawCard());
      b.cards.push(drawCard());
      // Split aces receive one card each and stand.
      if (h.cards[0].rank === 'A') {
        a.done = true;
        b.done = true;
      }
      return [a, b];
    }
    default:
      return [h];
  }
}

/** Dealer draws to 17 (hits soft 17 under H17). Returns the cards drawn. */
export function dealerDraws(dealerCards, drawCard, rules = DEFAULT_RULES) {
  const cards = dealerCards.slice();
  const drawn = [];
  for (;;) {
    const { total, soft } = handValue(cards);
    if (total > 17) break;
    if (total === 17 && !(soft && rules.dealerHitsSoft17)) break;
    const c = drawCard();
    cards.push(c);
    drawn.push(c);
  }
  return drawn;
}

/** Settle one hand against the dealer. Returns { outcome, net } with net in units of the original bet. */
export function settleHand(hand, dealerCards, dealerBlackjack) {
  if (hand.surrendered) return { outcome: 'surrender', net: -hand.bet / 2 };
  const player = handValue(hand.cards);
  const dealer = handValue(dealerCards);
  if (isBlackjack(hand)) {
    if (dealerBlackjack) return { outcome: 'push', net: 0 };
    return { outcome: 'blackjack', net: hand.bet * 1.5 };
  }
  if (dealerBlackjack) return { outcome: 'lose', net: -hand.bet };
  if (player.bust) return { outcome: 'bust', net: -hand.bet };
  if (dealer.bust) return { outcome: 'win', net: hand.bet };
  if (player.total > dealer.total) return { outcome: 'win', net: hand.bet };
  if (player.total < dealer.total) return { outcome: 'lose', net: -hand.bet };
  return { outcome: 'push', net: 0 };
}

/** Grade a simulator session into an overall accuracy and parts. */
export function gradeSession({ countChecks, bets, plays }) {
  const part = (list) => (list.length ? list.filter((x) => x.correct).length / list.length : null);
  const countAcc = part(countChecks);
  const betAcc = part(bets);
  const playAcc = part(plays);
  const parts = [countAcc, betAcc, playAcc].filter((x) => x != null);
  const weights = [0.5, 0.25, 0.25];
  let total = 0;
  let w = 0;
  [countAcc, betAcc, playAcc].forEach((acc, i) => {
    if (acc != null) {
      total += acc * weights[i];
      w += weights[i];
    }
  });
  return { countAcc, betAcc, playAcc, overall: w ? total / w : parts.length ? 0 : 1 };
}

export { ACTION_LABELS };
