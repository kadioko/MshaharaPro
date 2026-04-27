"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signInWithPassword, signUpWithPassword } from "@/app/actions";
import { demoAccounts, authenticateDemoUser, DEMO_PASSWORD } from "@/lib/demo-accounts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  function fillDemoAccount(email: string) {
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", DEMO_PASSWORD, { shouldValidate: true });
    setError(null);
  }

  async function submit(values: z.infer<typeof schema>) {
    const supabaseResult =
      mode === "login"
        ? await signInWithPassword(values)
        : await signUpWithPassword(values);

    if (supabaseResult.ok && supabaseResult.redirectTo) {
      router.push(supabaseResult.redirectTo);
      return;
    }

    if (mode === "signup") {
      setError(supabaseResult.message);
      return;
    }

    const account = authenticateDemoUser(values.email, values.password);
    if (!account) {
      setError(`${supabaseResult.message} Or use one of the demo emails below with the test password.`);
      return;
    }

    const demoResponse = await fetch("/api/demo-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!demoResponse.ok) {
      setError("Demo session could not be started. Please try again.");
      return;
    }

    window.localStorage.setItem("mshaharapro.demoUser", JSON.stringify(account));
    router.push(account.landingPath);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Welcome back" : "Create your account"}</CardTitle>
        <CardDescription>
          {mode === "login" ? "Sign in to manage payroll and compliance." : "Start your company setup in a few minutes."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.co.tz" {...form.register("email")} />
            {form.formState.errors.email ? <p className="text-xs text-destructive">{form.formState.errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...form.register("password")} />
            {form.formState.errors.password ? <p className="text-xs text-destructive">{form.formState.errors.password.message}</p> : null}
          </div>
          {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" type="submit">{mode === "login" ? "Login" : "Sign up"}</Button>
        </form>
        {mode === "login" ? (
          <div className="mt-5 space-y-3">
            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              Test password for all demo accounts: <span className="font-mono font-medium text-foreground">{DEMO_PASSWORD}</span>
            </div>
            <div className="grid gap-2">
              {demoAccounts.map((account) => (
                <button
                  className="rounded-md border p-3 text-left text-sm transition-colors hover:bg-muted"
                  key={account.email}
                  onClick={() => fillDemoAccount(account.email)}
                  type="button"
                >
                  <span className="font-medium">{account.name}</span>
                  <span className="block text-xs text-muted-foreground">{account.email} · {account.organization}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
