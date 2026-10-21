import type { Metadata } from "next";
import { ClientOnly } from "@/core/shell/ClientOnly";
import { AdminView } from "@/modules/admin/AdminView";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return (
    <ClientOnly fallback={<div className="min-h-svh" />}>
      <AdminView />
    </ClientOnly>
  );
}
