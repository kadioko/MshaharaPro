"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyInviteButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return token;
    return `${window.location.origin}/onboarding?invite=${encodeURIComponent(token)}`;
  }, [token]);

  return (
    <Button
      size="sm"
      variant="outline"
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
