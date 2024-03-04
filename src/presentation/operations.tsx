import * as React from 'react';
import * as dayjs from 'dayjs';
import { Trans } from 'react-i18next';
import { Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

import '@presentation/common.scss';
import Bar from '@presentation/bar';
import '@presentation/operations.scss';
import { CODES } from '@src/common/codes';
import { Footer } from '@presentation/footer';
import inversify from '@src/common/inversify';
import { GetAccountUsecaseModel } from '@usecase/getAccount/getAccount.usecase.model';
import { GetOperationsUsecaseModel } from '@usecase/getOperations/getOperations.usecase.model';

export const Operations = () => {
  const [searchParams] = useSearchParams();
  const [account, setAccount] = React.useState<any>(null);
  const [operations, setOperations] = React.useState<any[]>(null);
  const [qryAccount, setQryAccount] = React.useState({
    loading: true,
    data: null,
    error: null
  });
  const [qryOperations, setQryOperations] = React.useState({
    loading: true,
    data: null,
    error: null
  });

  const reco = async (dto: {
    operation_id: string
  }) => {
    await inversify.setRecoUsecase.execute({
      operation_id: parseInt(dto.operation_id)
    });
    setOperations(null);
    setAccount(null);
  }

  const Operation = (props: { operation: any }) => {
    const { operation } = props;

    // Amount
    var color = "color1";
    var opera = "+";
    if (operation.type_id == 1)
    {
        // Crédit Bleu
        if (operation.status_id == 1)
        {
            color = "color2";
        }
        else
        {
            color = "color3";
        }
    }
    else if (operation.type_id == 2)
    {
        // Débit rouge
        if (operation.status_id == 1)
        {
            color = "color4";
        }
        else
        {
            color = "color5";
        }
        opera = "-";
    }
    else if (operation.type_id == 3 && operation.account_id_dest == searchParams.get('account_id'))
    {
        // Vir crédit
        color = "color6";
    }
    else
    {
        // Vir débit
        color = "color7";
        opera = "-";
    }

    // Third
    var third = operation.third?.label;
    if (operation.third_id == 1)
    {
        third = "Autre créditeur";
    }
    else if (operation.third_id == 2)
    {
        third = "Autre débiteur";
    }

    // Category
    var category = operation.category?.label;
    if (operation.category_id == 1)
    {
        category = "Autre";
    }
  
    return (
      <tr>
        <td>{operation.id}</td>
        <td>{dayjs(operation.date).format('DD/MM/YYYY')}</td>
        <td className={color}>{opera+operation.amount}€</td>
        <td>{operation.account?.label}</td>
        <td>{operation.account_dest?.label}</td>
        <td>{third}</td>
        <td>{category}</td>
        <td className='desc'><Typography noWrap>{operation.description}</Typography></td>
        <td>{(operation.status_id == 1)?<button onClick={(e) => {
          e.preventDefault();
          reco({
            operation_id: operation.id
          });
        }}>Réconcilier</button>:''}
        </td>
      </tr>
    )
  }

  if(operations === null) {
    setOperations([]);
    setQryOperations(qry => ({
      ...qry,
      loading: true
    }));
    inversify.getOperationsUsecase.execute({
      account_id: parseInt(searchParams.get('account_id'))
    })
      .then((response:GetOperationsUsecaseModel) => {
        if(response.message === CODES.SUCCESS) {
          setOperations(response.data);
        } else {
          inversify.loggerService.debug(response.error);
          setQryOperations(qry => ({
            ...qry,
            error: response.message
          }));
        }
      })
      .catch((error:any) => {
        setQryOperations(qry => ({
          ...qry,
          error: error.message
        }));
      })
      .finally(() => {
        setQryOperations(qry => ({
          ...qry,
          loading: false
        }));
      });
  }

  if(account === null) {
    setAccount({});
    setQryAccount(qry => ({
      ...qry,
      loading: true
    }));
    inversify.getAccountUsecase.execute({
      account_id: parseInt(searchParams.get('account_id'))
    })
      .then((response:GetAccountUsecaseModel) => {
        if(response.message === CODES.SUCCESS) {
          setAccount(response.data);
        } else {
          inversify.loggerService.debug(response.error);
          setQryAccount(qry => ({
            ...qry,
            error: response.message
          }));
        }
      })
      .catch((error:any) => {
        setQryAccount(qry => ({
          ...qry,
          error: error.message
        }));
      })
      .finally(() => {
        setQryAccount(qry => ({
          ...qry,
          loading: false
        }));
      });
  }

  let contentAccount = <div></div>;
  if(qryAccount.loading) {
    contentAccount = <div><Trans>common.loading</Trans></div>;
  } if(qryAccount.error) {
    contentAccount = <div><Trans>operations.{qryAccount.error}</Trans></div>
  } else if (account) {
    contentAccount = <div>
      <h2>{account.label}</h2>
      <h3>Balance reconcilé : {account.balance_reconcilied}€</h3>
      <h3>Balance non-reconcilé : {account.balance_not_reconcilied}€</h3>  
    </div>;
  } 

  let contentOperations = <div></div>;
  if(qryOperations.loading) {
    contentOperations = <div><Trans>common.loading</Trans></div>;
  } if(qryOperations.error) {
    contentOperations = <div><Trans>operations.{qryOperations.error}</Trans></div>
  } else if (operations) {
    contentOperations = <div>
      <table>
        <thead>
            <tr>
                <th>Id</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Account</th>
                <th>Dest</th>
                <th>Third</th>
                <th>Category</th>
                <th>Description</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
          {operations?.map((operation:any) => (
            <Operation key={operation.id} operation={operation} />
          ))}
        </tbody>
      </table>
    </div>;
  } 

  return (
    <div className="app">
      <Bar/>
      <div className="parent_container">
        <div className="container">
          <div>
            {contentAccount}
          </div>
          <div>
            {contentOperations}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}