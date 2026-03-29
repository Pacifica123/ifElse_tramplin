import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AdminLayout } from '@/app/layouts/AdminLayout';
import { ApplicantLayout } from '@/app/layouts/ApplicantLayout';
import { CuratorLayout } from '@/app/layouts/CuratorLayout';
import { EmployerLayout } from '@/app/layouts/EmployerLayout';
import { PublicLayout } from '@/app/layouts/PublicLayout';
import { RequireAuth, RequireRole } from '@/app/router/guards';
import { paths } from '@/app/router/paths';
import { AdminCuratorsPage } from '@/features/admin/pages/AdminCuratorsPage';
import { ApplicantProfilePage } from '@/features/applicant-profile/pages/ApplicantProfilePage';
import { PublicApplicantProfilePage } from '@/features/applicant-profile/pages/PublicApplicantProfilePage';
import { EmployerApplicationsPage } from '@/features/applications/pages/EmployerApplicationsPage';
import { MyApplicationsPage } from '@/features/applications/pages/MyApplicationsPage';
import { CuratorLoginPage } from '@/features/auth/pages/CuratorLoginPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ApplicantContactsPage } from '@/features/contacts/pages/ApplicantContactsPage';
import { ApplicantPrivacyPage } from '@/features/privacy-settings/pages/ApplicantPrivacyPage';
import { CuratorApplicantsPage } from '@/features/curator/pages/CuratorApplicantsPage';
import { CuratorDashboardPage } from '@/features/curator/pages/CuratorDashboardPage';
import { CuratorEmployersPage } from '@/features/curator/pages/CuratorEmployersPage';
import { CuratorOpportunitiesPage } from '@/features/curator/pages/CuratorOpportunitiesPage';
import { CuratorVerificationPage } from '@/features/curator/pages/CuratorVerificationPage';
import { EmployerProfilePage } from '@/features/employer-profile/pages/EmployerProfilePage';
import { FavoritesPage } from '@/features/favorites/pages/FavoritesPage';
import { HomePage } from '@/features/opportunities/pages/HomePage';
import { EmployerOpportunitiesPage } from '@/features/opportunities/pages/EmployerOpportunitiesPage';
import { OpportunityEditorPage } from '@/features/opportunities/pages/OpportunityEditorPage';
import { OpportunityPage } from '@/features/opportunities/pages/OpportunityPage';
import { EventsPage } from '@/features/opportunities/pages/EventsPage'; 

const router = createBrowserRouter([
  {
    path: paths.home,
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: paths.login, element: <LoginPage /> },
      { path: paths.register, element: <RegisterPage /> },
      { path: paths.curatorLogin, element: <CuratorLoginPage /> },
      { path: paths.events, element: <EventsPage /> },
      { path: paths.opportunity(), element: <OpportunityPage /> },
      { path: paths.publicApplicant(), element: <PublicApplicantProfilePage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole roles={['applicant']} />,
        children: [
          {
            element: <ApplicantLayout />,
            children: [
              { path: paths.applicantProfile, element: <ApplicantProfilePage /> },
              { path: paths.applicantApplications, element: <MyApplicationsPage /> },
              { path: paths.applicantFavorites, element: <FavoritesPage /> },
              { path: paths.applicantContacts, element: <ApplicantContactsPage /> },
              { path: paths.applicantPrivacy, element: <ApplicantPrivacyPage /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole roles={['employer']} />,
        children: [
          {
            element: <EmployerLayout />,
            children: [
              { path: paths.employerProfile, element: <EmployerProfilePage /> },
              { path: paths.employerOpportunities, element: <EmployerOpportunitiesPage /> },
              { path: paths.employerOpportunityNew, element: <OpportunityEditorPage /> },
              { path: paths.employerOpportunityEdit(), element: <OpportunityEditorPage /> },
              { path: paths.employerApplications, element: <EmployerApplicationsPage /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole roles={['curator', 'admin_curator']} />,
        children: [
          {
            element: <CuratorLayout />,
            children: [
              { path: paths.curatorDashboard, element: <CuratorDashboardPage /> },
              { path: paths.curatorEmployers, element: <CuratorEmployersPage /> },
              { path: paths.curatorApplicants, element: <CuratorApplicantsPage /> },
              { path: paths.curatorOpportunities, element: <CuratorOpportunitiesPage /> },
              { path: paths.curatorVerification, element: <CuratorVerificationPage /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole roles={['admin_curator']} />,
        children: [
          {
            element: <AdminLayout />,
            children: [{ path: paths.adminCurators, element: <AdminCuratorsPage /> }],
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
