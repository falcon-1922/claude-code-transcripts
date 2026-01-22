#!/usr/bin/env bun
/**
 * bun-transcripts - Convert Claude Code session JSON to mobile-friendly HTML pages
 *
 * This is the entry point for both CLI and programmatic usage.
 */

// CLI entry point
import { run } from "./cli";

// Export public API for programmatic usage
export {
  parseSessionFile,
  extractTextFromContent,
  getSessionSummary,
  findLocalSessions,
  findAllSessions,
  getDefaultProjectsFolder,
  detectGithubRepo,
  getProjectDisplayName,
} from "./parser";

export {
  generateHtml,
  generateHtmlFromSessionData,
  generateBatchHtml,
  injectGistPreviewJs,
} from "./renderer";

export type {
  SessionData,
  LogEntry,
  Message,
  ContentBlock,
  TextBlock,
  ThinkingBlock,
  ToolUseBlock,
  ToolResultBlock,
  ImageBlock,
  SessionInfo,
  ProjectInfo,
  GenerateOptions,
  BatchGenerateOptions,
  BatchGenerateResult,
} from "./types";

// Run CLI if this is the main module
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
