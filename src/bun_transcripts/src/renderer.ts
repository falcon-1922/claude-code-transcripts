/**
 * HTML rendering for Claude Code sessions
 */

import { marked } from "marked";
import { join, basename } from "node:path";
import type {
  SessionData,
  LogEntry,
  ContentBlock,
  Conversation,
  ConversationAnalysis,
  TimelineItem,
  GenerateOptions,
  BatchGenerateOptions,
  BatchGenerateResult,
  TodoItem,
} from "./types";
import {
  parseSessionFile,
  extractTextFromContent,
  detectGithubRepo,
  findAllSessions,
} from "./parser";
import * as templates from "./templates";

const PROMPTS_PER_PAGE = 5;
const LONG_TEXT_THRESHOLD = 300;

// Regex to match git commit output: [branch hash] message
const COMMIT_PATTERN = /\[[\w\-/]+ ([a-f0-9]{7,})\] (.+?)(?:\n|$)/g;

// Module-level variable for GitHub repo
let githubRepo: string | null = null;

/**
 * Format JSON for display with proper escaping.
 */
function formatJson(obj: unknown): string {
  try {
    let data = obj;
    if (typeof obj === "string") {
      data = JSON.parse(obj);
    }
    const formatted = JSON.stringify(data, null, 2);
    return `<pre class="json">${templates.escapeHtml(formatted)}</pre>`;
  } catch {
    return `<pre>${templates.escapeHtml(String(obj))}</pre>`;
  }
}

/**
 * Render markdown text to HTML.
 */
function renderMarkdownText(text: string): string {
  if (!text) return "";
  return marked.parse(text, { async: false }) as string;
}

/**
 * Check if text looks like JSON.
 */
function isJsonLike(text: unknown): boolean {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  return (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  );
}

/**
 * Render TodoWrite tool.
 */
function renderTodoWrite(toolInput: Record<string, unknown>, toolId: string): string {
  const todos = toolInput.todos as TodoItem[] | undefined;
  if (!todos || todos.length === 0) return "";
  return templates.todoList(todos, toolId);
}

/**
 * Render Write tool.
 */
function renderWriteTool(toolInput: Record<string, unknown>, toolId: string): string {
  const filePath = (toolInput.file_path as string) || "Unknown file";
  const content = (toolInput.content as string) || "";
  return templates.writeTool(filePath, content, toolId);
}

/**
 * Render Edit tool.
 */
function renderEditTool(toolInput: Record<string, unknown>, toolId: string): string {
  const filePath = (toolInput.file_path as string) || "Unknown file";
  const oldString = (toolInput.old_string as string) || "";
  const newString = (toolInput.new_string as string) || "";
  const replaceAll = (toolInput.replace_all as boolean) || false;
  return templates.editTool(filePath, oldString, newString, replaceAll, toolId);
}

/**
 * Render Bash tool.
 */
function renderBashTool(toolInput: Record<string, unknown>, toolId: string): string {
  const command = (toolInput.command as string) || "";
  const description = (toolInput.description as string) || "";
  return templates.bashTool(command, description, toolId);
}

/**
 * Render a content block.
 */
function renderContentBlock(block: ContentBlock | unknown): string {
  if (typeof block !== "object" || block === null) {
    return `<p>${templates.escapeHtml(String(block))}</p>`;
  }

  const typedBlock = block as Record<string, unknown>;
  const blockType = typedBlock.type as string;

  if (blockType === "image") {
    const source = typedBlock.source as Record<string, unknown>;
    const mediaType = (source?.media_type as string) || "image/png";
    const data = (source?.data as string) || "";
    return templates.imageBlock(mediaType, data);
  }

  if (blockType === "thinking") {
    const contentHtml = renderMarkdownText((typedBlock.thinking as string) || "");
    return templates.thinking(contentHtml);
  }

  if (blockType === "text") {
    const contentHtml = renderMarkdownText((typedBlock.text as string) || "");
    return templates.assistantText(contentHtml);
  }

  if (blockType === "tool_use") {
    const toolName = (typedBlock.name as string) || "Unknown tool";
    const toolInput = (typedBlock.input as Record<string, unknown>) || {};
    const toolId = (typedBlock.id as string) || "";

    if (toolName === "TodoWrite") {
      return renderTodoWrite(toolInput, toolId);
    }
    if (toolName === "Write") {
      return renderWriteTool(toolInput, toolId);
    }
    if (toolName === "Edit") {
      return renderEditTool(toolInput, toolId);
    }
    if (toolName === "Bash") {
      return renderBashTool(toolInput, toolId);
    }

    const description = (toolInput.description as string) || "";
    const displayInput = Object.fromEntries(
      Object.entries(toolInput).filter(([k]) => k !== "description")
    );
    const inputJson = JSON.stringify(displayInput, null, 2);
    return templates.toolUse(toolName, description, inputJson, toolId);
  }

  if (blockType === "tool_result") {
    const content = typedBlock.content;
    const isError = (typedBlock.is_error as boolean) || false;
    let hasImages = false;
    let contentHtml: string;

    // Check for git commits and render with styled cards
    if (typeof content === "string") {
      const commits: Array<{ match: RegExpMatchArray; start: number; end: number }> = [];
      let match;
      const regex = new RegExp(COMMIT_PATTERN.source, "g");
      while ((match = regex.exec(content)) !== null) {
        commits.push({ match, start: match.index, end: regex.lastIndex });
      }

      if (commits.length > 0) {
        const parts: string[] = [];
        let lastEnd = 0;

        for (const { match, start, end } of commits) {
          const before = content.slice(lastEnd, start).trim();
          if (before) {
            parts.push(`<pre>${templates.escapeHtml(before)}</pre>`);
          }

          const commitHash = match[1];
          const commitMsg = match[2];
          parts.push(templates.commitCard(commitHash, commitMsg, githubRepo));
          lastEnd = end;
        }

        const after = content.slice(lastEnd).trim();
        if (after) {
          parts.push(`<pre>${templates.escapeHtml(after)}</pre>`);
        }

        contentHtml = parts.join("");
      } else {
        contentHtml = `<pre>${templates.escapeHtml(content)}</pre>`;
      }
    } else if (Array.isArray(content)) {
      // Handle tool result content that contains multiple blocks
      const parts: string[] = [];
      for (const item of content) {
        if (typeof item === "object" && item !== null) {
          const itemType = (item as Record<string, unknown>).type as string;
          if (itemType === "text") {
            const text = (item as Record<string, unknown>).text as string;
            if (text) {
              parts.push(`<pre>${templates.escapeHtml(text)}</pre>`);
            }
          } else if (itemType === "image") {
            const source = (item as Record<string, unknown>).source as Record<string, unknown>;
            const mediaType = (source?.media_type as string) || "image/png";
            const data = (source?.data as string) || "";
            if (data) {
              parts.push(templates.imageBlock(mediaType, data));
              hasImages = true;
            }
          } else {
            parts.push(formatJson(item));
          }
        } else {
          parts.push(`<pre>${templates.escapeHtml(String(item))}</pre>`);
        }
      }
      contentHtml = parts.length > 0 ? parts.join("") : formatJson(content);
    } else if (isJsonLike(content)) {
      contentHtml = formatJson(content);
    } else {
      contentHtml = formatJson(content);
    }

    return templates.toolResult(contentHtml, isError, hasImages);
  }

  return formatJson(block);
}

/**
 * Check if a message contains only tool_result blocks.
 */
function isToolResultMessage(messageData: Record<string, unknown>): boolean {
  const content = messageData.content;
  if (!Array.isArray(content)) return false;
  if (content.length === 0) return false;
  return content.every(
    (block) =>
      typeof block === "object" &&
      block !== null &&
      (block as Record<string, unknown>).type === "tool_result"
  );
}

/**
 * Render user message content.
 */
function renderUserMessageContent(messageData: Record<string, unknown>): string {
  const content = messageData.content;
  if (typeof content === "string") {
    if (isJsonLike(content)) {
      return templates.userContent(formatJson(content));
    }
    return templates.userContent(renderMarkdownText(content));
  }
  if (Array.isArray(content)) {
    return content.map((block) => renderContentBlock(block)).join("");
  }
  return `<p>${templates.escapeHtml(String(content))}</p>`;
}

/**
 * Render assistant message.
 */
function renderAssistantMessage(messageData: Record<string, unknown>): string {
  const content = messageData.content;
  if (!Array.isArray(content)) {
    return `<p>${templates.escapeHtml(String(content))}</p>`;
  }
  return content.map((block) => renderContentBlock(block)).join("");
}

/**
 * Create message ID from timestamp.
 */
function makeMsgId(timestamp: string): string {
  return `msg-${timestamp.replace(/:/g, "-").replace(/\./g, "-")}`;
}

/**
 * Render a message.
 */
function renderMessage(
  logType: string,
  messageJson: string,
  timestamp: string
): string {
  if (!messageJson) return "";

  let messageData: Record<string, unknown>;
  try {
    messageData = JSON.parse(messageJson);
  } catch {
    return "";
  }

  let contentHtml: string;
  let roleClass: string;
  let roleLabel: string;

  if (logType === "user") {
    contentHtml = renderUserMessageContent(messageData);
    if (isToolResultMessage(messageData)) {
      roleClass = "tool-reply";
      roleLabel = "Tool reply";
    } else {
      roleClass = "user";
      roleLabel = "User";
    }
  } else if (logType === "assistant") {
    contentHtml = renderAssistantMessage(messageData);
    roleClass = "assistant";
    roleLabel = "Assistant";
  } else {
    return "";
  }

  if (!contentHtml.trim()) return "";

  const msgId = makeMsgId(timestamp);
  return templates.message(roleClass, roleLabel, msgId, timestamp, contentHtml);
}

/**
 * Analyze conversation for stats.
 */
function analyzeConversation(
  messages: Array<{ logType: string; messageJson: string; timestamp: string }>
): ConversationAnalysis {
  const toolCounts: Record<string, number> = {};
  const longTexts: string[] = [];
  const commits: Array<{ hash: string; message: string; timestamp: string }> = [];

  for (const { logType, messageJson, timestamp } of messages) {
    if (!messageJson) continue;

    let messageData: Record<string, unknown>;
    try {
      messageData = JSON.parse(messageJson);
    } catch {
      continue;
    }

    const content = messageData.content;
    if (!Array.isArray(content)) continue;

    for (const block of content) {
      if (typeof block !== "object" || block === null) continue;
      const typedBlock = block as Record<string, unknown>;
      const blockType = typedBlock.type as string;

      if (blockType === "tool_use") {
        const toolName = (typedBlock.name as string) || "Unknown";
        toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;
      } else if (blockType === "tool_result") {
        const resultContent = typedBlock.content;
        if (typeof resultContent === "string") {
          const regex = new RegExp(COMMIT_PATTERN.source, "g");
          let match;
          while ((match = regex.exec(resultContent)) !== null) {
            commits.push({
              hash: match[1],
              message: match[2],
              timestamp,
            });
          }
        }
      } else if (blockType === "text") {
        const text = (typedBlock.text as string) || "";
        if (text.length >= LONG_TEXT_THRESHOLD) {
          longTexts.push(text);
        }
      }
    }
  }

  return { toolCounts, longTexts, commits };
}

/**
 * Format tool stats into a concise summary string.
 */
function formatToolStats(toolCounts: Record<string, number>): string {
  if (Object.keys(toolCounts).length === 0) return "";

  const abbrev: Record<string, string> = {
    Bash: "bash",
    Read: "read",
    Write: "write",
    Edit: "edit",
    Glob: "glob",
    Grep: "grep",
    Task: "task",
    TodoWrite: "todo",
    WebFetch: "fetch",
    WebSearch: "search",
  };

  const parts: string[] = [];
  const sorted = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]);

  for (const [name, count] of sorted) {
    const shortName = abbrev[name] || name.toLowerCase();
    parts.push(`${count} ${shortName}`);
  }

  return parts.join(" · ");
}

/**
 * Generate HTML from a session file.
 */
export async function generateHtml(
  jsonPath: string,
  outputDir: string,
  repo?: string
): Promise<void> {
  const fs = await import("node:fs/promises");
  await fs.mkdir(outputDir, { recursive: true });

  // Load session file
  const data = await parseSessionFile(jsonPath);
  const loglines = data.loglines || [];

  // Auto-detect GitHub repo if not provided
  if (repo) {
    githubRepo = repo;
    console.log(`Using GitHub repo: ${repo}`);
  } else {
    githubRepo = detectGithubRepo(loglines);
    if (githubRepo) {
      console.log(`Auto-detected GitHub repo: ${githubRepo}`);
    } else {
      console.log(
        "Warning: Could not auto-detect GitHub repo. Commit links will be disabled."
      );
    }
  }

  // Group messages into conversations
  const conversations: Conversation[] = [];
  let currentConv: Conversation | null = null;

  for (const entry of loglines) {
    const logType = entry.type;
    const timestamp = entry.timestamp || "";
    const isCompactSummary = entry.isCompactSummary || false;
    const messageData = entry.message;

    if (!messageData) continue;

    const messageJson = JSON.stringify(messageData);
    let isUserPrompt = false;
    let userText: string | null = null;

    if (logType === "user") {
      const content = messageData.content;
      const text = extractTextFromContent(content as string | ContentBlock[]);
      if (text) {
        isUserPrompt = true;
        userText = text;
      }
    }

    if (isUserPrompt && userText) {
      if (currentConv) {
        conversations.push(currentConv);
      }
      currentConv = {
        userText,
        timestamp,
        messages: [{ logType, messageJson, timestamp }],
        isContinuation: isCompactSummary,
      };
    } else if (currentConv) {
      currentConv.messages.push({ logType, messageJson, timestamp });
    }
  }

  if (currentConv) {
    conversations.push(currentConv);
  }

  const totalConvs = conversations.length;
  const totalPages = Math.ceil(totalConvs / PROMPTS_PER_PAGE);

  // Generate page files
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const startIdx = (pageNum - 1) * PROMPTS_PER_PAGE;
    const endIdx = Math.min(startIdx + PROMPTS_PER_PAGE, totalConvs);
    const pageConvs = conversations.slice(startIdx, endIdx);

    const messagesHtml: string[] = [];
    for (const conv of pageConvs) {
      let isFirst = true;
      for (const { logType, messageJson, timestamp } of conv.messages) {
        let msgHtml = renderMessage(logType, messageJson, timestamp);
        if (msgHtml) {
          if (isFirst && conv.isContinuation) {
            msgHtml = templates.continuation(msgHtml);
          }
          messagesHtml.push(msgHtml);
        }
        isFirst = false;
      }
    }

    const paginationHtml = templates.pagination(pageNum, totalPages);
    const pageContent = templates.pageTemplate(
      pageNum,
      totalPages,
      paginationHtml,
      messagesHtml.join("")
    );

    const pageFilename = `page-${String(pageNum).padStart(3, "0")}.html`;
    await Bun.write(join(outputDir, pageFilename), pageContent);
    console.log(`Generated ${pageFilename}`);
  }

  // Calculate overall stats and collect all commits for timeline
  const totalToolCounts: Record<string, number> = {};
  let totalMessages = 0;
  const allCommits: Array<{
    timestamp: string;
    hash: string;
    message: string;
    pageNum: number;
    convIndex: number;
  }> = [];

  for (let i = 0; i < conversations.length; i++) {
    const conv = conversations[i];
    totalMessages += conv.messages.length;
    const stats = analyzeConversation(conv.messages);

    for (const [tool, count] of Object.entries(stats.toolCounts)) {
      totalToolCounts[tool] = (totalToolCounts[tool] || 0) + count;
    }

    const pageNum = Math.floor(i / PROMPTS_PER_PAGE) + 1;
    for (const commit of stats.commits) {
      allCommits.push({
        timestamp: commit.timestamp,
        hash: commit.hash,
        message: commit.message,
        pageNum,
        convIndex: i,
      });
    }
  }

  const totalToolCalls = Object.values(totalToolCounts).reduce(
    (a, b) => a + b,
    0
  );
  const totalCommits = allCommits.length;

  // Build timeline items
  const timelineItems: TimelineItem[] = [];

  let promptNum = 0;
  for (let i = 0; i < conversations.length; i++) {
    const conv = conversations[i];
    if (conv.isContinuation) continue;
    if (conv.userText.startsWith("Stop hook feedback:")) continue;

    promptNum++;
    const pageNum = Math.floor(i / PROMPTS_PER_PAGE) + 1;
    const msgId = makeMsgId(conv.timestamp);
    const link = `page-${String(pageNum).padStart(3, "0")}.html#${msgId}`;
    const renderedContent = renderMarkdownText(conv.userText);

    // Collect all messages including from subsequent continuation conversations
    const allMessages = [...conv.messages];
    for (let j = i + 1; j < conversations.length; j++) {
      if (!conversations[j].isContinuation) break;
      allMessages.push(...conversations[j].messages);
    }

    const stats = analyzeConversation(allMessages);
    const toolStatsStr = formatToolStats(stats.toolCounts);

    let longTextsHtml = "";
    for (const lt of stats.longTexts) {
      const renderedLt = renderMarkdownText(lt);
      longTextsHtml += templates.indexLongText(renderedLt);
    }

    const statsHtml = templates.indexStats(toolStatsStr, longTextsHtml);
    const itemHtml = templates.indexItem(
      promptNum,
      link,
      conv.timestamp,
      renderedContent,
      statsHtml
    );
    timelineItems.push({ timestamp: conv.timestamp, type: "prompt", html: itemHtml });
  }

  // Add commits as separate timeline items
  for (const commit of allCommits) {
    const itemHtml = templates.indexCommit(
      commit.hash,
      commit.message,
      commit.timestamp,
      githubRepo
    );
    timelineItems.push({ timestamp: commit.timestamp, type: "commit", html: itemHtml });
  }

  // Sort by timestamp
  timelineItems.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const indexItemsHtml = timelineItems.map((item) => item.html).join("");

  // Generate index page
  const indexPagination = templates.indexPagination(totalPages);
  const searchJs = templates.getSearchJs(totalPages);
  const indexContent = templates.indexTemplate(
    indexPagination,
    promptNum,
    totalMessages,
    totalToolCalls,
    totalCommits,
    totalPages,
    indexItemsHtml,
    searchJs
  );

  await Bun.write(join(outputDir, "index.html"), indexContent);
  console.log(
    `Generated index.html (${totalConvs} prompts, ${totalPages} pages)`
  );
}

/**
 * Generate HTML from session data (instead of file path).
 */
export async function generateHtmlFromSessionData(
  sessionData: SessionData,
  outputDir: string,
  repo?: string
): Promise<void> {
  // Write session data to temp file and call generateHtml
  const tempPath = join(outputDir, "_temp_session.json");
  const fs = await import("node:fs/promises");
  await fs.mkdir(outputDir, { recursive: true });
  await Bun.write(tempPath, JSON.stringify(sessionData));
  await generateHtml(tempPath, outputDir, repo);
  await fs.unlink(tempPath);
}

/**
 * Generate project index page.
 */
async function generateProjectIndex(
  project: { name: string; sessions: Array<{ path: string; summary: string; mtime: number; size: number }> },
  outputDir: string
): Promise<void> {
  const sessionsData = project.sessions.map((session) => ({
    name: basename(session.path, ".jsonl"),
    summary: session.summary,
    date: new Date(session.mtime).toISOString().slice(0, 16).replace("T", " "),
    sizeKb: session.size / 1024,
  }));

  const html = templates.projectIndexTemplate(project.name, sessionsData);
  await Bun.write(join(outputDir, "index.html"), html);
}

/**
 * Generate master index page.
 */
async function generateMasterIndex(
  projects: Array<{ name: string; sessions: Array<{ mtime: number }> }>,
  outputDir: string
): Promise<void> {
  let totalSessions = 0;
  const projectsData = projects.map((project) => {
    const sessionCount = project.sessions.length;
    totalSessions += sessionCount;

    let recentDate = "N/A";
    if (project.sessions.length > 0) {
      const mostRecent = new Date(project.sessions[0].mtime);
      recentDate = mostRecent.toISOString().slice(0, 10);
    }

    return {
      name: project.name,
      sessionCount,
      recentDate,
    };
  });

  const html = templates.masterIndexTemplate(projectsData, totalSessions);
  await Bun.write(join(outputDir, "index.html"), html);
}

/**
 * Generate HTML archive for all sessions in a Claude projects folder.
 */
export async function generateBatchHtml(
  options: BatchGenerateOptions
): Promise<BatchGenerateResult> {
  const { sourceFolder, outputDir, includeAgents, progressCallback } = options;
  const fs = await import("node:fs/promises");
  await fs.mkdir(outputDir, { recursive: true });

  // Find all sessions
  const projects = await findAllSessions(sourceFolder, includeAgents);

  // Calculate total for progress tracking
  const totalSessionCount = projects.reduce(
    (acc, p) => acc + p.sessions.length,
    0
  );
  let processedCount = 0;
  let successfulSessions = 0;
  const failedSessions: Array<{ project: string; session: string; error: string }> = [];

  // Process each project
  for (const project of projects) {
    const projectDir = join(outputDir, project.name);
    await fs.mkdir(projectDir, { recursive: true });

    // Process each session
    for (const session of project.sessions) {
      const sessionName = basename(session.path, ".jsonl");
      const sessionDir = join(projectDir, sessionName);

      try {
        await generateHtml(session.path, sessionDir);
        successfulSessions++;
      } catch (e) {
        failedSessions.push({
          project: project.name,
          session: sessionName,
          error: e instanceof Error ? e.message : String(e),
        });
      }

      processedCount++;

      if (progressCallback) {
        progressCallback(
          project.name,
          sessionName,
          processedCount,
          totalSessionCount
        );
      }
    }

    // Generate project index
    await generateProjectIndex(project, projectDir);
  }

  // Generate master index
  await generateMasterIndex(projects, outputDir);

  return {
    totalProjects: projects.length,
    totalSessions: successfulSessions,
    failedSessions,
    outputDir,
  };
}

/**
 * Inject gist preview JavaScript into all HTML files.
 */
export async function injectGistPreviewJs(outputDir: string): Promise<void> {
  const glob = new Bun.Glob("*.html");

  for await (const path of glob.scan({ cwd: outputDir, absolute: true })) {
    const content = await Bun.file(path).text();
    if (content.includes("</body>")) {
      const newContent = content.replace(
        "</body>",
        `<script>${templates.GIST_PREVIEW_JS}</script>\n</body>`
      );
      await Bun.write(path, newContent);
    }
  }
}
