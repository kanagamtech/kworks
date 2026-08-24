export type Employee = {
  id: string;
  name: string;
  role: string;
  photo: number;
  birthMonth: number;
  birthDay: number;
  joinYear: number;
  joinMonth: number;
  joinDay: number;
};

export type Notice = {
  id: string;
  title: string;
  body: string;
  date: string;
  team?: string;
};

export const EMPLOYEES: Employee[] = [
  {
    id: 'emp1',
    name: 'Rahul Sharma',
    role: 'Software Engineer',
    photo: require('../assets/images/avatars/avatar-rs.png'),
    birthMonth: 7,
    birthDay: 12,
    joinYear: 2021,
    joinMonth: 7,
    joinDay: 15,
  },
  {
    id: 'emp2',
    name: 'Priya Verma',
    role: 'HR Executive',
    photo: require('../assets/images/avatars/avatar-pv.png'),
    birthMonth: 7,
    birthDay: 3,
    joinYear: 2019,
    joinMonth: 7,
    joinDay: 3,
  },
  {
    id: 'emp3',
    name: 'Arjun Nair',
    role: 'UI/UX Designer',
    photo: require('../assets/images/avatars/avatar-an.png'),
    birthMonth: 7,
    birthDay: 21,
    joinYear: 2020,
    joinMonth: 10,
    joinDay: 2,
  },
  {
    id: 'emp4',
    name: 'Meena Kumar',
    role: 'Project Manager',
    photo: require('../assets/images/avatars/avatar-mk.png'),
    birthMonth: 8,
    birthDay: 5,
    joinYear: 2018,
    joinMonth: 7,
    joinDay: 20,
  },
  {
    id: 'emp5',
    name: 'Vikram Singh',
    role: 'QA Analyst',
    photo: require('../assets/images/avatars/avatar-vs.png'),
    birthMonth: 7,
    birthDay: 27,
    joinYear: 2022,
    joinMonth: 2,
    joinDay: 18,
  },
  {
    id: 'emp6',
    name: 'Divya Rao',
    role: 'DevOps Engineer',
    photo: require('../assets/images/avatars/avatar-dr.png'),
    birthMonth: 8,
    birthDay: 15,
    joinYear: 2023,
    joinMonth: 0,
    joinDay: 5,
  },
];

export const MANAGEMENT_NOTICES: Notice[] = [
  {
    id: 'm1',
    title: 'Diwali Holiday Schedule',
    body: 'Office will remain closed on Diwali (Nov 8). Plan your leaves accordingly.',
    date: 'Aug 10, 2026',
  },
  {
    id: 'm2',
    title: 'Annual Performance Review',
    body: 'Quarterly performance reviews will begin from Sep 1. Please submit your self-appraisal by Aug 28.',
    date: 'Aug 18, 2026',
  },
];

export const HR_NOTICES: Notice[] = [
  {
    id: 'h1',
    title: 'July Payslips Released',
    body: 'July 2026 payslips are now available on the HR portal.',
    date: 'Aug 2, 2026',
  },
  {
    id: 'h2',
    title: 'Health Checkup Camp',
    body: 'Free health checkup camp on Aug 25 in the ground floor conference room, 9 AM - 1 PM.',
    date: 'Aug 15, 2026',
  },
  {
    id: 'h3',
    title: 'Canteen Menu Update',
    body: 'From next Monday, lunch menu will include regional specials every Friday.',
    date: 'Aug 19, 2026',
  },
];