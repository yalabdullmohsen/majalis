import { useCallback, useState } from "react";
import {
  createLocalBackup,
  restoreFromBackupFile,
  serializeBackupEnvelope,
  type BackupEnvelope,
} from "@/lib/local-backup-migration";

/** Local backup & peer migration — logic only. */
export function useLocalBackupMigration() {
  const [lastEnvelope, setLastEnvelope] = useState<BackupEnvelope | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastRestored, setLastRestored] = useState<string[]>([]);

  const exportBackup = useCallback(async (passphrase?: string) => {
    setBusy(true);
    try {
      const env = await createLocalBackup({ passphrase });
      setLastEnvelope(env);
      return serializeBackupEnvelope(env);
    } finally {
      setBusy(false);
    }
  }, []);

  const importBackup = useCallback(async (raw: string, passphrase?: string) => {
    setBusy(true);
    try {
      const result = await restoreFromBackupFile(raw, passphrase);
      setLastRestored(result.restored);
      return result;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, lastEnvelope, lastRestored, exportBackup, importBackup };
}
