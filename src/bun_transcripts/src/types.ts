/**
 * Type definitions for Claude Code transcript conversion
 */

// Content block types
export interface TextBlock {
  type: "text";
  text: string;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string | ContentBlock[];
  is_error?: boolean;
}

export interface ImageSource {
  type: "base64";
  media_type: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
  data: string;
}

export interface ImageBlock {
  type: "image";
  source: ImageSource;
}

export type ContentBlock =
  | TextBlock
  | ThinkingBlock
  | ToolUseBlock
  | ToolResultBlock
  | ImageBlock;

// Message types
export interface Message {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export interface LogEntry {
  type: "user" | "assistant" | "summary" | "file-history-snapshot";
  timestamp: string;
  message?: Message;
  summary?: string;
  isMeta?: boolean;
  isCompactSummary?: boolean;
}

export interface SessionData {
  loglines: LogEntry[];
}

// Tool input types
export interface BashToolInput {
  command: string;
  description?: string;
}

export interface WriteToolInput {
  file_path: string;
  content: string;
}

export interface EditToolInput {
  file_path: string;
  old_string: string;
  new_string: string;
  replace_all?: boolean;
}

export interface TodoItem {
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm?: string;
}

export interface TodoWriteToolInput {
  todos: TodoItem[];
}

// Conversation and analysis types
export interface Conversation {
  userText: string;
  timestamp: string;
  messages: Array<{
    logType: string;
    messageJson: string;
    timestamp: string;
  }>;
  isContinuation: boolean;
}

export interface ConversationAnalysis {
  toolCounts: Record<string, number>;
  longTexts: string[];
  commits: Array<{
    hash: string;
    message: string;
    timestamp: string;
  }>;
}

// Session discovery types
export interface SessionInfo {
  path: string;
  summary: string;
  mtime: number;
  size: number;
}

export interface ProjectInfo {
  name: string;
  path: string;
  sessions: SessionInfo[];
}

// Generation options
export interface GenerateOptions {
  outputDir: string;
  githubRepo?: string;
}

export interface BatchGenerateOptions extends GenerateOptions {
  sourceFolder: string;
  includeAgents?: boolean;
  progressCallback?: (
    projectName: string,
    sessionName: string,
    current: number,
    total: number
  ) => void;
}

export interface BatchGenerateResult {
  totalProjects: number;
  totalSessions: number;
  failedSessions: Array<{
    project: string;
    session: string;
    error: string;
  }>;
  outputDir: string;
}

// Timeline item for index page
export interface TimelineItem {
  timestamp: string;
  type: "prompt" | "commit";
  html: string;
}

// Pagination info
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
}
