import Link from "next/link";
import { AuthCard } from "@/components/app/auth-card";
import { BrandLogo } from "@/components/app/brand-logo";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-4">
        <Link href="/" className="flex justify-center" aria-label="MshaharaPro home">
          <BrandLogo />
        </Link>
        <AuthCard mode="signup" />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link className="font-medium text-foreground" href="/login">Login</Link>
        </p>
      </div>
    </main>
  );
}
