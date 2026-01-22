# Usage

## Quick Start

Convert your most recent Claude Code session to HTML:

```bash
claude-code-transcripts
```

This opens an interactive picker showing your recent sessions. Select one to generate an HTML transcript that opens in your browser.

### Where to Find Claude Session Exports

**Local sessions** (Claude Code CLI):
```
~/.claude/projects/<project>/<session>.jsonl
```

**Web API sessions**: Use the `web` command to fetch from Claude's API.

---

## CLI Reference

### Global Options

| Option | Description |
|--------|-------------|
| `-v, --version` | Show version and exit |
| `--help` | Show help and exit |

### Commands

```
claude-code-transcripts [COMMAND]

Commands:
  local (default)  Convert a local Claude Code session
  json             Convert a JSON/JSONL file or URL
  web              Fetch and convert from Claude web API
  all              Batch convert all local sessions
```

---

### `local` Command (Default)

Convert a local Claude Code session interactively.

```bash
claude-code-transcripts [local] [OPTIONS]
```

**Options:**

| Option | Description |
|--------|-------------|
| `-o, --output PATH` | Output directory (default: temp dir, opens browser) |
| `-a, --output-auto` | Auto-name output subdirectory based on session |
| `--repo OWNER/NAME` | GitHub repo for commit links (auto-detected) |
| `--gist` | Upload output to GitHub Gist |
| `--json` | Include original JSONL file in output |
| `--open` | Open in browser (default when no -o specified) |
| `--limit N` | Show N most recent sessions (default: 10) |

**Examples:**

```bash
# Interactive picker, opens in browser
claude-code-transcripts

# Save to specific directory
claude-code-transcripts -o ./my-transcript

# Auto-name output directory
claude-code-transcripts -o ./transcripts -a

# Upload to GitHub Gist
claude-code-transcripts --gist

# Show more sessions in picker
claude-code-transcripts --limit 50
```

---

### `json` Command

Convert a JSON or JSONL file directly.

```bash
claude-code-transcripts json FILE_OR_URL [OPTIONS]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `FILE_OR_URL` | Path to .json/.jsonl file, or https:// URL |

**Options:**

| Option | Description |
|--------|-------------|
| `-o, --output PATH` | Output directory |
| `-a, --output-auto` | Auto-name output subdirectory |
| `--repo OWNER/NAME` | GitHub repo for commit links |
| `--gist` | Upload to GitHub Gist |
| `--json` | Include original file in output |
| `--open` | Open in browser |

**Examples:**

```bash
# Convert local file
claude-code-transcripts json ~/session.jsonl

# Convert from URL
claude-code-transcripts json https://example.com/session.json

# Convert and upload to gist
claude-code-transcripts json session.jsonl --gist

# Specify output directory with auto-naming
claude-code-transcripts json session.jsonl -o ./output -a
```

---

### `web` Command

Fetch a session from Claude's web API.

```bash
claude-code-transcripts web [SESSION_ID] [OPTIONS]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `SESSION_ID` | Session ID (optional - shows picker if omitted) |

**Options:**

| Option | Description |
|--------|-------------|
| `-o, --output PATH` | Output directory |
| `-a, --output-auto` | Auto-name output subdirectory |
| `--token TOKEN` | API access token (auto-detected on macOS) |
| `--org-uuid UUID` | Organization UUID (auto-detected from config) |
| `--repo OWNER/NAME` | GitHub repo for commit links |
| `--gist` | Upload to GitHub Gist |
| `--json` | Save session JSON to output |
| `--open` | Open in browser |

**Examples:**

```bash
# Interactive session picker (macOS with auto-credentials)
claude-code-transcripts web

# Fetch specific session
claude-code-transcripts web abc123-session-id

# With manual credentials
claude-code-transcripts web --token $TOKEN --org-uuid $ORG_UUID

# Save JSON alongside HTML
claude-code-transcripts web abc123 --json -o ./output
```

---

### `all` Command

Batch convert all local sessions to an HTML archive.

```bash
claude-code-transcripts all [OPTIONS]
```

**Options:**

| Option | Description |
|--------|-------------|
| `-s, --source DIR` | Source directory (default: ~/.claude/projects) |
| `-o, --output DIR` | Output directory (default: ./claude-archive) |
| `--include-agents` | Include agent-* session files |
| `--dry-run` | Show what would be converted |
| `--open` | Open archive in browser when done |
| `-q, --quiet` | Suppress progress output |

**Examples:**

```bash
# Convert all sessions to ./claude-archive
claude-code-transcripts all

# Custom output directory
claude-code-transcripts all -o ~/Documents/claude-sessions

# Preview what would be converted
claude-code-transcripts all --dry-run

# Include agent sessions
claude-code-transcripts all --include-agents

# Silent operation
claude-code-transcripts all -q
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (file not found, invalid JSON, etc.) |
| 2 | User cancelled (e.g., Ctrl+C in picker) |

---

## Programmatic API

### Importing

```python
from claude_code_transcripts import (
    generate_html,
    generate_html_from_session_data,
    generate_batch_html,
    parse_session_file,
    find_local_sessions,
    find_all_sessions,
)
```

### Core Functions

#### `generate_html(json_path, output_dir, github_repo=None)`

Convert a session file to HTML.

```python
from claude_code_transcripts import generate_html

# Basic conversion
generate_html(
    json_path="/path/to/session.jsonl",
    output_dir="/path/to/output"
)

# With GitHub repo for commit links
generate_html(
    json_path="/path/to/session.jsonl",
    output_dir="/path/to/output",
    github_repo="owner/repo"
)
```

#### `generate_html_from_session_data(session_data, output_dir, github_repo=None)`

Convert session data (dict) to HTML.

```python
from claude_code_transcripts import generate_html_from_session_data

session_data = {
    "loglines": [
        {
            "type": "user",
            "timestamp": "2025-01-21T10:00:00Z",
            "message": {"role": "user", "content": "Hello"}
        },
        {
            "type": "assistant",
            "timestamp": "2025-01-21T10:00:05Z",
            "message": {
                "role": "assistant",
                "content": [{"type": "text", "text": "Hi there!"}]
            }
        }
    ]
}

generate_html_from_session_data(session_data, "/path/to/output")
```

#### `generate_batch_html(source_folder, output_dir, include_agents=False, progress_callback=None)`

Convert all sessions in a folder.

```python
from claude_code_transcripts import generate_batch_html

# Basic batch conversion
generate_batch_html(
    source_folder="~/.claude/projects",
    output_dir="./archive"
)

# With progress callback
def on_progress(message):
    print(f"Progress: {message}")

generate_batch_html(
    source_folder="~/.claude/projects",
    output_dir="./archive",
    include_agents=True,
    progress_callback=on_progress
)
```

#### `parse_session_file(filepath)`

Parse a JSON or JSONL session file.

```python
from claude_code_transcripts import parse_session_file

data = parse_session_file("/path/to/session.jsonl")
# Returns: {"loglines": [...]}
```

#### `find_local_sessions(folder, limit=10)`

Find recent local sessions.

```python
from claude_code_transcripts import find_local_sessions

sessions = find_local_sessions("~/.claude/projects", limit=20)
# Returns: [{"path": "...", "summary": "...", "mtime": ...}, ...]
```

#### `find_all_sessions(folder, include_agents=False)`

Find all sessions grouped by project.

```python
from claude_code_transcripts import find_all_sessions

projects = find_all_sessions("~/.claude/projects")
# Returns: {"project_name": [{"path": "...", ...}, ...], ...}
```

---

## Configuration

### Credential Sources (in order of precedence)

1. **CLI arguments**: `--token` and `--org-uuid`
2. **macOS Keychain**: Automatic retrieval (web API only)
3. **Config file**: `~/.claude.json` for org UUID

### Config File Format

`~/.claude.json`:
```json
{
  "organizationUUID": "your-org-uuid-here"
}
```

### Environment Variables

Currently no environment variables are supported. Use CLI arguments for configuration.

---

## Examples

### Basic Conversation Export

**Input** (session.jsonl):
```jsonl
{"type":"user","timestamp":"2025-01-21T10:00:00Z","message":{"role":"user","content":"What is 2+2?"}}
{"type":"assistant","timestamp":"2025-01-21T10:00:05Z","message":{"role":"assistant","content":[{"type":"text","text":"2 + 2 = 4"}]}}
```

**Command:**
```bash
claude-code-transcripts json session.jsonl -o ./output
```

**Output:** `./output/index.html` and `./output/page-001.html`

### Conversation with Code Blocks

**Input:**
```jsonl
{"type":"user","timestamp":"2025-01-21T10:00:00Z","message":{"role":"user","content":"Write a hello world function"}}
{"type":"assistant","timestamp":"2025-01-21T10:00:05Z","message":{"role":"assistant","content":[{"type":"text","text":"Here's a Python function:\n\n```python\ndef hello():\n    print(\"Hello, World!\")\n```"}]}}
```

Code blocks are syntax-highlighted in the HTML output.

### Conversation with Tool Use

**Input:**
```jsonl
{"type":"user","timestamp":"2025-01-21T10:00:00Z","message":{"role":"user","content":"Create a file called hello.py"}}
{"type":"assistant","timestamp":"2025-01-21T10:00:05Z","message":{"role":"assistant","content":[{"type":"text","text":"I'll create that file for you."},{"type":"tool_use","id":"tool_1","name":"Write","input":{"file_path":"hello.py","content":"print('Hello')"}}]}}
{"type":"user","timestamp":"2025-01-21T10:00:10Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"tool_1","content":"File written successfully"}]}}
```

Tool calls are rendered with specialized visualizations showing the file path and content.

### Conversation with Thinking Blocks

**Input:**
```jsonl
{"type":"assistant","timestamp":"2025-01-21T10:00:05Z","message":{"role":"assistant","content":[{"type":"thinking","thinking":"Let me analyze this problem step by step..."},{"type":"text","text":"The answer is 42."}]}}
```

Thinking blocks appear in yellow boxes labeled "Thinking".

### Multi-Turn Complex Session

```bash
# Convert a complex session with many turns
claude-code-transcripts json complex-session.jsonl -o ./complex-output

# The output will be paginated:
# - ./complex-output/index.html (timeline view)
# - ./complex-output/page-001.html (first 5 prompts)
# - ./complex-output/page-002.html (next 5 prompts)
# - etc.
```

---

## Integration Patterns

### Using in Scripts

```bash
#!/bin/bash
# Convert all sessions and create an archive
claude-code-transcripts all -o ./archive -q

# Upload the result somewhere
rsync -av ./archive/ server:/var/www/claude-archive/
```

### Piping Input

```bash
# Fetch JSON from API and convert
curl -s https://api.example.com/session/123 | \
  jq '.' > /tmp/session.json && \
  claude-code-transcripts json /tmp/session.json --open
```

### Integrating with Other Tools

```bash
# Convert and open in specific browser
claude-code-transcripts json session.jsonl -o /tmp/output
open -a "Firefox" /tmp/output/index.html

# Convert and serve locally
claude-code-transcripts json session.jsonl -o ./site
python -m http.server --directory ./site 8000
```

### Automated Archival

```bash
#!/bin/bash
# Daily archive script
DATE=$(date +%Y-%m-%d)
claude-code-transcripts all -o ~/archives/claude-$DATE -q

# Keep only last 30 days
find ~/archives -name "claude-*" -type d -mtime +30 -exec rm -rf {} \;
```

### GitHub Actions Integration

```yaml
- name: Generate Claude Transcript
  run: |
    pip install claude-code-transcripts
    claude-code-transcripts json ${{ inputs.session_file }} -o ./transcript

- name: Upload Artifact
  uses: actions/upload-artifact@v3
  with:
    name: claude-transcript
    path: ./transcript
```
