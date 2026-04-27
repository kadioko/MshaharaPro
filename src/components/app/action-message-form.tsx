"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/actions";
import { Button } from "@/components/ui/button";

const initialState: ActionState = { ok: false, message: "" };

export function ActionMessageForm({
  action,
  children,
  label,
  formId,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  label: string;
  formId?: string;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form id={formId} action={formAction} className="space-y-2">
      {children}
      <Button size="sm" variant="outline">{label}</Button>
      {state.message ? <p className="text-xs text-muted-foreground">{state.message}</p> : null}
    </form>
  );
}
