export type UserProfile = {
  name: string;
  email: string;
  password?: string;
  company?: string;
  role?: string;
  department?: string;
  photoUri: string | null;
};