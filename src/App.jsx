import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProProvider } from "./context/ProContext";
import { BubbleThemeProvider } from "./context/BubbleThemeContext";
import { PostInteractionProvider } from "./context/PostInteractionContext";
import { NotificationProvider } from "./context/NotificationContext";
import { RealtimeProvider } from "./realtime/RealtimeContext";
import AppShell from "./components/Appshell";
import ProtectedRoute from "./components/ProtectedRoute";
import FeedPage from "./pages/FeedPage";
import CommunitiesPage from "./pages/CommunitiesPage";
import JobsPage from "./pages/JobsPage";
import RecruitmentLayout from "./pages/recruitment/RecruitmentLayout";
import OverviewTab from "./pages/recruitment/OverviewTab";
import MyJobsTab from "./pages/recruitment/MyJobsTab";
import ApplicantsTab from "./pages/recruitment/ApplicantsTab";
import ApplicantDetailPage from "./pages/recruitment/ApplicantDetailPage";
import StatsTab from "./pages/recruitment/StatsTab";
import CompanyTab from "./pages/recruitment/CompanyTab";
import PlanTab from "./pages/recruitment/PlanTab";
import TemplatesTab from "./pages/recruitment/TemplatesTab";
import InterviewsTab from "./pages/recruitment/InterviewsTab";
import TalentPoolTab from "./pages/recruitment/TalentPoolTab";
import MyInterviewsPage from "./pages/MyInterviewsPage";
import CompanyPage from "./pages/CompanyPage";
import SearchPage from "./pages/SearchPage";
import PostDetailPage from "./pages/PostDetailPage";
import MessagesPage from "./pages/MessagesPage";
import CvBuilderPage from "./pages/CvBuilderPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import PublicProfilePage from "./pages/PublicProfilePage";
import RulesPage from "./pages/RulesPage";
import AgreementsPage from "./pages/AgreementsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import AccessibilityPage from "./pages/AccessibilityPage";
import HelpPage from "./pages/HelpPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import MentorPage from "./pages/MentorPage";
import PremiumPage from "./pages/PremiumPage";
import MentorDetailPage from "./pages/MentorDetailPage";
import MentorSessionsPage from "./pages/MentorSessionsPage";
import MentorDashboardPage from "./pages/MentorDashboardPage";
import AboutPage from "./pages/AboutPage";
import SettingsPage from "./pages/SettingsPage";
import SettingsSectionPage from "./pages/SettingsSectionPage";
import CreatePostPage from "./pages/CreatePostPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { CommunityProvider } from "./context/CommunityContext";
import CommunityPage from "./pages/CommunityPage";
import { PostComposerProvider } from "./context/PostComposerContext";
import CreatePostModal from "./components/CreatePostModal";

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
      <NotificationProvider>
        <ProProvider>
        <BubbleThemeProvider>
        <CommunityProvider>
        <PostComposerProvider>
        <PostInteractionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/lupa-password" element={<ForgotPasswordPage />} />
          <Route path="/atur-ulang-password" element={<ResetPasswordPage />} />
          <Route
            path="/*"
            element={
              <AppShell>
                  <Routes>
                    <Route path="/" element={<FeedPage />} />
                    <Route path="/post/:id" element={<PostDetailPage />} />
                    <Route path="/komunitas" element={<CommunitiesPage />} />
                    <Route path="/komunitas/:id" element={<CommunityPage />} />
                    <Route path="/lowongan-kerja" element={<JobsPage />} />
                    <Route path="/wawancara" element={<ProtectedRoute><MyInterviewsPage /></ProtectedRoute>} />
                    <Route path="/rekrutmen" element={<RecruitmentLayout />}>
                      <Route index element={<OverviewTab />} />
                      <Route path="lowongan" element={<MyJobsTab />} />
                      <Route path="pelamar" element={<ApplicantsTab />} />
                      <Route path="pelamar/:id" element={<ApplicantDetailPage />} />
                      <Route path="statistik" element={<StatsTab />} />
                      <Route path="template" element={<TemplatesTab />} />
                      <Route path="wawancara" element={<InterviewsTab />} />
                      <Route path="talent" element={<TalentPoolTab />} />
                      <Route path="perusahaan" element={<CompanyTab />} />
                      <Route path="paket" element={<PlanTab />} />
                    </Route>
                    <Route path="/perusahaan/:id" element={<CompanyPage />} />
                    <Route path="/cari" element={<SearchPage />} />
                    <Route path="/aturan-komunitas" element={<RulesPage />} />
                    <Route path="/agreements" element={<AgreementsPage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    <Route path="/accessibility" element={<AccessibilityPage />} />
                    <Route path="/help" element={<HelpPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/blog/:slug" element={<BlogPostPage />} />
                    <Route
                      path="/mentor"
                      element={
                        <ProtectedRoute>
                          <MentorPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/cv" element={<ProtectedRoute><CvBuilderPage /></ProtectedRoute>} />
                    <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />
                    <Route path="/mentor/sesi" element={<ProtectedRoute><MentorSessionsPage /></ProtectedRoute>} />
                    <Route path="/mentor/dashboard" element={<ProtectedRoute><MentorDashboardPage /></ProtectedRoute>} />
                    <Route path="/mentor/:id" element={<ProtectedRoute><MentorDetailPage /></ProtectedRoute>} />
                    <Route
                      path="/pesan"
                      element={
                        <ProtectedRoute>
                          <MessagesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/notifikasi"
                      element={
                        <ProtectedRoute>
                          <NotificationsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profil"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/pengguna/:id" element={<ProtectedRoute><PublicProfilePage /></ProtectedRoute>} />
                    {/* Pengaturan kini berupa modal di halaman profil; tautan lama tetap berfungsi. */}
                    {/* HP: Pengaturan & Buat Post berupa halaman; desktop tetap memakai popup */}
                    <Route path="/pengaturan" element={<SettingsPage />} />
                    <Route path="/pengaturan/:tab" element={<ProtectedRoute><SettingsSectionPage /></ProtectedRoute>} />
                    <Route path="/buat-post" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
                  </Routes>
              </AppShell>
            }
          />
        </Routes>
        <CreatePostModal />
        </PostInteractionProvider>
        </PostComposerProvider>
       </CommunityProvider>
        </BubbleThemeProvider>
      </ProProvider>
      </NotificationProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
}