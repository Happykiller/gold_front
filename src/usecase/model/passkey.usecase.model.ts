export interface PasskeyUsecaseModel {
  id: string;
  label: string;
  user_id: string;
  hostname: string;
  user_code: string;
  challenge: string;
  credential_id: string;
}