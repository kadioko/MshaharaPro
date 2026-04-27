import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const candidates = [];

if (process.env.SUPABASE_CLI_PATH) {
  candidates.push(process.env.SUPABASE_CLI_PATH);
}

if (process.platform === "win32") {
  if (process.env.LOCALAPPDATA) {
    candidates.push(
      join(
        process.env.LOCALAPPDATA,
        "MshaharaProTools",
        "supabase",
        "2.95.4",
        "supabase.exe",
      ),
    );
  }
  candidates.push("supabase.cmd", "supabase.exe", "supabase");
} else {
  candidates.push("supabase");
}

const command = candidates.find((candidate) => {
  return candidate === "supabase" ||
    candidate === "supabase.cmd" ||
    candidate === "supabase.exe"
    ? true
    : existsSync(candidate);
});

const result = spawnSync(command, args, {
  stdio: "inherit",
  shell: command === "supabase" || command.endsWith(".cmd"),
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
