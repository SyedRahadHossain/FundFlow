/**
 * Whether a failed search is worth trying again.
 *
 * The server is a serverless function, so the first request after a deploy
 * pays for the wake-up. A blip there should not leave the reader looking
 * at a failure page whose API is actually fine. One retry, then the honest
 * error.
 */

/** How long to wait before the retry: long enough for a cold start. */
export const SEARCH_RETRY_DELAY_MS = 1500;

/**
 * The attempt number is the count of failures so far.
 *
 * 0 means the first attempt failed, which is retried. 1 means the retry
 * failed too, and the reader is told.
 */
export function searchOutcome(attempt) {
  return attempt < 1 ? 'retry' : 'fail';
}
