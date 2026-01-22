import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  parseSessionFile,
  extractTextFromContent,
  getSessionSummary,
  getProjectDisplayName,
  detectGithubRepo,
} from "../src/parser";

describe("extractTextFromContent", () => {
  it("should extract text from a string", () => {
    expect(extractTextFromContent("Hello world")).toBe("Hello world");
  });

  it("should extract text from a string with whitespace", () => {
    expect(extractTextFromContent("  Hello world  ")).toBe("Hello world");
  });

  it("should extract text from an array of content blocks", () => {
    const content = [
      { type: "text", text: "Hello" },
      { type: "text", text: "world" },
    ];
    expect(extractTextFromContent(content as any)).toBe("Hello world");
  });

  it("should ignore non-text blocks", () => {
    const content = [
      { type: "text", text: "Hello" },
      { type: "image", source: { type: "base64", data: "..." } },
      { type: "text", text: "world" },
    ];
    expect(extractTextFromContent(content as any)).toBe("Hello world");
  });

  it("should return empty string for non-string, non-array content", () => {
    expect(extractTextFromContent(null as any)).toBe("");
    expect(extractTextFromContent(undefined as any)).toBe("");
    expect(extractTextFromContent({} as any)).toBe("");
  });
});

describe("getProjectDisplayName", () => {
  it("should extract project name from home path", () => {
    expect(getProjectDisplayName("-home-user-projects-myproject")).toBe(
      "myproject"
    );
  });

  it("should extract project name from Windows path", () => {
    expect(getProjectDisplayName("-mnt-c-Users-name-Projects-app")).toBe("app");
  });

  it("should extract project name from macOS path", () => {
    expect(getProjectDisplayName("-Users-name-code-myapp")).toBe("myapp");
  });

  it("should skip common intermediate directories", () => {
    expect(getProjectDisplayName("-home-user-repos-awesome-project")).toBe(
      "awesome-project"
    );
  });

  it("should return original name if no meaningful parts found", () => {
    expect(getProjectDisplayName("simple")).toBe("simple");
  });
});

describe("detectGithubRepo", () => {
  it("should detect GitHub repo from git push output", () => {
    const loglines = [
      {
        type: "user",
        timestamp: "2025-01-01T00:00:00Z",
        message: {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "123",
              content:
                "remote: Create a pull request for 'feature' on GitHub by visiting:\nremote:   https://github.com/owner/repo/pull/new/feature",
            },
          ],
        },
      },
    ];
    expect(detectGithubRepo(loglines as any)).toBe("owner/repo");
  });

  it("should return null if no GitHub repo detected", () => {
    const loglines = [
      {
        type: "user",
        timestamp: "2025-01-01T00:00:00Z",
        message: {
          role: "user",
          content: "Hello world",
        },
      },
    ];
    expect(detectGithubRepo(loglines as any)).toBeNull();
  });
});

describe("parseSessionFile", () => {
  const tempDir = join(tmpdir(), "bun-transcripts-test-" + Date.now());

  beforeAll(async () => {
    const fs = await import("node:fs/promises");
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    const fs = await import("node:fs/promises");
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should parse a JSON file", async () => {
    const filePath = join(tempDir, "test.json");
    const data = {
      loglines: [
        {
          type: "user",
          timestamp: "2025-01-01T00:00:00Z",
          message: { role: "user", content: "Hello" },
        },
      ],
    };
    await Bun.write(filePath, JSON.stringify(data));

    const result = await parseSessionFile(filePath);
    expect(result.loglines).toHaveLength(1);
    expect(result.loglines[0].type).toBe("user");
  });

  it("should parse a JSONL file", async () => {
    const filePath = join(tempDir, "test.jsonl");
    const lines = [
      JSON.stringify({
        type: "user",
        timestamp: "2025-01-01T00:00:00Z",
        message: { role: "user", content: "Hello" },
      }),
      JSON.stringify({
        type: "assistant",
        timestamp: "2025-01-01T00:00:01Z",
        message: { role: "assistant", content: [{ type: "text", text: "Hi" }] },
      }),
    ];
    await Bun.write(filePath, lines.join("\n"));

    const result = await parseSessionFile(filePath);
    expect(result.loglines).toHaveLength(2);
    expect(result.loglines[0].type).toBe("user");
    expect(result.loglines[1].type).toBe("assistant");
  });

  it("should skip non-message entries in JSONL", async () => {
    const filePath = join(tempDir, "test-skip.jsonl");
    const lines = [
      JSON.stringify({ type: "summary", summary: "Test summary" }),
      JSON.stringify({
        type: "user",
        timestamp: "2025-01-01T00:00:00Z",
        message: { role: "user", content: "Hello" },
      }),
      JSON.stringify({ type: "file-history-snapshot", data: {} }),
    ];
    await Bun.write(filePath, lines.join("\n"));

    const result = await parseSessionFile(filePath);
    expect(result.loglines).toHaveLength(1);
  });
});

describe("getSessionSummary", () => {
  const tempDir = join(tmpdir(), "bun-transcripts-summary-test-" + Date.now());

  beforeAll(async () => {
    const fs = await import("node:fs/promises");
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    const fs = await import("node:fs/promises");
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should get summary from summary entry in JSONL", async () => {
    const filePath = join(tempDir, "with-summary.jsonl");
    const lines = [
      JSON.stringify({ type: "summary", summary: "This is a test session" }),
      JSON.stringify({
        type: "user",
        timestamp: "2025-01-01T00:00:00Z",
        message: { role: "user", content: "Hello" },
      }),
    ];
    await Bun.write(filePath, lines.join("\n"));

    const result = await getSessionSummary(filePath);
    expect(result).toBe("This is a test session");
  });

  it("should get summary from first user message if no summary entry", async () => {
    const filePath = join(tempDir, "no-summary.jsonl");
    const lines = [
      JSON.stringify({
        type: "user",
        timestamp: "2025-01-01T00:00:00Z",
        message: { role: "user", content: "First user message" },
      }),
    ];
    await Bun.write(filePath, lines.join("\n"));

    const result = await getSessionSummary(filePath);
    expect(result).toBe("First user message");
  });

  it("should truncate long summaries", async () => {
    const filePath = join(tempDir, "long-summary.jsonl");
    const longText = "A".repeat(300);
    const lines = [
      JSON.stringify({
        type: "user",
        timestamp: "2025-01-01T00:00:00Z",
        message: { role: "user", content: longText },
      }),
    ];
    await Bun.write(filePath, lines.join("\n"));

    const result = await getSessionSummary(filePath, 50);
    expect(result.length).toBe(50);
    expect(result.endsWith("...")).toBe(true);
  });

  it("should return '(no summary)' for empty files", async () => {
    const filePath = join(tempDir, "empty.jsonl");
    await Bun.write(filePath, "");

    const result = await getSessionSummary(filePath);
    expect(result).toBe("(no summary)");
  });
});
