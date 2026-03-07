import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { GetCashflowUsecaseDto } from '@usecase/getCashflow/getCashflow.usecase.dto';
import { GetCashflowUsecaseModel } from '@usecase/getCashflow/getCashflow.usecase.model';

export class GetCashflowUsecase {

    constructor(
        private inversify: Inversify
    ) { }

    async execute(dto: GetCashflowUsecaseDto): Promise<GetCashflowUsecaseModel> {
        try {
            const response: any = await this.inversify.graphqlService.send(
                {
                    operationName: 'cashflow',
                    variables: dto,
                    query: `query cashflow($account_ids: [Int!]!, $start_date: String!, $end_date: String!) {
            cashflow (
              dto: {
                account_ids: $account_ids
                start_date: $start_date
                end_date: $end_date
              }
            ) {
              account_id
              date
              reconciled_balance
              total_balance
            }
          }`
                }
            );

            if (response.errors) {
                throw new Error(response.errors[0].message);
            }

            return {
                message: CODES.SUCCESS,
                data: response.data.cashflow
            }
        } catch (e: any) {
            return {
                message: CODES.FAIL,
                error: e.message
            }
        }
    }
}
