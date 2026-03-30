export const paths = {
  home: '/',
  login: '/login',
  register: '/register',
  curatorLogin: '/curator/login',
  events: '/events',

  opportunity: (id: string | number = ':id') => `/opportunities/${id}`,
  publicApplicant: (id: string | number = ':id') => `/applicants/${id}`,

  applicantProfile: '/applicant/profile',
  applicantApplications: '/applicant/applications',
  applicantFavorites: '/applicant/favorites',
  applicantContacts: '/applicant/contacts',
  applicantPrivacy: '/applicant/privacy',

  employerProfile: '/employer/profile',
  employerOpportunities: '/employer/opportunities',
  employerOpportunityNew: '/employer/opportunities/new',
  employerOpportunityEdit: (id: string | number = ':id') => `/employer/opportunities/${id}/edit`,
  employerApplications: '/employer/applications',

  curatorDashboard: '/curator',
  curatorEmployers: '/curator/employers',
  curatorApplicants: '/curator/applicants',
  curatorOpportunities: '/curator/opportunities',
  curatorVerification: '/curator/verification',

  adminCurators: '/admin/curators',
} as const;
