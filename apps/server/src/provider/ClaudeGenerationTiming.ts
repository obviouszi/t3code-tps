/** A turn's running total of time Claude spent emitting output. */
export interface ClaudeGenerationTiming {
  responseStartedAtMs: number | null;
  durationMs: number;
  /** False once the turn's result can count output this total did not time, or the reverse. */
  coversAllOutput: boolean;
}

/**
 * Feed every root stream event of a turn, in order, with the time it arrived.
 * Each response counts from its first content block to its end, so the wait
 * for the first token and the tool runs between responses are left out.
 */
export function trackClaudeGenerationTiming(
  timing: ClaudeGenerationTiming,
  eventType: string,
  arrivedAtMs: number,
): void {
  switch (eventType) {
    case "message_start":
      timing.responseStartedAtMs = null;
      return;
    case "content_block_start":
    case "content_block_delta":
      timing.responseStartedAtMs ??= arrivedAtMs;
      return;
    case "message_delta":
    case "message_stop":
      if (timing.responseStartedAtMs !== null) {
        timing.durationMs += Math.max(0, arrivedAtMs - timing.responseStartedAtMs);
        timing.responseStartedAtMs = null;
      }
      return;
  }
}
