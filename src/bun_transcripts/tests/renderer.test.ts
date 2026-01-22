import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateHtml } from "../src/renderer";

describe("generateHtml", () => {
  const tempDir = join(tmpdir(), "bun-transcripts-renderer-test-" + Date.now());
  const outputDir = join(tempDir, "output");

  beforeAll(async () => {
    const fs = await import("node:fs/promises");
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    const fs = await import("node:fs/promises");
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should generate HTML from a simple session", async () => {
    const sessionPath = join(tempDir, "simple.jsonl");
    const lines = [
      JSON.stringify({
        type: "user",
        timestamp: "2025-01-01T00:00:00Z",
        message: { role: "user", content: "Hello" },
      }),
      JSON.stringify({
        type: "assistant",
        timestamp: "2025-01-01T00:00:01Z",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "Hi there!" }],
        },
      }),
    ];
    await Bun.write(sessionPath, lines.join("\n"));

    const output = join(outputDir, "simple");
    await generateHtml(sessionPath, output);

    // Check that index.html was created
    const indexExists = await Bun.file(join(output, "index.html")).exists();
    expect(indexExists).toBe(true);

    // Check that page-001.html was created
    const pageExists = await Bun.file(join(output, "page-001.html")).exists();
    expect(pageExists).toBe(true);

    // Verify content
    const indexContent = await Bun.file(join(output, "index.html")).text();
    expect(indexContent).toContain("Claude Code transcript");
    expect(indexContent).toContain("1 prompts");

    const pageContent = await Bun.file(join(output, "page-001.html")).text();
    expect(pageContent).toContain("Hello");
    expect(pageContent).toContain("Hi there!");
  });

  it("should generate multiple pages for large sessions", async () => {
    const sessionPath = join(tempDir, "large.jsonl");
    const lines: string[] = [];

    // Create 12 prompts (should result in 3 pages with 5 per page)
    for (let i = 0; i < 12; i++) {
      lines.push(
        JSON.stringify({
          type: "user",
          timestamp: `2025-01-01T00:${String(i).padStart(2, "0")}:00Z`,
          message: { role: "user", content: `Question ${i + 1}` },
        })
      );
      lines.push(
        JSON.stringify({
          type: "assistant",
          timestamp: `2025-01-01T00:${String(i).padStart(2, "0")}:01Z`,
          message: {
            role: "assistant",
            content: [{ type: "text", text: `Answer ${i + 1}` }],
          },
        })
      );
    }

    await Bun.write(sessionPath, lines.join("\n"));

    const output = join(outputDir, "large");
    await generateHtml(sessionPath, output);

    // Check that all pages were created
    expect(await Bun.file(join(output, "index.html")).exists()).toBe(true);
    expect(await Bun.file(join(output, "page-001.html")).exists()).toBe(true);
    expect(await Bun.file(join(output, "page-002.html")).exists()).toBe(true);
    expect(await Bun.file(join(output, "page-003.html")).exists()).toBe(true);

    // Verify index shows correct count
    const indexContent = await Bun.file(join(output, "index.html")).text();
    expect(indexContent).toContain("12 prompts");
    expect(indexContent).toContain("3 pages");
  });

  it("should render tool use blocks", async () => {
    const sessionPath = join(tempDir, "tools.jsonl");
    const lines = [
      JSON.stringify({
        type: "user",
        timestamp: "2025-01-01T00:00:00Z",
        message: { role: "user", content: "Create a file" },
      }),
      JSON.stringify({
        type: "assistant",
        timestamp: "2025-01-01T00:00:01Z",
        message: {
          role: "assistant",
          content: [
            { type: "text", text: "I'll create that file." },
            {
              type: "tool_use",
              id: "tool_1",
              name: "Write",
              input: { file_path: "/tmp/test.txt", content: "Hello" },
            },
          ],
        },
      }),
      JSON.stringify({
        type: "user",
        timestamp: "2025-01-01T00:00:02Z",
        message: {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "tool_1",
              content: "File written successfully",
            },
          ],
        },
      }),
    ];
    await Bun.write(sessionPath, lines.join("\n"));

    const output = join(outputDir, "tools");
    await generateHtml(sessionPath, output);

    const pageContent = await Bun.file(join(output, "page-001.html")).text();
    expect(pageContent).toContain("Write");
    expect(pageContent).toContain("test.txt");
    expect(pageContent).toContain("File written successfully");
    expect(pageContent).toContain("tool-reply");
  });

  it("should render thinking blocks", async () => {
    const sessionPath = join(tempDir, "thinking.jsonl");
    const lines = [
      JSON.stringify({
        type: "user",
        timestamp: "2025-01-01T00:00:00Z",
        message: { role: "user", content: "Solve this problem" },
      }),
      JSON.stringify({
        type: "assistant",
        timestamp: "2025-01-01T00:00:01Z",
        message: {
          role: "assistant",
          content: [
            { type: "thinking", thinking: "Let me think about this..." },
            { type: "text", text: "Here's the solution." },
          ],
        },
      }),
    ];
    await Bun.write(sessionPath, lines.join("\n"));

    const output = join(outputDir, "thinking");
    await generateHtml(sessionPath, output);

    const pageContent = await Bun.file(join(output, "page-001.html")).text();
    expect(pageContent).toContain("thinking");
    expect(pageContent).toContain("Let me think about this...");
    expect(pageContent).toContain("Thinking");
  });

  it("should detect GitHub repo from tool results", async () => {
    const sessionPath = join(tempDir, "github.jsonl");
    const lines = [
      JSON.stringify({
        type: "user",
        timestamp: "2025-01-01T00:00:00Z",
        message: { role: "user", content: "Push the changes" },
      }),
      JSON.stringify({
        type: "assistant",
        timestamp: "2025-01-01T00:00:01Z",
        message: {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: "tool_1",
              name: "Bash",
              input: { command: "git push -u origin main" },
            },
          ],
        },
      }),
      JSON.stringify({
        type: "user",
        timestamp: "2025-01-01T00:00:02Z",
        message: {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "tool_1",
              content:
                "remote: Create a pull request on GitHub by visiting:\nremote:   https://github.com/testowner/testrepo/pull/new/main\n[main abc1234] Test commit",
            },
          ],
        },
      }),
    ];
    await Bun.write(sessionPath, lines.join("\n"));

    const output = join(outputDir, "github");
    await generateHtml(sessionPath, output);

    const pageContent = await Bun.file(join(output, "page-001.html")).text();
    // Should have commit card with GitHub link
    expect(pageContent).toContain("commit-card");
    expect(pageContent).toContain("abc1234");
    expect(pageContent).toContain("github.com/testowner/testrepo/commit");
  });
});
