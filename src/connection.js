'use strict';

/**
 * ReconnectingClient schedules reconnection attempts after a disconnect.
 *
 * Desired behavior: exponential backoff. The first retry waits exactly
 * `baseReconnectDelayMs`; each subsequent attempt doubles the previous
 * delay, capped at `maxReconnectDelayMs`.
 */
class ReconnectingClient {
  constructor(options = {}) {
    this.baseReconnectDelayMs = options.baseReconnectDelayMs ?? 1000;
    this.maxReconnectDelayMs = options.maxReconnectDelayMs ?? 30000;
    this.maxRetries = options.maxRetries ?? 5;
  }

  /**
   * Delay in milliseconds before retry number `attempt` (1-based).
   */
  nextReconnectDelay(attempt) {
    if (attempt < 1) {
      throw new RangeError('attempt must be >= 1');
    }
    return Math.min(
      this.baseReconnectDelayMs * 2 ** (attempt - 1),
      this.maxReconnectDelayMs,
    );
  }

  shouldRetry(attempt) {
    return attempt <= this.maxRetries;
  }
}

module.exports = { ReconnectingClient };