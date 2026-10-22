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
import { useT } from "@/core/i18n";
import { Group, SectionTitle } from "./SettingsDialog";

export function DataSection() {
  const t = useT();
  const file = useRef<HTMLInputElement>(null);
  const gate = useGate();
  const canExport = useCan("export");
  const items = useEntries((s) => s.items);
  const sample = hasSampleData(items);

  return (
    <>
      <SectionTitle eyebrow={t("Data")} title={t("Your data")}>
        {t("Without an account, everything lives in this browser. Make a backup now and then, or sign in with Pro to sync.")}
      </SectionTitle>
      <Group title={t("Backup")}>
        <Field label={t("Download a backup")} hint={t("Every session, task and setting as JSON.")}>
          <Button
            size="sm"
            variant="outline"
            icon={<DownloadSimple size={14} weight="bold" />}
            onClick={() => downloadFile(`steen-backup-${dayKey(Date.now())}.json`, createBackup(), "application/json")}
          >
            {t("Backup")}
          </Button>
        </Field>
        <Field label={t("Restore a backup")} hint={t("Merges with what's here; newer versions win.")}>
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
                  toast({ message: t("Restored {n} records.", { n }), tone: "success" });
                } catch (err) {
                  toast({ message: err instanceof Error ? err.message : t("Couldn't read that file."), tone: "error" });
                }
              }}
            />
            <Button size="sm" variant="outline" icon={<UploadSimple size={14} weight="bold" />} onClick={() => file.current?.click()}>
              {t("Restore")}
            </Button>
          </>
        </Field>
        <Field label={t("Sessions as CSV")} hint={t("For spreadsheets.")} badge={!canExport ? <ProBadge /> : undefined}>
          <Button size="sm" variant="outline" icon={<FileCsv size={14} weight="bold" />} onClick={() => gate("export", exportSessionsCsv)}>
            {t("Export")}
          </Button>
        </Field>
      </Group>
      <Group title={t("Sample data")}>
        <Field
          label={sample ? t("Remove sample sessions") : t("Explore with sample data")}
          hint={t("Six months of made-up sessions, so Insights has something to show.")}
        >
          {sample ? (
            <Button size="sm" variant="outline" icon={<Trash size={14} weight="bold" />} onClick={() => removeSampleData()}>
              {t("Remove")}
            </Button>
          ) : (
            <Button size="sm" variant="outline" icon={<Flask size={14} weight="bold" />} onClick={() => loadSampleData()}>
              {t("Load")}
            </Button>
          )}
        </Field>
      </Group>
      <Group title={t("Danger zone")}>
        <Field label={t("Erase everything on this device")} hint={t("Sessions, tasks, settings. Synced data in your account is kept.")}>
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              const ok = await confirmAction({
                title: t("Erase all local data?"),
                body: t("This can't be undone. Download a backup first if you might want it back."),
                confirmLabel: t("Erase everything"),
                tone: "danger",
              });
              if (!ok) return;
              eraseLocalData();
              window.location.reload();
            }}
          >
            {t("Erase")}
          </Button>
        </Field>
      </Group>
    </>
  );
}
