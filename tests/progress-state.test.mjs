import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProgress } from '../progress-state.js';

const defaults = () => ({
  version: 1, name: 'Chefe', startDate: '2026-11-01', streak: 0, lastStudy: '',
  coins: 0, xp: 0, hearts: 5, heartsDay: '2026-11-01', freezes: 0,
  completed: [], topics: {}, notes: {}, inventory: [], quote: false,
  marathon: false, sound: false, history: [], lastBossScore: 0
});
const restore = data => normalizeProgress(data, defaults(), ['mfa', 'pim'], ['skin_g']);

test('invalid storage versions cannot replace defaults', () => {
  for (const value of [null, [], {}, { version: 2 }]) {
    assert.throws(() => restore(value), /Unsupported progress format/);
  }
});

test('malformed nested backup fields cannot break progress rendering', () => {
  const result = restore({
    version: 1, name: null, coins: -200, xp: Infinity, hearts: 'five',
    completed: ['1-1', '1-1', '31-3', null, '__proto__'],
    topics: { mfa: null, pim: { right: '100', wrong: -3, box: 99, due: '2026-02-30' } },
    notes: null, history: [{ id: 'mfa', correct: 'yes' }, null],
    inventory: ['skin_g', 'unknown'], startDate: 'tomorrow'
  });
  assert.equal(result.name, 'Chefe');
  assert.equal(result.coins, 0);
  assert.equal(result.xp, 0);
  assert.equal(result.hearts, 5);
  assert.deepEqual(result.completed, ['1-1']);
  assert.deepEqual(result.topics.pim, { right: 0, wrong: 0, box: 4, due: '' });
  assert.deepEqual(result.notes, {});
  assert.deepEqual(result.history, []);
  assert.deepEqual(result.inventory, ['skin_g']);
  assert.equal(result.startDate, '2026-11-01');
});

test('valid backups preserve studied topics, notes, dates and attempts', () => {
  const result = restore({
    version: 1, name: 'Estudante', startDate: '2026-10-31', lastStudy: '2026-11-01',
    heartsDay: '2026-11-01', xp: 240, coins: 35, hearts: 3, streak: 2, freezes: 1,
    quote: true, sound: true, marathon: false, lastBossScore: 90,
    completed: ['1-1', '1-2'], inventory: ['skin_g'],
    topics: { mfa: { right: 3, wrong: 1, box: 2, due: '2026-11-04' } },
    notes: { mfa: 'Ativar MFA' },
    history: [{ id: 'mfa', correct: true, date: '2026-11-01', at: 1793491200000 }]
  });
  assert.equal(result.name, 'Estudante');
  assert.equal(result.xp, 240);
  assert.equal(result.topics.mfa.right, 3);
  assert.equal(result.notes.mfa, 'Ativar MFA');
  assert.equal(result.history.length, 1);
  assert.deepEqual(result.completed, ['1-1', '1-2']);
});

test('unknown and prototype keys are discarded from user-supplied records', () => {
  const data = JSON.parse('{"version":1,"topics":{"__proto__":{"polluted":true},"mfa":{"right":2}},"notes":{"__proto__":"unsafe","pim":"ok"}}');
  const result = restore(data);
  assert.equal({}.polluted, undefined);
  assert.deepEqual(Object.keys(result.topics), ['mfa']);
  assert.deepEqual(Object.keys(result.notes), ['pim']);
  assert.equal(result.notes.pim, 'ok');
});
