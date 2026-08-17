import { Redirect, useParams } from "wouter";

/** مسارات قديمة `/fiqh/topics/:id` تُحوَّل إلى الكتب أو المباحث المساندة. */
const TOPIC_REDIRECTS: Record<string, string> = {
  muamalat: "/fiqh#fiqh-muamalat",
  atima: "/fiqh/books/atima",
  medical: "/fiqh-council/nawazil",
  "islamic-finance": "/fiqh/books/riba",
  "usul-fiqh": "/fiqh/usul",
  nawazil: "/fiqh-council/nawazil",
  hudud: "/fiqh/books/hudud",
  minorities: "/fiqh-council/nawazil",
  "tech-fiqh": "/fiqh-council/nawazil",
  patients: "/fiqh/books/taharah",
  financing: "/fiqh/books/riba",
};

export default function FiqhTopicPage() {
  const params = useParams<{ topicId: string }>();
  const dest = TOPIC_REDIRECTS[params.topicId ?? ""] ?? "/fiqh";
  return <Redirect to={dest} />;
}
