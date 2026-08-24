export type UserProfile = {
  name: string;
  email: string;
  password?: string;
  company?: string;
  role?: string;
  department?: string;
  destination?: string;
  photoUri: string | null;
};