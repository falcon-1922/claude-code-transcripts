 # Note
The app shows **sessions**, not directories. Each project directory can contain **multiple session files** (`.jsonl` files).

The app scans for all `**/*.jsonl` files across all project directories, so if you have 23 directories but 29 sessions, some of your project directories contain more than one session file.

You can verify this by counting the total `.jsonl` files:

```bash
find ~/.claude/projects -name "*.jsonl" | wc -l
```

Or see which directories have multiple sessions:

```bash
find ~/.claude/projects -name "*.jsonl" -exec dirname {} \; | sort | uniq -c | sort -rn
```

# Usage

## Quick Start

Convert your most recent Claude Code session to HTML:

```bash
bun run src/index.ts
```

This opens an interactive picker showing your recent sessions. Select one to generate an HTML transcript that opens in your browser.

### Where to Find Claude Session Exports

**Local sessions** (Claude Code CLI):
```
~/.claude/projects/<project>/<session>.jsonl
```

---

## Installation

### Install Dependencies

```bash
bun install
```

### Run the Development Version

```bash
bun run src/index.ts [command] [options]
```

### Build a Standalone Binary

```bash
bun build src/index.ts --compile --outfile=bun-transcripts
./bun-transcripts --help
```

---

## CLI Reference

### Global Options

| Option | Description |
|--------|-------------|
| `-v, --version` | Show version and exit |
| `--help` | Show help and exit |

### Commands

```
bun-transcripts [COMMAND]

Commands:
  local (default)  Convert a local Claude Code session
  json             Convert a JSON/JSONL file or URL
  all              Batch convert all local sessions
```

---

### `local` Command (Default)

Convert a local Claude Code session interactively.

```bash
bun run src/index.ts [local] [OPTIONS]
```

**Options:**

| Option | Description |
|--------|-------------|
| `-o, --output <path>` | Output directory (default: temp dir, opens browser) |
| `-a, --output-auto` | Auto-name output subdirectory based on session |
| `--repo <owner/name>` | GitHub repo for commit links (auto-detected) |
| `--gist` | Upload output to GitHub Gist |
| `--json` | Include original JSONL file in output |
| `--open` | Open in browser (default when no -o specified) |
| `--limit <n>` | Show N most recent sessions (default: 10) |

**Examples:**

```bash
# Interactive picker, opens in browser
bun run src/index.ts

# Save to specific directory
bun run src/index.ts -o ./my-transcript

# Auto-name output directory
bun run src/index.ts -o ./transcripts -a

# Upload to GitHub Gist
bun run src/index.ts --gist

# Show more sessions in picker
bun run src/index.ts --limit 50
```

---

### `json` Command

Convert a JSON or JSONL file directly.

```bash
bun run src/index.ts json <file> [OPTIONS]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `<file>` | Path to .json/.jsonl file, or https:// URL |

**Options:**

| Option | Description |
|--------|-------------|
| `-o, --output <path>` | Output directory |
| `-a, --output-auto` | Auto-name output subdirectory |
| `--repo <owner/name>` | GitHub repo for commit links |
| `--gist` | Upload to GitHub Gist |
| `--json` | Include original file in output |
| `--open` | Open in browser |

**Examples:**

```bash
# Convert local file
bun run src/index.ts json ~/session.jsonl

# Convert from URL
bun run src/index.ts json https://example.com/session.json

# Convert and upload to gist
bun run src/index.ts json session.jsonl --gist

# Specify output directory with auto-naming
bun run src/index.ts json session.jsonl -o ./output -a
```

---

### `all` Command

Batch convert all local sessions to an HTML archive.

```bash
bun run src/index.ts all [OPTIONS]
```

**Options:**

| Option | Description |
|--------|-------------|
| `-s, --source <dir>` | Source directory (default: ~/.claude/projects) |
| `-o, --output <dir>` | Output directory (default: ./claude-archive) |
| `--include-agents` | Include agent-* session files |
| `--dry-run` | Show what would be converted |
| `--open` | Open archive in browser when done |
| `-q, --quiet` | Suppress progress output |

**Examples:**

```bash
# Convert all sessions to ./claude-archive
bun run src/index.ts all

# Custom output directory
bun run src/index.ts all -o ~/Documents/claude-sessions

# Preview what would be converted
bun run src/index.ts all --dry-run

# Include agent sessions
bun run src/index.ts all --include-agents

# Silent operation
bun run src/index.ts all -q
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (file not found, invalid JSON, etc.) |

---

## Programmatic API

### Importing

```typescript
import {
  generateHtml,
  generateHtmlFromSessionData,
  generateBatchHtml,
  parseSessionFile,
  findLocalSessions,
  findAllSessions,
} from "./src/index";
```

### Core Functions

#### `generateHtml(jsonPath, outputDir, githubRepo?)`

Convert a session file to HTML.

```typescript
import { generateHtml } from "./src/index";

// Basic conversion
await generateHtml(
  "/path/to/session.jsonl",
  "/path/to/output"
);

// With GitHub repo for commit links
await generateHtml(
  "/path/to/session.jsonl",
  "/path/to/output",
  "owner/repo"
);
```

#### `generateHtmlFromSessionData(sessionData, outputDir, githubRepo?)`

Convert session data (object) to HTML.

```typescript
import { generateHtmlFromSessionData } from "./src/index";

const sessionData = {
  loglines: [
    {
      type: "user",
      timestamp: "2025-01-21T10:00:00Z",
      message: { role: "user", content: "Hello" }
    },
    {
      type: "assistant",
      timestamp: "2025-01-21T10:00:05Z",
      message: {
        role: "assistant",
        content: [{ type: "text", text: "Hi there!" }]
      }
    }
  ]
};

await generateHtmlFromSessionData(sessionData, "/path/to/output");
```

#### `generateBatchHtml(options)`

Convert all sessions in a folder.

```typescript
import { generateBatchHtml } from "./src/index";

// Basic batch conversion
const stats = await generateBatchHtml({
  sourceFolder: "~/.claude/projects",
  outputDir: "./archive"
});

// With progress callback
await generateBatchHtml({
  sourceFolder: "~/.claude/projects",
  outputDir: "./archive",
  includeAgents: true,
  progressCallback: (project, session, current, total) => {
    console.log(`Progress: ${current}/${total}`);
  }
});
```

#### `parseSessionFile(filepath)`

Parse a JSON or JSONL session file.

```typescript
import { parseSessionFile } from "./src/index";

const data = await parseSessionFile("/path/to/session.jsonl");
// Returns: { loglines: [...] }
```

#### `findLocalSessions(folder, limit?)`

Find recent local sessions.

```typescript
import { findLocalSessions } from "./src/index";

const sessions = await findLocalSessions("~/.claude/projects", 20);
// Returns: [{ path: "...", summary: "...", mtime: ..., size: ... }, ...]
```

#### `findAllSessions(folder, includeAgents?)`

Find all sessions grouped by project.

```typescript
import { findAllSessions } from "./src/index";

const projects = await findAllSessions("~/.claude/projects");
// Returns: [{ name: "...", path: "...", sessions: [...] }, ...]
```

---

## Running Tests

```bash
bun test
```

---

## Type Checking

```bash
bun run tsc --noEmit
```

---

## Building

Create a standalone binary:

```bash
bun build src/index.ts --compile --outfile=bun-transcripts
```

The resulting binary can be distributed without requiring Bun to be installed.
