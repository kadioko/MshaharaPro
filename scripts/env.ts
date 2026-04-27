import { existsSync, readFileSync } from "node:fs";

export function loadLocalEnv() {
  if (!existsSync(".env.local")) return;

  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;

    const [, key, value] = match;
    process.env[key.trim()] ??= value.trim();
  }
}

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} before running this script.`);
  return value;
}
