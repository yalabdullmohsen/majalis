/**
 * شجرة المسارات خارج الرئيسية — تُحمَّل كسولًا حتى لا تنتفخ حزمة الإقلاع.
 * الرئيسية تبقى في App.tsx مع HomeInitialShell.
 */
import { Suspense, type ComponentType } from "react";
import { Redirect, Route, Switch, useParams } from "wouter";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LazyRouteFallback } from "@/components/LazyRouteFallback";
import { lazyWithRetry } from "@/lib/lazy-with-retry";

const lazy = lazyWithRetry;

const NotFound = lazy(() => import("@/views/not-found"));
const QuranEnginePage = lazy(() => import("@/pages/quran/QuranEnginePage"));
const AboutPage = lazy(() => import("@/views/AboutPage"));
const SourcesLicensesPage = lazy(() => import("@/views/SourcesLicensesPage"));
const SourcesDirectoryPage = lazy(() => import("@/pages/sources/SourcesDirectoryPage"));
const SourceDetailPage = lazy(() => import("@/pages/sources/SourceDetailPage"));
const SiteMapPage = lazy(() => import("@/pages/account/SiteMapPage"));
const PrivacyPage = lazy(() => import("@/views/PrivacyPage"));
const TermsPage = lazy(() => import("@/views/TermsPage"));
const ContactPage = lazy(() => import("@/views/ContactPage"));
const FatwaPolicyPage = lazy(() => import("@/pages/fiqh/FatwaPolicyPage"));

const CalendarPage = lazy(() => import("@/views/CalendarPage"));
const SearchPage = lazy(() => import("@/pages/account/SearchPage"));
const LessonsPage = lazy(() => import("@/pages/lessons/LessonsPage"));
const CompetitionsPage = lazy(() => import("@/pages/competitions/CompetitionsPage"));
const CompetitionDetailPage = lazy(() => import("@/pages/competitions/CompetitionDetailPage"));
const TeachersIndexPage = lazy(() => import("@/pages/lessons/TeachersIndexPage"));
const ScholarProfilePage = lazy(() => import("@/pages/scholars/ScholarProfilePage"));
const TeacherDetailPage = lazy(() => import("@/pages/lessons/TeacherDetailPage"));
const LessonsArchivePage = lazy(() => import("@/pages/lessons/LessonsArchivePage"));
const LessonDetailPage = lazy(() => import("@/pages/lessons/LessonDetailPage"));
const ScientificAnnouncementDetailPage = lazy(() => import("@/views/ScientificAnnouncementDetailPage"));
const LibraryPage = lazy(() => import("@/pages/library/LibraryPage"));
const LibraryDetailPage = lazy(() => import("@/pages/library/LibraryDetailPage"));
const MiraclesPage = lazy(() => import("@/views/MiraclesPage"));
const FawaidPage = lazy(() => import("@/pages/account/FawaidPage"));
const PropheticMedicinePage = lazy(() => import("@/views/PropheticMedicinePage"));
const HadithPage = lazy(() => import("@/pages/hadith/HadithPage"));
const HadithByIdPage = lazy(() => import("@/pages/hadith/HadithByIdPage"));
const HadithSahihPage = lazy(() => import("@/pages/hadith/HadithSahihPage"));
const HadithDaifPage = lazy(() => import("@/pages/hadith/HadithDaifPage"));
const HadithMawduPage = lazy(() => import("@/pages/hadith/HadithMawduPage"));
const HadithBooksPage = lazy(() => import("@/pages/hadith/HadithBooksPage"));
const HadithBooksAndRulingsPage = lazy(() => import("@/pages/hadith/HadithBooksAndRulingsPage"));
const ArbaeenLovePage = lazy(() => import("@/views/ArbaeenLovePage"));
const QuranCirclesPage = lazy(() => import("@/pages/quran/QuranCirclesPage"));
const KidsPage = lazy(() => import("@/views/KidsPage"));
const SurahIndexPage = lazy(() => import("@/pages/quran/SurahIndexPage"));
const QuranSearchPage = lazy(() => import("@/pages/quran/QuranSearchPage"));
const RevelationOrderPage = lazy(() => import("@/pages/quran/RevelationOrderPage"));
const MakkiMadaniPage = lazy(() => import("@/pages/quran/MakkiMadaniPage"));
const MushafReaderPage = lazy(() => import("@/pages/quran/MushafReaderPage"));
const QuranHubPage = lazy(() => import("@/pages/quran/QuranHubPage"));
const QuranNumbersPage = lazy(() => import("@/pages/quran/QuranNumbersPage"));
const QuranPeoplePage = lazy(() => import("@/pages/quran/QuranPeoplePage"));
const QuranPersonDetailPage = lazy(() => import("@/pages/quran/QuranPersonDetailPage"));
const RecitationTestPage = lazy(() => import("@/pages/quran/RecitationTestPage"));
const SurahStoriesPage = lazy(() => import("@/pages/quran/SurahStoriesPage"));
const QuranTajweedPage = lazy(() => import("@/pages/quran/QuranTajweedPage"));
const TajweedChapterPage = lazy(() => import("@/pages/quran/TajweedChapterPage"));
const QuranQiraatPage = lazy(() => import("@/pages/quran/QuranQiraatPage"));
const QuranSevenAhrufPage = lazy(() => import("@/pages/quran/QuranSevenAhrufPage"));
const QuranTilawaPage = lazy(() => import("@/pages/quran/QuranTilawaPage"));
const QuranUlumTermsPage = lazy(() => import("@/pages/quran/QuranUlumTermsPage"));
const SurahStoryDetailRoute = lazy(() =>
  import("@/pages/quran/SurahStoriesPage").then(m => ({
    default: ({ params }: { params?: Record<string, string> }) => {
      const n = parseInt(params?.number ?? "1", 10);
      return <m.SurahStoryDetailPage surahNumber={Number.isNaN(n) ? 1 : n} />;
    },
  }))
);
const TawhidPage = lazy(() => import("@/views/TawhidPage"));
const DiscoverIslamPage = lazy(() => import("@/views/DiscoverIslamPage"));
const DiscoverIslamQuestionsPage = lazy(() => import("@/views/DiscoverIslamQuestionsPage"));
const DiscoverIslamQuestionDetailPage = lazy(() => import("@/views/DiscoverIslamQuestionDetailPage"));
const DiscoverIslamDoubtsPage = lazy(() => import("@/views/DiscoverIslamDoubtsPage"));
const DiscoverIslamDoubtDetailPage = lazy(() => import("@/views/DiscoverIslamDoubtDetailPage"));
const DiscoverIslamArticleDetailPage = lazy(() => import("@/views/DiscoverIslamArticleDetailPage"));
const HowToBecomeMuslimPage = lazy(() => import("@/views/HowToBecomeMuslimPage"));
const NewMuslimPathPage = lazy(() => import("@/views/NewMuslimPathPage"));
const NewMuslimDayDetailPage = lazy(() => import("@/views/NewMuslimDayDetailPage"));
const DiscoverIslamContactPage = lazy(() => import("@/views/DiscoverIslamContactPage"));
const KnowledgeSectionPage = lazy(() => import("@/views/KnowledgeSectionPage"));
const AdhkarPage = lazy(() => import("@/pages/worship/AdhkarPage"));
const QuizPage = lazy(() => import("@/pages/account/QuizPage"));
const SubmitContentPage = lazy(() => import("@/views/SubmitContentPage"));
const LoginPage = lazyWithRetry(() => import("@/pages/account/LoginPage"), "LoginPage");
const RegisterPage = lazyWithRetry(() => import("@/pages/account/RegisterPage"), "RegisterPage");
const TranscribePage = lazy(() => import("@/views/TranscribePage"));
const AssistantPage = lazy(() => import("@/views/AssistantPage"));
const KuwaitLessonsPage = lazy(() => import("@/pages/lessons/KuwaitLessonsPage"));
const CardsPage = lazy(() => import("@/views/CardsPage"));
const PrayerTimesPage = lazy(() => import("@/pages/worship/PrayerTimesPage"));
const PrayerRanksPage = lazy(() => import("@/pages/worship/PrayerRanksPage"));
const QiblaPage = lazy(() => import("@/pages/worship/QiblaPage"));
const TasbihPage = lazy(() => import("@/pages/worship/TasbihPage"));
const DailyWirdPage = lazy(() => import("@/pages/worship/DailyWirdPage"));
const OccasionsPage = lazy(() => import("@/views/OccasionsPage"));
const ArbaeenNawawiPage = lazy(() => import("@/pages/hadith/ArbaeenNawawiPage"));
const ArbaeenHadithDetailPage = lazy(() => import("@/pages/hadith/ArbaeenHadithDetailPage"));
const SujoodSahwPage = lazy(() => import("@/views/SujoodSahwPage"));
const AmradQalbiyyaPage = lazy(() => import("@/views/AmradQalbiyyaPage"));
const DurusImaniyyaPage = lazy(() => import("@/views/DurusImaniyyaPage"));
const DurusMutanawwiaPage = lazy(() => import("@/views/DurusMutanawwiaPage"));
const ImanTopicsPage = lazy(() => import("@/views/ImanTopicsPage"));
const SunnahStudiesPage = lazy(() => import("@/pages/hadith/SunnahStudiesPage"));
const TazkiyaTopicsPage = lazy(() => import("@/views/TazkiyaTopicsPage"));
const TarikhIslamiPage = lazy(() => import("@/views/TarikhIslamiPage"));
const UsraMujtamaPage = lazy(() => import("@/views/UsraMujtamaPage"));
const FikrWaqiaPage = lazy(() => import("@/views/FikrWaqiaPage"));
const MawsuaatPage = lazy(() => import("@/views/MawsuaatPage"));
const ArabicLanguagePage = lazy(() => import("@/views/ArabicLanguagePage"));
const MaqasidShariaPage = lazy(() => import("@/views/MaqasidShariaPage"));
const DalailNubuwwahPage = lazy(() => import("@/views/DalailNubuwwahPage"));
const SettingsPage = lazy(() => import("@/pages/account/SettingsPage"));
const FeatureTourPage = lazy(() => import("@/pages/account/FeatureTourPage"));
const AccountDeletionPage = lazy(() => import("@/pages/account/AccountDeletionPage"));
const AnnualCourseDetailPage = lazy(() => import("@/pages/lessons/AnnualCourseDetailPage"));
const FiqhCouncilResolutionsPage = lazy(() => import("@/views/FiqhCouncilResolutionsPage"));
const FiqhCouncilFatwasPage = lazy(() => import("@/views/FiqhCouncilFatwasPage"));
const FiqhCouncilRecommendationsPage = lazy(() => import("@/views/FiqhCouncilRecommendationsPage"));
const FiqhCouncilResearchPage = lazy(() => import("@/views/FiqhCouncilResearchPage"));
const FiqhCouncilCategoriesPage = lazy(() => import("@/views/FiqhCouncilCategoriesPage"));
const FiqhCouncilArchivePage = lazy(() => import("@/views/FiqhCouncilArchivePage"));
const FiqhCouncilNawazilPage = lazy(() => import("@/views/FiqhCouncilNawazilPage"));
const FiqhCouncilComparePage = lazy(() => import("@/views/FiqhCouncilComparePage"));
const FiqhCouncilAdvancedSearchPage = lazy(() => import("@/views/FiqhCouncilAdvancedSearchPage"));
const FiqhCouncilResearchAssistantPage = lazy(() => import("@/views/FiqhCouncilResearchAssistantPage"));
const FiqhCouncilLivePage = lazy(() => import("@/views/FiqhCouncilLivePage"));
const FiqhCouncilSessionDetailPage = lazy(() => import("@/views/FiqhCouncilSessionDetailPage"));
const FiqhCouncilIssuesPage = lazy(() => import("@/views/FiqhCouncilIssuesPage"));
const FiqhCouncilIssueDetailPage = lazy(() => import("@/views/FiqhCouncilIssueDetailPage"));
const FiqhCouncilTopicIndexPage = lazy(() => import("@/views/FiqhCouncilTopicIndexPage"));
const FiqhCouncilStatsPage = lazy(() => import("@/views/FiqhCouncilStatsPage"));
const FiqhCouncilPage = lazy(() => import("@/views/FiqhCouncilPage"));
const FiqhCouncilItemDetailPage = lazy(() => import("@/views/FiqhCouncilItemDetailPage"));
const FiqhPage = lazy(() => import("@/pages/fiqh/FiqhPage"));
const FiqhBookPage = lazy(() => import("@/pages/fiqh/FiqhBookPage"));
const FiqhLessonPage = lazy(() => import("@/pages/fiqh/FiqhLessonPage"));
const FiqhUsulPage = lazy(() => import("@/pages/fiqh/FiqhUsulPage"));
const FiqhTopicPage = lazy(() => import("@/pages/fiqh/FiqhTopicPage"));
const SeerahPage = lazy(() => import("@/views/SeerahPage"));
const UpdatesPage = lazy(() => import("@/views/UpdatesPage"));
const AutoContentDetailPage = lazy(() => import("@/views/AutoContentDetailPage"));
const KnowledgeGraphPage = lazy(() => import("@/views/KnowledgeGraphPage"));
const SectionsPage = lazy(() => import("@/pages/account/SectionsPage"));
const MindMapPage = lazy(() => import("@/views/MindMapPage"));
const IslamicLandmarksPage = lazy(() => import("@/views/IslamicLandmarksPage"));
const MutashabihatPage = lazy(() => import("@/views/MutashabihatPage"));
const QuranMemorizationPage = lazy(() => import("@/pages/quran/QuranMemorizationPage"));
const QuranMemorizationPlansPage = lazy(() => import("@/pages/quran/QuranMemorizationPlansPage"));
const QuranHifzLoopPage = lazy(() => import("@/pages/quran/QuranHifzLoopPage"));
const QuranWorshipHubPage = lazy(() => import("@/pages/quran/QuranWorshipHubPage"));
const QuranOfflinePlayerPage = lazy(() => import("@/pages/quran/QuranOfflinePlayerPage"));
const TarikhIslamiDetailPage = lazy(() => import("@/views/TarikhIslamiDetailPage"));
const AsmaaHusnaPage = lazy(() => import("@/views/AsmaaHusnaPage"));
const AkhlaqPage = lazy(() => import("@/views/AkhlaqPage"));
const DuasPage = lazy(() => import("@/pages/worship/DuasPage"));
const ArkanIslamPage = lazy(() => import("@/views/ArkanIslamPage"));
const ArkanImanPage = lazy(() => import("@/views/ArkanImanPage"));
const HadithSciencePage = lazy(() => import("@/pages/hadith/HadithSciencePage"));
const MadhahibPage = lazy(() => import("@/views/MadhahibPage"));
const IslamicSectsPage = lazy(() => import("@/views/IslamicSectsPage"));
const FiqhQawaidPage = lazy(() => import("@/pages/fiqh/FiqhQawaidPage"));
const ShimaelPage = lazy(() => import("@/views/ShimaelPage"));
const IslamStatsPage = lazy(() => import("@/views/IslamStatsPage"));
const IslamicGlossaryPage = lazy(() => import("@/pages/account/IslamicGlossaryPage"));
const AdabTalabIlmPage = lazy(() => import("@/views/AdabTalabIlmPage"));
const JannaNaarPage = lazy(() => import("@/views/JannaNaarPage"));
const AlamatSaahPage = lazy(() => import("@/views/AlamatSaahPage"));
const MalaikaPage = lazy(() => import("@/views/MalaikaPage"));
const WasayaNabawiyyaPage = lazy(() => import("@/views/WasayaNabawiyyaPage"));
const RaqaiqPage = lazy(() => import("@/views/RaqaiqPage"));
const SunanYawmiyyaPage = lazy(() => import("@/views/SunanYawmiyyaPage"));
const HikamSalafPage = lazy(() => import("@/views/HikamSalafPage"));
const ZakatPage = lazy(() => import("@/pages/fiqh/ZakatPage"));
const SawmPage = lazy(() => import("@/views/SawmPage"));
const HajjPage = lazy(() => import("@/pages/fiqh/HajjPage"));
const TaharaPage = lazy(() => import("@/views/TaharaPage"));
const FadailAamalPage = lazy(() => import("@/views/FadailAamalPage"));
const JanazaPage = lazy(() => import("@/pages/fiqh/JanazaPage"));
const SahabahPage = lazy(() => import("@/views/SahabahPage"));
const TawbaPage = lazy(() => import("@/views/TawbaPage"));
const SinsAndRightsPage = lazy(() => import("@/views/SinsAndRightsPage"));
const SinsAndRightsDetailPage = lazy(() => import("@/views/SinsAndRightsDetailPage"));
const AmrBilMarufPage = lazy(() => import("@/views/AmrBilMarufPage"));
const UlumQuranPage = lazy(() => import("@/pages/quran/UlumQuranPage"));
const QuranKnowledgeHubPage = lazy(() => import("@/pages/quran/QuranKnowledgeHubPage"));
const MemorizationHubPage = lazy(() => import("@/views/MemorizationHubPage"));
const OccasionsLessonsHubPage = lazy(() => import("@/pages/lessons/OccasionsLessonsHubPage"));
const IslamicDirectoryHubPage = lazy(() => import("@/views/IslamicDirectoryHubPage"));
const TafsirPage = lazy(() => import("@/pages/quran/TafsirPage"));
const MawarithPage = lazy(() => import("@/pages/fiqh/MawarithPage"));
const MawarithCalculatorPage = lazy(() => import("@/pages/fiqh/MawarithCalculatorPage"));
const SalahGuidePage = lazy(() => import("@/pages/fiqh/SalahGuidePage"));
const DuasQuranPage = lazy(() => import("@/pages/quran/DuasQuranPage"));
const RibaPage = lazy(() => import("@/views/RibaPage"));
const NikahPage = lazy(() => import("@/pages/fiqh/NikahPage"));
const TalaqPage = lazy(() => import("@/pages/fiqh/TalaqPage"));
const UdhiyaPage = lazy(() => import("@/views/UdhiyaPage"));
const RuqyaPage = lazy(() => import("@/views/RuqyaPage"));
const JumuahPage = lazy(() => import("@/views/JumuahPage"));
const WaqfPage = lazy(() => import("@/views/WaqfPage"));
const SadaqaPage = lazy(() => import("@/views/SadaqaPage"));
const AdminPage = lazyWithRetry(() => import("@/views/AdminPage"), "AdminPage");
const LessonImportImagePage = lazyWithRetry(() => import("@/views/admin/LessonImportImagePage"), "LessonImportImagePage");
const LessonImportUrlPage = lazyWithRetry(() => import("@/views/admin/LessonImportUrlPage"), "LessonImportUrlPage");
const AutomationSourcesPage = lazyWithRetry(() => import("@/views/admin/AutomationSourcesPage"), "AutomationSourcesPage");
const AutomationReviewPage = lazyWithRetry(() => import("@/views/admin/AutomationReviewPage"), "AutomationReviewPage");
const ReviewHubPage = lazyWithRetry(() => import("@/views/admin/ReviewHubPage"), "ReviewHubPage");
const AutomationDashboardPage = lazyWithRetry(() => import("@/views/admin/AutomationDashboardPage"), "AutomationDashboardPage");
const AutomationCenterPage = lazyWithRetry(() => import("@/views/admin/AutomationCenterPage"), "AutomationCenterPage");
const AutonomousPlatformPage = lazyWithRetry(() => import("@/views/admin/AutonomousPlatformPage"), "AutonomousPlatformPage");
const InstagramIntegrationPage = lazyWithRetry(() => import("@/views/admin/InstagramIntegrationPage"), "InstagramIntegrationPage");
const MajlisKnowledgeEnginePage = lazyWithRetry(() => import("@/views/admin/MajlisKnowledgeEnginePage"), "MajlisKnowledgeEnginePage");
const AdminDashboardPage = lazyWithRetry(() => import("@/views/admin/AdminDashboardPage"), "AdminDashboardPage");
const AutoContentPage = lazyWithRetry(() => import("@/views/admin/AutoContentPage"), "AutoContentPage");
const FiqhReviewPage = lazyWithRetry(() => import("@/views/admin/FiqhReviewPage"), "FiqhReviewPage");
const FiqhQualityPage = lazyWithRetry(() => import("@/views/admin/FiqhQualityPage"), "FiqhQualityPage");
const ContentProductionDashboardPage = lazyWithRetry(
  () => import("@/views/admin/ContentProductionDashboardPage"),
  "ContentProductionDashboardPage",
);
const FeatureStatusPage = lazyWithRetry(() => import("@/views/admin/FeatureStatusPage"), "FeatureStatusPage");
const InternalStatusPage = lazyWithRetry(() => import("@/views/internal/InternalStatusPage"), "InternalStatusPage");
const MyLearningPage = lazy(() => import("@/pages/lessons/MyLearningPage"));
const LearnHubPage = lazy(() => import("@/views/learn/LearnHubPage"));
const LearnCategoryPage = lazy(() => import("@/views/learn/LearnCategoryPage"));
const LearnSeriesPage = lazy(() => import("@/views/learn/LearnSeriesPage"));
const LearnLessonPage = lazy(() => import("@/views/learn/LearnLessonPage"));
const AdhanSettingsPage = lazy(() => import("@/pages/worship/AdhanSettingsPage"));
const AdhanHelpPage = lazy(() => import("@/pages/worship/AdhanHelpPage"));
const UploadPage = lazy(() => import("@/views/UploadPage"));
const MySubmissionsPage = lazy(() => import("@/views/MySubmissionsPage"));
const UserStatsPage = lazy(() => import("@/views/UserStatsPage"));
const ReadingPlansPage = lazy(() => import("@/pages/library/ReadingPlansPage"));
const FlashCardsPage = lazy(() => import("@/pages/account/FlashCardsPage"));
const CarModePage = lazy(() => import("@/views/CarModePage"));
const MosqueModePage = lazy(() => import("@/views/MosqueModePage"));
const NotificationSettingsPage = lazy(() => import("@/pages/account/NotificationSettingsPage"));
const StudyRoomPage = lazy(() => import("@/views/StudyRoomPage"));
const FamilyModePage = lazy(() => import("@/views/FamilyModePage"));
const VaultPage = lazy(() => import("@/views/VaultPage"));
const ResearcherProfilePage = lazy(() => import("@/views/ResearcherProfilePage"));
const InstitutionsPage = lazy(() => import("@/views/InstitutionsPage"));
const AuthCallbackPage = lazy(() => import("@/views/AuthCallbackPage"));
const UpdatePasswordPage = lazy(() => import("@/views/UpdatePasswordPage"));
const ProphetStoriesPage = lazy(() => import("@/views/ProphetStoriesPage"));
const NationsPage = lazy(() => import("@/views/NationsPage"));
const NationDetailPage = lazy(() => import("@/views/NationDetailPage"));
const ProphetsFamilyTreePage = lazy(() => import("@/views/ProphetsFamilyTreePage"));
const IslamicStoriesPage = lazy(() => import("@/views/IslamicStoriesPage"));
const CitationPublicPage = lazy(() => import("@/views/CitationPublicPage"));
const MethodologyPage = lazy(() => import("@/views/MethodologyPage"));
// ScholarlyResearchPage عُطِّلت 2026-07-23 — الاستيراد الكسول أُزيل (لم يعد
// يُستهلَك)؛ ملف المكوّن نفسه باقٍ بلا حذف (راجع feature-registry.ts).
const AcademicResearchPage  = lazy(() => import("@/views/AcademicResearchPage"));
const ResearchDetailPage    = lazy(() => import("@/views/ResearchDetailPage"));
const ResearchSubmitPage    = lazy(() => import("@/views/ResearchSubmitPage"));
const ResearchAssistantPage = lazy(() => import("@/views/ResearchAssistantPage"));
const UniversitiesPage = lazy(() => import("@/views/UniversitiesPage"));
const UniversityDetailPage = lazy(() => import("@/views/UniversityDetailPage"));
const UniversitiesComparePage = lazy(() => import("@/views/UniversitiesComparePage"));
const UniversitiesAdminPage = lazyWithRetry(() => import("@/views/admin/UniversitiesAdminPage"), "UniversitiesAdminPage");

function SafeLazyRoute({ component: Component }: { component: ComponentType<any> }) {
  // useParams يُعيد params المسار الحالي (مثل { id } أو { slug })
  // ويُمرَّر كـ prop "params" لجميع صفحات التفاصيل
  const params = useParams();
  return (
    <ErrorBoundary>
      <Suspense fallback={<LazyRouteFallback />}>
        <Component params={params} />
      </Suspense>
    </ErrorBoundary>
  );
}

function AdminLazyRoute({ component: Component }: { component: ComponentType }) {
  return (
    <AdminRouteGuard>
      <ErrorBoundary>
        <Suspense fallback={<LazyRouteFallback />}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    </AdminRouteGuard>
  );
}


export default function AppRoutes() {
  return (
    <Switch>
<Route path="/quran-engine/viewer"><SafeLazyRoute component={QuranEnginePage} /></Route>
      <Route path="/quran-engine"><SafeLazyRoute component={QuranEnginePage} /></Route>
      <Route path="/about"><SafeLazyRoute component={AboutPage} /></Route>
      <Route path="/about-us"><Redirect to="/about" /></Route>
      <Route path="/who-we-are"><Redirect to="/about" /></Route>
      <Route path="/man-nahnu"><Redirect to="/about" /></Route>
      <Route path="/sources/:id"><SafeLazyRoute component={SourceDetailPage} /></Route>
      <Route path="/sources"><SafeLazyRoute component={SourcesDirectoryPage} /></Route>
      <Route path="/data-licenses"><SafeLazyRoute component={SourcesLicensesPage} /></Route>
      <Route path="/sources-licenses"><Redirect to="/data-licenses" /></Route>
      <Route path="/licenses"><Redirect to="/data-licenses" /></Route>
      <Route path="/methodology"><SafeLazyRoute component={MethodologyPage} /></Route>
      <Route path="/fatwa-policy"><SafeLazyRoute component={FatwaPolicyPage} /></Route>
      <Route path="/sitemap"><SafeLazyRoute component={SiteMapPage} /></Route>
      <Route path="/privacy"><SafeLazyRoute component={PrivacyPage} /></Route>
      <Route path="/privacy-center"><Redirect to="/privacy" /></Route>
      <Route path="/privacy-policy"><Redirect to="/privacy" /></Route>
      <Route path="/terms"><SafeLazyRoute component={TermsPage} /></Route>
      <Route path="/account-deletion"><SafeLazyRoute component={AccountDeletionPage} /></Route>
      <Route path="/delete-account"><Redirect to="/account-deletion" /></Route>
      <Route path="/account/delete"><Redirect to="/account-deletion" /></Route>
      <Route path="/contact"><SafeLazyRoute component={ContactPage} /></Route>
      <Route path="/support"><Redirect to="/contact" /></Route>
      <Route path="/settings"><SafeLazyRoute component={SettingsPage} /></Route>
      <Route path="/feature-tour"><SafeLazyRoute component={FeatureTourPage} /></Route>
      <Route path="/search/:q"><SafeLazyRoute component={SearchPage} /></Route>
      <Route path="/search"><SafeLazyRoute component={SearchPage} /></Route>
      <Route path="/topics/:slug"><Redirect to="/sections" /></Route>
      <Route path="/topics"><Redirect to="/sections" /></Route>
      <Route path="/scientific-announcements/:id"><SafeLazyRoute component={ScientificAnnouncementDetailPage} /></Route>
      <Route path="/lessons/current"><Redirect to="/lessons" /></Route>
      <Route path="/lessons/archive"><SafeLazyRoute component={LessonsArchivePage} /></Route>
      <Route path="/competitions/:id"><SafeLazyRoute component={CompetitionDetailPage} /></Route>
      <Route path="/competitions"><SafeLazyRoute component={CompetitionsPage} /></Route>
      <Route path="/lessons"><SafeLazyRoute component={LessonsPage} /></Route>
      <Route path="/lessons/:id"><SafeLazyRoute component={LessonDetailPage} /></Route>
      <Route path="/teachers/:slug"><SafeLazyRoute component={TeacherDetailPage} /></Route>
      <Route path="/teachers"><SafeLazyRoute component={TeachersIndexPage} /></Route>
      <Route path="/calendar"><SafeLazyRoute component={CalendarPage} /></Route>
      <Route path="/kuwait-lessons"><SafeLazyRoute component={KuwaitLessonsPage} /></Route>
      <Route path="/announcements"><Redirect to="/lessons" /></Route>
      <Route path="/courses"><Redirect to="/lessons" /></Route>
      <Route path="/sheikhs/:id"><Redirect to="/lessons" /></Route>
      <Route path="/sheikhs"><Redirect to="/lessons" /></Route>
      <Route path="/library/:id"><SafeLazyRoute component={LibraryDetailPage} /></Route>
      <Route path="/library"><SafeLazyRoute component={LibraryPage} /></Route>
      <Route path="/miracles"><SafeLazyRoute component={MiraclesPage} /></Route>
      <Route path="/prophetic-medicine"><SafeLazyRoute component={PropheticMedicinePage} /></Route>
      <Route path="/quran-circles"><SafeLazyRoute component={QuranCirclesPage} /></Route>
      <Route path="/fawaid"><SafeLazyRoute component={FawaidPage} /></Route>
      <Route path="/hadith/books"><SafeLazyRoute component={HadithBooksPage} /></Route>
      <Route path="/hadith/books-and-rulings"><SafeLazyRoute component={HadithBooksAndRulingsPage} /></Route>
      <Route path="/hadith/arbaeen-love-of-allah"><SafeLazyRoute component={ArbaeenLovePage} /></Route>
      <Route path="/hadith/sahih"><SafeLazyRoute component={HadithSahihPage} /></Route>
      <Route path="/hadith/daif"><SafeLazyRoute component={HadithDaifPage} /></Route>
      <Route path="/hadith/mawdu"><SafeLazyRoute component={HadithMawduPage} /></Route>
      <Route path="/hadith/:id">
        {(params) =>
          params.id && params.id.includes(":") ? (
            <SafeLazyRoute component={HadithByIdPage} />
          ) : (
            <Redirect to="/hadith" />
          )
        }
      </Route>
      <Route path="/hadith"><SafeLazyRoute component={HadithPage} /></Route>
      <Route path="/stories"><SafeLazyRoute component={IslamicStoriesPage} /></Route>
      <Route path="/nations/:slug"><SafeLazyRoute component={NationDetailPage} /></Route>
      <Route path="/nations"><SafeLazyRoute component={NationsPage} /></Route>
      <Route path="/prophets-stories/:slug"><SafeLazyRoute component={ProphetStoriesPage} /></Route>
      <Route path="/prophets-stories"><Redirect to="/prophets" /></Route>
      <Route path="/prophet-stories/:slug"><SafeLazyRoute component={ProphetStoriesPage} /></Route>
      <Route path="/prophet-stories"><Redirect to="/prophets" /></Route>
      <Route path="/prophets/tree"><SafeLazyRoute component={ProphetsFamilyTreePage} /></Route>
      <Route path="/prophets/ishaq"><Redirect to="/prophets/is-haq" /></Route>
      <Route path="/prophets/ishaaq"><Redirect to="/prophets/is-haq" /></Route>
      <Route path="/prophets/alyasa"><Redirect to="/prophets/al-yasa" /></Route>
      <Route path="/prophets/al-yasaa"><Redirect to="/prophets/al-yasa" /></Route>
      <Route path="/prophets/zakariya"><Redirect to="/prophets/zakariyya" /></Route>
      <Route path="/prophets/zakaria"><Redirect to="/prophets/zakariyya" /></Route>
      <Route path="/prophets/:slug"><SafeLazyRoute component={ProphetStoriesPage} /></Route>
      <Route path="/prophets"><SafeLazyRoute component={ProphetStoriesPage} /></Route>
      <Route path="/islamic-stories"><Redirect to="/stories" /></Route>
      <Route path="/adhkar/:slug"><SafeLazyRoute component={AdhkarPage} /></Route>
      <Route path="/duas"><SafeLazyRoute component={DuasPage} /></Route>
      <Route path="/adhkar"><SafeLazyRoute component={AdhkarPage} /></Route>
      <Route path="/qa"><Redirect to="/quiz" /></Route>
      <Route path="/qa/:rest*"><Redirect to="/quiz" /></Route>
      <Route path="/quiz"><SafeLazyRoute component={QuizPage} /></Route>
      <Route path="/knowledge-graph"><SafeLazyRoute component={KnowledgeGraphPage} /></Route>
      <Route path="/knowledge-map"><Redirect to="/" /></Route>
      <Route path="/mind-map"><SafeLazyRoute component={MindMapPage} /></Route>
      <Route path="/islamic-landmarks"><SafeLazyRoute component={IslamicLandmarksPage} /></Route>
      <Route path="/mutashabihat"><SafeLazyRoute component={MutashabihatPage} /></Route>
      <Route path="/scholars/:id"><SafeLazyRoute component={ScholarProfilePage} /></Route>
      <Route path="/scholars"><SafeLazyRoute component={ScholarProfilePage} /></Route>
      <Route path="/tarikh-islami/:id"><SafeLazyRoute component={TarikhIslamiDetailPage} /></Route>
      <Route path="/asma-husna"><SafeLazyRoute component={AsmaaHusnaPage} /></Route>
      <Route path="/akhlaq"><SafeLazyRoute component={AkhlaqPage} /></Route>
      <Route path="/arkan"><SafeLazyRoute component={ArkanIslamPage} /></Route>
      <Route path="/arkan-iman"><SafeLazyRoute component={ArkanImanPage} /></Route>
      <Route path="/hadith-science"><SafeLazyRoute component={HadithSciencePage} /></Route>
      <Route path="/madhahib"><SafeLazyRoute component={MadhahibPage} /></Route>
      <Route path="/islamic-sects"><SafeLazyRoute component={IslamicSectsPage} /></Route>
      <Route path="/fiqh-qawaid"><SafeLazyRoute component={FiqhQawaidPage} /></Route>
      <Route path="/shamael"><SafeLazyRoute component={ShimaelPage} /></Route>
      <Route path="/islam-stats"><SafeLazyRoute component={IslamStatsPage} /></Route>
      <Route path="/glossary"><Redirect to="/islamic-glossary" /></Route>
      <Route path="/islamic-glossary"><SafeLazyRoute component={IslamicGlossaryPage} /></Route>
      <Route path="/adab-talab-ilm"><SafeLazyRoute component={AdabTalabIlmPage} /></Route>
      <Route path="/anbiya"><Redirect to="/prophets" /></Route>
      <Route path="/janna-naar"><SafeLazyRoute component={JannaNaarPage} /></Route>
      <Route path="/alamat-saah"><SafeLazyRoute component={AlamatSaahPage} /></Route>
      <Route path="/malaika"><SafeLazyRoute component={MalaikaPage} /></Route>
      <Route path="/wasaya-nabawiyya"><SafeLazyRoute component={WasayaNabawiyyaPage} /></Route>
      <Route path="/raqaiq"><SafeLazyRoute component={RaqaiqPage} /></Route>
      <Route path="/sunan-yawmiyya"><SafeLazyRoute component={SunanYawmiyyaPage} /></Route>
      <Route path="/hikam-salaf"><SafeLazyRoute component={HikamSalafPage} /></Route>
      <Route path="/zakat"><SafeLazyRoute component={ZakatPage} /></Route>
      <Route path="/sawm"><SafeLazyRoute component={SawmPage} /></Route>
      <Route path="/hajj"><SafeLazyRoute component={HajjPage} /></Route>
      <Route path="/tahara"><SafeLazyRoute component={TaharaPage} /></Route>
      <Route path="/fadail-aamal"><SafeLazyRoute component={FadailAamalPage} /></Route>
      <Route path="/janaza"><SafeLazyRoute component={JanazaPage} /></Route>
      <Route path="/sahabah"><SafeLazyRoute component={SahabahPage} /></Route>
      <Route path="/tawba"><SafeLazyRoute component={TawbaPage} /></Route>
      <Route path="/sins-and-rights"><SafeLazyRoute component={SinsAndRightsPage} /></Route>
      <Route path="/sins-and-rights/:slug"><SafeLazyRoute component={SinsAndRightsDetailPage} /></Route>
      <Route path="/amr-bil-maruf"><SafeLazyRoute component={AmrBilMarufPage} /></Route>
      <Route path="/ulum-quran"><SafeLazyRoute component={UlumQuranPage} /></Route>
      <Route path="/tafsir"><SafeLazyRoute component={TafsirPage} /></Route>
      <Route path="/quran/tafsir"><Redirect to="/tafsir" /></Route>
      <Route path="/mawarith"><SafeLazyRoute component={MawarithPage} /></Route>
      <Route path="/mawarith/calculator"><SafeLazyRoute component={MawarithCalculatorPage} /></Route>
      <Route path="/salah-guide"><SafeLazyRoute component={SalahGuidePage} /></Route>
      <Route path="/jumuah"><SafeLazyRoute component={JumuahPage} /></Route>
      <Route path="/riba"><SafeLazyRoute component={RibaPage} /></Route>
      <Route path="/nikah"><SafeLazyRoute component={NikahPage} /></Route>
      <Route path="/talaq"><SafeLazyRoute component={TalaqPage} /></Route>
      <Route path="/udhiya"><SafeLazyRoute component={UdhiyaPage} /></Route>
      <Route path="/ruqya"><SafeLazyRoute component={RuqyaPage} /></Route>
      <Route path="/waqf"><SafeLazyRoute component={WaqfPage} /></Route>
      <Route path="/sadaqa"><SafeLazyRoute component={SadaqaPage} /></Route>
      <Route path="/duas-quran"><SafeLazyRoute component={DuasQuranPage} /></Route>
      <Route path="/submit"><SafeLazyRoute component={SubmitContentPage} /></Route>
      <Route path="/upload"><SafeLazyRoute component={UploadPage} /></Route>
      <Route path="/my-submissions"><SafeLazyRoute component={MySubmissionsPage} /></Route>
      <Route path="/stats"><SafeLazyRoute component={UserStatsPage} /></Route>
      <Route path="/profile"><SafeLazyRoute component={UserStatsPage} /></Route>
      <Route path="/learning-plan"><Redirect to="/lessons" /></Route>
      <Route path="/reading-plans"><SafeLazyRoute component={ReadingPlansPage} /></Route>
      <Route path="/flashcards"><SafeLazyRoute component={FlashCardsPage} /></Route>
      <Route path="/memorize"><Redirect to="/flashcards" /></Route>
      <Route path="/my-citations"><Redirect to="/flashcards" /></Route>
      <Route path="/citations"><Redirect to="/flashcards" /></Route>
      <Route path="/car-mode"><SafeLazyRoute component={CarModePage} /></Route>
      <Route path="/mosque-mode"><SafeLazyRoute component={MosqueModePage} /></Route>
      <Route path="/notification-settings"><SafeLazyRoute component={NotificationSettingsPage} /></Route>
      <Route path="/study-room"><SafeLazyRoute component={StudyRoomPage} /></Route>
      <Route path="/family"><SafeLazyRoute component={FamilyModePage} /></Route>
      <Route path="/family-mode"><Redirect to="/family" /></Route>
      <Route path="/vault"><SafeLazyRoute component={VaultPage} /></Route>
      <Route path="/researcher"><SafeLazyRoute component={ResearcherProfilePage} /></Route>
      <Route path="/researcher-profile"><SafeLazyRoute component={ResearcherProfilePage} /></Route>
      <Route path="/institutions"><SafeLazyRoute component={InstitutionsPage} /></Route>
      <Route path="/auth/callback"><SafeLazyRoute component={AuthCallbackPage} /></Route>
      <Route path="/auth/update-password"><SafeLazyRoute component={UpdatePasswordPage} /></Route>
      {/* مسارات التعلم أُلغيت — تحويل دائم إلى الدروس */}
      <Route path="/learning/paths/:slug"><Redirect to="/lessons" /></Route>
      <Route path="/learning/paths"><Redirect to="/lessons" /></Route>
      <Route path="/learn/series/:slug"><SafeLazyRoute component={LearnSeriesPage} /></Route>
      <Route path="/learn/lesson/:id"><SafeLazyRoute component={LearnLessonPage} /></Route>
      <Route path="/learn/:slug"><SafeLazyRoute component={LearnCategoryPage} /></Route>
      <Route path="/learn"><SafeLazyRoute component={LearnHubPage} /></Route>
      <Route path="/learning/quiz/:slug"><Redirect to="/quiz" /></Route>
      <Route path="/learning/quiz"><Redirect to="/quiz" /></Route>
      <Route path="/learning/calendar"><Redirect to="/calendar" /></Route>
      <Route path="/learning/certificates/:code"><Redirect to="/lessons" /></Route>
      <Route path="/learning/certificates"><Redirect to="/lessons" /></Route>
      <Route path="/my-learning"><SafeLazyRoute component={MyLearningPage} /></Route>
      <Route path="/c/:slug"><SafeLazyRoute component={CitationPublicPage} /></Route>
      <Route path="/learning"><Redirect to="/lessons" /></Route>
      <Route path="/learning-paths"><Redirect to="/lessons" /></Route>
      <Route path="/tracks"><Redirect to="/lessons" /></Route>
      <Route path="/study-paths"><Redirect to="/lessons" /></Route>
      <Route path="/pathways"><Redirect to="/lessons" /></Route>
      <Route path="/lessons/paths"><Redirect to="/lessons" /></Route>
      <Route path="/courses/paths"><Redirect to="/lessons" /></Route>

      <Route path="/assistant">
        <ErrorBoundary>
          <Suspense fallback={<LazyRouteFallback />}>
            <AssistantPage />
          </Suspense>
        </ErrorBoundary>
      </Route>
      {/* عُطِّلت 2026-07-23: توجيه دائم إلى الأسئلة والأجوبة، وvercel.json يوجّه
          الطلبات المباشرة على مستوى الخادم بنفس الوجهة. */}
      <Route path="/scholarly-research"><Redirect to="/quiz" /></Route>
      <Route path="/academic-research/submit"><SafeLazyRoute component={ResearchSubmitPage} /></Route>
      <Route path="/academic-research/assistant"><SafeLazyRoute component={ResearchAssistantPage} /></Route>
      <Route path="/academic-research/:id"><SafeLazyRoute component={ResearchDetailPage} /></Route>
      <Route path="/academic-research"><SafeLazyRoute component={AcademicResearchPage} /></Route>
      <Route path="/researches"><Redirect to="/academic-research" /></Route>
      <Route path="/sharia-research"><Redirect to="/academic-research" /></Route>
      <Route path="/research"><Redirect to="/academic-research" /></Route>
      <Route path="/learning-path/dashboard"><Redirect to="/my-learning" /></Route>
      <Route path="/learning-path/book/:bookId"><Redirect to="/lessons" /></Route>
      <Route path="/learning-path/:scienceSlug"><Redirect to="/lessons" /></Route>
      <Route path="/learning-path"><Redirect to="/lessons" /></Route>
      <Route path="/start-here"><Redirect to="/lessons" /></Route>
      <Route path="/universities/compare"><SafeLazyRoute component={UniversitiesComparePage} /></Route>
      <Route path="/universities/:slug"><SafeLazyRoute component={UniversityDetailPage} /></Route>
      <Route path="/universities"><SafeLazyRoute component={UniversitiesPage} /></Route>
      <Route path="/condolences"><Redirect to="/" /></Route>
      <Route path="/transcribe">
        <ErrorBoundary>
          <Suspense fallback={<LazyRouteFallback />}>
            <TranscribePage />
          </Suspense>
        </ErrorBoundary>
      </Route>
      <Route path="/quran"><Redirect to="/quran-hub" /></Route>
      {/* مصحف المدينة الجديد — بيانات QPC فقط، بلا PDF ولا واجهة قديمة */}
      <Route path="/mushaf/page/:page"><SafeLazyRoute component={MushafReaderPage} /></Route>
      <Route path="/mushaf/page"><SafeLazyRoute component={MushafReaderPage} /></Route>
      <Route path="/mushaf/about-edition"><Redirect to="/mushaf?page=1" /></Route>
      <Route path="/mushaf/:surah"><SafeLazyRoute component={MushafReaderPage} /></Route>
      <Route path="/mushaf"><SafeLazyRoute component={MushafReaderPage} /></Route>
      <Route path="/quran/mushaf"><Redirect to="/mushaf" /></Route>
      <Route path="/mushaf-v2-preview"><Redirect to="/mushaf" /></Route>
      <Route path="/demo-ayah-reader"><Redirect to="/mushaf" /></Route>
      <Route path="/quran-hub/numbers"><SafeLazyRoute component={QuranNumbersPage} /></Route>
      <Route path="/quran-hub/tajweed/:chapter"><SafeLazyRoute component={TajweedChapterPage} /></Route>
      <Route path="/quran-hub/tajweed"><SafeLazyRoute component={QuranTajweedPage} /></Route>
      <Route path="/quran-hub/qiraat"><SafeLazyRoute component={QuranQiraatPage} /></Route>
      <Route path="/quran-hub/seven-ahruf"><SafeLazyRoute component={QuranSevenAhrufPage} /></Route>
      <Route path="/quran-hub/tilawa"><SafeLazyRoute component={QuranTilawaPage} /></Route>
      <Route path="/quran-hub/terms"><SafeLazyRoute component={QuranUlumTermsPage} /></Route>
      <Route path="/quran-hub"><SafeLazyRoute component={QuranHubPage} /></Route>
      <Route path="/quran/terms"><Redirect to="/quran-hub/terms" /></Route>
      <Route path="/quran-knowledge"><SafeLazyRoute component={QuranKnowledgeHubPage} /></Route>
      <Route path="/memorization"><SafeLazyRoute component={MemorizationHubPage} /></Route>
      <Route path="/occasions-lessons"><SafeLazyRoute component={OccasionsLessonsHubPage} /></Route>
      <Route path="/islamic-directory"><SafeLazyRoute component={IslamicDirectoryHubPage} /></Route>
      <Route path="/quran-index"><Redirect to="/quran-knowledge" /></Route>
      <Route path="/asbab-al-nuzul"><Redirect to="/quran-knowledge" /></Route>
      <Route path="/quran-stories"><Redirect to="/quran-knowledge" /></Route>
      <Route path="/memorization-tests"><Redirect to="/memorization" /></Route>
      <Route path="/memorization-plans"><Redirect to="/memorization" /></Route>
      <Route path="/islamic-institutions"><Redirect to="/islamic-directory" /></Route>
      <Route path="/mosques"><Redirect to="/islamic-directory" /></Route>
      <Route path="/reviewed-cards"><Redirect to="/my-learning" /></Route>
      <Route path="/scientific-library"><Redirect to="/" /></Route>
      <Route path="/latest"><Redirect to="/" /></Route>
      <Route path="/fatwas"><Redirect to="/fiqh" /></Route>
      <Route path="/explore"><Redirect to="/" /></Route>
      <Route path="/news"><Redirect to="/" /></Route>
      <Route path="/events"><Redirect to="/occasions-lessons" /></Route>
      <Route path="/islamic-events"><Redirect to="/occasions-lessons" /></Route>
      <Route path="/lesson-calendar"><Redirect to="/occasions-lessons" /></Route>
      <Route path="/review-plans"><Redirect to="/memorization" /></Route>
      <Route path="/masajid"><Redirect to="/islamic-directory" /></Route>
      <Route path="/quran-sciences"><Redirect to="/quran-knowledge" /></Route>

      <Route path="/kids"><SafeLazyRoute component={KidsPage} /></Route>
      <Route path="/quran/recitation-test-ai"><SafeLazyRoute component={RecitationTestPage} /></Route>
      <Route path="/quran/surahs"><SafeLazyRoute component={SurahIndexPage} /></Route>
      <Route path="/quran/search"><SafeLazyRoute component={QuranSearchPage} /></Route>
      <Route path="/quran/people/:slug"><SafeLazyRoute component={QuranPersonDetailPage} /></Route>
      <Route path="/quran/people"><SafeLazyRoute component={QuranPeoplePage} /></Route>
      <Route path="/quran/revelation-order"><SafeLazyRoute component={RevelationOrderPage} /></Route>
      <Route path="/quran/makki-madani"><SafeLazyRoute component={MakkiMadaniPage} /></Route>
      <Route path="/quran-memorization"><SafeLazyRoute component={QuranMemorizationPage} /></Route>
      <Route path="/quran/hifz-loop"><SafeLazyRoute component={QuranHifzLoopPage} /></Route>
      <Route path="/quran/worship-hub"><SafeLazyRoute component={QuranWorshipHubPage} /></Route>
      <Route path="/quran/offline-player"><SafeLazyRoute component={QuranOfflinePlayerPage} /></Route>
      <Route path="/quran/memorization-plans"><SafeLazyRoute component={QuranMemorizationPlansPage} /></Route>
      <Route path="/tajweed"><Redirect to="/quran-hub/tajweed" /></Route>
      <Route path="/surah-stories"><Redirect to="/quran/surah-stories" /></Route>
      <Route path="/quran/tajweed"><Redirect to="/quran-hub/tajweed" /></Route>
      {/* الفقه الإسلامي الموحّد + السيرة النبوية */}
      <Route path="/tawhid"><SafeLazyRoute component={TawhidPage} /></Route>
      <Route path="/aqidah"><Redirect to="/tawhid" /></Route>
      <Route path="/discover-islam"><SafeLazyRoute component={DiscoverIslamPage} /></Route>
      <Route path="/discover-islam/questions"><SafeLazyRoute component={DiscoverIslamQuestionsPage} /></Route>
      <Route path="/discover-islam/questions/:slug"><SafeLazyRoute component={DiscoverIslamQuestionDetailPage} /></Route>
      <Route path="/discover-islam/doubts"><SafeLazyRoute component={DiscoverIslamDoubtsPage} /></Route>
      <Route path="/discover-islam/doubts/:slug"><SafeLazyRoute component={DiscoverIslamDoubtDetailPage} /></Route>
      <Route path="/discover-islam/articles/:slug"><SafeLazyRoute component={DiscoverIslamArticleDetailPage} /></Route>
      <Route path="/discover-islam/how-to-convert"><SafeLazyRoute component={HowToBecomeMuslimPage} /></Route>
      <Route path="/discover-islam/new-muslim"><SafeLazyRoute component={NewMuslimPathPage} /></Route>
      <Route path="/discover-islam/new-muslim/:day"><SafeLazyRoute component={NewMuslimDayDetailPage} /></Route>
      <Route path="/discover-islam/contact"><SafeLazyRoute component={DiscoverIslamContactPage} /></Route>
      <Route path="/knowledge/:section/:id"><SafeLazyRoute component={KnowledgeSectionPage} /></Route>
      <Route path="/knowledge/:section"><SafeLazyRoute component={KnowledgeSectionPage} /></Route>
      <Route path="/knowledge"><Redirect to="/knowledge/intro-islam" /></Route>
      <Route path="/fiqh/books/:bookId/lessons/:lessonId"><SafeLazyRoute component={FiqhLessonPage} /></Route>
      <Route path="/fiqh/books/:bookId"><SafeLazyRoute component={FiqhBookPage} /></Route>
      <Route path="/fiqh/usul"><SafeLazyRoute component={FiqhUsulPage} /></Route>
      <Route path="/fiqh/topics/:topicId"><SafeLazyRoute component={FiqhTopicPage} /></Route>
      <Route path="/fiqh"><SafeLazyRoute component={FiqhPage} /></Route>
      <Route path="/seerah"><SafeLazyRoute component={SeerahPage} /></Route>
      <Route path="/quran/surah-stories/:number"><SafeLazyRoute component={SurahStoryDetailRoute} /></Route>
      <Route path="/quran/surah-stories"><SafeLazyRoute component={SurahStoriesPage} /></Route>
      <Route path="/prayer-times"><SafeLazyRoute component={PrayerTimesPage} /></Route>
      <Route path="/prayer"><Redirect to="/prayer-times" /></Route>
      <Route path="/prayer-countdown"><Redirect to="/prayer-times" /></Route>
      <Route path="/prayer-ranks"><SafeLazyRoute component={PrayerRanksPage} /></Route>
      <Route path="/muezzins/:rest"><Redirect to="/adhan-settings" /></Route>
      <Route path="/muezzins"><Redirect to="/adhan-settings" /></Route>
      <Route path="/adhan-settings"><SafeLazyRoute component={AdhanSettingsPage} /></Route>
      <Route path="/adhan-help"><SafeLazyRoute component={AdhanHelpPage} /></Route>
      <Route path="/qibla"><SafeLazyRoute component={QiblaPage} /></Route>
      <Route path="/tasbih"><SafeLazyRoute component={TasbihPage} /></Route>
      <Route path="/daily-wird"><SafeLazyRoute component={DailyWirdPage} /></Route>
      <Route path="/occasions"><SafeLazyRoute component={OccasionsPage} /></Route>
      <Route path="/features-in-progress"><Redirect to="/" /></Route>
      <Route path="/arbaeen-nawawi/:id"><SafeLazyRoute component={ArbaeenHadithDetailPage} /></Route>
      <Route path="/arbaeen-nawawi"><SafeLazyRoute component={ArbaeenNawawiPage} /></Route>
      <Route path="/sujood-sahw"><SafeLazyRoute component={SujoodSahwPage} /></Route>
      <Route path="/amrad-qalbiyya"><SafeLazyRoute component={AmradQalbiyyaPage} /></Route>
      <Route path="/durus-imaniyya"><SafeLazyRoute component={DurusImaniyyaPage} /></Route>
      <Route path="/durus-mutanawwia"><SafeLazyRoute component={DurusMutanawwiaPage} /></Route>
      <Route path="/iman-topics"><SafeLazyRoute component={ImanTopicsPage} /></Route>
      <Route path="/quran-studies"><Redirect to="/ulum-quran" /></Route>
      <Route path="/sunnah-studies"><SafeLazyRoute component={SunnahStudiesPage} /></Route>
      <Route path="/tazkiya-topics"><SafeLazyRoute component={TazkiyaTopicsPage} /></Route>
      <Route path="/tarikh-islami"><SafeLazyRoute component={TarikhIslamiPage} /></Route>
      <Route path="/usra-mujtama"><SafeLazyRoute component={UsraMujtamaPage} /></Route>
      <Route path="/fikr-waqia"><SafeLazyRoute component={FikrWaqiaPage} /></Route>
      <Route path="/mawsuaat"><SafeLazyRoute component={MawsuaatPage} /></Route>
      <Route path="/arabic-language"><SafeLazyRoute component={ArabicLanguagePage} /></Route>
      <Route path="/maqasid-sharia"><SafeLazyRoute component={MaqasidShariaPage} /></Route>
      <Route path="/dalail-nubuwwah"><SafeLazyRoute component={DalailNubuwwahPage} /></Route>
      <Route path="/masarat"><Redirect to="/lessons" /></Route>
      <Route path="/cards"><SafeLazyRoute component={CardsPage} /></Route>
      <Route path="/annual-courses/:id"><SafeLazyRoute component={AnnualCourseDetailPage} /></Route>
      <Route path="/annual-courses"><Redirect to="/lessons" /></Route>
      <Route path="/fiqh-council/sessions/:slug"><SafeLazyRoute component={FiqhCouncilSessionDetailPage} /></Route>
      <Route path="/fiqh-council/live"><SafeLazyRoute component={FiqhCouncilLivePage} /></Route>
      <Route path="/fiqh-council/issues/:slug"><SafeLazyRoute component={FiqhCouncilIssueDetailPage} /></Route>
      <Route path="/fiqh-council/issues"><SafeLazyRoute component={FiqhCouncilIssuesPage} /></Route>
      <Route path="/fiqh-council/index"><SafeLazyRoute component={FiqhCouncilTopicIndexPage} /></Route>
      <Route path="/fiqh-council/stats"><SafeLazyRoute component={FiqhCouncilStatsPage} /></Route>
      <Route path="/fiqh-council/resolutions"><SafeLazyRoute component={FiqhCouncilResolutionsPage} /></Route>
      <Route path="/fiqh-council/fatwas"><SafeLazyRoute component={FiqhCouncilFatwasPage} /></Route>
      <Route path="/fiqh-council/recommendations"><SafeLazyRoute component={FiqhCouncilRecommendationsPage} /></Route>
      <Route path="/fiqh-council/nawazil"><SafeLazyRoute component={FiqhCouncilNawazilPage} /></Route>
      <Route path="/fiqh-council/research"><SafeLazyRoute component={FiqhCouncilResearchPage} /></Route>
      <Route path="/fiqh-council/categories"><SafeLazyRoute component={FiqhCouncilCategoriesPage} /></Route>
      <Route path="/fiqh-council/search"><SafeLazyRoute component={FiqhCouncilAdvancedSearchPage} /></Route>
      <Route path="/fiqh-council/research-assistant"><SafeLazyRoute component={FiqhCouncilResearchAssistantPage} /></Route>
      <Route path="/fiqh-council/compare"><SafeLazyRoute component={FiqhCouncilComparePage} /></Route>
      <Route path="/fiqh-council/archive"><SafeLazyRoute component={FiqhCouncilArchivePage} /></Route>
      <Route path="/fiqh-council/:slug"><SafeLazyRoute component={FiqhCouncilItemDetailPage} /></Route>
      <Route path="/fiqh-council"><SafeLazyRoute component={FiqhCouncilPage} /></Route>
      <Route path="/fatwa/:id"><Redirect to="/fiqh" /></Route>
      <Route path="/fatwa"><Redirect to="/fiqh" /></Route>
      <Route path="/rulings/:id"><Redirect to="/fiqh" /></Route>
      <Route path="/rulings"><Redirect to="/fiqh" /></Route>
      <Route path="/updates/auto/:slug"><SafeLazyRoute component={AutoContentDetailPage} /></Route>
      <Route path="/updates"><SafeLazyRoute component={UpdatesPage} /></Route>
      <Route path="/sections"><SafeLazyRoute component={SectionsPage} /></Route>
      <Route path="/more"><Redirect to="/sections" /></Route>
      <Route path="/whats-new"><Redirect to="/" /></Route>
      <Route path="/login"><SafeLazyRoute component={LoginPage} /></Route>
      <Route path="/register"><SafeLazyRoute component={RegisterPage} /></Route>
      <Route path="/auth/register"><Redirect to="/register" /></Route>
      <Route path="/internal/status"><AdminLazyRoute component={InternalStatusPage} /></Route>
      <Route path="/admin/sources"><AdminLazyRoute component={AutomationSourcesPage} /></Route>
      <Route path="/admin/automation/sources"><AdminLazyRoute component={AutomationSourcesPage} /></Route>
      <Route path="/admin/automation/dashboard"><AdminLazyRoute component={AutomationDashboardPage} /></Route>
      <Route path="/admin/automation/platform"><AdminLazyRoute component={MajlisKnowledgeEnginePage} /></Route>
      <Route path="/admin/automation/center"><AdminLazyRoute component={AutomationCenterPage} /></Route>
      <Route path="/admin/autonomous-platform"><AdminLazyRoute component={AutonomousPlatformPage} /></Route>
      <Route path="/admin/automation"><Redirect to="/admin/automation/center" /></Route>
      <Route path="/admin/integrations/instagram"><AdminLazyRoute component={InstagramIntegrationPage} /></Route>
      <Route path="/admin/review-hub"><AdminLazyRoute component={ReviewHubPage} /></Route>
      <Route path="/admin/review-center"><AdminLazyRoute component={AutomationReviewPage} /></Route>
      <Route path="/admin/automation/review"><AdminLazyRoute component={AutomationReviewPage} /></Route>
      <Route path="/admin/content-import/url"><AdminLazyRoute component={LessonImportUrlPage} /></Route>
      <Route path="/admin/content-import/image"><AdminLazyRoute component={LessonImportImagePage} /></Route>
      <Route path="/admin/import"><Redirect to="/admin/content-import/url" /></Route>
      <Route path="/admin/content"><Redirect to="/admin/auto-content" /></Route>
      <Route path="/admin/auto-content"><AdminLazyRoute component={AutoContentPage} /></Route>
      <Route path="/admin/fiqh-review"><AdminLazyRoute component={FiqhReviewPage} /></Route>
      <Route path="/admin/fiqh-quality"><AdminLazyRoute component={FiqhQualityPage} /></Route>
      <Route path="/admin/content-production"><AdminLazyRoute component={ContentProductionDashboardPage} /></Route>
      <Route path="/admin/automation/content-production"><AdminLazyRoute component={ContentProductionDashboardPage} /></Route>
      <Route path="/admin/feature-status"><AdminLazyRoute component={FeatureStatusPage} /></Route>
      <Route path="/admin/dashboard"><AdminLazyRoute component={AdminDashboardPage} /></Route>
      <Route path="/admin/users"><Redirect to="/admin?section=users" /></Route>
      <Route path="/admin/universities"><AdminLazyRoute component={UniversitiesAdminPage} /></Route>
      <Route path="/admin"><AdminLazyRoute component={AdminPage} /></Route>
      <Route component={() => (
        <Suspense fallback={<LazyRouteFallback />}>
          <NotFound />
        </Suspense>
      )} />
    </Switch>
  );
}
