export interface DemoOpportunity {
  id: string;
  title: string;
  company: string;
  city: string;
  address: string;
  type: 'internship' | 'vacancy' | 'mentoring' | 'event';
  format: 'office' | 'hybrid' | 'remote';
  salary: string;
  tags: string[];
  coordinates: [number, number];
}

export const demoOpportunities: DemoOpportunity[] = [
  {
    id: 'kemerovo-frontend-intern',
    title: 'Frontend Intern',
    company: 'CodeInsight',
    city: 'Кемерово',
    address: 'Кемерово, пр. Советский, 60',
    type: 'internship',
    format: 'office',
    salary: 'от 35 000 ₽',
    tags: ['React', 'TypeScript', 'UI'],
    coordinates: [86.0871, 55.3552],
  },
  {
    id: 'tomsk-backend-junior',
    title: 'Junior Backend Developer',
    company: 'DataSpring',
    city: 'Томск',
    address: 'Томск, ул. Учебная, 39',
    type: 'vacancy',
    format: 'hybrid',
    salary: 'от 70 000 ₽',
    tags: ['Rust', 'PostgreSQL', 'SQLx'],
    coordinates: [84.9542, 56.4846],
  },
  {
    id: 'novosibirsk-ml-mentoring',
    title: 'Менторская программа по ML',
    company: 'AI Track',
    city: 'Новосибирск',
    address: 'Новосибирск, Красный проспект, 25',
    type: 'mentoring',
    format: 'remote',
    salary: 'бесплатно',
    tags: ['Python', 'ML', 'CV'],
    coordinates: [82.9204, 55.0302],
  },
  {
    id: 'moscow-career-day',
    title: 'Карьерный день для студентов IT',
    company: 'Tech Consortium',
    city: 'Москва',
    address: 'Москва, Ленинские горы, 1',
    type: 'event',
    format: 'office',
    salary: 'мероприятие',
    tags: ['Стажировки', 'Нетворкинг', 'HR'],
    coordinates: [37.5308, 55.7033],
  },
];
