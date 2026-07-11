import { Link } from "wouter";
import {
  BookOpen, ScrollText, Moon, Star, Scale, Building2, Landmark, Gem,
} from "lucide-react";

const CATS = [
  { name: "القرآن الكريم",    Icon: BookOpen   },
  { name: "الحديث الشريف",   Icon: ScrollText  },
  { name: "السيرة النبوية",    Icon: Moon        },
  { name: "قصص الأنبياء",    Icon: Star        },
  { name: "الفقه",             Icon: Scale       },
  { name: "العقيدة",           Icon: Building2   },
  { name: "التاريخ الإسلامي", Icon: Landmark     },
  { name: "الأخلاق والصحابة", Icon: Gem          },
];

export function HomeQuizCard() {
  return (
    <section className="ds-quiz-home-card" dir="rtl" aria-label="لعبة سؤال وجواب الإسلامية"
      style={{ position: "relative", overflow: "hidden" }}>
      {/* زخرفة هندسية خلفية */}
      <svg aria-hidden="true" style={{
        position: "absolute", top: "-20px", left: "-20px", opacity: 0.05, pointerEvents: "none",
      }} width="120" height="120" viewBox="0 0 120 120">
        <polygon points="60,5 75,40 112,40 82,62 95,97 60,75 25,97 38,62 8,40 45,40" fill="#1F4D3A"/>
      </svg>
      <svg aria-hidden="true" style={{
        position: "absolute", bottom: "-15px", right: "-15px", opacity: 0.04, pointerEvents: "none",
      }} width="100" height="100" viewBox="0 0 100 100">
        <polygon points="50,5 63,37 97,37 71,57 81,89 50,68 19,89 29,57 3,37 37,37" fill="#2d7a5a"/>
      </svg>
      <div className="ds-quiz-home-card__content">
        <div className="ds-quiz-home-card__text">
          <span className="ds-quiz-home-card__badge">تنافسي • جماعي</span>
          <h2 className="ds-quiz-home-card__title">لعبة سؤال وجواب الإسلامية</h2>
          <p className="ds-quiz-home-card__desc">
            فريقان يتنافسان في 440 سؤال إسلامي من 8 فئات، اختبر معلوماتك في القرآن والحديث والسيرة والفقه والعقيدة والتاريخ والأخلاق
          </p>
          <Link href="/quiz" className="ds-quiz-home-card__btn">ابدأ اللعبة</Link>
        </div>
        <div className="ds-quiz-home-card__grid" aria-hidden="true">
          {CATS.map(({ name, Icon }) => (
            <div key={name} className="ds-quiz-home-card__cat">
              <Icon size={15} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
