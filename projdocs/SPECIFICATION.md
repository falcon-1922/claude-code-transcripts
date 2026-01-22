# Specification

This document specifies the input and output formats for `claude-code-transcripts`.

## Input Format

The tool accepts Claude session exports in two formats: JSON (from the Claude web API) and JSONL (from local Claude Code sessions).

### Session File Locations

Local Claude Code sessions are stored in:
```
~/.claude/projects/<project-folder>/<session-id>.jsonl
```

Project folder names may be URL-encoded (e.g., `%2FVolumes%2Fdata%2Fmyproject` for `/Volumes/data/myproject`).

### JSONL Format (Local Sessions)

Each line is a JSON object representing a log entry:

```jsonl
{"type": "summary", "summary": "Brief session description"}
{"type": "user", "timestamp": "2025-01-21T10:30:00.000Z", "message": {...}}
{"type": "assistant", "timestamp": "2025-01-21T10:30:05.000Z", "message": {...}}
```

**Entry Types:**

| Type | Description |
|------|-------------|
| `user` | User message |
| `assistant` | Assistant response |
| `summary` | Session summary (used for display in session picker) |
| `file-history-snapshot` | File state snapshot (ignored during conversion) |

### JSON Format (Web API)

```json
{
  "loglines": [
    {"type": "user", "timestamp": "...", "message": {...}},
    {"type": "assistant", "timestamp": "...", "message": {...}}
  ]
}
```

### Message Structure

#### User Messages

```json
{
  "type": "user",
  "timestamp": "2025-01-21T10:30:00.000Z",
  "message": {
    "role": "user",
    "content": "string or array"
  },
  "isMeta": false,
  "isCompactSummary": false
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | Always `"user"` |
| `timestamp` | Yes | ISO 8601 timestamp |
| `message.role` | Yes | Always `"user"` |
| `message.content` | Yes | String or array of content blocks |
| `isMeta` | No | If true, message is metadata (skipped in summaries) |
| `isCompactSummary` | No | If true, marks a session continuation point |

#### Assistant Messages

```json
{
  "type": "assistant",
  "timestamp": "2025-01-21T10:30:05.000Z",
  "message": {
    "role": "assistant",
    "content": [...]
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | Always `"assistant"` |
| `timestamp` | Yes | ISO 8601 timestamp |
| `message.role` | Yes | Always `"assistant"` |
| `message.content` | Yes | Array of content blocks |

### Content Block Types

Content can be a string (older format) or an array of typed blocks (current format):

#### Text Block

```json
{
  "type": "text",
  "text": "Message content with **markdown** support"
}
```

#### Thinking Block

```json
{
  "type": "thinking",
  "thinking": "Internal reasoning process..."
}
```

#### Tool Use Block

```json
{
  "type": "tool_use",
  "id": "tool_abc123",
  "name": "Write",
  "input": {
    "file_path": "/path/to/file.py",
    "content": "file content..."
  }
}
```

#### Tool Result Block

```json
{
  "type": "tool_result",
  "tool_use_id": "tool_abc123",
  "content": "Result text or array of content blocks",
  "is_error": false
}
```

Tool result content can be:
- A string
- An array of content blocks (text, images)

#### Image Block

```json
{
  "type": "image",
  "source": {
    "type": "base64",
    "media_type": "image/png",
    "data": "base64-encoded-data..."
  }
}
```

Supported media types: `image/png`, `image/jpeg`, `image/gif`, `image/webp`

### Tool Input Structures

The tool provides specialized rendering for these tools:

#### Bash Tool

```json
{
  "name": "Bash",
  "input": {
    "command": "npm install",
    "description": "Install dependencies"
  }
}
```

#### Write Tool

```json
{
  "name": "Write",
  "input": {
    "file_path": "/path/to/file.py",
    "content": "file content..."
  }
}
```

#### Edit Tool

```json
{
  "name": "Edit",
  "input": {
    "file_path": "/path/to/file.py",
    "old_string": "original text",
    "new_string": "replacement text",
    "replace_all": false
  }
}
```

#### TodoWrite Tool

```json
{
  "name": "TodoWrite",
  "input": {
    "todos": [
      {
        "content": "Task description",
        "status": "pending",
        "activeForm": "Working on task"
      }
    ]
  }
}
```

Status values: `pending`, `in_progress`, `completed`

---

## Output Format

The tool generates a static HTML website with multiple pages.

### File Structure

**Single Session:**
```
output/
├── index.html          # Timeline of prompts and commits
├── page-001.html       # First page of conversation
├── page-002.html       # Second page
└── ...
```

**Batch Mode (`all` command):**
```
output/
├── index.html              # Master archive index
├── project-name/
│   ├── index.html          # Project index
│   └── session-name/
│       ├── index.html      # Session timeline
│       ├── page-001.html
│       └── ...
└── another-project/
    └── ...
```

### Pagination

- 5 prompts (user messages) per page
- Pages named: `page-001.html`, `page-002.html`, etc.
- Each page has navigation to adjacent pages and index

### Index Page Structure

The index page provides a timeline view with:
- Search functionality
- Session statistics (prompts, messages, tool calls, commits)
- Pagination controls
- Timeline items:
  - User prompts (truncated to 300 characters)
  - Tool usage summaries
  - Long assistant responses (>300 characters)
  - Git commit cards with GitHub links

### Message Representation

| Message Type | Visual Style |
|--------------|--------------|
| User | Blue border, light blue background |
| Assistant | Gray border, light gray background |
| Tool Reply | Orange border, pale yellow background |

### Special Content Rendering

#### Code Blocks

Markdown code fences are rendered with syntax highlighting:
```html
<pre><code class="language-python">def hello():
    print("Hello")
</code></pre>
```

#### Thinking Blocks

Displayed in a yellow box with "Thinking" label, markdown-rendered content.

#### Tool Calls

Displayed in purple boxes showing:
- Tool name
- Description (if available)
- Input parameters (formatted JSON)

Specialized visualizations for:
- **Bash**: Command with description
- **Write**: File path header + content preview
- **Edit**: Diff-style old vs new comparison
- **TodoWrite**: Task list with status icons (○ → ✓)

#### Tool Results

Displayed in green boxes (red for errors) showing:
- Result content
- Images (if present)
- Git commit output with GitHub links

#### Images

Base64 images are embedded directly with responsive sizing.

#### Continuation Summaries

Messages marked with `isCompactSummary: true` are collapsed in a `<details>` element labeled "Session continuation summary".

### Content Sanitization

- HTML in user content is escaped
- Markdown is rendered to safe HTML
- Base64 image data is embedded directly (no external fetching)
- JSON content is auto-detected and formatted with syntax coloring

### Truncation

Content blocks taller than 250px are truncated with:
- Gradient fade effect
- "Show more" / "Show less" toggle button
- Images always displayed in full (no truncation)

### Search Feature

Client-side search functionality:
- Modal dialog triggered by search icon
- Fetches and parses all pages via JavaScript
- Highlights matches with yellow background
- Links directly to matching messages

### GitHub Integration

When a GitHub repository is detected or specified:
- Commit hashes link to GitHub commit pages
- Git push output shows "View on GitHub" links
- Pattern: `https://github.com/{owner}/{repo}/commit/{hash}`

Auto-detection regex for git push output:
```
github\.com/([a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+)/pull/new/
```

---

## Transformation Rules

### JSON to HTML Mapping

1. **Session parsing**: Load JSON/JSONL and extract message entries
2. **Message grouping**: Group messages into prompts (user message + following assistant responses)
3. **Pagination**: Split prompts into pages (5 per page)
4. **Content rendering**: Transform each content block to HTML
5. **Index generation**: Create timeline with stats and navigation

### Content Block Transformation

| Input Type | Output |
|------------|--------|
| `text` | Markdown → HTML |
| `thinking` | Yellow box with markdown content |
| `tool_use` | Purple box with formatted input |
| `tool_result` | Green/red box with content |
| `image` | `<img>` with base64 data URL |
| String content | Escaped text, auto-detect JSON |

### Conversation Structure

Messages are grouped into "prompts" - a user message followed by all assistant responses until the next user message. Tool-result-only messages are displayed separately with "Tool reply" styling.

### Timestamp Handling

- ISO 8601 timestamps converted to locale-specific display
- Used as unique IDs for message anchors: `msg-{epoch-ms}`
- Enables direct linking to specific messages

---

## Edge Cases

### Empty Messages

Messages with empty content are rendered but may appear blank.

### Interrupted Responses

Partial responses are rendered as-is. No special handling for incomplete tool calls.

### Large Sessions

- Pagination prevents memory issues on large conversations
- Truncation prevents oversized content blocks
- Search fetches pages incrementally

### Format Versions

The tool handles both old (string content) and new (array content) formats transparently. The `isCompactSummary` flag was added in later versions for continuation handling.

### Missing Fields

Optional fields default to:
- `isMeta`: `false`
- `isCompactSummary`: `false`
- `is_error`: `false`
- `replace_all`: `false`

---

## Limitations

- No support for streaming/incremental export
- Images must be base64-encoded (no URL references)
- Search is client-side only (no server-side indexing)
- GitHub link detection relies on specific git output patterns
- Tool visualization is limited to recognized tools (Bash, Write, Edit, TodoWrite)
