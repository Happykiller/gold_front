// src\common\inversify.ts
import { StateStorage } from 'zustand/middleware';

import {
  AuthPasskeyUsecase, AuthUsecase, CreatePasskeyUsecase, DeletePasskeyUsecase,
  GetPasskeyForUserUsecase, GraphqlService,
  LoggerService, LoggerServiceReal, SessionInfoUsecase, SystemInfoUsecase, UpdPasswordUsecase
} from '@happykiller/sunny-ui';
import config from '@src/config';
import { SetRecoUsecase } from '@usecase/setReco/setReco.usecase';
import { GetThirdsUsecase } from '@usecase/getThirds/getThirds.usecase';
import { GraphqlServiceFake } from '@service/graphql/graphql.service.fake';
import { GetAccountUsecase } from '@usecase/getAccount/getAccount.usecase';
import { GraphqlServiceFetch } from '@service/graphql/graphql.service.fetch';
import { GetAccountsUsecase } from '@usecase/getAccounts/getAccounts.usecase';
import { StorageServiceCookie } from '@service/storage/storage.service.cookie';
import { GetOperationUsecase } from '@usecase/getOperation/getOperation.usecaset';
import { GetOperationsUsecase } from '@usecase/getOperations/getOperations.usecase';
import { CreateOperationUsecase } from '@usecase/createOperation/createOperation.usecase';
import { CloneOperationsUsecase } from '@usecase/cloneOperations/cloneOperations.usecase';
import { UpdateOperationUsecase } from '@usecase/updateOperation/updateOperation.usecase';
import { DeleteOperationUsecase } from '@usecase/deleteOperation/deleteOperation.usecase';
import { GetOpeCategoriesUsecase } from '@usecase/getOpeCategories/getOpeCategories.usecase';
import { GetCashflowUsecase } from '@usecase/getCashflow/getCashflow.usecase';

export class Inversify {
  authUsecase: AuthUsecase;
  loggerService: LoggerService;
  storageService: StateStorage;
  graphqlService: GraphqlService;
  setRecoUsecase: SetRecoUsecase;
  sessionInfo: SessionInfoUsecase;
  getThirdsUsecase: GetThirdsUsecase;
  systemInfoUsecase: SystemInfoUsecase;
  getAccountUsecase: GetAccountUsecase;
  authPasskeyUsecase: AuthPasskeyUsecase;
  getAccountsUsecase: GetAccountsUsecase;
  updPasswordUsecase: UpdPasswordUsecase;
  getOperationUsecase: GetOperationUsecase;
  getOperationsUsecase: GetOperationsUsecase;
  deletePasskeyUsecase: DeletePasskeyUsecase;
  createPasskeyUsecase: CreatePasskeyUsecase;
  createOperationUsecase: CreateOperationUsecase;
  cloneOperationsUsecase: CloneOperationsUsecase;
  updateOperationUsecase: UpdateOperationUsecase;
  deleteOperationUsecase: DeleteOperationUsecase;
  getOpeCategoriesUsecase: GetOpeCategoriesUsecase;
  getPasskeyForUserUsecase: GetPasskeyForUserUsecase;
  getCashflowUsecase: GetCashflowUsecase;

  constructor() {
    // Usecases
    this.authUsecase = new AuthUsecase(this);
    this.loggerService = new LoggerServiceReal();
    this.setRecoUsecase = new SetRecoUsecase(this);
    this.sessionInfo = new SessionInfoUsecase(this);
    this.getThirdsUsecase = new GetThirdsUsecase(this);
    this.systemInfoUsecase = new SystemInfoUsecase(this);
    this.getAccountUsecase = new GetAccountUsecase(this);
    this.getAccountsUsecase = new GetAccountsUsecase(this);
    this.authPasskeyUsecase = new AuthPasskeyUsecase(this);
    this.updPasswordUsecase = new UpdPasswordUsecase(this);
    this.getOperationUsecase = new GetOperationUsecase(this);
    this.getOperationsUsecase = new GetOperationsUsecase(this);
    this.deletePasskeyUsecase = new DeletePasskeyUsecase(this);
    this.createPasskeyUsecase = new CreatePasskeyUsecase(this);
    this.cloneOperationsUsecase = new CloneOperationsUsecase(this);
    this.createOperationUsecase = new CreateOperationUsecase(this);
    this.updateOperationUsecase = new UpdateOperationUsecase(this);
    this.deleteOperationUsecase = new DeleteOperationUsecase(this);
    this.getOpeCategoriesUsecase = new GetOpeCategoriesUsecase(this);
    this.getPasskeyForUserUsecase = new GetPasskeyForUserUsecase(this);
    this.getCashflowUsecase = new GetCashflowUsecase(this);

    // Services
    this.storageService = new StorageServiceCookie();
    if (config.mode === 'prod' || config.mode === 'dev') {
      this.graphqlService = new GraphqlServiceFetch(this);
    } else {
      this.graphqlService = new GraphqlServiceFake();
    }

  }
}

const inversify = new Inversify();

export default inversify;