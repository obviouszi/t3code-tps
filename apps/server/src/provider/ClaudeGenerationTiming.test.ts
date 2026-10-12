import { describe, expect, it } from "vite-plus/test";

import {
  trackClaudeGenerationTiming,
  type ClaudeGenerationTiming,
} from "./ClaudeGenerationTiming.ts";

function timeEvents(events: ReadonlyArray<readonly [type: string, atMs: number]>) {
  const timing: ClaudeGenerationTiming = {
    responseStartedAtMs: null,
    durationMs: 0,
    coversAllOutput: true,
  };
  for (const [type, atMs] of events) {
    trackClaudeGenerationTiming(timing, type, atMs);
  }
  return timing.durationMs;
}

describe("trackClaudeGenerationTiming", () => {
  it("counts each response from its first content to its end, skipping first-token waits and tool runs", () => {
    expect(
      timeEvents([
        ["message_start", 0],
        // 800ms wait for the first token.
        ["content_block_start", 800],
        ["content_block_delta", 1_500],
        ["content_block_stop", 1_600],
        // A tool call's arguments are written inside the same response.
        ["content_block_start", 1_600],
        ["content_block_delta", 2_700],
        ["content_block_stop", 2_800],
        ["message_delta", 2_800],
        ["message_stop", 2_810],
        // The tool runs for 10s before the next response.
        ["message_start", 12_810],
        ["content_block_start", 13_300],
        ["content_block_stop", 13_800],
        ["message_delta", 13_800],
        ["message_stop", 13_800],
      ]),
    ).toBe(2_000 + 500);
  });

  it("drops a response that never finished", () => {
    expect(
      timeEvents([
        ["message_start", 0],
        ["content_block_start", 100],
        ["message_start", 5_000],
        ["content_block_start", 5_200],
        ["message_stop", 6_200],
      ]),
    ).toBe(1_000);
  });
});
