export interface SystemInfoUsecaseModel {
  message: string;
  data?: {
    version: string;
  },
  error?: string;
}