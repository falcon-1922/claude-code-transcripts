/**
 * CLI commands for bun-transcripts
 */

import { Command } from "commander";
import { homedir, tmpdir, platform } from "node:os";
import { join, basename, resolve } from "node:path";
import pc from "picocolors";
import {
  findLocalSessions,
  findAllSessions,
  getDefaultProjectsFolder,
  getSessionSummary,
} from "./parser";
import {
  generateHtml,
  generateBatchHtml,
  injectGistPreviewJs,
} from "./renderer";

const VERSION = "0.1.0";

/**
 * Simple interactive session picker using terminal input.
 */
async function selectSession(
  sessions: Array<{ path: string; summary: string; mtime: number; size: number }>
): Promise<string | null> {
  console.log("\nSelect a session to convert:\n");

  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    const date = new Date(session.mtime);
    const dateStr = date.toISOString().slice(0, 16).replace("T", " ");
    const sizeKb = Math.round(session.size / 1024);
    const summary =
      session.summary.length > 50
        ? session.summary.slice(0, 47) + "..."
        : session.summary;
    console.log(
      `  ${pc.cyan(String(i + 1).padStart(2))}. ${dateStr}  ${String(sizeKb).padStart(5)} KB  ${summary}`
    );
  }

  console.log(`\n  ${pc.dim("Enter number (1-" + sessions.length + ") or q to quit:")}`);

  // Read from stdin
  const reader = Bun.stdin.stream().getReader();
  const decoder = new TextDecoder();
  let input = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    for (const char of chunk) {
      if (char === "\n" || char === "\r") {
        const trimmed = input.trim().toLowerCase();
        if (trimmed === "q" || trimmed === "quit") {
          reader.releaseLock();
          return null;
        }

        const num = parseInt(trimmed, 10);
        if (num >= 1 && num <= sessions.length) {
          reader.releaseLock();
          return sessions[num - 1].path;
        }

        console.log(pc.red(`Invalid selection. Enter 1-${sessions.length} or q to quit:`));
        input = "";
      } else {
        input += char;
        process.stdout.write(char);
      }
    }
  }

  reader.releaseLock();
  return null;
}

/**
 * Open a file or URL in the default browser.
 */
async function openBrowser(url: string): Promise<void> {
  const os = platform();
  let cmd: string[];

  if (os === "darwin") {
    cmd = ["open", url];
  } else if (os === "win32") {
    cmd = ["cmd", "/c", "start", url];
  } else {
    cmd = ["xdg-open", url];
  }

  Bun.spawn(cmd);
}

/**
 * Create a GitHub gist from HTML files.
 */
async function createGist(
  outputDir: string,
  isPublic = false
): Promise<{ gistId: string; gistUrl: string }> {
  const glob = new Bun.Glob("*.html");
  const htmlFiles: string[] = [];

  for await (const path of glob.scan({ cwd: outputDir, absolute: true })) {
    htmlFiles.push(path);
  }

  if (htmlFiles.length === 0) {
    throw new Error("No HTML files found to upload to gist.");
  }

  // Build the gh gist create command
  const args = ["gist", "create", ...htmlFiles.sort()];
  if (isPublic) {
    args.push("--public");
  }

  const proc = Bun.spawn(["gh", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`Failed to create gist: ${stderr || "Unknown error"}`);
  }

  // Output is the gist URL
  const gistUrl = stdout.trim();
  const gistId = gistUrl.split("/").pop() || "";

  return { gistId, gistUrl };
}

/**
 * Fetch a URL and save to a temporary file.
 */
async function fetchUrlToTempfile(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();

  // Determine file extension from URL
  const urlPath = url.split("?")[0];
  let suffix = ".jsonl";
  if (urlPath.endsWith(".json")) {
    suffix = ".json";
  }

  // Extract a name from the URL
  const urlName = basename(urlPath, suffix) || "session";
  const tempFile = join(tmpdir(), `claude-url-${urlName}${suffix}`);

  await Bun.write(tempFile, text);
  return tempFile;
}

/**
 * Check if a path is a URL.
 */
function isUrl(path: string): boolean {
  return path.startsWith("http://") || path.startsWith("https://");
}

/**
 * Create the CLI program.
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name("bun-transcripts")
    .description("Convert Claude Code session JSON to mobile-friendly HTML pages")
    .version(VERSION, "-v, --version")
    .addHelpText(
      "after",
      `
Local command options (default):
  -o, --output <path>    Output directory
  -a, --output-auto      Auto-name output subdirectory based on session filename
  --repo <owner/name>    GitHub repo for commit links
  --gist                 Upload to GitHub Gist
  --json                 Include the original JSONL session file in output
  --open                 Open in browser
  --limit <n>            Maximum sessions to show
  --nolimit              Show all sessions (default)
  -1, --last             Automatically select the most recent session
  -n, --name <name>      Name for the output folder
`
    );

  // Local command (default)
  program
    .command("local", { isDefault: true })
    .description("Select and convert a local Claude Code session to HTML")
    .option("-o, --output <path>", "Output directory")
    .option(
      "-a, --output-auto",
      "Auto-name output subdirectory based on session filename"
    )
    .option("--repo <owner/name>", "GitHub repo for commit links")
    .option("--gist", "Upload to GitHub Gist")
    .option("--json", "Include the original JSONL session file in output")
    .option("--open", "Open in browser")
    .option("--limit <n>", "Maximum sessions to show")
    .option("--nolimit", "Show all sessions (default)", true)
    .option("-1, --last", "Automatically select the most recent session")
    .option("-n, --name <name>", "Name for the output folder")
    .action(async (options) => {
      const projectsFolder = getDefaultProjectsFolder();

      try {
        await Bun.file(projectsFolder).exists();
      } catch {
        console.log(`Projects folder not found: ${projectsFolder}`);
        console.log("No local Claude Code sessions available.");
        process.exit(1);
      }

      console.log("Loading local sessions...");
      const limit = options.limit ? parseInt(options.limit, 10) : undefined;
      const sessions = await findLocalSessions(projectsFolder, limit);

      if (sessions.length === 0) {
        console.log("No local sessions found.");
        process.exit(1);
      }

      let selected: string | null;
      if (options.last) {
        // Auto-select the most recent session (last in the list since sorted oldest-first)
        selected = sessions[sessions.length - 1].path;
        console.log(`Auto-selecting most recent session: ${basename(selected)}`);
      } else {
        selected = await selectSession(sessions);
        if (!selected) {
          console.log("No session selected.");
          process.exit(1);
        }
      }

      const sessionFile = selected;
      const sessionName = basename(sessionFile, ".jsonl");

      // Determine output directory
      let outputDir: string;
      const autoOpen = !options.output && !options.gist && !options.outputAuto;
      const folderName = options.name || sessionName;

      if (options.outputAuto) {
        const parentDir = options.output || ".";
        outputDir = join(parentDir, folderName);
      } else if (options.output) {
        outputDir = options.output;
      } else {
        // Default to current working directory with folder name
        outputDir = join(".", folderName);
      }

      outputDir = resolve(outputDir);

      await generateHtml(sessionFile, outputDir, options.repo);
      console.log(`Output: ${outputDir}`);

      // Copy JSONL file if requested
      if (options.json) {
        const fs = await import("node:fs/promises");
        await fs.mkdir(outputDir, { recursive: true });
        const jsonDest = join(outputDir, basename(sessionFile));
        await fs.copyFile(sessionFile, jsonDest);
        const stat = await fs.stat(jsonDest);
        console.log(`JSONL: ${jsonDest} (${Math.round(stat.size / 1024)} KB)`);
      }

      if (options.gist) {
        await injectGistPreviewJs(outputDir);
        console.log("Creating GitHub gist...");
        const { gistId, gistUrl } = await createGist(outputDir);
        const previewUrl = `https://gisthost.github.io/?${gistId}/index.html`;
        console.log(`Gist: ${gistUrl}`);
        console.log(`Preview: ${previewUrl}`);
      }

      if (options.open || autoOpen) {
        const indexUrl = `file://${join(outputDir, "index.html")}`;
        await openBrowser(indexUrl);
      }
    });

  // JSON command
  program
    .command("json <file>")
    .description("Convert a Claude Code session JSON/JSONL file or URL to HTML")
    .option("-o, --output <path>", "Output directory")
    .option("-a, --output-auto", "Auto-name output subdirectory based on filename")
    .option("--repo <owner/name>", "GitHub repo for commit links")
    .option("--gist", "Upload to GitHub Gist")
    .option("--json", "Include the original JSON session file in output")
    .option("--open", "Open in browser")
    .action(async (file, options) => {
      let jsonFilePath: string;
      let urlName: string | null = null;

      // Handle URL input
      if (isUrl(file)) {
        console.log(`Fetching ${file}...`);
        jsonFilePath = await fetchUrlToTempfile(file);
        urlName = basename(file.split("?")[0], ".jsonl").replace(".json", "") || "session";
      } else {
        jsonFilePath = resolve(file);
        const exists = await Bun.file(jsonFilePath).exists();
        if (!exists) {
          console.error(`File not found: ${file}`);
          process.exit(1);
        }
      }

      const fileName = urlName || basename(jsonFilePath, ".jsonl").replace(".json", "");

      // Determine output directory
      let outputDir: string;
      const autoOpen = !options.output && !options.gist && !options.outputAuto;

      if (options.outputAuto) {
        const parentDir = options.output || ".";
        outputDir = join(parentDir, fileName);
      } else if (options.output) {
        outputDir = options.output;
      } else {
        outputDir = join(tmpdir(), `claude-session-${fileName}`);
      }

      outputDir = resolve(outputDir);

      await generateHtml(jsonFilePath, outputDir, options.repo);
      console.log(`Output: ${outputDir}`);

      // Copy JSON file if requested
      if (options.json) {
        const fs = await import("node:fs/promises");
        await fs.mkdir(outputDir, { recursive: true });
        const jsonDest = join(outputDir, basename(jsonFilePath));
        await fs.copyFile(jsonFilePath, jsonDest);
        const stat = await fs.stat(jsonDest);
        console.log(`JSON: ${jsonDest} (${Math.round(stat.size / 1024)} KB)`);
      }

      if (options.gist) {
        await injectGistPreviewJs(outputDir);
        console.log("Creating GitHub gist...");
        const { gistId, gistUrl } = await createGist(outputDir);
        const previewUrl = `https://gisthost.github.io/?${gistId}/index.html`;
        console.log(`Gist: ${gistUrl}`);
        console.log(`Preview: ${previewUrl}`);
      }

      if (options.open || autoOpen) {
        const indexUrl = `file://${join(outputDir, "index.html")}`;
        await openBrowser(indexUrl);
      }
    });

  // All command
  program
    .command("all")
    .description("Convert all local Claude Code sessions to a browsable HTML archive")
    .option("-s, --source <dir>", "Source directory containing Claude projects")
    .option("-o, --output <dir>", "Output directory", "./claude-archive")
    .option("--include-agents", "Include agent-* session files")
    .option("--dry-run", "Show what would be converted")
    .option("--open", "Open archive in browser when done")
    .option("-q, --quiet", "Suppress progress output")
    .action(async (options) => {
      const sourceFolder = options.source || getDefaultProjectsFolder();

      const exists = await Bun.file(sourceFolder).exists();
      if (!exists) {
        console.error(`Source directory not found: ${sourceFolder}`);
        process.exit(1);
      }

      const outputDir = resolve(options.output);

      if (!options.quiet) {
        console.log(`Scanning ${sourceFolder}...`);
      }

      const projects = await findAllSessions(
        sourceFolder,
        options.includeAgents
      );

      if (projects.length === 0) {
        if (!options.quiet) {
          console.log("No sessions found.");
        }
        return;
      }

      const totalSessions = projects.reduce(
        (acc, p) => acc + p.sessions.length,
        0
      );

      if (!options.quiet) {
        console.log(
          `Found ${projects.length} projects with ${totalSessions} sessions`
        );
      }

      if (options.dryRun) {
        if (!options.quiet) {
          console.log("\nDry run - would convert:");
          for (const project of projects) {
            console.log(
              `\n  ${project.name} (${project.sessions.length} sessions)`
            );
            for (const session of project.sessions.slice(0, 3)) {
              const modTime = new Date(session.mtime);
              console.log(
                `    - ${basename(session.path, ".jsonl")} (${modTime.toISOString().slice(0, 10)})`
              );
            }
            if (project.sessions.length > 3) {
              console.log(`    ... and ${project.sessions.length - 3} more`);
            }
          }
        }
        return;
      }

      if (!options.quiet) {
        console.log(`\nGenerating archive in ${outputDir}...`);
      }

      const progressCallback = options.quiet
        ? undefined
        : (
            projectName: string,
            sessionName: string,
            current: number,
            total: number
          ) => {
            if (current % 10 === 0) {
              console.log(`  Processed ${current}/${total} sessions...`);
            }
          };

      const stats = await generateBatchHtml({
        sourceFolder,
        outputDir,
        includeAgents: options.includeAgents,
        progressCallback,
      });

      // Report any failures
      if (stats.failedSessions.length > 0) {
        console.log(
          `\nWarning: ${stats.failedSessions.length} session(s) failed:`
        );
        for (const failure of stats.failedSessions) {
          console.log(`  ${failure.project}/${failure.session}: ${failure.error}`);
        }
      }

      if (!options.quiet) {
        console.log(
          `\nGenerated archive with ${stats.totalProjects} projects, ${stats.totalSessions} sessions`
        );
        console.log(`Output: ${outputDir}`);
      }

      if (options.open) {
        const indexUrl = `file://${join(outputDir, "index.html")}`;
        await openBrowser(indexUrl);
      }
    });

  return program;
}

/**
 * Run the CLI.
 */
export async function run(): Promise<void> {
  const program = createProgram();
  await program.parseAsync(process.argv);
}
