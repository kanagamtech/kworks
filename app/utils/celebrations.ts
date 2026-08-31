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

// No hardcoded employee data — all employee, birthday and anniversary data is loaded live from the backend.
export const EMPLOYEES: Employee[] = [];

// No hardcoded notices — all notices are fetched live from the backend API (/api/notices).
export const MANAGEMENT_NOTICES: Notice[] = [];

export const HR_NOTICES: Notice[] = [];