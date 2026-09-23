/**
 * محفوظاتي — وحدات مسجّلة للمراجعة (فارغ حتى PR-3).
 */
import { useEffect } from "react";
import { Link, Redirect } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { UtilityScreen } from "@/components/design-system/screens";
import { EmptyStateV2, PageHeaderV2 } from "@/components/design-system";
import {
  HIFZ_PATH_USER_TAGLINE,
  isHifzPathEnabled,
} from "@/lib/memorization-path";

const PATH = "/hifz-path";

export default function HifzPathMyPage() {
  if (!isHifzPathEnabled()) {
    return <Redirect to="/memorization" />;
  }
  return <HifzPathMyShell />;
}

function HifzPathMyShell() {
  useEffect(() => {
    applyPageSeo({
      path: `${PATH}/my`,
      title: "محفوظاتي | مسار الحفظ | سُنّة",
      description: "متابعة الوحدات التي سجّلتها للمراجعة ضمن مسار الحفظ.",
      robots: "noindex, follow",
    });
  }, []);

  return (
    <UtilityScreen compose="mark">
      <main className="mx-auto w-full max-w-3xl px-4 py-4" dir="rtl">
        <PageHeaderV2
          className="mb-4"
          title="محفوظاتي"
          description="الوحدات التي سجّلتها ضمن محفوظاتك — بلا شهادة حفظ وبلا ادعاء تحقق آلي."
        />
        <EmptyStateV2
          title="لا وحدات في محفوظاتك بعد"
          description={`${HIFZ_PATH_USER_TAGLINE}. سجّل وحدة بعد بدء مسار منشور.`}
          ctaLabel="العودة لمسار الحفظ"
          href={PATH}
        />
        <p className="mt-4 text-center text-sm">
          <Link href={PATH} className="text-primary underline-offset-2 hover:underline">
            تصفّح المسارات المقترحة
          </Link>
        </p>
      </main>
    </UtilityScreen>
  );
}
