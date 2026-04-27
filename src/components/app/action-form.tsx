"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { ActionState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  submitLabel: string;
  submitClassName?: string;
};

const initialState: ActionState = { ok: false, message: "" };

export function ActionForm({ action, children, className, submitLabel, submitClassName }: ActionFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.redirectTo) router.push(state.redirectTo);
  }, [router, state.redirectTo]);

  return (
    <form action={formAction} className={className}>
      {children}
      {state.message ? (
        <p
          className={cn(
            "rounded-md border p-3 text-sm",
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {state.message}
        </p>
      ) : null}
      <PendingSubmit className={submitClassName}>{submitLabel}</PendingSubmit>
    </form>
  );
}

function PendingSubmit({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button className={className} disabled={pending}>
      {pending ? "Saving..." : children}
    </Button>
  );
}
