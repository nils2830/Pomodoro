import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/core/shell/ClientOnly";
import { LoginView } from "@/modules/account/LoginView";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <ClientOnly fallback={<div className="min-h-svh" />}>
      <Suspense>
        <LoginView />
      </Suspense>
    </ClientOnly>
  );
}
