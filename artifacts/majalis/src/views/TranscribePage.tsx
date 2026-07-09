import { useCallback, useEffect, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { validateMediaUpload, safeUploadFileName, MAX_MEDIA_BYTES } from "@/lib/file-validation";
import { sanitizeText } from "@/lib/sanitize";
import { Link } from "wouter";
import { useDropzone, type FileRejection } from "react-dropzone";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type TabId = "upload" | "youtube" | "text";
type Status = "idle" | "uploading" | "processing" | "done" | "error";

type AnalysisResult = {
  summary?: string;
  benefits?: Array<{ benefit: string; timestamp?: string; category?: string }>;
  main_topics?: string[];
  speaker_info?: string;
  key_quotes?: string[];
};

const PENDING_WHISPER_TRANSCRIPT = "__pending_whisper__";

export default function TranscribePage() {
  const { isLoggedIn } = useAuth() as { isLoggedIn: boolean };
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("upload");
  const [manualText, setManualText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/transcribe",
      title: "تفريغ الدروس والمحاضرات | المجلس العلمي",
      description: "أداة تفريغ الدروس والمحاضرات الإسلامية تلقائياً — حمّل ملفاً صوتياً أو رابط يوتيوب واحصل على ملخص وفوائد منظّمة.",
      keywords: ["تفريغ دروس", "تفريغ محاضرات", "تلخيص درس", "ذكاء اصطناعي إسلامي", "استخراج فوائد"],
    });
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const code = rejectedFiles[0]?.errors[0]?.code;
        if (code === "file-too-large") {
          setErrorMessage("حجم الملف يتجاوز الحد المسموح.");
        } else {
          setErrorMessage("نوع الملف غير مدعوم.");
        }
        return;
      }
      const picked = acceptedFiles[0];
      if (!picked) return;
      const check = validateMediaUpload(picked);
      if (!check.ok) {
        setErrorMessage(check.error);
        return;
      }
      setFile(picked);
      if (!title) setTitle(sanitizeText(picked.name.replace(/\.[^/.]+$/, ""), 120));
    },
    [title]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
      "audio/mp4": [".m4a"],
      "video/mp4": [".mp4"],
      "video/webm": [".webm"],
    },
    maxSize: MAX_MEDIA_BYTES,
    multiple: false,
  });

  const handleProcess = async () => {
    setErrorMessage("");
    setResult(null);

    if (!sanitizeText(title, 200)) {
      setErrorMessage("أدخل عنواناً للدرس.");
      return;
    }

    const safeTitle = sanitizeText(title, 200);

    if (!isLoggedIn) {
      setErrorMessage("يجب تسجيل الدخول أولاً.");
      return;
    }

    setStatus("uploading");
    setProgress(10);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      const accessToken = sessionData.session?.access_token;
      if (!user || !accessToken) {
        setErrorMessage("يجب تسجيل الدخول.");
        setStatus("error");
        return;
      }

      const fileType =
        activeTab === "youtube"
          ? "youtube"
          : activeTab === "text"
            ? "audio"
            : file?.type.startsWith("video")
              ? "video"
              : "audio";

      let transcriptText = manualText.trim();

      const { data: record, error: insertError } = await supabase
        .from("transcriptions")
        .insert({
          user_id: user.id,
          title: safeTitle,
          file_type: fileType,
          source_url: activeTab === "youtube" ? sanitizeText(youtubeUrl, 500) || null : null,
          transcript_text: activeTab === "text" ? sanitizeText(manualText, 50000) : null,
          status: "processing",
        })
        .select()
        .single();

      if (insertError || !record) throw insertError || new Error("تعذر إنشاء السجل.");

      setProgress(30);

      if (file && activeTab === "upload") {
        const fileName = `${user.id}/${Date.now()}-${safeUploadFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("transcriptions")
          .upload(fileName, file, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage.from("transcriptions").getPublicUrl(fileName);

        await supabase
          .from("transcriptions")
          .update({ file_url: publicUrl?.publicUrl || fileName })
          .eq("id", record.id);

        transcriptText = PENDING_WHISPER_TRANSCRIPT;
        setProgress(60);
      }

      if (activeTab === "youtube") {
        await supabase
          .from("transcriptions")
          .update({ status: "pending", source_url: youtubeUrl.trim() })
          .eq("id", record.id);
        setProgress(100);
        setStatus("done");
        setErrorMessage("تم حفظ رابط يوتيوب. التفريغ التلقائي قيد التطوير — استخدم تبويب «نص مباشر» للتحليل الآن.");
        return;
      }

      if (activeTab === "upload" && (!transcriptText || transcriptText === PENDING_WHISPER_TRANSCRIPT)) {
        await supabase
          .from("transcriptions")
          .update({ status: "pending" })
          .eq("id", record.id);
        setProgress(100);
        setStatus("done");
        setErrorMessage("تم رفع الملف بنجاح. للتحليل الذكي الصق النص المُفرَّغ في تبويب «نص مباشر».");
        return;
      }

      if (!transcriptText || transcriptText.length < 40) {
        throw new Error("أدخل نصاً مُفرَّغاً كافياً (40 حرفاً على الأقل).");
      }

      setStatus("processing");
      setProgress(70);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          transcript_text: transcriptText,
          title: safeTitle,
          transcription_id: record.id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await supabase.from("transcriptions").update({ status: "error" }).eq("id", record.id);
        throw new Error("تعذر إكمال التحليل. حاول لاحقًا.");
      }

      setProgress(100);
      setResult(data.analysis as AnalysisResult);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage("تعذر إكمال العملية. حاول لاحقًا.");
    }
  };

  return (
    <div className="trp-root">
      <div className="mx-auto max-w-4xl px-4">
        <Link href="/" className="trp-back-link">← المجلس العلمي</Link>
        <h1 className="trp-title">تفريغ الدروس</h1>
        <p className="trp-subtitle">حوّل الصوت والفيديو إلى نص مع تلخيص ذكي واستخراج الفوائد</p>

        {!isLoggedIn && (
          <div className="trp-login-notice">
            يجب <Link href="/login?next=/transcribe" className="font-bold underline">تسجيل الدخول</Link> لاستخدام التفريغ.
          </div>
        )}

        <div className="trp-tabs-nav">
          {[
            { id: "upload" as const, label: "رفع ملف" },
            { id: "youtube" as const, label: "يوتيوب" },
            { id: "text" as const, label: "نص مباشر" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? "trp-tab trp-tab--active" : "trp-tab"}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="trp-form-box">
          <div>
            <label className="trp-label">عنوان الدرس *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: شرح الأربعين النووية - الدرس الأول"
              className="trp-input"
            />
          </div>

          {activeTab === "upload" && (
            <div
              {...getRootProps()}
              className={isDragActive ? "trp-dropzone trp-dropzone--active" : "trp-dropzone"}
            >
              <input {...getInputProps()} />
              <div className="trp-drop-label">اسحب الملف هنا أو انقر للاختيار</div>
              {file ? (
                <p className="trp-drop-filename">{file.name}</p>
              ) : (
                <>
                  <p className="trp-drop-hint">اسحب الملف هنا أو اضغط للاختيار</p>
                  <p className="trp-drop-hint-sub">MP3, MP4, WAV, M4A — حتى 500MB</p>
                </>
              )}
            </div>
          )}

          {activeTab === "youtube" && (
            <div>
              <label className="trp-label">رابط يوتيوب</label>
              <input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="trp-input"
              />
            </div>
          )}

          {activeTab === "text" && (
            <div>
              <label className="trp-label">أدخل النص المُفرَّغ مسبقاً</label>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                rows={8}
                placeholder="الصق النص هنا لتلخيصه واستخراج فوائده..."
                className="trp-input"
              />
            </div>
          )}

          {status !== "idle" && (
            <div>
              <div className="trp-progress-row">
                <span className="trp-progress-status">
                  {status === "uploading"
                    ? "جاري الرفع..."
                    : status === "processing"
                      ? "جاري التحليل..."
                        : status === "done"
                        ? "اكتملت المعالجة"
                        : "حدث خطأ"}
                </span>
                <span className="trp-progress-pct">{progress}%</span>
              </div>
              <div className="trp-prog-track">
                <div
                  className="trp-prog-fill"
                  style={{ "--tp-pct": `${progress}%` } as React.CSSProperties}
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <p className="trp-alert" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleProcess}
            disabled={!isLoggedIn || status === "uploading" || status === "processing"}
            className="trp-submit-btn"
          >
            {status === "uploading" || status === "processing" ? "جاري المعالجة..." : "ابدأ التحليل الذكي"}
          </button>
        </div>

        {result && (
          <div className="mt-8 space-y-6">
            {result.summary && (
              <div className="trp-result-card">
                <h2 className="trp-result-title">الملخص الذكي</h2>
                <p className="trp-result-body">{result.summary}</p>
              </div>
            )}

            {result.benefits && result.benefits.length > 0 && (
              <div className="trp-result-card">
                <h2 className="trp-result-title">
                  الفوائد المستخرجة ({result.benefits.length})
                </h2>
                <div className="space-y-3">
                  {result.benefits.map((b, i) => (
                    <div key={i} className="trp-benefit-card">
                      {b.timestamp && (
                        <span className="trp-benefit-timestamp">{b.timestamp}</span>
                      )}
                      <div className="flex-1">
                        <p className="trp-benefit-text">{b.benefit}</p>
                        {b.category && (
                          <span className="trp-benefit-category">{b.category}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.key_quotes && result.key_quotes.length > 0 && (
              <div className="trp-result-card">
                <h2 className="trp-result-title">أبرز الاقتباسات</h2>
                <div className="space-y-3">
                  {result.key_quotes.map((q, i) => (
                    <blockquote key={i} className="trp-blockquote">
                      {q}
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
