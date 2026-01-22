# Architecture

This document describes the internal architecture of `claude-code-transcripts`.

## Module Structure

```
src/claude_code_transcripts/
├── __init__.py          # Main module (all code)
└── templates/
    ├── base.html        # Base HTML template
    ├── macros.html      # Jinja2 macros for rendering
    ├── index.html       # Session index template
    ├── page.html        # Conversation page template
    ├── project_index.html   # Project listing template
    ├── master_index.html    # Archive index template
    └── search.js        # Client-side search script
```

The application is contained in a single module (`__init__.py`) with all functionality. Templates are Jinja2 files for HTML generation.

## Component Overview

### CLI Layer

**Entry Point:** `main()` → `cli()`

Uses Click with `DefaultGroup` for command routing:

```
cli (group)
├── local (default)    # Convert local session
├── json               # Convert JSON/JSONL file or URL
├── web                # Fetch from Claude API
└── all                # Batch convert all sessions
```

### Session Discovery

**Functions:**
- `find_local_sessions(folder, limit)` - Find recent sessions
- `find_all_sessions(folder, include_agents)` - Find all sessions grouped by project
- `get_project_display_name(folder_name)` - Decode project folder names

**Flow:**
```
~/.claude/projects/
    └── <project-folder>/
        └── *.jsonl
            ↓
        Session list with summaries
```

### Session Parsing

**Functions:**
- `parse_session_file(filepath)` - Unified JSON/JSONL parser
- `_parse_jsonl_file(filepath)` - JSONL-specific parsing
- `get_session_summary(filepath, max_length)` - Extract summary

**Data Flow:**
```
JSON/JSONL file
    ↓
parse_session_file()
    ↓
{"loglines": [...]}  # Normalized format
```

### HTML Generation

**Core Functions:**
- `generate_html(json_path, output_dir, github_repo)` - Main entry point
- `generate_html_from_session_data(session_data, output_dir, github_repo)` - From API data
- `generate_batch_html(source_folder, output_dir, include_agents, progress_callback)` - Batch mode

**Pipeline:**
```
Session data
    ↓
analyze_conversation()      # Extract stats
    ↓
Group messages into prompts
    ↓
Paginate (5 prompts/page)
    ↓
render_message()           # For each message
    ↓
Jinja2 templates           # Generate HTML files
    ↓
Output directory
```

### Message Rendering

**Entry Point:** `render_message(log_type, message_json, timestamp)`

**Dispatch:**
```
User message → render_user_message_content()
    ↓
    String content: escape + auto-detect JSON
    Array content: render each block

Assistant message → render_assistant_message()
    ↓
    render_content_block() for each block
```

**Content Block Rendering:**
```
render_content_block(block)
    ├── type: "text"      → render_markdown_text()
    ├── type: "thinking"  → Yellow box + markdown
    ├── type: "tool_use"  → render_tool_use()
    ├── type: "tool_result" → Green/red box
    └── type: "image"     → <img> with base64 src
```

**Specialized Tool Renderers:**
```
render_tool_use(block)
    ├── Bash      → render_bash_tool()
    ├── Write     → render_write_tool()
    ├── Edit      → render_edit_tool()
    ├── TodoWrite → render_todo_write()
    └── Other     → Generic JSON display
```

### API Integration

**Functions:**
- `fetch_sessions(token, org_uuid)` - List sessions
- `fetch_session(token, org_uuid, session_id)` - Get session data
- `resolve_credentials(token, org_uuid)` - Auto-detect credentials
- `get_access_token_from_keychain()` - macOS keychain retrieval
- `get_org_uuid_from_config()` - Read from ~/.claude.json

**Flow:**
```
User request
    ↓
resolve_credentials()
    ├── Provided via CLI args
    └── Auto-detect (macOS keychain + config)
    ↓
fetch_sessions() / fetch_session()
    ↓
httpx GET to api.anthropic.com
    ↓
Session data
```

### Gist Publishing

**Functions:**
- `create_gist(output_dir, public)` - Upload to GitHub
- `inject_gist_preview_js(output_dir)` - Add gisthost compatibility

**Flow:**
```
HTML output directory
    ↓
inject_gist_preview_js()  # Modify links for gisthost
    ↓
create_gist()
    ↓
gh gist create (subprocess)
    ↓
Gist URL → gisthost.github.io preview URL
```

---

## Data Flow

### Single Session Conversion

```
┌─────────────────┐
│  Session File   │  .json or .jsonl
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ parse_session_  │  Normalize to {"loglines": [...]}
│     file()      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   analyze_      │  Count tools, extract commits
│ conversation()  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Group messages  │  User message + responses = prompt
│  into prompts   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Paginate      │  5 prompts per page
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ render_message  │  For each message in each page
│      ()         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Jinja2 render   │  base.html + page.html / index.html
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Output files   │  index.html, page-001.html, ...
└─────────────────┘
```

### Batch Conversion

```
┌─────────────────┐
│ Source folder   │  ~/.claude/projects/
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ find_all_       │  Group by project
│   sessions()    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  For each project:                  │
│    For each session:                │
│      generate_html()                │
│    _generate_project_index()        │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ _generate_      │
│ master_index()  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Archive output  │  index.html + project/session dirs
└─────────────────┘
```

---

## Key Types

### Session Data (Normalized)

```python
{
    "loglines": [
        {
            "type": "user" | "assistant" | "summary",
            "timestamp": str,  # ISO 8601
            "message": {
                "role": str,
                "content": str | list[ContentBlock]
            },
            "isMeta": bool,           # Optional
            "isCompactSummary": bool  # Optional
        }
    ]
}
```

### Content Blocks

```python
TextBlock = {"type": "text", "text": str}
ThinkingBlock = {"type": "thinking", "thinking": str}
ToolUseBlock = {"type": "tool_use", "id": str, "name": str, "input": dict}
ToolResultBlock = {"type": "tool_result", "content": str | list, "is_error": bool}
ImageBlock = {"type": "image", "source": {"type": "base64", "media_type": str, "data": str}}
```

### Conversation Analysis Result

```python
{
    "tool_counts": dict[str, int],      # Tool name → usage count
    "commits": list[str],               # Commit hashes found
    "long_texts": list[dict],           # Long assistant responses
    "continuation_long_texts": list[dict]  # In continuation summaries
}
```

---

## Extension Points

### Adding New Output Formats

1. Create a new template in `templates/`
2. Add a rendering function following the `generate_html` pattern
3. Register a new CLI command in the `cli` group

### Adding New Tool Visualizations

1. Create a `render_{tool_name}_tool(tool_input, tool_id)` function
2. Add a case in `render_tool_use()`:
   ```python
   if tool_name == "NewTool":
       return render_new_tool_tool(tool_input, tool_id)
   ```

### Custom Content Block Types

1. Add handling in `render_content_block()`:
   ```python
   elif block_type == "custom_type":
       return render_custom_type(block)
   ```

### Adding New CLI Commands

```python
@cli.command()
@click.option("--option", help="Description")
def new_command(option):
    """Command description."""
    # Implementation
```

---

## Error Handling

### Strategy

- **Fail fast** for critical errors (file not found, invalid JSON)
- **Graceful degradation** for rendering errors (show raw content)
- **User feedback** via Click's `click.echo()` for progress and errors
- **Exit codes**: 0 for success, non-zero for errors

### Common Error Paths

| Scenario | Handling |
|----------|----------|
| File not found | Click error, exit |
| Invalid JSON | Exception with message |
| API auth failure | Error message, suggest credentials |
| Missing `gh` CLI | Error message when creating gist |
| Network failure | httpx exception, user message |
| Malformed content | Render as escaped text |

### Content Rendering Fallbacks

When specialized rendering fails:
1. Tool use: Show generic JSON
2. Markdown: Return escaped text
3. Images: Show placeholder text
4. Unknown blocks: Render as JSON

---

## Template System

### Jinja2 Environment

- **Loader**: `PackageLoader` from `claude_code_transcripts`
- **Templates directory**: `templates/`
- **Auto-escaping**: Enabled for HTML

### Template Hierarchy

```
base.html
    ├── index.html (extends)
    ├── page.html (extends)
    ├── project_index.html (extends)
    └── master_index.html (extends)

macros.html (included for shared components)
```

### Template Variables

**index.html:**
- `title`, `summary`, `num_prompts`, `num_messages`
- `tool_counts`, `num_commits`, `total_pages`
- `timeline_items`, `current_page`, `pagination`

**page.html:**
- `title`, `page_number`, `total_pages`
- `rendered_messages`, `pagination`

### CSS and JavaScript

- CSS is embedded in `base.html` (no external files)
- Search JavaScript is loaded from `search.js`
- Gist preview JavaScript is injected when `--gist` is used

---

## Constants

```python
API_BASE_URL = "https://api.anthropic.com/v1"
ANTHROPIC_VERSION = "2023-06-01"
PROMPTS_PER_PAGE = 5
LONG_TEXT_THRESHOLD = 300
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `click` | CLI framework |
| `click-default-group` | Default command support |
| `httpx` | HTTP client |
| `jinja2` | Template rendering |
| `markdown` | Markdown to HTML |
| `questionary` | Interactive prompts |
