import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/core/shell/ClientOnly";
import { AccountView } from "@/modules/account/AccountView";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <ClientOnly fallback={<div className="min-h-svh" />}>
      <Suspense>
        <AccountView />
      </Suspense>
    </ClientOnly>
  );
}
