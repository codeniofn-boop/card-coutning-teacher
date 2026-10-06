/**
 * readings.js — content for reading lessons (text pages with quick checks).
 *
 * Page types:
 *   { type: 'text', icon, title, body }
 *   { type: 'quiz', question, options, answer, explain, cards? }   cards: [{rank,suit}] shown above the question
 *   { type: 'ror' }                                               interactive risk-of-ruin calculator (Unit 8)
 */
import { makeCard } from '../game/cards.js';

const c = (r, s) => makeCard(r, s);

export const READINGS = {
  'basics-flow': [
    { type: 'text', icon: '🪙', title: 'Place a bet', body: 'Every hand starts with a bet in the betting circle. Nothing else happens until the chips are down. Counters size this bet from the count, which is why the whole skill exists.' },
    { type: 'text', icon: '🃏', title: 'The deal', body: 'Everyone gets two cards face up. The dealer gets one face up (the upcard) and one face down (the hole card). Your decisions are based on your two cards and that single upcard.' },
    { type: 'quiz', question: 'How many dealer cards can you see when you decide?', options: ['One', 'Two', 'None'], answer: 'One', explain: 'Only the upcard. The hole card stays hidden until everyone has played.' },
    { type: 'text', icon: '🧑‍🤝‍🧑', title: 'Players act first', body: 'From the dealer’s left, each player hits, stands, doubles, splits or surrenders. Go over 21 and you bust and lose immediately, even if the dealer later busts too. That ordering is the entire house edge.' },
    { type: 'text', icon: '🏦', title: 'Then the dealer', body: 'The dealer has no choices: hit to 16, stand on 17. Some tables also hit a soft 17. Then bets are settled: beat the dealer and win even money; a natural blackjack pays 3 to 2 on good tables.' },
    { type: 'quiz', question: 'You bust with 23. The dealer then busts too. What happens?', options: ['You lose', 'Push', 'You win'], answer: 'You lose', explain: 'Players bust first and lose at once. The dealer busting later does not undo it.' },
  ],
  'basics-values': [
    { type: 'text', icon: '🔢', title: 'Count the pips', body: 'Number cards are worth their number. Jacks, queens and kings are all worth 10. The ace is worth 11 or 1, whichever helps you more.' },
    { type: 'quiz', cards: [c('K', 'S'), c('7', 'H')], question: 'What is this hand worth?', options: ['17', '20', '7'], answer: '17', explain: 'A king is 10, plus 7.' },
    { type: 'text', icon: '🪶', title: 'Soft hands', body: 'A hand with an ace counted as 11 is “soft”: ace-six is soft 17. You cannot bust a soft hand with one card, because the ace can drop to 1. Once it does, the hand is “hard”.' },
    { type: 'quiz', cards: [c('A', 'D'), c('6', 'C')], question: 'This hand is…', options: ['Soft 17', 'Hard 17', 'Hard 7'], answer: 'Soft 17', explain: 'Ace as 11 plus 6. Hit it and the ace can become 1 if needed.' },
    { type: 'quiz', cards: [c('A', 'D'), c('6', 'C'), c('9', 'S')], question: 'And after drawing a 9?', options: ['Hard 16', 'Soft 26', 'Hard 26'], answer: 'Hard 16', explain: '11 + 6 + 9 would bust, so the ace drops to 1: 1 + 6 + 9 = 16, now hard.' },
    { type: 'text', icon: '✨', title: 'Blackjack', body: 'An ace with any ten-value card on the first two cards is a natural, or blackjack. It beats everything except another blackjack and pays 3 to 2 where the rules are fair.' },
  ],
  'basics-dealer': [
    { type: 'text', icon: '🤖', title: 'The dealer is a robot', body: 'Dealers follow a fixed rule printed on the felt. Most common: “Dealer must draw to 16 and stand on all 17s” (S17). The variation “Dealer hits soft 17” (H17) means an ace-six must take another card.' },
    { type: 'text', icon: '📉', title: 'Why H17 hurts you', body: 'Hitting soft 17 lets the dealer improve a weak 17 more often than it busts. It costs players about 0.2% of every bet. Small, but it is a fifth of a counter’s whole edge, so prefer S17 tables when you can.' },
    { type: 'quiz', question: 'Dealer shows A♠ 6♥ at an H17 table. What happens?', options: ['Dealer takes a card', 'Dealer stands on 17', 'Dealer’s choice'], answer: 'Dealer takes a card', explain: 'Soft 17 must be hit under H17. The ace can still become 1, so the dealer cannot bust on that card.' },
    { type: 'text', icon: '🔍', title: 'Peeking', body: 'In most US casinos the dealer checks for blackjack when showing an ace or ten before anyone plays. If they have it, the hand ends and you lose only your original bet, not doubles or splits.' },
    { type: 'quiz', question: 'Which costs the player more?', options: ['H17', 'S17'], answer: 'H17', explain: 'About 0.2% of every bet. Basic strategy changes in a handful of spots to compensate.' },
  ],
  'basics-payouts': [
    { type: 'text', icon: '💵', title: '3 to 2 versus 6 to 5', body: 'A blackjack should pay 3 to 2: $15 on a $10 bet. Some tables pay 6 to 5, only $12. That one change costs about 1.4% of every bet, which wipes out any edge a counter can gain. Never play 6 to 5.' },
    { type: 'quiz', question: 'You bet $20 and get a blackjack at a 3-to-2 table. Profit?', options: ['$30', '$20', '$24'], answer: '$30', explain: '3 to 2 means 1.5 times the bet.' },
    { type: 'text', icon: '🛡️', title: 'Insurance', body: 'When the dealer shows an ace you may bet up to half your wager that the hole card is a ten. It pays 2 to 1. For a non-counter it is a bad bet: fewer than a third of cards are tens. For a Hi-Lo counter it becomes profitable at a true count of +3.' },
    { type: 'text', icon: '🤝', title: '“Even money”', body: 'If you have a blackjack and the dealer shows an ace, the dealer offers to pay you even money right away. That is just insurance in disguise; decline it unless the count says otherwise.' },
    { type: 'quiz', question: 'A 6-to-5 table costs the player roughly…', options: ['1.4% of every bet', '0.1% of every bet', 'Nothing, it is a bonus'], answer: '1.4% of every bet', explain: 'Enough to erase a counter’s edge entirely. Walk past those tables.' },
  ],
  'basics-reality': [
    { type: 'text', icon: '⚖️', title: 'Legal, but not welcome', body: 'Counting cards in your head is legal in the US and most of the world. Casinos are private businesses though: if they think you are counting they can ask you to stop playing blackjack, or to leave. That is a “back-off”, and it happens to every serious counter eventually.' },
    { type: 'text', icon: '📏', title: 'The edge is small', body: 'A solid counter with a good bet spread has roughly a 0.5–1.5% edge over the house. On $1,000 of total bets that is about $5–15 of expected profit. The edge only shows up as an average over a very large number of hands.' },
    { type: 'quiz', question: 'Card counting in your head is illegal in the United States.', options: ['True', 'False'], answer: 'False', explain: 'It is legal. Casinos can still refuse to let you play.' },
    { type: 'text', icon: '🎢', title: 'Variance is enormous', body: 'Even with an edge, losing streaks that last many hours are normal. Counters think in hundreds of hours of play, not sessions. A bad weekend proves nothing, and neither does a good one.' },
    { type: 'text', icon: '🏦', title: 'You need a bankroll', body: 'Bets scale with the count, so a 1-to-8 spread at a $25 table means $200 top bets. To keep the risk of going broke low, pros keep a bankroll of several hundred top bets. That is real money set aside for nothing else.' },
    { type: 'quiz', question: 'With a 1% edge, roughly how much does a counter expect to win per $1,000 wagered?', options: ['$10', '$100', '$500'], answer: '$10', explain: '1% of $1,000 is $10, and that is an average, not a guarantee.' },
    { type: 'quiz', question: 'If you count perfectly, you will win every session.', options: ['True', 'False'], answer: 'False', explain: 'A small edge with high variance means plenty of losing sessions.' },
    { type: 'text', icon: '🎯', title: 'So why learn it?', body: 'Because it is a genuinely hard, satisfying skill, and the only honest way to play blackjack with an edge. Treat it as a demanding hobby with a possible upside, not a paycheck. That mindset is what keeps it fun.' },
  ],
  'tc-why': [
    { type: 'text', icon: '➗', title: 'Same number, different meaning', body: 'A running count of +6 with five decks left means the extra high cards are spread thin: about one per deck. The same +6 with one deck left means they are all packed into the next 52 cards. The second shoe is far richer.' },
    { type: 'text', icon: '🧮', title: 'True count', body: 'True count = running count ÷ decks remaining. +6 with 3 decks left is a true +2. +6 with 1 deck left is a true +6. Bets and playing deviations are always based on the true count.' },
    { type: 'quiz', question: 'Running count +8, four decks left. True count?', options: ['+2', '+4', '+32'], answer: '+2', explain: '8 ÷ 4 = 2.' },
    { type: 'text', icon: '✂️', title: 'Rounding', body: 'Counters round the true count, usually toward zero (so +2.8 becomes +2 and −2.8 becomes −2). That is slightly conservative for bets and good enough for every index play in this app.' },
    { type: 'quiz', question: 'Running count −7, two decks left. True count (toward zero)?', options: ['−3', '−4', '−14'], answer: '−3', explain: '−7 ÷ 2 = −3.5, which rounds toward zero to −3.' },
    { type: 'text', icon: '📦', title: 'Where decks remaining comes from', body: 'From Unit 6: glance at the discard tray, estimate decks played, subtract from the shoe size. Half-deck precision is plenty. The division only needs to be roughly right.' },
  ],
  'bet-units': [
    { type: 'text', icon: '🪙', title: 'Think in units', body: 'Counters size bets in units, not dollars, so one plan works at any table. A unit is your minimum bet, often the table minimum. A “1-to-8 spread” means your biggest bet is eight units.' },
    { type: 'text', icon: '📈', title: 'Why spread at all', body: 'Every edge comes from betting more when the true count is high and the minimum when it is low or negative. Flat betting with a perfect count makes almost nothing; the spread is where the money is.' },
    { type: 'quiz', question: 'At a $25 table with a 1-to-8 spread, your top bet is…', options: ['$200', '$25', '$800'], answer: '$200', explain: '8 units × $25.' },
    { type: 'text', icon: '👀', title: 'The cost of a big spread', body: 'Wider spreads earn more and get noticed more. Casinos watch for bets that jump with the count. Units 10 and 11 deal with that trade-off.' },
    { type: 'quiz', question: 'Flat betting the minimum while counting perfectly…', options: ['Earns almost nothing', 'Earns the full 1% edge', 'Is illegal'], answer: 'Earns almost nothing', explain: 'The edge only exists when the big bets go out on the high counts.' },
  ],
  'bet-ror': [
    { type: 'text', icon: '🎲', title: 'Risk of ruin', body: 'Risk of ruin is the chance you lose your entire bankroll before the edge has time to work. It depends on your edge, your bet sizes and how much you have. A small edge with big swings means a real chance of going broke.' },
    { type: 'ror' },
    { type: 'quiz', question: 'Doubling your bankroll (same bets) does what to risk of ruin?', options: ['Roughly squares it: 20% becomes 4%', 'Halves it', 'Nothing'], answer: 'Roughly squares it: 20% becomes 4%', explain: 'Risk of ruin falls exponentially with bankroll, so each doubling multiplies the risk by itself.' },
    { type: 'text', icon: '📐', title: 'Rules of thumb', body: 'With a typical 1-to-8 spread, a bankroll of about 1,000 units gives a few percent risk of ruin; 500 units is closer to 25%. Many pros also resize their unit down after losses, which makes ruin nearly impossible but slows recovery.' },
    { type: 'quiz', question: 'A $25 unit with a 1,000-unit bankroll means setting aside…', options: ['$25,000', '$2,500', '$1,000'], answer: '$25,000', explain: 'That is why most counters start at $5–$10 tables or join a team.' },
  ],
  'dev-insurance': [
    { type: 'text', icon: '🛡️', title: 'The best deviation', body: 'Insurance pays 2 to 1 if the dealer’s hole card is a ten. Ten-value cards are 16 of 52, so it loses money normally. When the shoe is rich in tens, the odds flip.' },
    { type: 'text', icon: '🔢', title: 'The index: +3', body: 'For Hi-Lo, take insurance at a true count of +3 or higher, with any hand. Below that, decline. This single play is worth more than any other index because the bet is half your wager and the count tells you exactly what you need to know.' },
    { type: 'quiz', question: 'Dealer shows an ace. True count +4. You hold 16.', options: ['Take insurance', 'Decline'], answer: 'Take insurance', explain: 'Your own hand does not matter. At +3 or more, insure.' },
    { type: 'quiz', question: 'Dealer shows an ace. True count +2. You hold a blackjack and are offered even money.', options: ['Decline', 'Take even money'], answer: 'Decline', explain: 'Even money is insurance. Below +3, let it ride.' },
  ],
  'casino-camo': [
    { type: 'text', icon: '🕶️', title: 'What they look for', body: 'Surveillance does not read minds. It looks for bets that rise and fall with the count, players who never talk, eyes glued to the discard tray, and perfect play. Camouflage is about not looking like that, at a small cost in edge.' },
    { type: 'text', icon: '🪜', title: 'Ramp, don’t jump', body: 'Raise bets in steps rather than from 1 unit to 8 at once, and never raise after a loss when the count has not risen. Parlaying a win (“letting it ride”) is a natural-looking way to get a bigger bet out.' },
    { type: 'quiz', question: 'The count jumps from 0 to +5 in one round. Least suspicious?', options: ['Raise over the next two hands', 'Jump straight to the max bet', 'Keep betting the minimum forever'], answer: 'Raise over the next two hands', explain: 'You give up a little expectation and look like a player on a hot streak.' },
    { type: 'text', icon: '🎭', title: 'Act like a gambler', body: 'Chat with the dealer, watch the game casually, tip now and then, and do not play for hours at one table. Short sessions at many tables (“Wonging in” on good counts and leaving on bad ones) are both camouflage and better math.' },
    { type: 'text', icon: '🚪', title: 'Know when to leave', body: 'A pit boss who suddenly stands behind you, a phone call to surveillance, a new dealer mid-shoe: these are signals. Color up politely and leave. A back-off is not a disaster; getting banned from a whole chain is.' },
    { type: 'quiz', question: 'Which gives away a counter fastest?', options: ['Bets that track the count exactly', 'Tipping the dealer', 'Playing two hands'], answer: 'Bets that track the count exactly', explain: 'Bet correlation with the count is what casino software is built to detect.' },
  ],
};

export function readingFor(lessonId) {
  return READINGS[lessonId] || null;
}
