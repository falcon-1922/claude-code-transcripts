import { describe, it, expect } from "bun:test";
import {
  escapeHtml,
  pagination,
  indexPagination,
  todoList,
  writeTool,
  editTool,
  bashTool,
  toolUse,
  toolResult,
  thinking,
  assistantText,
  userContent,
  imageBlock,
  commitCard,
  message,
  indexItem,
  indexCommit,
} from "../src/templates";

describe("escapeHtml", () => {
  it("should escape HTML special characters", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"
    );
  });

  it("should escape ampersands", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  it("should escape quotes", () => {
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
  });
});

describe("pagination", () => {
  it("should render index link only when single page", () => {
    const html = pagination(1, 1);
    expect(html).toContain('href="index.html"');
    expect(html).not.toContain("Prev");
  });

  it("should disable prev on first page", () => {
    const html = pagination(1, 3);
    expect(html).toContain("disabled");
    expect(html).toContain("Prev");
    expect(html).toContain('href="page-002.html"');
  });

  it("should disable next on last page", () => {
    const html = pagination(3, 3);
    expect(html).toContain('href="page-002.html"');
    expect(html).toContain("disabled");
  });

  it("should highlight current page", () => {
    const html = pagination(2, 3);
    expect(html).toContain('class="current"');
    expect(html).toContain(">2<");
  });
});

describe("indexPagination", () => {
  it("should mark index as current", () => {
    const html = indexPagination(3);
    expect(html).toContain('class="current">Index');
    expect(html).toContain('href="page-001.html"');
  });
});

describe("todoList", () => {
  it("should render todo items with correct status icons", () => {
    const todos = [
      { content: "Pending task", status: "pending" as const },
      { content: "In progress", status: "in_progress" as const },
      { content: "Done", status: "completed" as const },
    ];
    const html = todoList(todos, "tool-123");

    expect(html).toContain("todo-pending");
    expect(html).toContain("todo-in-progress");
    expect(html).toContain("todo-completed");
    expect(html).toContain("○");
    expect(html).toContain("→");
    expect(html).toContain("✓");
  });

  it("should return empty string for empty todos", () => {
    expect(todoList([], "tool-123")).toBe("");
  });
});

describe("writeTool", () => {
  it("should render write tool with file path and content", () => {
    const html = writeTool("/path/to/file.ts", "const x = 1;", "tool-123");

    expect(html).toContain("Write");
    expect(html).toContain("file.ts");
    expect(html).toContain("/path/to/file.ts");
    expect(html).toContain("const x = 1;");
    expect(html).toContain("write-tool");
  });
});

describe("editTool", () => {
  it("should render edit tool with old and new strings", () => {
    const html = editTool(
      "/path/to/file.ts",
      "old code",
      "new code",
      false,
      "tool-123"
    );

    expect(html).toContain("Edit");
    expect(html).toContain("file.ts");
    expect(html).toContain("old code");
    expect(html).toContain("new code");
    expect(html).toContain("edit-tool");
  });

  it("should show replace all indicator", () => {
    const html = editTool("/path/to/file.ts", "old", "new", true, "tool-123");
    expect(html).toContain("replace all");
  });
});

describe("bashTool", () => {
  it("should render bash tool with command", () => {
    const html = bashTool("npm install", "Install dependencies", "tool-123");

    expect(html).toContain("Bash");
    expect(html).toContain("npm install");
    expect(html).toContain("Install dependencies");
  });

  it("should render without description", () => {
    const html = bashTool("ls -la", "", "tool-123");

    expect(html).toContain("ls -la");
    expect(html).not.toContain("tool-description");
  });
});

describe("toolUse", () => {
  it("should render generic tool use", () => {
    const html = toolUse("CustomTool", "Do something", '{"key": "value"}', "tool-123");

    expect(html).toContain("CustomTool");
    expect(html).toContain("Do something");
    // JSON is HTML-escaped
    expect(html).toContain("{&quot;key&quot;: &quot;value&quot;}");
  });
});

describe("toolResult", () => {
  it("should render tool result", () => {
    const html = toolResult("<pre>output</pre>", false);
    expect(html).toContain("tool-result");
    expect(html).toContain("output");
    expect(html).not.toContain("tool-error");
  });

  it("should render error tool result", () => {
    const html = toolResult("<pre>error</pre>", true);
    expect(html).toContain("tool-error");
  });

  it("should not truncate when has images", () => {
    const html = toolResult("<img>", false, true);
    expect(html).not.toContain("truncatable");
  });
});

describe("thinking", () => {
  it("should render thinking block", () => {
    const html = thinking("<p>Let me think...</p>");
    expect(html).toContain("thinking");
    expect(html).toContain("Thinking");
    expect(html).toContain("Let me think...");
  });
});

describe("assistantText", () => {
  it("should render assistant text", () => {
    const html = assistantText("<p>Hello</p>");
    expect(html).toContain("assistant-text");
    expect(html).toContain("Hello");
  });
});

describe("userContent", () => {
  it("should render user content", () => {
    const html = userContent("<p>User message</p>");
    expect(html).toContain("user-content");
    expect(html).toContain("User message");
  });
});

describe("imageBlock", () => {
  it("should render image with base64 data", () => {
    const html = imageBlock("image/png", "base64data");
    expect(html).toContain("image-block");
    expect(html).toContain("data:image/png;base64,base64data");
  });
});

describe("commitCard", () => {
  it("should render commit card with GitHub link", () => {
    const html = commitCard("abc1234567", "Fix bug", "owner/repo");
    expect(html).toContain("commit-card");
    expect(html).toContain("abc1234");
    expect(html).toContain("Fix bug");
    expect(html).toContain("https://github.com/owner/repo/commit/abc1234567");
  });

  it("should render commit card without GitHub link", () => {
    const html = commitCard("abc1234567", "Fix bug", null);
    expect(html).toContain("abc1234");
    expect(html).not.toContain("href");
  });
});

describe("message", () => {
  it("should render message with correct structure", () => {
    const html = message(
      "user",
      "User",
      "msg-123",
      "2025-01-01T00:00:00Z",
      "<p>Hello</p>"
    );

    expect(html).toContain('class="message user"');
    expect(html).toContain('id="msg-123"');
    expect(html).toContain("User");
    expect(html).toContain("Hello");
    expect(html).toContain("2025-01-01T00:00:00Z");
  });
});

describe("indexItem", () => {
  it("should render index item", () => {
    const html = indexItem(
      1,
      "page-001.html#msg-1",
      "2025-01-01T00:00:00Z",
      "<p>Question</p>",
      "<span>2 read</span>"
    );

    expect(html).toContain("#1");
    expect(html).toContain("page-001.html#msg-1");
    expect(html).toContain("Question");
    expect(html).toContain("2 read");
  });
});

describe("indexCommit", () => {
  it("should render index commit with GitHub link", () => {
    const html = indexCommit(
      "abc1234567",
      "Add feature",
      "2025-01-01T00:00:00Z",
      "owner/repo"
    );

    expect(html).toContain("index-commit");
    expect(html).toContain("abc1234");
    expect(html).toContain("Add feature");
    expect(html).toContain("https://github.com/owner/repo/commit/abc1234567");
  });
});
