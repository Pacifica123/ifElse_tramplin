export const paths = {
  home: '/',
  login: '/login',
  register: '/register',

  opportunity: (id = ':id') => `/opportunities/${id}`,
  publicApplicant: (id = ':id') => `/applicants/${id}`,

  applicantProfile: '/applicant/profile',
  applicantApplications: '/applicant/applications',
  applicantFavorites: '/applicant/favorites',
  applicantContacts: '/applicant/contacts',
  applicantPrivacy: '/applicant/privacy',

  employerProfile: '/employer/profile',
  employerOpportunities: '/employer/opportunities',
  employerOpportunityNew: '/employer/opportunities/new',
  employerOpportunityEdit: (id = ':id') => `/employer/opportunities/${id}/edit`,
  employerApplications: '/employer/applications',

  curatorDashboard: '/curator',
  curatorEmployers: '/curator/employers',
  curatorApplicants: '/curator/applicants',
  curatorOpportunities: '/curator/opportunities',
  curatorVerification: '/curator/verification',

  adminCurators: '/admin/curators',
} as const;
