/**
 * تصدير/استيراد نسخة احتياطية مشفّرة لبيانات المصحف الشخصية.
 */
import { useRef, useState } from "react";
import { Download, Upload, Shield } from "lucide-react";
import {
  collectQuranBackupPayload,
  encryptBackup,
  decryptBackup,
  restoreQuranBackup,
  downloadTextFile,
} from "@/lib/quran-backup";
import { yieldToMain } from "@/lib/yield-to-main";

export function QuranBackupPanel() {
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportBackup = async () => {
    if (pass.length < 4) {
      setStatus("اختر كلمة مرور من 4 أحرف على الأقل");
      return;
    }
    if (pass !== pass2) {
      setStatus("كلمتا المرور غير متطابقتين");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await yieldToMain();
      const payload = await collectQuranBackupPayload();
      const cipher = await encryptBackup(payload, pass);
      const name = `majalis-quran-backup-${new Date().toISOString().slice(0, 10)}.json`;
      downloadTextFile(name, cipher);
      setStatus("تم تنزيل النسخة المشفّرة بنجاح");
    } catch {
      setStatus("تعذّر إنشاء النسخة الاحتياطية");
    } finally {
      setBusy(false);
    }
  };

  const importBackup = async (file: File) => {
    if (pass.length < 4) {
      setStatus("أدخل كلمة مرور النسخة قبل الاستيراد");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const text = await file.text();
      await yieldToMain();
      const payload = await decryptBackup(text, pass);
      await restoreQuranBackup(payload);
      setStatus("تمت الاستعادة بنجاح — أعد تحميل الصفحة لتطبيق التفضيلات");
    } catch {
      setStatus("فشل فك التشفير أو الاستعادة — تحقق من كلمة المرور والملف");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="qbp-panel">
      <div className="qbp-panel__head">
        <Shield size={15} aria-hidden="true" />
        <strong>نسخ احتياطي مشفّر</strong>
      </div>
      <p className="qbp-hint">
        يحفظ الإشارات المرجعية، ألوانها، ملاحظات التدبّر، سجلات الختمة، والورد في ملف JSON مشفّر بكلمة مرورك.
      </p>

      <label className="qbp-label">
        كلمة المرور
        <input
          type="password"
          autoComplete="new-password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          dir="ltr"
        />
      </label>
      <label className="qbp-label">
        تأكيد كلمة المرور (للتصدير)
        <input
          type="password"
          autoComplete="new-password"
          value={pass2}
          onChange={(e) => setPass2(e.target.value)}
          dir="ltr"
        />
      </label>

      <div className="qbp-actions">
        <button type="button" className="qbp-btn" disabled={busy} onClick={() => void exportBackup()}>
          <Download size={14} aria-hidden="true" />
          تصدير مشفّر
        </button>
        <button
          type="button"
          className="qbp-btn qbp-btn--ghost"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={14} aria-hidden="true" />
          استيراد
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importBackup(f);
            e.target.value = "";
          }}
        />
      </div>
      {status && <p className="qbp-status" role="status">{status}</p>}
    </div>
  );
}

export default QuranBackupPanel;
