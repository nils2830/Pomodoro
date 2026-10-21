"use client";

import { useRef } from "react";
import { DownloadSimple, UploadSimple, Flask, Trash, FileCsv } from "@phosphor-icons/react";
import { Button } from "@/core/ui/Button";
import { Field } from "@/core/ui/fields";
import { ProBadge } from "@/core/ui/ProBadge";
import { confirmAction, toast } from "@/core/ui/store";
import { useGate } from "@/core/billing/useGate";
import { useCan } from "@/core/billing/entitlements";
import { createBackup, eraseLocalData, restoreBackup } from "@/core/data/backup";
import { downloadFile } from "@/core/lib/download";
import { dayKey } from "@/core/lib/date";
import { loadSampleData, removeSampleData, hasSampleData } from "@/modules/insights/sample";
import { exportSessionsCsv } from "@/modules/insights/export";
import { useEntries } from "@/core/data/entries";
import { Group, SectionTitle } from "./SettingsDialog";

export function DataSection() {
  const file = useRef<HTMLInputElement>(null);
  const gate = useGate();
  const canExport = useCan("export");
  const items = useEntries((s) => s.items);
  const sample = hasSampleData(items);

  return (
    <>
      <SectionTitle eyebrow="Data" title="Your data">
        Without an account, everything lives in this browser. Make a backup now and then, or sign in with Pro to sync.
      </SectionTitle>
      <Group title="Backup">
        <Field label="Download a backup" hint="Every session, task and setting as JSON.">
          <Button
            size="sm"
            variant="outline"
            icon={<DownloadSimple size={14} weight="bold" />}
            onClick={() => downloadFile(`steen-backup-${dayKey(Date.now())}.json`, createBackup(), "application/json")}
          >
            Backup
          </Button>
        </Field>
        <Field label="Restore a backup" hint="Merges with what's here; newer versions win.">
          <>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                try {
                  const n = restoreBackup(await f.text());
                  toast({ message: `Restored ${n} records.`, tone: "success" });
                } catch (err) {
                  toast({ message: err instanceof Error ? err.message : "Couldn't read that file.", tone: "error" });
                }
              }}
            />
            <Button size="sm" variant="outline" icon={<UploadSimple size={14} weight="bold" />} onClick={() => file.current?.click()}>
              Restore
            </Button>
          </>
        </Field>
        <Field label="Sessions as CSV" hint="For spreadsheets." badge={!canExport ? <ProBadge /> : undefined}>
          <Button size="sm" variant="outline" icon={<FileCsv size={14} weight="bold" />} onClick={() => gate("export", exportSessionsCsv)}>
            Export
          </Button>
        </Field>
      </Group>
      <Group title="Sample data">
        <Field label={sample ? "Remove sample sessions" : "Explore with sample data"} hint="Six months of made-up sessions, so Insights has something to show.">
          {sample ? (
            <Button size="sm" variant="outline" icon={<Trash size={14} weight="bold" />} onClick={() => removeSampleData()}>
              Remove
            </Button>
          ) : (
            <Button size="sm" variant="outline" icon={<Flask size={14} weight="bold" />} onClick={() => loadSampleData()}>
              Load
            </Button>
          )}
        </Field>
      </Group>
      <Group title="Danger zone">
        <Field label="Erase everything on this device" hint="Sessions, tasks, settings. Synced data in your account is kept.">
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              const ok = await confirmAction({
                title: "Erase all local data?",
                body: "This can't be undone. Download a backup first if you might want it back.",
                confirmLabel: "Erase everything",
                tone: "danger",
              });
              if (!ok) return;
              eraseLocalData();
              window.location.reload();
            }}
          >
            Erase
          </Button>
        </Field>
      </Group>
    </>
  );
}
