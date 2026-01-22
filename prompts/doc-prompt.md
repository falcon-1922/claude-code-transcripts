# Documentation Task: Claude Session Export Tool

Analyze this python repository and create comprehensive specification documentation.

## Project Context
This tool converts Claude session JSON exports into html.

## Documentation Deliverables

### 1. SPECIFICATION.md
Create a specification document covering:

**Input Format**
- Document the expected Claude session JSON structure
- List all fields used from the JSON (messages, roles, timestamps, metadata, etc.)
- Note any optional vs required fields
- Document any Claude-specific data structures (thinking blocks, tool calls, artifacts, etc.)

**Output Formats**
- Html output: document the structure, formatting conventions, and customization options
- How are different message types (human, assistant, system) represented in each format?
- How are special content types handled (code blocks, images, tool use, citations)?

**Transformation Rules**
- Document the mapping logic from JSON → Html
- Any content sanitization or escaping rules
- How are conversation threads/turns delineated?

### 2. ARCHITECTURE.md
Document:
- Module structure and responsibilities
- Data flow from input to output
- Key types/interfaces (especially the session JSON type definitions)
- Extension points (adding new output formats, custom formatters)
- Error handling strategy

### 3. INSTALLATION.md
Document:

**Prerequisites**
- Runtime requirements 
- System dependencies (if any)
- Platform compatibility (macOS, Linux, Windows)

**Installation Methods**
- Package manager installation using uv
- Global vs local installation
- Installing from source (git clone workflow)
- Any post-install setup steps

**Verification**
- How to verify successful installation
- Version check command
- Basic smoke test

**Troubleshooting**
- Common installation issues and solutions
- Platform-specific notes

### 4. USAGE.md
Document:

**Quick Start**
- Minimal example to get running in 30 seconds
- Where to find Claude session JSON exports

**CLI Usage** (if applicable)
- Command syntax and structure
- All available commands/subcommands
- Complete flag and option reference with descriptions
- Exit codes and their meanings

**Programmatic API Usage**
- Importing the module
- Core functions/classes with signatures
- Configuration options and defaults
- Complete examples for common use cases:
  - Converting a single session
  - Batch processing multiple sessions
  - Customizing output format
  - Streaming/handling large files

**Configuration**
- Environment variables
- Config file format and location (if applicable)
- Precedence order (CLI flags > env vars > config file > defaults)

**Examples**
- Annotated input/output pairs showing:
  - Basic conversation export
  - Conversation with code blocks
  - Conversation with tool use
  - Conversation with thinking blocks
  - Multi-turn complex session

**Integration Patterns**
- Using in scripts/automation
- Piping input/output
- Integrating with other tools

### 5. CONTRIBUTING.md (optional)
- Development setup
- Running tests
- Adding new output formats

## Special Attention
- Identify any edge cases in session JSON handling (empty messages, interrupted responses, etc.)
- Note any assumptions about Claude session JSON format versions
- Document any limitations or unsupported features
- Flag any hardcoded values that might need configuration
- Include copy-paste ready command examples throughout
