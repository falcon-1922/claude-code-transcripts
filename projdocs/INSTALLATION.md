# Installation

## Prerequisites

### Runtime Requirements

- **Python**: 3.10 or higher
- **uv**: Package manager (recommended)

### Optional Dependencies

- **GitHub CLI (`gh`)**: Required for `--gist` functionality
- **Claude Code**: Required for local session access

### Platform Compatibility

| Platform | Status | Notes |
|----------|--------|-------|
| macOS | Full support | Automatic keychain credential retrieval |
| Linux | Full support | Manual credential entry for web API |
| Windows | Full support | Manual credential entry for web API |

---

## Installation Methods

### Using uv (Recommended)

Install globally with uv:

```bash
uv tool install claude-code-transcripts
```

Or add to a project:

```bash
uv add claude-code-transcripts
```

### Using pip

```bash
pip install claude-code-transcripts
```

### Using pipx

```bash
pipx install claude-code-transcripts
```

### Installing from Source

Clone the repository:

```bash
git clone https://github.com/simonw/claude-code-transcripts.git
cd claude-code-transcripts
```

Install with uv:

```bash
uv sync
```

Or with pip:

```bash
pip install -e .
```

---

## Post-Install Setup

### For Local Session Access

No additional setup required. The tool automatically finds sessions in:
```
~/.claude/projects/
```

This directory is created by Claude Code when you start sessions.

### For Web API Access (macOS)

Credentials are automatically retrieved from the macOS keychain if you've used Claude Code. No manual setup needed.

### For Web API Access (Linux/Windows)

You'll need to provide credentials manually:

1. Get your access token from Claude Code settings or browser developer tools
2. Find your organization UUID in `~/.claude.json`:
   ```json
   {
     "organizationUUID": "your-org-uuid-here"
   }
   ```

Use with commands:
```bash
claude-code-transcripts web --token YOUR_TOKEN --org-uuid YOUR_ORG_UUID
```

### For Gist Publishing

Install and authenticate the GitHub CLI:

```bash
# Install gh (varies by platform)
brew install gh        # macOS
apt install gh         # Ubuntu/Debian
winget install gh      # Windows

# Authenticate
gh auth login
```

---

## Verification

### Check Installation

```bash
claude-code-transcripts --version
```

Expected output:
```
claude-code-transcripts, version X.Y.Z
```

### Verify Help Works

```bash
claude-code-transcripts --help
```

### Basic Smoke Test

Test with a local session (if Claude Code is installed):

```bash
claude-code-transcripts
```

This should either:
- Show a session picker if sessions exist
- Show "No recent sessions found" if no sessions

Test with a JSON file:

```bash
echo '{"loglines":[{"type":"user","timestamp":"2025-01-01T00:00:00Z","message":{"role":"user","content":"Hello"}}]}' > test.json
claude-code-transcripts json test.json
rm test.json
```

---

## Troubleshooting

### "command not found: claude-code-transcripts"

The tool isn't in your PATH. Try:

```bash
# If installed with uv tool
uv tool list

# If installed with pip
python -m claude_code_transcripts --help

# Check pip installation location
pip show claude-code-transcripts
```

### "No recent sessions found"

Claude Code sessions are stored in `~/.claude/projects/`. This error means:
- Claude Code isn't installed, or
- You haven't started any sessions yet, or
- Sessions are in a different location

Check if the directory exists:
```bash
ls ~/.claude/projects/
```

### "Failed to retrieve credentials" (macOS)

The tool couldn't access the macOS keychain. Try:

1. Open Keychain Access
2. Search for "Claude Code"
3. Verify the credential exists

If missing, use Claude Code once to populate the keychain, or provide credentials manually:
```bash
claude-code-transcripts web --token YOUR_TOKEN --org-uuid YOUR_UUID
```

### "gh: command not found" when using --gist

Install the GitHub CLI:
```bash
brew install gh        # macOS
apt install gh         # Ubuntu/Debian
```

Then authenticate:
```bash
gh auth login
```

### JSON Parsing Errors

If you see JSON parsing errors:
- Ensure the file is valid JSON or JSONL
- Check for truncated files
- Verify the file isn't empty

### Permission Denied

If you get permission errors reading sessions:
```bash
chmod +r ~/.claude/projects/*/*.jsonl
```

### SSL Certificate Errors

If you see SSL errors when using the web API:
```bash
# Update certificates
pip install --upgrade certifi
```

---

## Platform-Specific Notes

### macOS

- Automatic credential retrieval from keychain
- `open` command used for browser launching
- Full feature support

### Linux

- Manual credential entry for web API
- `xdg-open` used for browser launching
- Full feature support

### Windows

- Manual credential entry for web API
- `start` command used for browser launching
- Path separators handled automatically
- WSL users: sessions may be in Windows home directory

### Docker

Running in Docker requires mounting the sessions directory:

```bash
docker run -v ~/.claude:/root/.claude \
  claude-code-transcripts
```

For web API access, pass credentials as environment variables or arguments.
