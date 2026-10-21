import { ClientOnly } from "@/core/shell/ClientOnly";
import { FocusView } from "@/modules/focus/components/FocusView";
import { FocusAbout } from "@/modules/focus/components/FocusAbout";

export default function FocusPage() {
  return (
    <>
      <ClientOnly fallback={<div className="min-h-[calc(100svh-72px)]" />}>
        <FocusView />
      </ClientOnly>
      <FocusAbout />
    </>
  );
}
