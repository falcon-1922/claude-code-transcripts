# Python to Bun TypeScript Conversion

## Objective

Convert the existing Python CLI application (documented in `/projdocs`) into a modern Bun TypeScript application. The new application will be built in `/src/bun_transcripts`.

## Source Documentation

Read and understand the Python application by studying these files in order:

1. `/projdocs/SPECIFICATION.md` - Core functionality and requirements
2. `/projdocs/ARCHITECTURE.md` - System design and component structure
3. `/projdocs/USAGE.md` - CLI interface and user-facing behavior
4. `/projdocs/INSTALLATION.md` - Dependencies and setup requirements
5. `/projdocs/CONTRIBUTING.md` - Code conventions and patterns

## Target Structure

Build the Bun TypeScript application in `/src/bun_transcripts` with this structure:

```
src/bun_transcripts/
├── package.json
├── tsconfig.json
├── bunfig.toml
├── src/
│   ├── index.ts          # CLI entry point
│   ├── cli.ts            # Command parsing and routing
│   ├── types.ts          # TypeScript interfaces and types
│   └── [feature modules] # Based on ARCHITECTURE.md
├── projdocs/
│   └── usage.md          # Bun-specific usage documentation
└── tests/
    └── [test files]      # Matching test coverage
```

## Conversion Guidelines

### CLI Framework

Use one of these approaches for CLI handling (choose based on complexity):

- **Simple**: `Bun.argv` + manual parsing
- **Moderate**: `commander` or `yargs`
- **Complex**: `clipanion` or `oclif`

### TypeScript Patterns

- Use strict TypeScript (`"strict": true`)
- Define explicit interfaces for all data structures
- Prefer `type` for unions/intersections, `interface` for objects
- Use Zod for runtime validation where the Python code uses type checking

### Bun-Specific Features

Leverage Bun's built-in capabilities:

```typescript
// File I/O
const content = await Bun.file("path").text();
await Bun.write("path", content);

// JSONL parsing
const file = Bun.file("session.jsonl");
for await (const line of file.stream()) {
  // process line
}

// Shell commands (if needed)
const result = Bun.spawnSync(["command", "args"]);
```

### Dependency Mapping

Common Python → TypeScript equivalents:

| Python | Bun/TypeScript |
|--------|----------------|
| `click` / `argparse` | `commander`, `yargs`, or built-in |
| `pathlib` | `node:path` + `node:fs` or Bun APIs |
| `json` | Built-in JSON + Bun.file() |
| `dataclasses` | TypeScript interfaces/types |
| `typing` | TypeScript type system |
| `pytest` | `bun:test` |
| `rich` | `chalk`, `picocolors`, or `kleur` |

## Implementation Steps

1. **Initialize the project**
   ```bash
   cd /src/bun_transcripts
   bun init -y
   ```

2. **Read all `/projdocs/*.md` files** to understand:
   - What the application does
   - Input/output formats
   - CLI commands and options
   - Error handling expectations

3. **Create type definitions** in `src/types.ts` based on:
   - Data structures from SPECIFICATION.md
   - API contracts from ARCHITECTURE.md

4. **Implement core modules** following the architecture:
   - Start with pure functions (easiest to test)
   - Add CLI layer last

5. **Write tests** using `bun:test`:
   ```typescript
   import { describe, it, expect } from "bun:test";
   ```

6. **Create `/src/bun_transcripts/projdocs/usage.md`** documenting:
   - Installation: `bun install`
   - Running: `bun run src/index.ts [options]`
   - Building: `bun build src/index.ts --compile --outfile=app`
   - All CLI commands and options (adapted from Python version)

## Quality Checklist

Before considering the conversion complete:

- [ ] All CLI commands from Python version are implemented
- [ ] TypeScript compiles with no errors (`bun run tsc --noEmit`)
- [ ] Tests pass (`bun test`)
- [ ] `projdocs/usage.md` accurately documents the Bun CLI
- [ ] Error messages are helpful and match Python behavior
- [ ] Exit codes follow conventions (0 success, 1 error)

## Example Conversion Pattern

**Python (click-based CLI):**
```python
@click.command()
@click.argument("input_file", type=click.Path(exists=True))
@click.option("--output", "-o", default=None)
def process(input_file: str, output: str | None):
    data = Path(input_file).read_text()
    result = transform(data)
    if output:
        Path(output).write_text(result)
    else:
        print(result)
```

**Bun TypeScript equivalent:**
```typescript
import { parseArgs } from "util";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    output: { type: "string", short: "o" },
  },
  allowPositionals: true,
});

const inputFile = positionals[0];
if (!inputFile) {
  console.error("Error: input file required");
  process.exit(1);
}

const data = await Bun.file(inputFile).text();
const result = transform(data);

if (values.output) {
  await Bun.write(values.output, result);
} else {
  console.log(result);
}
```

## Start Here

Begin by running:

```bash
cat /projdocs/SPECIFICATION.md /projdocs/ARCHITECTURE.md
```

Then proceed with implementation based on what you learn about the application's purpose and structure.
