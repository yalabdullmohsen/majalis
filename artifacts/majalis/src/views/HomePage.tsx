"use client";

import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import { HomeAboutSection, HomeMainHubsSection } from "@/components/home/HomeAboutSection";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeQuranCirclesSection } from "@/components/home/HomeQuranCirclesSection";
import { HomeMutoonSection } from "@/components/home/HomeMutoonSection";
import { HomeAnnualCoursesSection } from "@/components/home/HomeAnnualCoursesSection";
import { HomeDailyQuestion } from "@/components/home/HomeDailyQuestion";
import { HomeDailyFaida } from "@/components/home/HomeDailyFaida";
import { HomeDailyDhikr } from "@/components/home/HomeDailyDhikr";
import { HomeMiraclesSection } from "@/components/home/HomeMiraclesSection";
import { HomeFeaturedLibrary } from "@/components/home/HomeFeaturedLibrary";
import { HomeEducationalGamesSection } from "@/components/home/HomeEducationalGamesSection";
import { HomeLatestUpdates } from "@/components/home/HomeLatestUpdates";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

function SafeHomeSection({ name, children }: { name: string; children: React.ReactNode }) {
  return <SectionErrorBoundary name={name}>{children}</SectionErrorBoundary>;
}

export default function HomePage({
  initialFeaturedLessons,
}: {
  initialFeaturedLessons?: KuwaitLessonRecord[];
} = {}) {
  return (
    <div className="home-page home-page--v4">
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      <SafeHomeSection name="Hero">
        <HomeHeroSection />
      </SafeHomeSection>

      <main className="home-v4-main">
        <SafeHomeSection name="نبذة">
          <HomeAboutSection />
        </SafeHomeSection>

        <SafeHomeSection name="الأقسام">
          <HomeMainHubsSection />
        </SafeHomeSection>

        <div className="home-container home-v4-spaced">
          <SafeHomeSection name="الدروس">
            <HomeUpcomingLessons initialLessons={initialFeaturedLessons} />
          </SafeHomeSection>

          <SafeHomeSection name="حلقات القرآن">
            <HomeQuranCirclesSection />
          </SafeHomeSection>

          <SafeHomeSection name="المتون">
            <HomeMutoonSection />
          </SafeHomeSection>

          <SafeHomeSection name="الدورات">
            <HomeAnnualCoursesSection />
          </SafeHomeSection>

          <SafeHomeSection name="الأسئلة">
            <HomeDailyQuestion />
          </SafeHomeSection>

          <SafeHomeSection name="الفوائد">
            <HomeDailyFaida />
          </SafeHomeSection>

          <SafeHomeSection name="الأذكار">
            <HomeDailyDhikr />
          </SafeHomeSection>
        </div>

        <SafeHomeSection name="الإعجاز">
          <HomeMiraclesSection />
        </SafeHomeSection>

        <div className="home-container home-v4-spaced">
          <SafeHomeSection name="المكتبة">
            <HomeFeaturedLibrary />
          </SafeHomeSection>

          <SafeHomeSection name="الألعاب">
            <HomeEducationalGamesSection />
          </SafeHomeSection>

          <SafeHomeSection name="آخر الإضافات">
            <HomeLatestUpdates />
          </SafeHomeSection>
        </div>
      </main>
    </div>
  );
}
