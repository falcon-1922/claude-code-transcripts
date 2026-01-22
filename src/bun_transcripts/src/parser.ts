/**
 * Session file parsing - supports JSON and JSONL formats
 */

import { homedir } from "node:os";
import { join, basename } from "node:path";
import type {
  SessionData,
  LogEntry,
  ContentBlock,
  SessionInfo,
  ProjectInfo,
} from "./types";

const LONG_TEXT_THRESHOLD = 300;

/**
 * Extract plain text from message content.
 * Handles both string content (older format) and array content (newer format).
 */
export function extractTextFromContent(
  content: string | ContentBlock[]
): string {
  if (typeof content === "string") {
    return content.trim();
  }
  if (Array.isArray(content)) {
    const texts: string[] = [];
    for (const block of content) {
      if (
        typeof block === "object" &&
        block !== null &&
        "type" in block &&
        block.type === "text" &&
        "text" in block
      ) {
        const text = (block as { type: "text"; text: string }).text;
        if (text) {
          texts.push(text);
        }
      }
    }
    return texts.join(" ").trim();
  }
  return "";
}

/**
 * Parse a JSONL file and convert to standard session format.
 */
async function parseJsonlFile(filepath: string): Promise<SessionData> {
  const file = Bun.file(filepath);
  const text = await file.text();
  const lines = text.split("\n");
  const loglines: LogEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const obj = JSON.parse(trimmed);
      const entryType = obj.type;

      // Skip non-message entries
      if (entryType !== "user" && entryType !== "assistant") {
        continue;
      }

      const entry: LogEntry = {
        type: entryType,
        timestamp: obj.timestamp || "",
        message: obj.message || {},
      };

      // Preserve isCompactSummary if present
      if (obj.isCompactSummary) {
        entry.isCompactSummary = true;
      }

      loglines.push(entry);
    } catch {
      // Skip invalid JSON lines
      continue;
    }
  }

  return { loglines };
}

/**
 * Parse a session file and return normalized data.
 * Supports both JSON and JSONL formats.
 */
export async function parseSessionFile(filepath: string): Promise<SessionData> {
  if (filepath.endsWith(".jsonl")) {
    return parseJsonlFile(filepath);
  }

  // Standard JSON format
  const file = Bun.file(filepath);
  const data = await file.json();
  return data as SessionData;
}

/**
 * Get summary from a JSONL file.
 */
async function getJsonlSummary(
  filepath: string,
  maxLength: number
): Promise<string> {
  try {
    const file = Bun.file(filepath);
    const text = await file.text();
    const lines = text.split("\n");

    // First pass: look for summary type entries
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const obj = JSON.parse(trimmed);
        if (obj.type === "summary" && obj.summary) {
          const summary = obj.summary;
          if (summary.length > maxLength) {
            return summary.slice(0, maxLength - 3) + "...";
          }
          return summary;
        }
      } catch {
        continue;
      }
    }

    // Second pass: find first non-meta user message
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const obj = JSON.parse(trimmed);
        if (
          obj.type === "user" &&
          !obj.isMeta &&
          obj.message?.content
        ) {
          const content = obj.message.content;
          const text = extractTextFromContent(content);
          if (text && !text.startsWith("<")) {
            if (text.length > maxLength) {
              return text.slice(0, maxLength - 3) + "...";
            }
            return text;
          }
        }
      } catch {
        continue;
      }
    }
  } catch {
    // Ignore errors
  }

  return "(no summary)";
}

/**
 * Extract a human-readable summary from a session file.
 * Supports both JSON and JSONL formats.
 */
export async function getSessionSummary(
  filepath: string,
  maxLength = 200
): Promise<string> {
  try {
    if (filepath.endsWith(".jsonl")) {
      return await getJsonlSummary(filepath, maxLength);
    }

    // For JSON files, try to get first user message
    const file = Bun.file(filepath);
    const data = await file.json();
    const loglines = data.loglines || [];

    for (const entry of loglines) {
      if (entry.type === "user") {
        const content = entry.message?.content || "";
        const text = extractTextFromContent(content);
        if (text) {
          if (text.length > maxLength) {
            return text.slice(0, maxLength - 3) + "...";
          }
          return text;
        }
      }
    }

    return "(no summary)";
  } catch {
    return "(no summary)";
  }
}

/**
 * Convert encoded folder name to readable project name.
 */
export function getProjectDisplayName(folderName: string): string {
  // Common path prefixes to strip
  const prefixesToStrip = [
    "-home-",
    "-mnt-c-Users-",
    "-mnt-c-users-",
    "-Users-",
  ];

  let name = folderName;
  for (const prefix of prefixesToStrip) {
    if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
      name = name.slice(prefix.length);
      break;
    }
  }

  // Split on dashes and find meaningful parts
  const parts = name.split("-");

  // Common intermediate directories to skip
  const skipDirs = new Set([
    "projects",
    "code",
    "repos",
    "src",
    "dev",
    "work",
    "documents",
  ]);

  const meaningfulParts: string[] = [];
  let foundProject = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    // Skip the first part if it looks like a username (before common dirs)
    if (i === 0 && !foundProject) {
      const remaining = parts.slice(i + 1).map((p) => p.toLowerCase());
      if (remaining.some((d) => skipDirs.has(d))) {
        continue;
      }
    }

    if (skipDirs.has(part.toLowerCase())) {
      foundProject = true;
      continue;
    }

    meaningfulParts.push(part);
    foundProject = true;
  }

  if (meaningfulParts.length > 0) {
    return meaningfulParts.join("-");
  }

  // Fallback: return last non-empty part or original
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i]) {
      return parts[i];
    }
  }

  return folderName;
}

/**
 * Find recent JSONL session files in the given folder.
 * @param folder - The folder to search
 * @param limit - Maximum sessions to return (0 or undefined = no limit)
 */
export async function findLocalSessions(
  folder: string,
  limit?: number
): Promise<SessionInfo[]> {
  const glob = new Bun.Glob("**/*.jsonl");
  const results: SessionInfo[] = [];

  try {
    for await (const path of glob.scan({ cwd: folder, absolute: true })) {
      const filename = basename(path);

      // Skip agent files
      if (filename.startsWith("agent-")) {
        continue;
      }

      const summary = await getSessionSummary(path);

      // Skip boring/empty sessions
      if (
        summary.toLowerCase() === "warmup" ||
        summary === "(no summary)"
      ) {
        continue;
      }

      const stat = await Bun.file(path).stat();
      if (stat) {
        results.push({
          path,
          summary,
          mtime: stat.mtime?.getTime() ?? 0,
          size: stat.size,
        });
      }
    }
  } catch {
    return [];
  }

  // Sort by modification time, oldest first (most recent last)
  results.sort((a, b) => a.mtime - b.mtime);

  // Apply limit if specified (0 or undefined = no limit)
  if (limit && limit > 0) {
    return results.slice(-limit);
  }
  return results;
}

/**
 * Find all sessions in a Claude projects folder, grouped by project.
 */
export async function findAllSessions(
  folder: string,
  includeAgents = false
): Promise<ProjectInfo[]> {
  const glob = new Bun.Glob("**/*.jsonl");
  const projects = new Map<string, ProjectInfo>();

  try {
    for await (const path of glob.scan({ cwd: folder, absolute: true })) {
      const filename = basename(path);

      // Skip agent files unless requested
      if (!includeAgents && filename.startsWith("agent-")) {
        continue;
      }

      const summary = await getSessionSummary(path);

      // Skip boring sessions
      if (
        summary.toLowerCase() === "warmup" ||
        summary === "(no summary)"
      ) {
        continue;
      }

      // Get project folder
      const parts = path.split("/");
      const projectFolderIndex = parts.length - 2;
      const projectKey = parts[projectFolderIndex];
      const projectPath = parts.slice(0, projectFolderIndex + 1).join("/");

      if (!projects.has(projectKey)) {
        projects.set(projectKey, {
          name: getProjectDisplayName(projectKey),
          path: projectPath,
          sessions: [],
        });
      }

      const stat = await Bun.file(path).stat();
      if (stat) {
        projects.get(projectKey)!.sessions.push({
          path,
          summary,
          mtime: stat.mtime?.getTime() ?? 0,
          size: stat.size,
        });
      }
    }
  } catch {
    return [];
  }

  // Sort sessions within each project by mtime (most recent first)
  for (const project of projects.values()) {
    project.sessions.sort((a, b) => b.mtime - a.mtime);
  }

  // Convert to list and sort projects by most recent session
  const result = Array.from(projects.values());
  result.sort((a, b) => {
    const aTime = a.sessions[0]?.mtime ?? 0;
    const bTime = b.sessions[0]?.mtime ?? 0;
    return bTime - aTime;
  });

  return result;
}

/**
 * Get the default Claude projects folder path.
 */
export function getDefaultProjectsFolder(): string {
  return join(homedir(), ".claude", "projects");
}

/**
 * Detect GitHub repo from git push output in tool results.
 */
export function detectGithubRepo(loglines: LogEntry[]): string | null {
  const pattern = /github\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)\/pull\/new\//;

  for (const entry of loglines) {
    const content = entry.message?.content;
    if (!Array.isArray(content)) continue;

    for (const block of content) {
      if (
        typeof block === "object" &&
        block !== null &&
        "type" in block &&
        block.type === "tool_result"
      ) {
        const resultContent = (block as { content?: string | unknown[] })
          .content;
        if (typeof resultContent === "string") {
          const match = pattern.exec(resultContent);
          if (match) {
            return match[1];
          }
        }
      }
    }
  }

  return null;
}
