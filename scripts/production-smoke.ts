const baseUrl = process.env.SMOKE_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;

if (!baseUrl) {
  console.error("Set SMOKE_BASE_URL to your deployed app URL.");
  process.exit(1);
}

const checks = [
  ["/", "landing"],
  ["/login", "login"],
  ["/api/reports/payroll-summary?format=csv", "report export"],
] as const;

let failed = false;

for (const [path, label] of checks) {
  const url = new URL(path, baseUrl).toString();
  const response = await fetch(url, { redirect: "manual" });
  const ok = response.status >= 200 && response.status < 400;
  console.log(`${ok ? "OK" : "FAIL"} ${label}: ${response.status} ${url}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);

export {};
