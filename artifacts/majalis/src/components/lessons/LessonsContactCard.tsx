import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_E164, CONTACT_EMAIL } from "@/views/ContactPage";

export function LessonsContactCard() {
  return (
    <aside className="lessons-contact-card" aria-label="تواصل معنا">
      <h3 className="lessons-contact-card__title">تواصل معنا</h3>
      <div className="lessons-contact-card__links">
        <a href={`mailto:${CONTACT_EMAIL}`} className="lessons-contact-card__email">
          {CONTACT_EMAIL}
        </a>
        <a href={`tel:${CONTACT_PHONE_E164}`} className="lessons-contact-card__phone">
          {CONTACT_PHONE_DISPLAY}
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
