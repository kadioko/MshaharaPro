"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button asChild size="sm" variant="outline">
      <a href="/logout">
        <LogOut className="h-4 w-4" />
        Logout
      </a>
    </Button>
  );
}
