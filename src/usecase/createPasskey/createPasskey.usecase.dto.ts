import { RegistrationJSON } from '@passwordless-id/webauthn/dist/esm/types';

export default interface CreatePasskeyUsecaseDto {
  label: string;
  challenge: string;
  hostname: string;
  registration: RegistrationJSON
}
