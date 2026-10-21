import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginScreen } from "@/modules/site/LoginScreen";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <LoginScreen />
    </Suspense>
  );
}
