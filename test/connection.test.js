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

test('exponential growth is capped without over-delaying earlier attempts', () => {
  const client = new ReconnectingClient({
    baseReconnectDelayMs: 1000,
    maxReconnectDelayMs: 5000,
  });
  assert.equal(client.nextReconnectDelay(3), 4000);
  assert.equal(client.nextReconnectDelay(4), 5000);
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