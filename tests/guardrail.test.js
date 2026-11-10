import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseModelReply, buildSystemInstruction, validateUserInput, OFF_TOPIC_TOKEN, OFF_TOPIC_REPLY } from '../assets/js/guardrail.js';
import { DOMAINS } from '../assets/js/config.js';

test('маркер OFF_TOPIC распознаётся во всех типичных обёртках', () => {
  for (const reply of ['[OFF_TOPIC]', ' [OFF_TOPIC]\n', '`[OFF_TOPIC]`', '"[OFF_TOPIC]"', '**[OFF_TOPIC]**', '[off_topic].', 'OFF_TOPIC', '[OFF_TOPIC] Извините, не могу.']) {
    const r = parseModelReply(reply);
    assert.equal(r.offTopic, true, `не распознан: ${JSON.stringify(reply)}`);
    assert.equal(r.text, OFF_TOPIC_REPLY);
  }
});

test('содержательный ответ проходит без изменений', () => {
  const answer = 'Используйте Weighted Normals и Auto Smooth 30°.';
  assert.deepEqual(parseModelReply(answer), { offTopic: false, text: answer });
});

test('маркер внутри смешанного ответа вырезается', () => {
  const r = parseModelReply(`Про шейдер: используйте pow(1 - NdotV, 5).\n${OFF_TOPIC_TOKEN}`);
  assert.equal(r.offTopic, false);
  assert.ok(!r.text.includes(OFF_TOPIC_TOKEN));
});

test('пустой ответ считается отказом', () => {
  assert.equal(parseModelReply('   ').offTopic, true);
  assert.equal(parseModelReply(null).offTopic, true);
});

test('системная инструкция для каждой дисциплины содержит персону, политику и маркер', () => {
  for (const [name, d] of Object.entries(DOMAINS)) {
    const si = buildSystemInstruction(name);
    assert.ok(si.startsWith(d.persona), name);
    assert.ok(si.includes(OFF_TOPIC_TOKEN), name);
    assert.ok(si.includes('Правило отказа'), name);
    assert.ok(si.includes('Безопасность'), name);
  }
  assert.throws(() => buildSystemInstruction('Cooking'));
});

test('валидация ввода: пустой, длинный, с вложением', () => {
  assert.deepEqual(validateUserInput('   ', { maxChars: 10 }), { ok: false, reason: 'empty' });
  assert.deepEqual(validateUserInput('', { maxChars: 10, hasAttachments: true }), { ok: true, text: '' });
  assert.deepEqual(validateUserInput('x'.repeat(11), { maxChars: 10 }), { ok: false, reason: 'too_long' });
  assert.deepEqual(validateUserInput('  UV  ', { maxChars: 10 }), { ok: true, text: 'UV' });
});
