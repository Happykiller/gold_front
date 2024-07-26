import config from '@src/config/';
import { AuthUsecase } from '@usecase/auth/auth.usecase';
import LoggerService from '@service/logger/logger.service';
import GraphqlService from '@service/graphql/graphql.service';
import { SetRecoUsecase } from '@usecase/setReco/setReco.usecase';
import { SystemInfoUsecase } from '@usecase/system/systemInfo.usecase';
import { LoggerServiceReal } from '@service/logger/logger.service.real';
import { GetThirdsUsecase } from '@usecase/getThirds/getThirds.usecase';
import { GraphqlServiceFake } from '@service/graphql/graphql.service.fake';
import { GetAccountUsecase } from '@usecase/getAccount/getAccount.usecase';
import { GraphqlServiceFetch } from '@service/graphql/graphql.service.fetch';
import { SessionInfoUsecase } from '@usecase/sessionInfo/systemInfo.usecase';
import { GetAccountsUsecase } from '@usecase/getAccounts/getAccounts.usecase';
import { AuthPasskeyUsecase } from '@usecase/authPasskey/authPasskey.usecase';
import { GetOperationUsecase } from '@usecase/getOperation/getOperation.usecaset';
import { DeletePasskeyUsecase } from '@usecase/deletePasskey/deletePasskey.usecase';
import { CreatePasskeyUsecase } from '@usecase/createPasskey/createPasskey.usecase';
import { GetOperationsUsecase } from '@usecase/getOperations/getOperations.usecase';
import { CreateOperationUsecase } from '@usecase/createOperation/createOperation.usecase';
import { CloneOperationsUsecase } from '@usecase/cloneOperations/cloneOperations.usecase';
import { UpdateOperationUsecase } from '@usecase/updateOperation/updateOperation.usecase';
import { DeleteOperationUsecase } from '@usecase/deleteOperation/deleteOperation.usecase';
import { GetOpeCategoriesUsecase } from '@usecase/getOpeCategories/getOpeCategories.usecase';
import { GetPasskeyForUserUsecase } from '@usecase/getPasskeyForUser/getPasskeyForUser.usecase';

export class Inversify {
  authUsecase: AuthUsecase;
  loggerService: LoggerService;
  graphqlService: GraphqlService;
  setRecoUsecase: SetRecoUsecase;
  sessionInfo: SessionInfoUsecase;
  getThirdsUsecase: GetThirdsUsecase;
  systemInfoUsecase: SystemInfoUsecase;
  getAccountUsecase: GetAccountUsecase;
  authPasskeyUsecase: AuthPasskeyUsecase;
  getAccountsUsecase: GetAccountsUsecase;
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
    this.getOperationUsecase = new GetOperationUsecase(this);
    this.getOperationsUsecase = new GetOperationsUsecase(this);
    this.authPasskeyUsecase = new AuthPasskeyUsecase(this);
    this.deletePasskeyUsecase = new DeletePasskeyUsecase(this);
    this.createPasskeyUsecase = new CreatePasskeyUsecase(this);
    this.cloneOperationsUsecase = new CloneOperationsUsecase(this);
    this.createOperationUsecase = new CreateOperationUsecase(this);
    this.updateOperationUsecase = new UpdateOperationUsecase(this);
    this.deleteOperationUsecase = new DeleteOperationUsecase(this);
    this.getOpeCategoriesUsecase = new GetOpeCategoriesUsecase(this);
    this.getPasskeyForUserUsecase = new GetPasskeyForUserUsecase(this);

    // Services
    if (config.mode === 'prod') {
      this.graphqlService = new GraphqlServiceFetch(this);
    } else {
      this.graphqlService = new GraphqlServiceFake();
    }

  }
}

const inversify = new Inversify();

export default inversify;