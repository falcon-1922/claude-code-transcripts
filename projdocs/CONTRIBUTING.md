# Contributing

## Development Setup

### Prerequisites

- Python 3.10+
- [uv](https://docs.astral.sh/uv/) package manager

### Clone and Install

```bash
git clone https://github.com/simonw/claude-code-transcripts.git
cd claude-code-transcripts
uv sync
```

### Verify Setup

```bash
# Run tests
uv run pytest

# Run the tool
uv run claude-code-transcripts --help
```

---

## Development Workflow

### Running the Development Version

```bash
uv run claude-code-transcripts [command] [options]
```

### Code Formatting

Format code with Black before committing:

```bash
uv run black .
```

### Running Tests

```bash
# Run all tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run specific test file
uv run pytest tests/test_generate_html.py

# Run specific test
uv run pytest tests/test_generate_html.py::TestRenderFunctions::test_render_markdown_text

# Update snapshots
uv run pytest --snapshot-update
```

---

## Test-Driven Development

This project follows TDD. When adding features:

1. **Write a failing test first**
2. **Watch it fail**
3. **Implement the feature**
4. **Watch the test pass**
5. **Refactor if needed**

### Test Structure

```
tests/
├── conftest.py              # Shared fixtures
├── test_generate_html.py    # Unit and snapshot tests
└── test_all.py              # Batch conversion and CLI tests
```

### Snapshot Testing

The project uses [syrupy](https://github.com/tophat/syrupy) for snapshot testing. Snapshots capture HTML output for regression testing.

To update snapshots after intentional changes:

```bash
uv run pytest --snapshot-update
```

Review snapshot changes carefully before committing.

---

## Commit Guidelines

- **Commit early and often**
- **Bundle related changes**: Test, implementation, and documentation should be in the same commit
- Write clear commit messages describing the change

Example commit structure:
```
Add support for custom tool visualization

- Add render_custom_tool() function
- Add tests for custom tool rendering
- Update SPECIFICATION.md with new tool format
```

---

## Adding New Features

### Adding a New Output Format

1. Create a template in `templates/`:
   ```html
   {# templates/new_format.html #}
   {% extends "base.html" %}
   {% block content %}
   ...
   {% endblock %}
   ```

2. Add a generation function in `__init__.py`:
   ```python
   def generate_new_format(session_data, output_dir):
       # Implementation
   ```

3. Add a CLI command:
   ```python
   @cli.command()
   def new_format():
       """Generate in new format."""
       # Implementation
   ```

4. Add tests in `tests/test_generate_html.py`

### Adding a New Tool Visualization

1. Create a render function:
   ```python
   def render_my_tool(tool_input: dict, tool_id: str) -> str:
       """Render MyTool with specialized visualization."""
       # Return HTML string
   ```

2. Register in `render_tool_use()`:
   ```python
   if tool_name == "MyTool":
       return render_my_tool(tool_input, tool_id)
   ```

3. Add tests:
   ```python
   def test_render_my_tool(self):
       result = render_my_tool({"param": "value"}, "tool_123")
       assert "expected content" in result
   ```

### Adding a New Content Block Type

1. Add handling in `render_content_block()`:
   ```python
   elif block_type == "new_type":
       return render_new_type_block(block)
   ```

2. Create the render function:
   ```python
   def render_new_type_block(block: dict) -> str:
       # Return HTML string
   ```

3. Add tests:
   ```python
   def test_render_content_block_new_type(self):
       block = {"type": "new_type", "data": "..."}
       result = render_content_block(block)
       assert "expected output" in result
   ```

### Adding a New CLI Option

1. Add the option to the command:
   ```python
   @cli.command()
   @click.option("--new-option", help="Description")
   def command(new_option):
       if new_option:
           # Handle option
   ```

2. Add tests:
   ```python
   def test_new_option(self):
       runner = CliRunner()
       result = runner.invoke(cli, ["command", "--new-option", "value"])
       assert result.exit_code == 0
   ```

---

## Project Structure

```
claude-code-transcripts/
├── src/claude_code_transcripts/
│   ├── __init__.py          # Main module
│   └── templates/           # Jinja2 templates
├── tests/
│   ├── conftest.py          # Test fixtures
│   ├── test_generate_html.py
│   └── test_all.py
├── pyproject.toml           # Project configuration
├── README.md
├── SPECIFICATION.md         # Input/output format spec
├── ARCHITECTURE.md          # Code architecture
├── INSTALLATION.md          # Install instructions
├── USAGE.md                 # Usage documentation
└── CONTRIBUTING.md          # This file
```

---

## Release Process

1. Update version in `pyproject.toml`
2. Update README if needed
3. Run full test suite
4. Commit with message: `Release X.Y.Z`
5. Create git tag: `git tag vX.Y.Z`
6. Push with tags: `git push --tags`

---

## Code Style

- Follow PEP 8
- Use type hints where practical
- Keep functions focused and small
- Prefer explicit over implicit
- Write docstrings for public functions

---

## Getting Help

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Include reproduction steps for bugs
