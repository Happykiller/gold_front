/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

export type AccountModelResolver = {
  balance_not_reconcilied?: Maybe<Scalars['Float']['output']>;
  balance_reconcilied?: Maybe<Scalars['Float']['output']>;
  creation_date: Scalars['String']['output'];
  creator_id: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  label: Scalars['String']['output'];
  modification_date?: Maybe<Scalars['String']['output']>;
  modificator_id?: Maybe<Scalars['Int']['output']>;
  parent_account_id?: Maybe<Scalars['Int']['output']>;
  /** 1, regular by default */
  type_id: Scalars['Int']['output'];
};

export type AccountTypeModelResolver = {
  creation_date: Scalars['String']['output'];
  creator_id: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  label: Scalars['String']['output'];
  modification_date?: Maybe<Scalars['String']['output']>;
  modificator_id?: Maybe<Scalars['Int']['output']>;
};

export type AuthAuthResolverDto = {
  /** User code for the session */
  login: Scalars['String']['input'];
  /** Password for the session */
  password: Scalars['String']['input'];
};

export type AuthModelResolver = {
  /** Session token */
  access_token: Scalars['String']['output'];
  /** Code of the user */
  code: Scalars['String']['output'];
  description: Scalars['String']['output'];
  /** Id of the user */
  id: Scalars['String']['output'];
  mail: Scalars['String']['output'];
  name_first: Scalars['String']['output'];
  name_last: Scalars['String']['output'];
  role: Scalars['String']['output'];
};

export type CashflowInputResolver = {
  account_ids: Array<Scalars['Int']['input']>;
  end_date: Scalars['String']['input'];
  start_date: Scalars['String']['input'];
};

export type CashflowModelResolver = {
  account_id: Scalars['Int']['output'];
  date: Scalars['String']['output'];
  reconciled_balance: Scalars['Float']['output'];
  total_balance: Scalars['Float']['output'];
};

export type CloneOperationInputResolver = {
  account_id: Scalars['Int']['input'];
  date: Scalars['String']['input'];
  template_account_id: Scalars['Int']['input'];
};

export type CreateAccountInputResolver = {
  description?: InputMaybe<Scalars['String']['input']>;
  label: Scalars['String']['input'];
  parent_account_id?: InputMaybe<Scalars['Int']['input']>;
  /** 1, regular by default */
  type_id: Scalars['Int']['input'];
};

export type CreateOperationInputResolver = {
  account_id: Scalars['Int']['input'];
  account_id_dest?: InputMaybe<Scalars['Int']['input']>;
  amount: Scalars['Float']['input'];
  category_id?: InputMaybe<Scalars['Int']['input']>;
  date: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  status_id: Scalars['Int']['input'];
  third_id?: InputMaybe<Scalars['Int']['input']>;
  type_id: Scalars['Int']['input'];
  vat_rate?: InputMaybe<Scalars['Float']['input']>;
};

export type CreateOperationLinkInputResolver = {
  operation_id: Scalars['Int']['input'];
  operation_ref_id: Scalars['Int']['input'];
};

export type CreatePasskeyResolverDto = {
  challenge: Scalars['String']['input'];
  hostname: Scalars['String']['input'];
  label: Scalars['String']['input'];
  registration: RegisterPasskeyResolverDto;
};

export type CreateUserResolverDto = {
  /** Code of the user */
  code: Scalars['String']['input'];
  description: Scalars['String']['input'];
  mail: Scalars['String']['input'];
  name_first: Scalars['String']['input'];
  name_last: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type DeletePasskeyResolverDto = {
  passkey_id: Scalars['String']['input'];
};

export type GetAccountInputResolver = {
  account_id: Scalars['Int']['input'];
};

export type GetOperationInputResolver = {
  operation_id: Scalars['Int']['input'];
};

export type GetOperationLinkInputResolver = {
  operation_link_id: Scalars['Int']['input'];
};

export type GetOperationsInputResolver = {
  account_id: Scalars['Int']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type GetUserResolverDto = {
  code?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
};

export type Mutation = {
  cloneOperations: Array<OperationModelResolver>;
  createAccount: AccountModelResolver;
  createOperation: OperationModelResolver;
  createOperationLink: OperationLinkModelResolver;
  create_passkey: PasskeyResolverModel;
  create_user: UserModelResolver;
  deleteAccount: Scalars['Boolean']['output'];
  deleteOperation: Scalars['Boolean']['output'];
  deleteOperationLink: Scalars['Boolean']['output'];
  delete_passkey: Scalars['Boolean']['output'];
  updateAccount: AccountModelResolver;
  updateOperation: OperationModelResolver;
  update_password: AuthModelResolver;
};

export type MutationCloneOperationsArgs = {
  dto: CloneOperationInputResolver;
};

export type MutationCreateAccountArgs = {
  dto: CreateAccountInputResolver;
};

export type MutationCreateOperationArgs = {
  dto: CreateOperationInputResolver;
};

export type MutationCreateOperationLinkArgs = {
  dto: CreateOperationLinkInputResolver;
};

export type MutationCreate_PasskeyArgs = {
  dto: CreatePasskeyResolverDto;
};

export type MutationCreate_UserArgs = {
  dto: CreateUserResolverDto;
};

export type MutationDeleteAccountArgs = {
  dto: GetAccountInputResolver;
};

export type MutationDeleteOperationArgs = {
  dto: GetOperationInputResolver;
};

export type MutationDeleteOperationLinkArgs = {
  dto: GetOperationLinkInputResolver;
};

export type MutationDelete_PasskeyArgs = {
  dto: DeletePasskeyResolverDto;
};

export type MutationUpdateAccountArgs = {
  dto: UpdateAccountInputResolver;
};

export type MutationUpdateOperationArgs = {
  dto: UpdateOperationInputResolver;
};

export type MutationUpdate_PasswordArgs = {
  dto: UpdPasswordAuthResolverDto;
};

export type OperationCategoryModelResolver = {
  active: Scalars['Boolean']['output'];
  creation_date: Scalars['String']['output'];
  creator_id: Scalars['Int']['output'];
  description: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  label: Scalars['String']['output'];
  modification_date?: Maybe<Scalars['String']['output']>;
  modificator_id?: Maybe<Scalars['Int']['output']>;
};

export type OperationLinkModelResolver = {
  active: Scalars['Boolean']['output'];
  creation_date: Scalars['String']['output'];
  creator_id: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  modification_date?: Maybe<Scalars['String']['output']>;
  modificator_id?: Maybe<Scalars['Int']['output']>;
  operation_id: Scalars['Int']['output'];
  operation_ref_id: Scalars['Int']['output'];
};

export type OperationModelResolver = {
  account: AccountModelResolver;
  account_dest?: Maybe<AccountModelResolver>;
  account_id: Scalars['Int']['output'];
  account_id_dest?: Maybe<Scalars['Int']['output']>;
  active: Scalars['Boolean']['output'];
  amount: Scalars['Float']['output'];
  category: OperationCategoryModelResolver;
  category_id?: Maybe<Scalars['Int']['output']>;
  creation_date: Scalars['String']['output'];
  creator_id: Scalars['Int']['output'];
  date: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  modification_date?: Maybe<Scalars['String']['output']>;
  modificator_id?: Maybe<Scalars['Int']['output']>;
  status: OperationStatutModelResolver;
  status_id: Scalars['Int']['output'];
  third: OperationThirdModelResolver;
  third_id?: Maybe<Scalars['Int']['output']>;
  type: OperationTypeModelResolver;
  type_id: Scalars['Int']['output'];
  vat_rate: Scalars['Float']['output'];
};

export type OperationStatutModelResolver = {
  active: Scalars['Boolean']['output'];
  creation_date: Scalars['String']['output'];
  creator_id: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  label: Scalars['String']['output'];
  modification_date?: Maybe<Scalars['String']['output']>;
  modificator_id?: Maybe<Scalars['Int']['output']>;
};

export type OperationThirdModelResolver = {
  active: Scalars['Boolean']['output'];
  creation_date: Scalars['String']['output'];
  creator_id: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  label: Scalars['String']['output'];
  modification_date?: Maybe<Scalars['String']['output']>;
  modificator_id?: Maybe<Scalars['Int']['output']>;
};

export type OperationTypeModelResolver = {
  active: Scalars['Boolean']['output'];
  creation_date: Scalars['String']['output'];
  creator_id: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  label: Scalars['String']['output'];
  modification_date?: Maybe<Scalars['String']['output']>;
  modificator_id?: Maybe<Scalars['Int']['output']>;
};

export type PasskeyAuthAuthenticationResolverDto = {
  authenticatorAttachment?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  rawId: Scalars['String']['input'];
  response: PasskeyAuthResponseResolverDto;
  type: Scalars['String']['input'];
};

export type PasskeyAuthResolverDto = {
  authentication: PasskeyAuthAuthenticationResolverDto;
  user_code: Scalars['String']['input'];
};

export type PasskeyAuthResponseResolverDto = {
  authenticatorData: Scalars['String']['input'];
  clientDataJSON: Scalars['String']['input'];
  signature: Scalars['String']['input'];
  userHandle?: InputMaybe<Scalars['String']['input']>;
};

export type PasskeyResolverModel = {
  challenge: Scalars['String']['output'];
  credential_id: Scalars['String']['output'];
  hostname: Scalars['String']['output'];
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  user_code: Scalars['String']['output'];
  user_id: Scalars['String']['output'];
};

export type PingResponse = {
  message: Scalars['String']['output'];
};

export type Query = {
  account: AccountModelResolver;
  accountTypes: Array<AccountTypeModelResolver>;
  accounts: Array<AccountModelResolver>;
  auth: AuthModelResolver;
  auth_passkey: AuthModelResolver;
  cashflow: Array<CashflowModelResolver>;
  getSessionInfo: AuthModelResolver;
  operation: OperationModelResolver;
  operationCategories: Array<OperationCategoryModelResolver>;
  operationLinks: Array<OperationLinkModelResolver>;
  operationStatus: Array<OperationStatutModelResolver>;
  operationThirds: Array<OperationThirdModelResolver>;
  operationTypes: Array<OperationTypeModelResolver>;
  operations: Array<OperationModelResolver>;
  passkeys_for_user: Array<PasskeyResolverModel>;
  ping: PingResponse;
  systemInfo: SystemInfoResolverModel;
  test_mail: SendMailSystemResolverModel;
  user: UserModelResolver;
  users: Array<UserModelResolver>;
};

export type QueryAccountArgs = {
  dto: GetAccountInputResolver;
};

export type QueryAuthArgs = {
  dto: AuthAuthResolverDto;
};

export type QueryAuth_PasskeyArgs = {
  dto: PasskeyAuthResolverDto;
};

export type QueryCashflowArgs = {
  dto: CashflowInputResolver;
};

export type QueryOperationArgs = {
  dto: GetOperationInputResolver;
};

export type QueryOperationLinksArgs = {
  dto: GetOperationInputResolver;
};

export type QueryOperationsArgs = {
  dto: GetOperationsInputResolver;
};

export type QueryUserArgs = {
  dto: GetUserResolverDto;
};

export type RegisterPasskeyResolverDto = {
  authenticatorAttachment: Scalars['String']['input'];
  id: Scalars['String']['input'];
  rawId: Scalars['String']['input'];
  response: RegisterResponsePasskeyResolverDto;
  type: Scalars['String']['input'];
  user: RegisterUserPasskeyResolverDto;
};

export type RegisterResponsePasskeyResolverDto = {
  attestationObject: Scalars['String']['input'];
  authenticatorData: Scalars['String']['input'];
  clientDataJSON: Scalars['String']['input'];
  publicKey: Scalars['String']['input'];
  publicKeyAlgorithm: Scalars['Float']['input'];
  transports: Array<Scalars['String']['input']>;
};

export type RegisterUserPasskeyResolverDto = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type SendMailSystemResolverModel = {
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type SystemInfoResolverModel = {
  version: Scalars['String']['output'];
};

export type UpdPasswordAuthResolverDto = {
  conf_value: Scalars['String']['input'];
  new_value: Scalars['String']['input'];
  old_value: Scalars['String']['input'];
};

export type UpdateAccountInputResolver = {
  account_id: Scalars['Int']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  parent_account_id?: InputMaybe<Scalars['Int']['input']>;
  type_id?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateOperationInputResolver = {
  account_id?: InputMaybe<Scalars['Int']['input']>;
  account_id_dest?: InputMaybe<Scalars['Int']['input']>;
  amount?: InputMaybe<Scalars['Float']['input']>;
  category_id?: InputMaybe<Scalars['Int']['input']>;
  date?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  operation_id: Scalars['Int']['input'];
  status_id?: InputMaybe<Scalars['Int']['input']>;
  third_id?: InputMaybe<Scalars['Int']['input']>;
  type_id?: InputMaybe<Scalars['Int']['input']>;
  vat_rate?: InputMaybe<Scalars['Float']['input']>;
};

export type UserModelResolver = {
  code?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  mail?: Maybe<Scalars['String']['output']>;
  name_first?: Maybe<Scalars['String']['output']>;
  name_last?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
};

export type CloneOperationsMutationVariables = Exact<{
  account_id: number;
  template_account_id: number;
  date: string;
}>;

export type CloneOperationsMutation = {
  cloneOperations: Array<{
    id: number;
    account_id: number;
    account_id_dest: number | null;
    amount: number;
    date: string;
    status_id: number;
    type_id: number;
    third_id: number | null;
    category_id: number | null;
    description: string;
    creator_id: number;
    creation_date: string;
    modificator_id: number | null;
    modification_date: string | null;
  }>;
};

export type CreateOperationMutationVariables = Exact<{
  account_id: number;
  account_id_dest?: number | null | undefined;
  amount: number;
  vat_rate?: number | null | undefined;
  date: string;
  status_id: number;
  type_id: number;
  third_id?: number | null | undefined;
  category_id?: number | null | undefined;
  description?: string | null | undefined;
}>;

export type CreateOperationMutation = {
  createOperation: {
    id: number;
    account_id: number;
    account_id_dest: number | null;
    amount: number;
    vat_rate: number;
    date: string;
    status_id: number;
    type_id: number;
    third_id: number | null;
    category_id: number | null;
    description: string;
    creator_id: number;
    creation_date: string;
    modificator_id: number | null;
    modification_date: string | null;
  };
};

export type DeleteOperationMutationVariables = Exact<{
  operation_id: number;
}>;

export type DeleteOperationMutation = { deleteOperation: boolean };

export type AccountQueryVariables = Exact<{
  account_id: number;
}>;

export type AccountQuery = {
  account: {
    id: number;
    type_id: number;
    parent_account_id: number | null;
    label: string;
    description: string | null;
    balance_reconcilied: number | null;
    balance_not_reconcilied: number | null;
    creator_id: number;
    creation_date: string;
    modificator_id: number | null;
    modification_date: string | null;
  };
};

export type AccountTypesQueryVariables = Exact<{ [key: string]: never }>;

export type AccountTypesQuery = {
  accountTypes: Array<{ id: number; label: string }>;
};

export type AccountsQueryVariables = Exact<{ [key: string]: never }>;

export type AccountsQuery = {
  accounts: Array<{
    id: number;
    type_id: number;
    parent_account_id: number | null;
    label: string;
    description: string | null;
    balance_reconcilied: number | null;
    balance_not_reconcilied: number | null;
    creator_id: number;
    creation_date: string;
    modificator_id: number | null;
    modification_date: string | null;
  }>;
};

export type CashflowQueryVariables = Exact<{
  account_ids: Array<number> | number;
  start_date: string;
  end_date: string;
}>;

export type CashflowQuery = {
  cashflow: Array<{
    account_id: number;
    date: string;
    reconciled_balance: number;
    total_balance: number;
  }>;
};

export type OperationCategoriesQueryVariables = Exact<{ [key: string]: never }>;

export type OperationCategoriesQuery = {
  operationCategories: Array<{ id: number; label: string }>;
};

export type OperationTypesQueryVariables = Exact<{ [key: string]: never }>;

export type OperationTypesQuery = {
  operationTypes: Array<{ id: number; label: string }>;
};

export type OperationQueryVariables = Exact<{
  operation_id: number;
}>;

export type OperationQuery = {
  operation: {
    id: number;
    account_id: number;
    account_id_dest: number | null;
    amount: number;
    vat_rate: number;
    date: string;
    status_id: number;
    type_id: number;
    third_id: number | null;
    category_id: number | null;
    description: string;
    creator_id: number;
    creation_date: string;
    modificator_id: number | null;
    modification_date: string | null;
    account: { id: number; label: string };
    account_dest: { id: number; label: string } | null;
    third: { id: number; label: string };
    category: { id: number; label: string };
  };
};

export type OperationsQueryVariables = Exact<{
  account_id: number;
  limit: number;
  offset: number;
}>;

export type OperationsQuery = {
  operations: Array<{
    id: number;
    account_id: number;
    account_id_dest: number | null;
    amount: number;
    vat_rate: number;
    date: string;
    status_id: number;
    type_id: number;
    third_id: number | null;
    category_id: number | null;
    description: string;
    creator_id: number;
    creation_date: string;
    modificator_id: number | null;
    modification_date: string | null;
    account: { id: number; label: string };
    account_dest: { id: number; label: string } | null;
    third: { id: number; label: string };
    category: { id: number; label: string };
  }>;
};

export type OperationThirdsQueryVariables = Exact<{ [key: string]: never }>;

export type OperationThirdsQuery = {
  operationThirds: Array<{ id: number; label: string }>;
};

export type GetSessionInfoQueryVariables = Exact<{ [key: string]: never }>;

export type GetSessionInfoQuery = {
  getSessionInfo: {
    access_token: string;
    id: string;
    code: string;
    name_first: string;
    name_last: string;
    description: string;
    mail: string;
  };
};

export type SetOperationReconciledMutationVariables = Exact<{
  operation_id: number;
  date: string;
}>;

export type SetOperationReconciledMutation = {
  updateOperation: { id: number };
};

export type UpdateAccountMutationVariables = Exact<{
  account_id: number;
  label?: string | null | undefined;
  type_id?: number | null | undefined;
}>;

export type UpdateAccountMutation = {
  updateAccount: {
    id: number;
    label: string;
    type_id: number;
    parent_account_id: number | null;
    description: string | null;
    balance_reconcilied: number | null;
    balance_not_reconcilied: number | null;
  };
};

export type UpdateOperationMutationVariables = Exact<{
  operation_id: number;
  account_id: number;
  account_id_dest?: number | null | undefined;
  amount: number;
  vat_rate?: number | null | undefined;
  status_id: number;
  type_id: number;
  third_id: number;
  category_id: number;
  description?: string | null | undefined;
  date: string;
}>;

export type UpdateOperationMutation = {
  updateOperation: {
    id: number;
    account_id: number;
    account_id_dest: number | null;
    amount: number;
    vat_rate: number;
    date: string;
    status_id: number;
    type_id: number;
    third_id: number | null;
    category_id: number | null;
    description: string;
    creator_id: number;
    creation_date: string;
    modificator_id: number | null;
    modification_date: string | null;
    account: { id: number; label: string };
    account_dest: { id: number; label: string } | null;
    third: { id: number; label: string };
    category: { id: number; label: string };
  };
};
