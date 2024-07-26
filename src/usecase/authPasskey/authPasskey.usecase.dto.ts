export interface AuthPasskeyUsecaseDto {
  user_code: string;
  user_id: string;
  challenge: string;
  challenge_buffer: string;
}