"use client";

import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { useUI } from "./store";
import { useT } from "../i18n";

export function ConfirmDialog() {
  const req = useUI((s) => s.confirmRequest);
  const t = useT();
  return (
    <Dialog open={Boolean(req)} onClose={() => req?.resolve(false)} size="sm" title={req?.title}>
      {req?.body && <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{req.body}</p>}
      <div className="mt-7 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => req?.resolve(false)}>
          {t("Cancel")}
        </Button>
        <Button variant={req?.tone === "danger" ? "danger" : "primary"} onClick={() => req?.resolve(true)} autoFocus>
          {req?.confirmLabel ?? t("Confirm")}
        </Button>
      </div>
    </Dialog>
  );
}
