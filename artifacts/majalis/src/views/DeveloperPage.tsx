export default function DeveloperPage() {
  const apiBase = typeof window !== "undefined" ? window.location.origin : "https://www.majlisilm.com";

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ color: "#1a472a" }}>المجلس العلمي — Open Islamic Platform</h1>
      <p style={{ fontSize: "1.125rem", lineHeight: 1.7 }}>
        واجهة برمجة احترافية للوصول إلى المحتوى العلمي الإسلامي: القرآن، الأحاديث، الفتاوى، الدروس، والمزيد.
      </p>

      <section style={{ margin: "2rem 0" }}>
        <h2>البدء السريع</h2>
        <pre style={{ background: "#f4f4f4", padding: "1rem", borderRadius: 8, overflow: "auto" }}>
{`curl -H "X-API-Key: maj_YOUR_KEY" \\
  "${apiBase}/api/v1/search?q=الصلاة&limit=10"`}
        </pre>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2>إصدارات API</h2>
        <ul>
          <li><a href={`${apiBase}/api/v1/docs?format=html`}><code>/api/v1</code></a> — Stable</li>
          <li><a href={`${apiBase}/api/v2/docs?format=html`}><code>/api/v2</code></a> — Enhanced metadata + verification</li>
          <li><a href={`${apiBase}/api/v3/docs?format=html`}><code>/api/v3</code></a> — Relations + semantic search</li>
        </ul>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2>المحتوى المتاح</h2>
        <p>22+ قسم: قرآن، أحاديث، أذكار، أدعية، فوائد، كتب، مشايخ، دروس، فتاوى، قرارات فقهية، إعجاز علمي، مناسبات، تقويم، وغيرها.</p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2>المصادقة</h2>
        <p>أرسل <code>X-API-Key</code> أو <code>Authorization: Bearer</code> مع كل طلب. أنشئ مفاتيحك من لوحة الإدارة.</p>
        <a href="/admin">لوحة المطورين ←</a>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2>Webhooks</h2>
        <p>سجّل عنوان webhook من لوحة الإدارة لتلقي إشعارات عند نشر محتوى جديد.</p>
      </section>
    </div>
  );
}
