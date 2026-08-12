import { Link } from "wouter";
import { HOME_CONTENT_HUB } from "@/lib/home-content-hub";
import "@/styles/components/home-content-hub.css";

function prefetch(load?: () => Promise<unknown>) {
  if (!load) return;
  void load().catch(() => undefined);
}

/** محور محتوى عالي القيمة — قصص الأنبياء / الذين ذكروا في القرآن / الأمم السابقة */
export function HomeContentHub() {
  return (
    <section className="home-content-hub" aria-labelledby="home-content-hub-title">
      <div className="home-content-hub__head">
        <h2 id="home-content-hub-title" className="home-content-hub__title">
          محتوى أساسي
        </h2>
        <p className="home-content-hub__sub">قصص وأعلام وأمم — مدخل سريع</p>
      </div>
      <ul className="home-content-hub__grid">
        {HOME_CONTENT_HUB.map(({ href, Icon, title, subtitle, preload }) => (
          <li key={href}>
            <Link
              href={href}
              className="home-content-hub__card"
              onMouseEnter={() => prefetch(preload)}
              onTouchStart={() => prefetch(preload)}
              onFocus={() => prefetch(preload)}
            >
              <span className="home-content-hub__icon" aria-hidden="true">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <span className="home-content-hub__copy">
                <strong className="home-content-hub__name">{title}</strong>
                <span className="home-content-hub__desc">{subtitle}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
