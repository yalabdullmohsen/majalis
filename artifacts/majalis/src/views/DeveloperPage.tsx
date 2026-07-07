import { Link } from "wouter";

export default function DeveloperPage() {
  return (
    <div className="dvp-page">
      <h1 className="dvp-title">المجلس العلمي — Open Islamic Platform</h1>
      <p className="dvp-intro">
        واجهة برمجة احترافية للوصول إلى المحتوى العلمي الإسلامي: القرآن، الأحاديث، الفتاوى، الدروس، والمزيد.
      </p>

      <section className="dvp-section">
        <h2>البدء السريع</h2>
        <pre className="dvp-pre">
{`curl -H "X-API-Key: maj_YOUR_KEY" \\
  "https://majalis.app/api/v1/search?q=الصلاة&limit=10"`}
        </pre>
      </section>

      <section className="dvp-section">
        <h2>إصدارات API</h2>
        <ul>
          <li><Link href="/api/v1/docs?format=html"><code>/api/v1</code></Link> — Stable</li>
          <li><Link href="/api/v2/docs?format=html"><code>/api/v2</code></Link> — Enhanced metadata + verification</li>
          <li><Link href="/api/v3/docs?format=html"><code>/api/v3</code></Link> — Relations + semantic search</li>
        </ul>
      </section>

      <section className="dvp-section">
        <h2>المحتوى المتاح</h2>
        <p>22+ قسم: قرآن، أحاديث، أذكار، أدعية، فوائد، كتب، مشايخ، دروس، فتاوى، قرارات فقهية، إعجاز علمي، مناسبات، تقويم، وغيرها.</p>
      </section>

      <section className="dvp-section">
        <h2>المصادقة</h2>
        <p>أرسل <code>X-API-Key</code> أو <code>Authorization: Bearer</code> مع كل طلب. أنشئ مفاتيحك من لوحة الإدارة.</p>
        <Link href="/admin">لوحة المطورين ←</Link>
      </section>

      <section className="dvp-section">
        <h2>Webhooks</h2>
        <p>content.created, content.updated, fatwa.published, fiqh_decision.published, lesson.published, course.completed</p>
      </section>
    </div>
  );
}
