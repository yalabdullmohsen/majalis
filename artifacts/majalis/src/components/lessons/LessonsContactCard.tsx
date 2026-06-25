const PHONE_E164 = "+96597400062";
const PHONE_DISPLAY = "(965) 97400062";

export function LessonsContactCard() {
  return (
    <aside className="lessons-contact-card" aria-label="تواصل مع القائم على الموقع">
      <h3 className="lessons-contact-card__title">تواصل مع القائم على الموقع</h3>
      <div className="lessons-contact-card__links">
        <a href={`tel:${PHONE_E164}`} className="lessons-contact-card__phone">
          {PHONE_DISPLAY}
        </a>
        <a
          href={`https://wa.me/96597400062`}
          target="_blank"
          rel="noopener noreferrer"
          className="lessons-contact-card__whatsapp"
        >
          واتساب
        </a>
      </div>
    </aside>
  );
}

export default LessonsContactCard;
