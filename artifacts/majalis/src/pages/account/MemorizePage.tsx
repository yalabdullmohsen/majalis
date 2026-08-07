import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";
import Flashcards from "@/components/memorize/Flashcards";

/**
 * شاشة /memorize — بطاقات الحفظ بالتكرار المتباعد.
 * (مشروع Vite/wouter — بديل app/memorize/page.tsx في Next)
 */
export default function MemorizePage() {
  useEffect(() => {
    applyPageSeo({
      path: "/memorize",
      title: "بطاقات الحفظ · مجلس علم",
      description: "احفظ المتون والمصطلحات بالتكرار المتباعد.",
      keywords: ["بطاقات الحفظ", "تكرار متباعد", "الأربعون النووية", "مصطلحات"],
    });
  }, []);

  return <Flashcards />;
}
