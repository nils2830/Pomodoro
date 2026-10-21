"use client";

import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { useUI } from "./store";

export function ConfirmDialog() {
  const req = useUI((s) => s.confirmRequest);
  return (
    <Dialog open={Boolean(req)} onClose={() => req?.resolve(false)} size="sm" title={req?.title}>
      {req?.body && <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{req.body}</p>}
      <div className="mt-7 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => req?.resolve(false)}>
          Cancel
        </Button>
        <Button variant={req?.tone === "danger" ? "danger" : "primary"} onClick={() => req?.resolve(true)} autoFocus>
          {req?.confirmLabel ?? "Confirm"}
        </Button>
      </div>
    </Dialog>
  );
}
