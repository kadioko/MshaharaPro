"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/actions";
import { getDocumentDownloadLinkAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

const initialState: ActionState = { ok: false, message: "" };

export function DocumentLinkAction({ storagePath }: { storagePath: string }) {
  const [state, formAction] = useActionState(getDocumentDownloadLinkAction, initialState);

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction}>
        <input name="storagePath" type="hidden" value={storagePath} />
        <Button size="sm" variant="outline">Get link</Button>
      </form>
      {state.url ? (
        <a className="max-w-56 truncate text-xs font-medium text-primary underline" href={state.url} target="_blank" rel="noreferrer">
          Open secure link
        </a>
      ) : state.message ? (
        <p className="max-w-56 text-xs text-muted-foreground">{state.message}</p>
      ) : null}
    </div>
  );
}
