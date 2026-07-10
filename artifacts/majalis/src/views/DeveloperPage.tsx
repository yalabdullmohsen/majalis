import { useEffect } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/search",
    desc: "بحث شامل في جميع المحتوى",
    params: 'q=نص البحث&limit=10&type=hadith|fatwa|lesson',
  },
  {
    method: "GET",
    path: "/api/v1/quran/pages/:page",
    desc: "صورة صفحة المصحف (1-604)",
    params: 'format=png|webp&quality=high|medium',
  },
  {
    method: "GET",
    path: "/api/v1/hadith",
    desc: "قائمة الأحاديث مع فلترة",
    params: 'book=bukhari&grade=sahih&limit=20&offset=0',
  },
  {
    method: "GET",
    path: "/api/v1/fatwa",
    desc: "الفتاوى الشرعية",
    params: 'category=salah&scholar=:id',
  },
  {
    method: "GET",
    path: "/api/v1/scholars",
    desc: "قائمة العلماء والمشايخ",
    params: 'country=kw&verified=true',
  },
  {
    method: "GET",
    path: "/api/v1/lessons",
    desc: "الدروس والمحاضرات",
    params: 'scholar=:id&type=audio|video|text&limit=20',
  },
  {
    method: "GET",
    path: "/api/v1/adhkar",
    desc: "الأذكار المأثورة",
    params: 'time=morning|evening&grade=sahih',
  },
  {
    method: "GET",
    path: "/api/v1/prayer-times",
    desc: "مواقيت الصلاة",
    params: 'lat=29.37&lng=47.98&method=4&date=2026-07-08',
  },
  {
    method: "GET",
    path: "/api/v1/library/books",
    desc: "كتب المكتبة الشرعية",
    params: 'subject=fiqh|tafseer|hadith&limit=20',
  },
  {
    method: "POST",
    path: "/api/v1/submit/fawaid",
    desc: "تقديم فائدة جديدة للمراجعة",
    params: 'body: { text, source, scholar_id }',
  },
];

const RATE_LIMITS = [
  { plan: "مجاني",  rps: "10 طلب/دقيقة",   daily: "500",      note: "للاستخدام الشخصي" },
  { plan: "مطوّر",  rps: "100 طلب/دقيقة",  daily: "10,000",   note: "للتطبيقات الصغيرة" },
  { plan: "مؤسسي", rps: "1000 طلب/دقيقة", daily: "غير محدود", note: "للمنصات الكبيرة" },
];

const WEBHOOKS = [
  "content.created",
  "content.updated",
  "fatwa.published",
  "fiqh_decision.published",
  "lesson.published",
  "course.completed",
  "scholar.added",
  "book.indexed",
];

const SDK_LANGS = [
  { lang: "JavaScript / TypeScript", pkg: "npm install @majalis/sdk",    status: "قريباً" },
  { lang: "Python",                  pkg: "pip install majalis",           status: "قريباً" },
  { lang: "cURL",                    pkg: "متاح الآن عبر REST API",       status: "متاح"   },
  { lang: "REST (OpenAPI 3.1)",      pkg: "/api/v1/openapi.json",         status: "متاح"   },
];

const METHOD_COLORS: Record<string, string> = {
  GET:    "dvp-badge dvp-badge--get",
  POST:   "dvp-badge dvp-badge--post",
  PUT:    "dvp-badge dvp-badge--put",
  DELETE: "dvp-badge dvp-badge--delete",
};

export default function DeveloperPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/developer",
      title: "واجهة برمجة التطبيقات | مجالس للمطورين",
      description: "وثائق API مجالس، دمج المحتوى الإسلامي في تطبيقاتك بسهولة عبر REST API مفتوح.",
      keywords: ["API إسلامي", "واجهة برمجية", "مطورون", "مجالس API", "بيانات إسلامية"],
    });
  }, []);

  return (
    <div className="dvp-page">

      <header className="dvp-hero">
        <p className="dvp-eyebrow">للمطوّرين</p>
        <h1 className="dvp-title">المجلس العلمي، Open Islamic API</h1>
        <p className="dvp-intro">
          واجهة برمجية مفتوحة للوصول إلى المحتوى العلمي الإسلامي الموثَّق:
          القرآن الكريم، الأحاديث النبوية، الفتاوى، الأذكار، مواقيت الصلاة، الدروس، وأكثر من 22 قسماً.
        </p>
        <div className="dvp-hero-actions">
          <Link href="/admin" className="dvp-btn dvp-btn--primary">طلب مفتاح API</Link>
          <a href="/api/v1/openapi.json" className="dvp-btn dvp-btn--secondary" target="_blank" rel="noopener noreferrer">OpenAPI Spec</a>
        </div>
      </header>

      <section className="dvp-section">
        <h2 className="dvp-section-title">البدء السريع</h2>
        <p className="dvp-section-desc">أرسل أول طلب خلال 60 ثانية:</p>
        <pre className="dvp-pre">{`# 1. احصل على مفتاح API من لوحة المطورين
# 2. ابدأ البحث فوراً:

curl -H "X-API-Key: maj_YOUR_KEY" \\
  "https://majalis.app/api/v1/search?q=الصلاة&limit=5"

# النتيجة:
{
  "data": [
    { "type": "hadith", "text": "...", "grade": "صحيح", "source": "البخاري" },
    { "type": "lesson", "title": "أحكام الصلاة", "scholar": "..." }
  ],
  "meta": { "total": 342, "page": 1, "limit": 5 }
}`}</pre>
      </section>

      <section className="dvp-section">
        <h2 className="dvp-section-title">المصادقة</h2>
        <p className="dvp-section-desc">طريقتان مدعومتان:</p>
        <pre className="dvp-pre">{`# الطريقة 1: API Key في الترويسة (موصى به)
curl -H "X-API-Key: maj_xxxxxxxxxxxxxxxx" \\
  "https://majalis.app/api/v1/hadith"

# الطريقة 2: Bearer Token (OAuth 2.0)
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI..." \\
  "https://majalis.app/api/v1/fatwa"`}</pre>
        <p className="dvp-note">
          أنشئ مفاتيحك وأدر صلاحياتها من{" "}
          <Link href="/admin">لوحة المطوّرين</Link>.
          كل مفتاح قابل للتعطيل الفوري ومحدود بنطاق معين.
        </p>
      </section>

      <section className="dvp-section">
        <h2 className="dvp-section-title">إصدارات API</h2>
        <div className="dvp-versions">
          <div className="dvp-version dvp-version--stable">
            <span className="dvp-version-tag">v1، Stable</span>
            <p>البحث، الأحاديث، الأذكار، الفتاوى، الدروس، العلماء، الكتب، مواقيت الصلاة، صور المصحف.</p>
            <code>/api/v1/</code>
          </div>
          <div className="dvp-version">
            <span className="dvp-version-tag">v2، Enhanced</span>
            <p>البيانات الوصفية المُعززة، التحقق من مصادر الأحاديث، علاقات العلماء بمؤلفاتهم.</p>
            <code>/api/v2/</code>
          </div>
          <div className="dvp-version">
            <span className="dvp-version-tag">v3، Semantic</span>
            <p>البحث الدلالي بالذكاء الاصطناعي، رسم معرفي للمفاهيم الشرعية، توصيات المحتوى.</p>
            <code>/api/v3/</code>
          </div>
        </div>
      </section>

      <section className="dvp-section">
        <h2 className="dvp-section-title">نقاط الطرف الرئيسية</h2>
        <div className="dvp-endpoints">
          {ENDPOINTS.map((ep) => (
            <div key={ep.path} className="dvp-endpoint">
              <div className="dvp-endpoint-header">
                <span className={METHOD_COLORS[ep.method] ?? "dvp-badge"}>{ep.method}</span>
                <code className="dvp-endpoint-path">{ep.path}</code>
              </div>
              <p className="dvp-endpoint-desc">{ep.desc}</p>
              <p className="dvp-endpoint-params">{ep.params}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="dvp-section">
        <h2 className="dvp-section-title">حدود الاستخدام</h2>
        <div className="dvp-table-wrap">
          <table className="dvp-table">
            <thead>
              <tr>
                <th>الخطة</th>
                <th>معدل الطلبات</th>
                <th>الطلبات اليومية</th>
                <th>ملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {RATE_LIMITS.map((row) => (
                <tr key={row.plan}>
                  <td><strong>{row.plan}</strong></td>
                  <td>{row.rps}</td>
                  <td>{row.daily}</td>
                  <td className="dvp-table-note">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="dvp-note">
          عند تجاوز الحد يُعاد الرد بـ <code>429 Too Many Requests</code> مع ترويسة{" "}
          <code>Retry-After</code> تحدد وقت الانتظار.
        </p>
      </section>

      <section className="dvp-section">
        <h2 className="dvp-section-title">المحتوى المتاح (22+ قسم)</h2>
        <div className="dvp-content-grid">
          {[
            "القرآن الكريم", "الأحاديث النبوية", "الأذكار والأدعية", "الفتاوى الشرعية",
            "الدروس والمحاضرات", "الكتب الشرعية", "العلماء والمشايخ", "مواقيت الصلاة",
            "الأحكام الفقهية", "القرارات الفقهية", "السيرة النبوية", "الإعجاز العلمي",
            "المناسبات الإسلامية", "الفوائد العلمية", "الأسئلة والأجوبة", "الدورات العلمية",
            "الأربعون النووية", "خارطة طالب العلم", "التقويم الهجري", "القبلة",
            "الورد اليومي", "المسابقات التعليمية",
          ].map((c) => (
            <span key={c} className="dvp-content-tag">{c}</span>
          ))}
        </div>
      </section>

      <section className="dvp-section">
        <h2 className="dvp-section-title">Webhooks</h2>
        <p className="dvp-section-desc">
          اشترك في أحداث المنصة وستصلك إشعارات HTTP POST فور وقوعها:
        </p>
        <div className="dvp-webhook-list">
          {WEBHOOKS.map((wh) => (
            <code key={wh} className="dvp-webhook-tag">{wh}</code>
          ))}
        </div>
        <pre className="dvp-pre">{`{
  "event": "fatwa.published",
  "id": "evt_abc123",
  "timestamp": "2026-07-08T14:30:00Z",
  "data": {
    "fatwa_id": 47,
    "title": "حكم قراءة القرآن من الهاتف",
    "scholar": "شيخ محمد العثيمين",
    "published_at": "2026-07-08T14:29:55Z"
  }
}`}</pre>
      </section>

      <section className="dvp-section">
        <h2 className="dvp-section-title">مكتبات البرمجة (SDKs)</h2>
        <div className="dvp-sdk-list">
          {SDK_LANGS.map((sdk) => (
            <div key={sdk.lang} className="dvp-sdk-item">
              <div className="dvp-sdk-info">
                <strong>{sdk.lang}</strong>
                <code>{sdk.pkg}</code>
              </div>
              <span className={`dvp-sdk-status ${sdk.status === "متاح" ? "dvp-sdk-status--live" : "dvp-sdk-status--soon"}`}>
                {sdk.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="dvp-section">
        <h2 className="dvp-section-title">رموز الخطأ</h2>
        <div className="dvp-table-wrap">
          <table className="dvp-table">
            <thead>
              <tr><th>الرمز</th><th>المعنى</th><th>الحل</th></tr>
            </thead>
            <tbody>
              {[
                ["400", "طلب غير صحيح",          "تحقق من معاملات الطلب"],
                ["401", "مصادقة مطلوبة",          "أضف X-API-Key أو Bearer Token"],
                ["403", "صلاحيات غير كافية",     "مفتاحك لا يملك صلاحية هذا المسار"],
                ["404", "المحتوى غير موجود",     "تحقق من المعرّف أو المسار"],
                ["429", "تجاوز حد الاستخدام",    "انتظر المدة الواردة في Retry-After"],
                ["500", "خطأ داخلي في الخادم",   "أبلغ عن المشكلة عبر صفحة التواصل"],
              ].map(([code, meaning, fix]) => (
                <tr key={code}>
                  <td><code>{code}</code></td>
                  <td>{meaning}</td>
                  <td className="dvp-table-note">{fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dvp-cta">
        <h2>جاهز للبدء؟</h2>
        <p>اطلب مفتاح API الخاص بك مجاناً وابدأ البناء اليوم.</p>
        <div className="dvp-hero-actions">
          <Link href="/admin" className="dvp-btn dvp-btn--primary">طلب مفتاح API</Link>
          <Link href="/contact" className="dvp-btn dvp-btn--secondary">تواصل مع الفريق</Link>
        </div>
      </section>

    </div>
  );
}
