import { useEffect, useMemo, useReducer, useState } from 'react';
import { buildShoe } from '../../game/shoe.js';
import { cardValue, formatCount, trueCount as trueCountOf, hasHalfValues } from '../../game/countingSystems.js';
import { handValue, cardLabel } from '../../game/cards.js';
import { DEFAULT_RULES, basicStrategyAction, ACTION_LABELS } from '../../game/basicStrategy.js';
import { recommendedBet, DEFAULT_RAMP } from '../../game/betting.js';
import { newHand, openingDealOrder, correctAction, applyAction, dealerDraws, settleHand, isBlackjack, canSplit, canDouble, canSurrender, insuranceCorrect } from '../../game/table.js';
import { truncateTowardZero } from '../../game/drills.js';
import PlayingCard from '../../components/PlayingCard.jsx';
import Button from '../../components/Button.jsx';
import Keypad from '../../components/Keypad.jsx';
import CountChip from '../../components/CountChip.jsx';
import DiscardTray from '../../components/DiscardTray.jsx';
import ChoiceButton from './ChoiceButton.jsx';

const BET_UNITS = [...new Set(DEFAULT_RAMP.map((r) => r.units))];

/**
 * Unit 10 — a full table. Other seats play basic strategy automatically; the
 * learner bets, plays and keeps the count. Cards arrive one at a time at the
 * chosen speed. Everything is graded: bets against the ramp, plays against
 * basic strategy (plus Hi-Lo indices), and periodic count checks.
 */
export default function TableSim({ lesson, system, rules, speedMs, onMistake, onFinish, onProgress }) {
  const cfg = lesson.config;
  const [setup, setSetup] = useState({ decks: cfg.decks, penetration: cfg.penetration, players: cfg.players });
  const [state, dispatch] = useReducer(reducer, null, () => ({ phase: 'setup' }));
  const [input, setInput] = useState('');
  const useIndices = system.id === 'hilo';
  const ctx = useMemo(() => ({ system, rules: rules || DEFAULT_RULES, useIndices, cfg, setup }), [system, rules, useIndices, cfg, setup]);

  // Animation clock: process one queued step per tick.
  useEffect(() => {
    if (!state.queue || state.queue.length === 0) return undefined;
    const head = state.queue[0];
    const delay = head.type === 'card' ? speedMs : head.type === 'auto' ? Math.max(250, speedMs * 0.8) : Math.min(600, speedMs);
    const t = setTimeout(() => dispatch({ type: 'tick', ctx }), delay);
    return () => clearTimeout(t);
  }, [state.queue, speedMs, ctx]);

  // Progress and completion.
  useEffect(() => {
    if (!state.rounds) return;
    const target = cfg.rounds === 'shoe' ? Math.max(1, Math.round((state.cutIndex || 1) / Math.max(1, state.cardsPerRound || 20))) : cfg.rounds;
    onProgress?.(Math.min(1, state.round / target));
  }, [state.round, state.rounds, state.cutIndex, state.cardsPerRound, cfg.rounds, onProgress]);

  useEffect(() => {
    if (state.phase !== 'done' || state.finished) return;
    dispatch({ type: 'finished' });
    const all = [...state.grades.countChecks, ...state.grades.bets, ...state.grades.plays];
    onFinish({
      total: all.length,
      correct: all.filter((g) => g.correct).length,
      mistakes: all.filter((g) => !g.correct),
      durationMs: Date.now() - state.startedAt,
      netUnits: state.bankroll,
      countAccuracy: ratio(state.grades.countChecks),
      betAccuracy: ratio(state.grades.bets),
      playAccuracy: ratio(state.grades.plays),
      rounds: state.round,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // Mistakes cost hearts as they happen.
  useEffect(() => {
    if (state.lastGrade && state.lastGrade.correct === false && state.lastGrade.id !== state.lastPenalised) {
      dispatch({ type: 'penalised', id: state.lastGrade.id });
      onMistake();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lastGrade]);

  if (state.phase === 'setup') {
    return (
      <div className="flex flex-1 flex-col">
        <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Table setup</h2>
          <p className="mt-1 text-sm font-semibold text-ink-500">
            {cfg.rounds === 'shoe' ? 'Play until the cut card comes out.' : `${cfg.rounds} rounds.`} Count checks every {cfg.checkEvery} rounds. Cards arrive every {(speedMs / 1000).toFixed(1)}s.
          </p>
          <Picker label="Decks" value={setup.decks} options={[1, 2, 4, 6, 8]} onChange={(v) => setSetup({ ...setup, decks: v })} />
          <Picker label="Penetration" value={setup.penetration} options={[0.5, 0.65, 0.75, 0.85]} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(v) => setSetup({ ...setup, penetration: v })} />
          <Picker label="Other players" value={setup.players} options={[0, 1, 2, 3, 4, 5]} onChange={(v) => setSetup({ ...setup, players: v })} />
          <p className="mt-4 text-xs font-semibold text-ink-500">
            Rules: {ctx.rules.dealerHitsSoft17 ? 'H17' : 'S17'}, double after split, late surrender, blackjack pays 3:2. You sit at third base and act last.
            {useIndices ? ' Plays are graded against basic strategy plus the Illustrious 18 and Fab 4.' : ' Plays are graded against basic strategy.'}
          </p>
        </div>
        <div className="mt-auto py-4">
          <Button full size="lg" variant="success" onClick={() => dispatch({ type: 'start', ctx })}>
            Deal me in
          </Button>
        </div>
      </div>
    );
  }

  const user = state.hands[state.userSeat] || [];
  const decksLeft = (state.cards.length - state.pos) / 52;
  const dealerUp = state.dealer.cards[0];

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-2 flex items-center justify-between text-xs font-black uppercase tracking-wider text-ink-500">
        <span>Round {state.round + 1}</span>
        <span className={state.bankroll >= 0 ? 'text-good-600' : 'text-bad-600'}>
          {state.bankroll >= 0 ? '+' : '−'}
          {Math.abs(state.bankroll)}u
        </span>
      </div>

      <div className="relative mt-2 rounded-3xl bg-felt-700 p-3 text-white shadow-inner">
        <div className="flex items-start justify-between">
          <DiscardTray cards={state.pos} maxCards={state.cards.length} height={70} />
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Dealer {state.dealer.cards.length > 0 && !state.dealer.hidden ? `· ${handValue(state.dealer.cards).total}` : ''}</div>
            <div className="mt-1 flex min-h-[90px] items-center">
              {state.dealer.cards.map((c, i) => (
                <PlayingCard key={`${c.id}-${i}`} card={c} size="sm" faceDown={i === 1 && state.dealer.hidden} className={i > 0 ? '-ml-3' : ''} />
              ))}
            </div>
          </div>
          <div className="w-16 text-right text-[10px] font-black uppercase tracking-widest text-white/60">
            {state.cards.length - state.pos} cards
            <br />
            left
          </div>
        </div>

        {state.userSeat > 0 && (
          <div className="mt-2 flex justify-around">
            {Array.from({ length: state.userSeat }, (_, seat) => (
              <div key={seat} className={`flex flex-col items-center ${state.active?.seat === seat ? 'opacity-100' : 'opacity-80'}`}>
                <div className="flex">
                  {(state.hands[seat] || []).flatMap((h, hi) =>
                    h.cards.map((c, i) => <PlayingCard key={`${hi}-${c.id}-${i}`} card={c} size="xs" className={i + hi > 0 ? '-ml-4' : ''} />),
                  )}
                </div>
                <span className="mt-1 text-[10px] font-bold text-white/70">{seatLabel(state.hands[seat])}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex justify-center gap-6">
          {user.map((h, hi) => (
            <div key={hi} className={`flex flex-col items-center rounded-2xl p-2 ${state.phase === 'play' && state.active?.idx === hi ? 'bg-white/10 ring-2 ring-xp-400' : ''}`}>
              <div className="flex">
                {h.cards.map((c, i) => (
                  <PlayingCard key={`${c.id}-${i}`} card={c} size="md" className={i > 0 ? '-ml-5' : ''} />
                ))}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs font-black">
                <span className="rounded-full bg-xp-500 px-2 py-0.5 text-white">{h.bet}u</span>
                <span className="text-white/80">{h.cards.length ? describe(h) : ''}</span>
                {h.outcome && <span className={`rounded-full px-2 py-0.5 ${h.net > 0 ? 'bg-good-500' : h.net < 0 ? 'bg-bad-500' : 'bg-ink-500'}`}>{outcomeLabel(h)}</span>}
              </div>
            </div>
          ))}
        </div>
        {state.chatter && <div className="pointer-events-none absolute right-3 top-16 max-w-[60%] animate-rise rounded-2xl bg-white/95 px-3 py-1.5 text-xs font-bold text-ink-900 shadow">{state.chatter}</div>}
      </div>

      {state.lastGrade && (
        <div className={`mt-2 flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-bold ${state.lastGrade.correct ? 'bg-good-100 text-good-600' : 'bg-bad-100 text-bad-600'}`}>
          <span>{state.lastGrade.label}</span>
          <span>
            You: {state.lastGrade.entered} · Book: {state.lastGrade.expected}
          </span>
        </div>
      )}

      <div className="mt-auto pb-4 pt-3">
        {state.phase === 'bet' && (
          <>
            <p className="mb-2 text-center text-sm font-black uppercase tracking-wide text-ink-500">Your bet</p>
            <div className="grid grid-cols-5 gap-2">
              {BET_UNITS.map((u) => (
                <ChoiceButton key={u} onClick={() => dispatch({ type: 'bet', units: u, ctx })}>
                  {u}u
                </ChoiceButton>
              ))}
            </div>
          </>
        )}
        {state.phase === 'insurance' && (
          <>
            <p className="mb-2 text-center text-sm font-black uppercase tracking-wide text-ink-500">Dealer shows an ace. Insurance?</p>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceButton onClick={() => dispatch({ type: 'insurance', take: true, ctx })}>Take</ChoiceButton>
              <ChoiceButton onClick={() => dispatch({ type: 'insurance', take: false, ctx })}>Decline</ChoiceButton>
            </div>
          </>
        )}
        {state.phase === 'play' && user[state.active.idx] && (
          <div className="grid grid-cols-3 gap-2">
            {['H', 'S', 'D', 'P', 'R'].map((code) => {
              const h = user[state.active.idx];
              const ok = code === 'D' ? canDouble(h) : code === 'P' ? canSplit(h) && user.length < 2 : code === 'R' ? canSurrender(h, ctx.rules) : true;
              return (
                <button key={code} type="button" disabled={!ok} onClick={() => dispatch({ type: 'userAction', code, ctx })} className={`btn-3d h-12 text-sm ${ok ? 'bg-white border-ink-200 text-ink-900' : 'bg-white border-ink-100 text-ink-300 opacity-40'}`}>
                  {ACTION_LABELS[code]}
                </button>
              );
            })}
          </div>
        )}
        {state.phase === 'settle' && (
          <Button full size="lg" onClick={() => dispatch({ type: 'next', ctx })}>
            {state.roundSummary} · Next hand
          </Button>
        )}
        {state.phase === 'countCheck' && (
          <div>
            <p className="mb-2 text-center text-sm font-black uppercase tracking-wide text-ink-500">
              Count check · running count{state.checkStage === 'tc' ? ' was ' : '?'}
              {state.checkStage === 'tc' && <CountChip value={state.rc} size="sm" />}
            </p>
            {state.checkStage === 'rc' ? (
              <Keypad value={input} onChange={setInput} allowHalf={hasHalfValues(system)} onSubmit={(v) => { setInput(''); dispatch({ type: 'countAnswer', value: v, ctx }); }} />
            ) : (
              <>
                <p className="mb-2 text-center text-sm font-bold text-ink-500">About {fmtDecks(decksLeft)} decks left. True count?</p>
                <div className="grid grid-cols-5 gap-2">
                  {state.tcChoices.map((v) => (
                    <ChoiceButton key={v} onClick={() => dispatch({ type: 'tcAnswer', value: v, ctx })}>
                      {formatCount(v)}
                    </ChoiceButton>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {(state.phase === 'dealing' || state.phase === 'dealerTurn') && <p className="text-center text-sm font-bold text-ink-300">{state.phase === 'dealing' ? 'Dealing…' : 'Dealer plays…'}</p>}
        {state.phase === 'done' && <p className="text-center text-sm font-bold text-ink-500">Shuffling up…</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- reducer

const CHATTER = ['Dealer: good luck everyone!', 'Player 2: hit me… no wait, stand!', 'Cocktails?', 'Dealer: insurance, anyone?', 'Player 1: that’s my card!', 'Pit boss walks by.', 'Phone buzzes.', 'Dealer: nice hand!'];

function reducer(state, action) {
  switch (action.type) {
    case 'start': {
      const { setup, cfg } = action.ctx;
      const cards = buildShoe({ decks: setup.decks });
      const cutIndex = Math.round(cards.length * setup.penetration);
      return {
        phase: 'bet',
        cards,
        pos: 0,
        cutIndex,
        rc: 0,
        round: 0,
        rounds: cfg.rounds,
        bankroll: 0,
        userSeat: setup.players,
        hands: {},
        dealer: { cards: [], hidden: true },
        queue: [],
        active: null,
        grades: { countChecks: [], bets: [], plays: [] },
        lastGrade: null,
        lastPenalised: null,
        startedAt: Date.now(),
        cardsPerRound: (setup.players + 1) * 2.8 + 2.8,
        chatter: null,
        insuranceTaken: false,
      };
    }
    case 'bet': {
      const { system, setup } = action.ctx;
      const decksLeft = (state.cards.length - state.pos) / 52;
      const tc = truncateTowardZero(trueCountOf(state.rc, decksLeft));
      const expected = recommendedBet(system, { trueCount: tc, runningCount: state.rc, decks: setup.decks });
      const grade = { id: `bet-${state.round}`, kind: 'bet', correct: action.units === expected, label: `Round ${state.round + 1} bet`, entered: `${action.units}u`, expected: `${expected}u`, note: system.balanced ? `True count was ${formatCount(tc)}.` : `Running count was ${formatCount(state.rc)}.` };
      const hands = {};
      for (let s = 0; s < state.userSeat; s++) hands[s] = [newHand(s, 1)];
      hands[state.userSeat] = [newHand(state.userSeat, action.units, true)];
      const queue = openingDealOrder(state.userSeat + 1).map((o) => ({ type: 'card', target: o.seat, hidden: !!o.hidden }));
      queue.push({ type: 'afterDeal' });
      return { ...state, phase: 'dealing', hands, dealer: { cards: [], hidden: true }, queue, grades: { ...state.grades, bets: [...state.grades.bets, grade] }, lastGrade: grade, insuranceTaken: false, chatter: null };
    }
    case 'tick':
      return tick(state, action.ctx);
    case 'insurance': {
      const { system, useIndices } = action.ctx;
      const decksLeft = (state.cards.length - state.pos) / 52;
      const tc = truncateTowardZero(trueCountOf(state.rc, decksLeft));
      const should = system.balanced ? insuranceCorrect(tc, useIndices) : false;
      const grade = { id: `ins-${state.round}`, kind: 'play', correct: action.take === should, label: 'Insurance', entered: action.take ? 'Take' : 'Decline', expected: should ? 'Take' : 'Decline', note: useIndices ? `True count ${formatCount(tc)}; the index is +3.` : 'Without an insurance index, decline.' };
      const next = { ...state, insuranceTaken: action.take, grades: { ...state.grades, plays: [...state.grades.plays, grade] }, lastGrade: grade };
      return afterInsurance(next);
    }
    case 'userAction': {
      const { rules, useIndices } = action.ctx;
      const hands = state.hands[state.userSeat].slice();
      const hand = hands[state.active.idx];
      const decksLeft = (state.cards.length - state.pos) / 52;
      const tc = truncateTowardZero(trueCountOf(state.rc, decksLeft));
      const { code: expected, deviation } = correctAction(hand, state.dealer.cards[0].rank, { rules, trueCount: tc, useIndices });
      const grade = {
        id: `play-${state.round}-${state.active.idx}-${hand.cards.length}`,
        kind: 'play',
        correct: action.code === expected,
        label: `${describe(hand)} vs ${state.dealer.cards[0].rank}`,
        entered: ACTION_LABELS[action.code],
        expected: ACTION_LABELS[expected],
        cards: [...hand.cards, state.dealer.cards[0]],
        note: deviation ? `Index play: ${deviation.action} ${deviation.when === 'atOrAbove' ? 'at or above' : 'below'} ${formatCount(deviation.index)} (true count ${formatCount(tc)}).` : 'Basic strategy.',
      };
      let pos = state.pos;
      let rc = state.rc;
      const draw = () => {
        const c = state.cards[pos++];
        rc += cardValue(action.ctx.system, c);
        return c;
      };
      const out = applyAction(hand, action.code, draw);
      hands.splice(state.active.idx, 1, ...out);
      let next = { ...state, pos, rc: round2(rc), hands: { ...state.hands, [state.userSeat]: hands }, grades: { ...state.grades, plays: [...state.grades.plays, grade] }, lastGrade: grade };
      // Move to the next unfinished user hand, or on to the dealer.
      const idx = hands.findIndex((h) => !h.done);
      if (idx >= 0) next = { ...next, active: { seat: state.userSeat, idx } };
      else next = { ...next, phase: 'dealerTurn', active: null, queue: [{ type: 'reveal' }] };
      return next;
    }
    case 'next': {
      const round = state.round + 1;
      const { cfg } = action.ctx;
      const ended = state.pos >= state.cutIndex || (cfg.rounds !== 'shoe' && round >= cfg.rounds);
      const check = round % cfg.checkEvery === 0 || ended;
      if (check) return { ...state, round, phase: 'countCheck', checkStage: 'rc', endAfterCheck: ended, lastGrade: null };
      return { ...state, round, phase: 'bet', lastGrade: null, hands: {}, dealer: { cards: [], hidden: true } };
    }
    case 'countAnswer': {
      const { system } = action.ctx;
      const grade = { id: `rc-${state.round}`, kind: 'count', correct: action.value === state.rc, label: `Count check after round ${state.round}`, entered: formatCount(action.value), expected: formatCount(state.rc), note: 'Running count.' };
      const next = { ...state, grades: { ...state.grades, countChecks: [...state.grades.countChecks, grade] }, lastGrade: grade };
      if (system.balanced) {
        const decksLeft = (state.cards.length - state.pos) / 52;
        const tc = truncateTowardZero(trueCountOf(state.rc, decksLeft));
        const choices = [...new Set([tc - 2, tc - 1, tc, tc + 1, tc + 2])];
        return { ...next, checkStage: 'tc', tcChoices: choices, tcTruth: tc };
      }
      return finishCheck(next);
    }
    case 'tcAnswer': {
      const grade = { id: `tc-${state.round}`, kind: 'count', correct: action.value === state.tcTruth, label: `True count after round ${state.round}`, entered: formatCount(action.value), expected: formatCount(state.tcTruth), note: `${formatCount(state.rc)} ÷ ${fmtDecks((state.cards.length - state.pos) / 52)} decks.` };
      return finishCheck({ ...state, grades: { ...state.grades, countChecks: [...state.grades.countChecks, grade] }, lastGrade: grade });
    }
    case 'penalised':
      return { ...state, lastPenalised: action.id };
    case 'finished':
      return { ...state, finished: true };
    default:
      return state;
  }
}

function finishCheck(state) {
  if (state.endAfterCheck) return { ...state, phase: 'done' };
  return { ...state, phase: 'bet', hands: {}, dealer: { cards: [], hidden: true } };
}

function afterInsurance(state) {
  const dealerBJ = isBlackjack({ cards: state.dealer.cards, fromSplit: false });
  if (dealerBJ) return { ...state, phase: 'dealerTurn', queue: [{ type: 'reveal' }] };
  return startPlay(state);
}

function startPlay(state) {
  if (state.userSeat === 0) {
    const user = state.hands[0];
    if (user.every((h) => h.done || isBlackjack(h))) return { ...state, phase: 'dealerTurn', active: null, queue: [{ type: 'reveal' }] };
    return { ...state, phase: 'play', active: { seat: 0, idx: 0 }, queue: [] };
  }
  return { ...state, phase: 'dealing', active: { seat: 0, idx: 0 }, queue: [{ type: 'auto' }] };
}

function tick(state, ctx) {
  const [head, ...rest] = state.queue;
  const { system, rules, cfg } = ctx;
  let s = { ...state, queue: rest };
  const draw = () => {
    const c = s.cards[s.pos];
    s = { ...s, pos: s.pos + 1 };
    return c;
  };
  const count = (c) => {
    s = { ...s, rc: round2(s.rc + cardValue(system, c)) };
  };
  if (cfg.distract && Math.random() < 0.18) s = { ...s, chatter: CHATTER[Math.floor(Math.random() * CHATTER.length)] };
  else if (s.chatter && Math.random() < 0.4) s = { ...s, chatter: null };

  switch (head.type) {
    case 'card': {
      const c = draw();
      if (head.target === 'dealer') {
        s = { ...s, dealer: { ...s.dealer, cards: [...s.dealer.cards, c] } };
        if (!head.hidden) count(c);
      } else {
        const hands = s.hands[head.target].slice();
        hands[0] = { ...hands[0], cards: [...hands[0].cards, c] };
        s = { ...s, hands: { ...s.hands, [head.target]: hands } };
        count(c);
      }
      return s;
    }
    case 'afterDeal': {
      const up = s.dealer.cards[0];
      if (up.rank === 'A') return { ...s, phase: 'insurance' };
      if (isBlackjack({ cards: s.dealer.cards, fromSplit: false })) return { ...s, phase: 'dealerTurn', queue: [{ type: 'reveal' }] };
      return startPlay(s);
    }
    case 'auto': {
      const seat = s.active.seat;
      const hands = s.hands[seat].slice();
      const h = hands[0];
      if (!h.done && !isBlackjack(h)) {
        const code = basicStrategyAction(h.cards, s.dealer.cards[0].rank, rules, { double: h.cards.length === 2, split: false, surrender: false });
        let drawn = null;
        const out = applyAction(h, code, () => {
          drawn = draw();
          return drawn;
        })[0];
        if (drawn) count(drawn);
        hands[0] = out;
        s = { ...s, hands: { ...s.hands, [seat]: hands } };
        if (!out.done) return { ...s, queue: [{ type: 'auto' }, ...s.queue] };
      }
      const nextSeat = seat + 1;
      if (nextSeat < s.userSeat) return { ...s, active: { seat: nextSeat, idx: 0 }, queue: [{ type: 'auto' }, ...s.queue] };
      const user = s.hands[s.userSeat];
      if (user.every((x) => x.done || isBlackjack(x))) return { ...s, phase: 'dealerTurn', active: null, queue: [{ type: 'reveal' }] };
      return { ...s, phase: 'play', active: { seat: s.userSeat, idx: 0 }, queue: [] };
    }
    case 'reveal': {
      const hole = s.dealer.cards[1];
      count(hole);
      s = { ...s, dealer: { ...s.dealer, hidden: false } };
      return { ...s, queue: [{ type: 'dealerDraw' }] };
    }
    case 'dealerDraw': {
      const live = Object.values(s.hands).flat().some((h) => !h.surrendered && !handValue(h.cards).bust && !isBlackjack(h));
      const dealerBJ = isBlackjack({ cards: s.dealer.cards, fromSplit: false });
      if (live && !dealerBJ) {
        const drawn = dealerDraws(s.dealer.cards, draw, rules);
        if (drawn.length) {
          // Reveal one card per tick for a natural rhythm.
          const first = drawn[0];
          s = { ...s, pos: state.pos + 1 };
          count(first);
          return { ...s, dealer: { ...s.dealer, cards: [...s.dealer.cards, first] }, queue: [{ type: 'dealerDraw' }] };
        }
      }
      return settle(s);
    }
    default:
      return s;
  }
}

function settle(state) {
  const dealerBJ = isBlackjack({ cards: state.dealer.cards, fromSplit: false });
  const hands = {};
  let net = 0;
  for (const [seat, list] of Object.entries(state.hands)) {
    hands[seat] = list.map((h) => {
      const r = settleHand(h, state.dealer.cards, dealerBJ);
      if (h.isUser) net += r.net;
      return { ...h, outcome: r.outcome, net: r.net, done: true };
    });
  }
  if (state.insuranceTaken) {
    const bet = state.hands[state.userSeat][0].bet / 2;
    net += dealerBJ ? bet * 2 : -bet;
  }
  const summary = net > 0 ? `Won ${net}u` : net < 0 ? `Lost ${Math.abs(net)}u` : 'Push';
  return { ...state, phase: 'settle', hands, bankroll: round2(state.bankroll + net), roundSummary: summary, queue: [] };
}

// ---------------------------------------------------------------- helpers

function round2(n) {
  return Math.round(n * 2) / 2;
}
function ratio(list) {
  return list.length ? list.filter((g) => g.correct).length / list.length : null;
}
function fmtDecks(d) {
  const r = Math.max(0.5, Math.round(d * 2) / 2);
  return Number.isInteger(r) ? `${r}` : `${r}`.replace('.5', '½');
}
function describe(h) {
  if (!h.cards.length) return '';
  if (isBlackjack(h)) return 'Blackjack!';
  const v = handValue(h.cards);
  if (v.bust) return `Bust (${v.total})`;
  return `${v.soft ? 'Soft ' : ''}${v.total}`;
}
function seatLabel(list) {
  if (!list || !list[0] || !list[0].cards.length) return '';
  const h = list[0];
  if (h.outcome) return outcomeLabel(h);
  return describe(h);
}
function outcomeLabel(h) {
  return { win: 'Win', lose: 'Lose', push: 'Push', bust: 'Bust', blackjack: 'BJ 3:2', surrender: 'Surr.' }[h.outcome] || '';
}

function Picker({ label, value, options, onChange, fmt = (v) => String(v) }) {
  return (
    <div className="mt-4">
      <div className="text-[11px] font-black uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => onChange(o)} className={`rounded-xl border-2 px-3 py-1.5 text-sm font-black ${o === value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-100 bg-white text-ink-700'}`}>
            {fmt(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

export { cardLabel };
