'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { ReconnectingClient } = require('../src/connection');

test('first retry waits exactly the base delay', () => {
  const client = new ReconnectingClient({ baseReconnectDelayMs: 1000 });
  assert.equal(client.nextReconnectDelay(1), 1000);
});

test('delay doubles every attempt (exponential)', () => {
  const client = new ReconnectingClient({ baseReconnectDelayMs: 1000 });
  assert.equal(client.nextReconnectDelay(2), 2000);
  assert.equal(client.nextReconnectDelay(3), 4000);
  assert.equal(client.nextReconnectDelay(4), 8000);
});

test('delay is capped at maxReconnectDelayMs', () => {
  const client = new ReconnectingClient({
    baseReconnectDelayMs: 1000,
    maxReconnectDelayMs: 5000,
  });
  assert.equal(client.nextReconnectDelay(5), 5000);
  assert.equal(client.nextReconnectDelay(9), 5000);
});

test('retry delays follow base * 2^(attempt - 1) until the cap', () => {
  const client = new ReconnectingClient({
    baseReconnectDelayMs: 250,
    maxReconnectDelayMs: 30000,
  });
  const expected = [250, 500, 1000, 2000, 4000, 8000, 16000];
  expected.forEach((delay, index) => {
    assert.equal(client.nextReconnectDelay(index + 1), delay);
  });
  // 32000 exceeds the cap, so the sequence clamps from here on.
  assert.equal(client.nextReconnectDelay(expected.length + 1), 30000);
  assert.equal(client.nextReconnectDelay(expected.length + 2), 30000);
});

test('large attempt numbers clamp to the cap instead of overflowing', () => {
  const client = new ReconnectingClient({
    baseReconnectDelayMs: 1000,
    maxReconnectDelayMs: 30000,
  });
  assert.equal(client.nextReconnectDelay(2000), 30000);
});

test('retry budget is respected', () => {
  const client = new ReconnectingClient({ maxRetries: 5 });
  assert.equal(client.shouldRetry(5), true);
  assert.equal(client.shouldRetry(6), false);
});

test('rejects non-positive attempt', () => {
  const client = new ReconnectingClient();
  assert.throws(() => client.nextReconnectDelay(0), RangeError);
});