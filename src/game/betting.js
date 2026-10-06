/**
 * betting.js — bet ramps, true-count equivalents for unbalanced systems, risk of ruin.
 *
 * The default ramp is a common 1–8 unit spread for a 6-deck game:
 *   TC ≤ 1 → 1 unit, TC 2 → 2, TC 3 → 4, TC 4 → 6, TC ≥ 5 → 8.
 */
import { deckSum } from './countingSystems.js';

export const DEFAULT_RAMP = [
  { tc: -Infinity, units: 1 },
  { tc: 2, units: 2 },
  { tc: 3, units: 4 },
  { tc: 4, units: 6 },
  { tc: 5, units: 8 },
];

export const MAX_UNITS = 8;

/** Units to bet at a (true) count, using the highest ramp step the count reaches. */
export function betForTrueCount(tc, ramp = DEFAULT_RAMP) {
  let units = ramp[0].units;
  for (const step of ramp) if (tc >= step.tc) units = step.units;
  return units;
}

/**
 * Key count for an unbalanced system: the running count that roughly equals a
 * true count of +1 in a shoe of `decks` decks. Published KO values where known,
 * otherwise derived from the system's pivot and deck excess at mid-shoe.
 */
export function keyCount(system, decks) {
  if (system.id === 'ko') return { 1: 2, 2: 1, 4: -1, 6: -4, 8: -6 }[decks] ?? Math.round(4 - 1.5 * decks);
  const excess = deckSum(system);
  const pivot = system.pivot ?? 0;
  // TC = (RC − pivot) / decksLeft + excess  ⇒  RC at TC 1 with half the shoe left:
  return Math.round(pivot + (1 - excess) * (decks / 2));
}

/**
 * True-count equivalent for an unbalanced running count without a deck estimate:
 * the key count maps to TC +1 and the pivot to TC +4 (the KO relationship),
 * interpolated linearly. Balanced systems should use the real true count.
 */
export function tcEquivalentUnbalanced(system, rc, decks) {
  const key = keyCount(system, decks);
  const pivot = system.pivot ?? 0;
  if (pivot === key) return rc >= pivot ? 4 : 1;
  return 1 + (3 * (rc - key)) / (pivot - key);
}

/** The bet the ramp calls for given either a true count (balanced) or a running count (unbalanced). */
export function recommendedBet(system, { trueCount, runningCount, decks }, ramp = DEFAULT_RAMP) {
  const tc = system.balanced ? trueCount : tcEquivalentUnbalanced(system, runningCount, decks);
  return betForTrueCount(tc, ramp);
}

/**
 * Risk of ruin approximation: RoR ≈ exp(−2·μ·B / σ²)
 *   mu     expected win per round in units (e.g. 0.025 for a 1–8 spread with a 1% edge)
 *   sigma  standard deviation per round in units (≈ 4 for the same spread)
 *   bankroll in units
 */
export function riskOfRuin({ mu = 0.025, sigma = 4, bankroll }) {
  if (mu <= 0) return 1;
  return Math.min(1, Math.exp((-2 * mu * bankroll) / (sigma * sigma)));
}
