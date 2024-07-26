export interface AuthPasskeyUsecaseModel {
  message: string;
  data?: {
    id: string;
    code: string;
    access_token: string;
    name_first: string;
    name_last: string;
    description: string;
    mail: string;
    role: string;
  },
  error?: string;
}