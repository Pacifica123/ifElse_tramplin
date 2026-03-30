import type { OpportunityType, PublicationStatus, WorkFormat } from './opportunities';

const STORAGE_KEY = 'trampolin-curator-workspace-v1';

export type CuratorVerificationStatus = 'pending' | 'approved' | 'rejected';
export type CuratorApplicantModerationStatus = 'pending' | 'approved' | 'rejected';

export interface CuratorEmployer {
  id: number;
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  industry: string;
  city: string;
  websiteUrl?: string | null;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationComment?: string | null;
  moderationNote?: string | null;
  updatedAt: string;
}

export interface CuratorApplicant {
  id: number;
  fullName: string;
  email: string;
  university: string;
  studyCourse: string;
  graduationYear: number;
  skills: string[];
  isProfilePublic: boolean;
  moderationStatus: CuratorApplicantModerationStatus;
  moderationNote?: string | null;
  updatedAt: string;
}

export interface CuratorOpportunity {
  id: number;
  title: string;
  employerName: string;
  shortDescription: string;
  opportunityType: OpportunityType;
  workFormat: WorkFormat;
  publicationStatus: PublicationStatus;
  cityName?: string | null;
  addressText?: string | null;
  moderationNote?: string | null;
  updatedAt: string;
}

export interface CuratorVerificationRequest {
  id: number;
  employerId: number;
  companyName: string;
  status: CuratorVerificationStatus;
  comment?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedByName?: string | null;
}

interface CuratorWorkspaceState {
  employers: CuratorEmployer[];
  applicants: CuratorApplicant[];
  opportunities: CuratorOpportunity[];
  verificationRequests: CuratorVerificationRequest[];
}

export interface CuratorDashboardData {
  employersTotal: number;
  employersPending: number;
  employersVerified: number;
  applicantsTotal: number;
  applicantsPending: number;
  opportunitiesTotal: number;
  opportunitiesPending: number;
  opportunitiesRejected: number;
  verificationPending: number;
  latestVerificationRequests: CuratorVerificationRequest[];
}

const initialState: CuratorWorkspaceState = {
  employers: [
    {
      id: 101,
      companyName: 'CodeInsight',
      ownerName: 'Ирина Соколова',
      ownerEmail: 'hr@codeinsight.example',
      industry: 'EdTech / заказная разработка',
      city: 'Кемерово',
      websiteUrl: 'https://codeinsight.example',
      verificationStatus: 'pending',
      verificationComment: 'Ждём подтверждающие документы по юрлицу.',
      moderationNote: 'Профиль заполнен хорошо, нужно проверить сайт и контакты.',
      updatedAt: '2026-03-29T10:15:00.000Z',
    },
    {
      id: 102,
      companyName: 'DataSpring',
      ownerName: 'Максим Орлов',
      ownerEmail: 'jobs@dataspring.example',
      industry: 'FinTech',
      city: 'Томск',
      websiteUrl: 'https://dataspring.example',
      verificationStatus: 'verified',
      verificationComment: 'Компания подтверждена, контакты совпадают.',
      moderationNote: 'Можно публиковать вакансии.',
      updatedAt: '2026-03-27T12:40:00.000Z',
    },
    {
      id: 103,
      companyName: 'AI Track',
      ownerName: 'Евгений Морозов',
      ownerEmail: 'team@aitrack.example',
      industry: 'AI / ML',
      city: 'Новосибирск',
      websiteUrl: 'https://aitrack.example',
      verificationStatus: 'rejected',
      verificationComment: 'Недостаточно данных о работодателе.',
      moderationNote: 'Нужно повторно запросить официальный сайт и соцсети.',
      updatedAt: '2026-03-25T08:30:00.000Z',
    },
  ],
  applicants: [
    {
      id: 201,
      fullName: 'Алина Петрова',
      email: 'alina.pet@example.com',
      university: 'КузГТУ',
      studyCourse: '4 курс',
      graduationYear: 2026,
      skills: ['React', 'TypeScript', 'UI'],
      isProfilePublic: true,
      moderationStatus: 'approved',
      moderationNote: 'Профиль аккуратный, ссылки на проекты есть.',
      updatedAt: '2026-03-28T14:00:00.000Z',
    },
    {
      id: 202,
      fullName: 'Никита Воронцов',
      email: 'vorontsov@example.com',
      university: 'ТПУ',
      studyCourse: '3 курс',
      graduationYear: 2027,
      skills: ['Rust', 'PostgreSQL', 'SQLx'],
      isProfilePublic: false,
      moderationStatus: 'pending',
      moderationNote: 'Проверить корректность резюме и контактных ссылок.',
      updatedAt: '2026-03-29T16:20:00.000Z',
    },
    {
      id: 203,
      fullName: 'Мария Крылова',
      email: 'maria.k@example.com',
      university: 'НГУ',
      studyCourse: 'магистратура',
      graduationYear: 2026,
      skills: ['Python', 'ML', 'CV'],
      isProfilePublic: true,
      moderationStatus: 'rejected',
      moderationNote: 'Нужна доработка описания опыта и ссылок на проекты.',
      updatedAt: '2026-03-24T09:10:00.000Z',
    },
  ],
  opportunities: [
    {
      id: 301,
      title: 'Frontend Intern',
      employerName: 'CodeInsight',
      shortDescription: 'Стажировка на React/TypeScript с наставником.',
      opportunityType: 'internship',
      workFormat: 'office',
      publicationStatus: 'pending_moderation',
      cityName: 'Кемерово',
      addressText: 'Кемерово, пр. Советский, 60',
      moderationNote: 'Проверить формулировку требований и зарплату.',
      updatedAt: '2026-03-29T11:00:00.000Z',
    },
    {
      id: 302,
      title: 'Junior Backend Developer',
      employerName: 'DataSpring',
      shortDescription: 'Вакансия для junior backend-разработчика на Rust.',
      opportunityType: 'vacancy',
      workFormat: 'hybrid',
      publicationStatus: 'active',
      cityName: 'Томск',
      addressText: 'Томск, ул. Учебная, 39',
      moderationNote: 'Карточка уже активна, замечаний нет.',
      updatedAt: '2026-03-27T13:15:00.000Z',
    },
    {
      id: 303,
      title: 'Менторская программа по ML',
      employerName: 'AI Track',
      shortDescription: 'Онлайн-программа по ML и карьерному треку.',
      opportunityType: 'mentoring',
      workFormat: 'remote',
      publicationStatus: 'rejected',
      cityName: 'Новосибирск',
      addressText: null,
      moderationNote: 'Нужно уточнить формат участия и контактные данные.',
      updatedAt: '2026-03-25T08:40:00.000Z',
    },
    {
      id: 304,
      title: 'Карьерный день для студентов IT',
      employerName: 'Tech Consortium',
      shortDescription: 'Очное карьерное мероприятие с работодателями.',
      opportunityType: 'event',
      workFormat: 'office',
      publicationStatus: 'planned',
      cityName: 'Москва',
      addressText: 'Москва, Ленинские горы, 1',
      moderationNote: 'Ожидаем финальную программу мероприятия.',
      updatedAt: '2026-03-30T07:50:00.000Z',
    },
  ],
  verificationRequests: [
    {
      id: 401,
      employerId: 101,
      companyName: 'CodeInsight',
      status: 'pending',
      comment: 'Добавили карточку компании, ждем решение куратора.',
      submittedAt: '2026-03-29T09:55:00.000Z',
      reviewedAt: null,
      reviewedByName: null,
    },
    {
      id: 402,
      employerId: 102,
      companyName: 'DataSpring',
      status: 'approved',
      comment: 'Проверены сайт, e-mail домен и описание компании.',
      submittedAt: '2026-03-26T10:00:00.000Z',
      reviewedAt: '2026-03-27T12:20:00.000Z',
      reviewedByName: 'Анна Куратор',
    },
    {
      id: 403,
      employerId: 103,
      companyName: 'AI Track',
      status: 'rejected',
      comment: 'Недостаточно подтверждающих материалов.',
      submittedAt: '2026-03-24T08:10:00.000Z',
      reviewedAt: '2026-03-25T08:20:00.000Z',
      reviewedByName: 'Анна Куратор',
    },
  ],
};

function cloneState(state: CuratorWorkspaceState): CuratorWorkspaceState {
  return JSON.parse(JSON.stringify(state)) as CuratorWorkspaceState;
}

function loadState(): CuratorWorkspaceState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = cloneState(initialState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return JSON.parse(raw) as CuratorWorkspaceState;
  } catch {
    const seeded = cloneState(initialState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveState(state: CuratorWorkspaceState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function mutateState(mutator: (draft: CuratorWorkspaceState) => void) {
  const draft = loadState();
  mutator(draft);
  saveState(draft);
  return cloneState(draft);
}

function nowIso() {
  return new Date().toISOString();
}

export async function getCuratorDashboard(): Promise<CuratorDashboardData> {
  const state = loadState();
  const latestVerificationRequests = [...state.verificationRequests]
    .sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt))
    .slice(0, 5);

  return {
    employersTotal: state.employers.length,
    employersPending: state.employers.filter((item) => item.verificationStatus === 'pending').length,
    employersVerified: state.employers.filter((item) => item.verificationStatus === 'verified').length,
    applicantsTotal: state.applicants.length,
    applicantsPending: state.applicants.filter((item) => item.moderationStatus === 'pending').length,
    opportunitiesTotal: state.opportunities.length,
    opportunitiesPending: state.opportunities.filter((item) => item.publicationStatus === 'pending_moderation').length,
    opportunitiesRejected: state.opportunities.filter((item) => item.publicationStatus === 'rejected').length,
    verificationPending: state.verificationRequests.filter((item) => item.status === 'pending').length,
    latestVerificationRequests,
  };
}

export async function getCuratorEmployers(): Promise<CuratorEmployer[]> {
  return loadState().employers.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export async function updateCuratorEmployer(
  employerId: number,
  patch: Partial<Pick<CuratorEmployer, 'companyName' | 'industry' | 'verificationStatus' | 'verificationComment' | 'moderationNote'>>,
) {
  const state = mutateState((draft) => {
    const employer = draft.employers.find((item) => item.id === employerId);
    if (!employer) throw new Error('Работодатель не найден');
    Object.assign(employer, patch, { updatedAt: nowIso() });
  });

  return state.employers.find((item) => item.id === employerId)!;
}

export async function getCuratorApplicants(): Promise<CuratorApplicant[]> {
  return loadState().applicants.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export async function updateCuratorApplicant(
  applicantId: number,
  patch: Partial<Pick<CuratorApplicant, 'moderationStatus' | 'moderationNote' | 'isProfilePublic'>>,
) {
  const state = mutateState((draft) => {
    const applicant = draft.applicants.find((item) => item.id === applicantId);
    if (!applicant) throw new Error('Соискатель не найден');
    Object.assign(applicant, patch, { updatedAt: nowIso() });
  });

  return state.applicants.find((item) => item.id === applicantId)!;
}

export async function getCuratorOpportunities(): Promise<CuratorOpportunity[]> {
  return loadState().opportunities.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export async function updateCuratorOpportunity(
  opportunityId: number,
  patch: Partial<Pick<CuratorOpportunity, 'publicationStatus' | 'moderationNote'>>,
) {
  const state = mutateState((draft) => {
    const opportunity = draft.opportunities.find((item) => item.id === opportunityId);
    if (!opportunity) throw new Error('Возможность не найдена');
    Object.assign(opportunity, patch, { updatedAt: nowIso() });
  });

  return state.opportunities.find((item) => item.id === opportunityId)!;
}

export async function getCuratorVerificationRequests(): Promise<CuratorVerificationRequest[]> {
  return loadState().verificationRequests.sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));
}

export async function reviewCuratorVerificationRequest(
  requestId: number,
  input: { status: CuratorVerificationStatus; comment?: string; reviewedByName?: string },
) {
  const state = mutateState((draft) => {
    const request = draft.verificationRequests.find((item) => item.id === requestId);
    if (!request) throw new Error('Запрос на верификацию не найден');

    request.status = input.status;
    request.comment = input.comment ?? request.comment ?? null;
    request.reviewedAt = nowIso();
    request.reviewedByName = input.reviewedByName ?? 'Куратор платформы';

    const employer = draft.employers.find((item) => item.id === request.employerId);
    if (employer) {
      employer.verificationStatus = input.status === 'approved' ? 'verified' : input.status === 'rejected' ? 'rejected' : 'pending';
      employer.verificationComment = request.comment ?? employer.verificationComment ?? null;
      employer.updatedAt = nowIso();
    }
  });

  return state.verificationRequests.find((item) => item.id === requestId)!;
}

export async function resetCuratorWorkspace() {
  const seeded = cloneState(initialState);
  saveState(seeded);
  return seeded;
}
