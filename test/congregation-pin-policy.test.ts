import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MIN_CONGREGATION_PIN_CHARS,
  countCongregationPinChars,
  isValidCongregationPinLength,
  generateSecureCongregationPin,
} from '../src/utils/theocraticSecurity.ts';

test('el mínimo del PIN de congregación son 8 caracteres reales', () => {
  assert.equal(MIN_CONGREGATION_PIN_CHARS, 8);
});

test('el guion de formato no cuenta como carácter', () => {
  assert.equal(countCongregationPinChars('ABCD-EFG'), 7);
  assert.equal(isValidCongregationPinLength('ABCD-EFG'), false); // antes pasaba por contar el guion
  assert.equal(isValidCongregationPinLength('ABCD-EFGH'), true);
  assert.equal(isValidCongregationPinLength('abcdefgh'), true);
  assert.equal(isValidCongregationPinLength(' ab cd-ef gh '), true);
});

test('PINs cortos, vacíos o con solo símbolos son inválidos', () => {
  for (const bad of ['', '   ', '----', '1234', 'AB-12', '!!!!!!!!', null as any, undefined as any]) {
    assert.equal(isValidCongregationPinLength(bad), false, `debería ser inválido: ${String(bad)}`);
  }
});

test('el generador siempre produce un PIN válido', () => {
  for (let i = 0; i < 200; i++) {
    const pin = generateSecureCongregationPin();
    assert.equal(isValidCongregationPinLength(pin), true, pin);
    assert.equal(countCongregationPinChars(pin), 8);
  }
});
