import { createClient } from "@supabase/supabase-js";
import { demoAccounts, DEMO_PASSWORD } from "../src/lib/demo-accounts";
import { loadLocalEnv } from "./env";

async function main() {
  loadLocalEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding users.");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const account of demoAccounts) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: account.name,
        role: account.role,
        organization: account.organization,
      },
    });

    if (error && !error.message.toLowerCase().includes("already")) {
      throw error;
    }

    console.log(`${error ? "exists" : "created"} ${account.email}${data.user ? ` (${data.user.id})` : ""}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
