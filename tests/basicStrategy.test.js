import { test } from 'node:test';
import assert from 'node:assert/strict';
import { basicStrategyAction, strategyCode } from '../src/game/basicStrategy.js';
import { ILLUSTRIOUS_18, FAB_4, deviationAction } from '../src/game/deviations.js';
import { makeCard } from '../src/game/cards.js';

const c = (r, s = 'S') => makeCard(r, s);
const S17 = { dealerHitsSoft17: false, doubleAfterSplit: true, surrender: true };
const H17 = { ...S17, dealerHitsSoft17: true };

test('hard totals', () => {
  assert.equal(basicStrategyAction([c('10'), c('6')], '10', S17), 'R');
  assert.equal(basicStrategyAction([c('10'), c('6')], '6', S17), 'S');
  assert.equal(basicStrategyAction([c('9'), c('3')], '2', S17), 'H');
  assert.equal(basicStrategyAction([c('9'), c('3')], '4', S17), 'S');
  assert.equal(basicStrategyAction([c('5'), c('6')], 'A', S17), 'H');
  assert.equal(basicStrategyAction([c('5'), c('6')], 'A', H17), 'D');
  assert.equal(basicStrategyAction([c('5'), c('4', 'H'), c('2', 'D')], '6', S17), 'H'); // hard 11 but no double on 3 cards
});

test('soft totals', () => {
  assert.equal(basicStrategyAction([c('A'), c('7')], '3', S17), 'D');
  assert.equal(basicStrategyAction([c('A'), c('7')], '2', S17), 'S');
  assert.equal(basicStrategyAction([c('A'), c('7')], '2', H17), 'D');
  assert.equal(basicStrategyAction([c('A'), c('7')], '9', S17), 'H');
  assert.equal(basicStrategyAction([c('A'), c('2')], '5', S17), 'D');
});

test('pairs', () => {
  assert.equal(basicStrategyAction([c('8'), c('8', 'H')], '10', S17), 'P');
  assert.equal(basicStrategyAction([c('A'), c('A', 'H')], '10', S17), 'P');
  assert.equal(basicStrategyAction([c('9'), c('9', 'H')], '7', S17), 'S');
  assert.equal(basicStrategyAction([c('5'), c('5', 'H')], '9', S17), 'D');
  assert.equal(basicStrategyAction([c('K'), c('Q')], '6', S17), 'S');
  assert.equal(strategyCode([c('8'), c('8', 'H')], 'A', H17), 'W');
  assert.equal(basicStrategyAction([c('8'), c('8', 'H')], 'A', { ...H17, surrender: false }), 'P');
});

test('index plays', () => {
  assert.equal(ILLUSTRIOUS_18.length, 18);
  assert.equal(FAB_4.length, 4);
  const sixteen = ILLUSTRIOUS_18.find((d) => d.id === '16v10');
  assert.equal(deviationAction(sixteen, 0), 'Stand');
  assert.equal(deviationAction(sixteen, -1), 'Hit');
  const twelveVsFour = ILLUSTRIOUS_18.find((d) => d.id === '12v4');
  assert.equal(deviationAction(twelveVsFour, -1), 'Hit');
  assert.equal(deviationAction(twelveVsFour, 0), 'Stand');
});
