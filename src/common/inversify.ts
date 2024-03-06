import config from '@src/config/';
import { AuthUsecase } from '@usecase/auth/auth.usecase';
import LoggerService from '@service/logger/logger.service';
import GraphqlService from '@service/graphql/graphql.service';
import { SetRecoUsecase } from '@usecase/setReco/setReco.usecase';
import { SystemInfoUsecase } from '@usecase/system/systemInfo.usecase';
import { LoggerServiceReal } from '@service/logger/logger.service.real';
import { GraphqlServiceFake } from '@service/graphql/graphql.service.fake';
import { GetAccountUsecase } from '@usecase/getAccount/getAccount.usecase';
import { GraphqlServiceFetch } from '@service/graphql/graphql.service.fetch';
import { SessionInfoUsecase } from '@usecase/sessionInfo/systemInfo.usecase';
import { GetAccountsUsecase } from '@usecase/getAccounts/getAccounts.usecase';
import { GetOperationsUsecase } from '@usecase/getOperations/getOperations.usecase';
import { CreateOperationUsecase } from '@usecase/createOperation/createOperation.usecase';
import { CloneOperationsUsecase } from '@usecase/cloneOperations/cloneOperations.usecase';

export class Inversify {
  authUsecase: AuthUsecase;
  loggerService: LoggerService;
  graphqlService: GraphqlService;
  setRecoUsecase: SetRecoUsecase;
  sessionInfo: SessionInfoUsecase;
  systemInfoUsecase: SystemInfoUsecase;
  getAccountUsecase: GetAccountUsecase;
  getAccountsUsecase: GetAccountsUsecase;
  getOperationsUsecase: GetOperationsUsecase;
  createOperationUsecase: CreateOperationUsecase;
  cloneOperationsUsecase: CloneOperationsUsecase;

  constructor() {
    // Usecases
    this.authUsecase = new AuthUsecase(this);
    this.loggerService = new LoggerServiceReal();
    this.setRecoUsecase = new SetRecoUsecase(this);
    this.sessionInfo = new SessionInfoUsecase(this);
    this.systemInfoUsecase = new SystemInfoUsecase(this);
    this.getAccountUsecase = new GetAccountUsecase(this);
    this.getAccountsUsecase = new GetAccountsUsecase(this);
    this.getOperationsUsecase = new GetOperationsUsecase(this);
    this.cloneOperationsUsecase = new CloneOperationsUsecase(this);
    this.createOperationUsecase = new CreateOperationUsecase(this);

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