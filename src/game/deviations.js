/**
 * deviations.js — index plays for Hi-Lo.
 *
 * The "Illustrious 18" (Don Schlesinger) are the 18 playing deviations that
 * capture most of the value of index play, and the "Fab 4" are the four most
 * valuable surrender deviations. Indices are the standard multi-deck Hi-Lo
 * true-count numbers.
 *
 * Each entry:
 *   hand:     player total or pair, e.g. '16', '10,10', 'insurance'
 *   upcard:   dealer upcard rank
 *   action:   what to do when the index is met
 *   fallback: the basic-strategy action otherwise
 *   index:    the true count that triggers `action`
 *   when:     'atOrAbove' → take `action` when TC ≥ index
 *             'below'     → take `action` when TC < index (negative indices)
 */

export const ILLUSTRIOUS_18 = [
  { id: 'ins', hand: 'Insurance', upcard: 'A', action: 'Take insurance', fallback: 'Decline', index: 3, when: 'atOrAbove' },
  { id: '16v10', hand: '16', upcard: '10', action: 'Stand', fallback: 'Hit', index: 0, when: 'atOrAbove' },
  { id: '15v10', hand: '15', upcard: '10', action: 'Stand', fallback: 'Hit', index: 4, when: 'atOrAbove' },
  { id: 'TTv5', hand: '10,10', upcard: '5', action: 'Split', fallback: 'Stand', index: 5, when: 'atOrAbove' },
  { id: 'TTv6', hand: '10,10', upcard: '6', action: 'Split', fallback: 'Stand', index: 4, when: 'atOrAbove' },
  { id: '10v10', hand: '10', upcard: '10', action: 'Double', fallback: 'Hit', index: 4, when: 'atOrAbove' },
  { id: '12v3', hand: '12', upcard: '3', action: 'Stand', fallback: 'Hit', index: 2, when: 'atOrAbove' },
  { id: '12v2', hand: '12', upcard: '2', action: 'Stand', fallback: 'Hit', index: 3, when: 'atOrAbove' },
  { id: '11vA', hand: '11', upcard: 'A', action: 'Double', fallback: 'Hit', index: 1, when: 'atOrAbove' },
  { id: '9v2', hand: '9', upcard: '2', action: 'Double', fallback: 'Hit', index: 1, when: 'atOrAbove' },
  { id: '10vA', hand: '10', upcard: 'A', action: 'Double', fallback: 'Hit', index: 4, when: 'atOrAbove' },
  { id: '9v7', hand: '9', upcard: '7', action: 'Double', fallback: 'Hit', index: 3, when: 'atOrAbove' },
  { id: '16v9', hand: '16', upcard: '9', action: 'Stand', fallback: 'Hit', index: 5, when: 'atOrAbove' },
  { id: '13v2', hand: '13', upcard: '2', action: 'Hit', fallback: 'Stand', index: -1, when: 'below' },
  { id: '12v4', hand: '12', upcard: '4', action: 'Hit', fallback: 'Stand', index: 0, when: 'below' },
  { id: '12v5', hand: '12', upcard: '5', action: 'Hit', fallback: 'Stand', index: -2, when: 'below' },
  { id: '12v6', hand: '12', upcard: '6', action: 'Hit', fallback: 'Stand', index: -1, when: 'below' },
  { id: '13v3', hand: '13', upcard: '3', action: 'Hit', fallback: 'Stand', index: -2, when: 'below' },
];

export const FAB_4 = [
  { id: 's14v10', hand: '14', upcard: '10', action: 'Surrender', fallback: 'Hit', index: 3, when: 'atOrAbove' },
  { id: 's15v10', hand: '15', upcard: '10', action: 'Surrender', fallback: 'Hit', index: 0, when: 'atOrAbove' },
  { id: 's15v9', hand: '15', upcard: '9', action: 'Surrender', fallback: 'Hit', index: 2, when: 'atOrAbove' },
  { id: 's15vA', hand: '15', upcard: 'A', action: 'Surrender', fallback: 'Hit', index: 1, when: 'atOrAbove' },
];

/** Does the deviation fire at this true count? */
export function deviationApplies(deviation, trueCount) {
  return deviation.when === 'atOrAbove' ? trueCount >= deviation.index : trueCount < deviation.index;
}

/** The action to take for a deviation at a given true count. */
export function deviationAction(deviation, trueCount) {
  return deviationApplies(deviation, trueCount) ? deviation.action : deviation.fallback;
}

/** Index plays available for a system. Only Hi-Lo ships indices for now. */
export function deviationsForSystem(systemId) {
  if (systemId === 'hilo') return { illustrious18: ILLUSTRIOUS_18, fab4: FAB_4 };
  return { illustrious18: [], fab4: [] };
}
