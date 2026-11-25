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

test('delay sequence follows base * 2^(attempt-1)', () => {
  const client = new ReconnectingClient({
    baseReconnectDelayMs: 125,
    maxReconnectDelayMs: 60000,
  });
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((attempt) => client.nextReconnectDelay(attempt)),
    [125, 250, 500, 1000, 2000]
  );
});

test('delay is capped at maxReconnectDelayMs', () => {
  const client = new ReconnectingClient({
    baseReconnectDelayMs: 1000,
    maxReconnectDelayMs: 5000,
  });
  assert.equal(client.nextReconnectDelay(5), 5000);
  assert.equal(client.nextReconnectDelay(9), 5000);
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