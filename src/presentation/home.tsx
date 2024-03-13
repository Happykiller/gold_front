import * as React from 'react';
import { Link } from '@mui/material';
import { Trans } from 'react-i18next';
import { createSearchParams, useNavigate } from 'react-router-dom';

import '@presentation/home.scss';
import '@presentation/common.scss';
import Bar from '@src/presentation/molecule/bar';
import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { Footer } from '@presentation/footer';
import { FlashStore, flashStore} from '@src/presentation/molecule/flash';
import { AccountUsecaseModel } from '@usecase/model/account.usecase.model';
import { GetAccountsUsecaseModel } from '@usecase/getAccounts/getAccounts.usecase.model';

const formatAccount = (accounts:AccountUsecaseModel[]):any => {
  let accountsFormated = [];

  for(let account of accounts) {
    if (account.parent_account_id === null) {

      const childs = searchChild({
        parent: account,
        accounts: accounts
      });

      const accountFormated:any = {
        ... account,
        balance_reconcilied: childs.parent_balance_reconcilied,
        balance_not_reconcilied: childs.parent_balance_not_reconcilied,
        child: childs.accountsFormated
      }

      accountsFormated.push(accountFormated);
    }
  }

  return accountsFormated;
}

const searchChild = (dto: {
  parent: AccountUsecaseModel,
  accounts: AccountUsecaseModel[]
}):any => {
  let accountsFormated = [];

  for(let account of dto.accounts) {
    if (account.parent_account_id === dto.parent.id) {

      const childs = searchChild({
        parent: account,
        accounts: dto.accounts
      });

      dto.parent.balance_reconcilied += childs.parent_balance_reconcilied;
      dto.parent.balance_not_reconcilied += childs.parent_balance_not_reconcilied;

      const accountFormated:any = {
        ... account,
        balance_reconcilied: childs.parent_balance_reconcilied,
        balance_not_reconcilied: childs.parent_balance_not_reconcilied,
        child: childs.accountsFormated
      }

      accountsFormated.push(accountFormated);
    }
  }

  return {
    parent_balance_reconcilied: dto.parent.balance_reconcilied,
    parent_balance_not_reconcilied: dto.parent.balance_not_reconcilied,
    accountsFormated
  }
}

export const Home = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = React.useState<AccountUsecaseModel[]>(null);
  let accountsFormated = [];
  const [qry, setQry] = React.useState({
    loading: true,
    data: null,
    error: null
  });

  const Account = (props: { account: any }) => {
    const { account } = props;
  
    let child = <div></div>;
  
    if (account.child.length > 0) {
      child =
      <ul className='account-ul'>
        {account.child?.map((account:any) => (
          <Account key={account.id} account={account} />
        ))}
      </ul>
    }

    let colorReco = 'green';
    if (account.balance_reconcilied < 0) {
      colorReco = 'red';
    }
    let colorNoReco = 'lightGreen';
    if (account.balance_not_reconcilied < 0) {
      colorNoReco = 'lightRed';
    }
  
    return (
      <li>
        <Link 
          onClick={(e) => {
            e.preventDefault();
            navigate({
              pathname: '/operations',
              search: createSearchParams({
                account_id: account.id
              }).toString()
            });
          }}
        >{account.id} | {account.label}</Link> | <span className={colorReco}>{Math.round(account.balance_reconcilied * 100) / 100} €</span> | <span className={colorNoReco}>{Math.round(account.balance_not_reconcilied * 100) / 100} €</span>
        {child}
      </li>
    )
  }

  if(accounts === null) {
    setAccounts([]);
    setQry(qry => ({
      ...qry,
      loading: true
    }));
    inversify.getAccountsUsecase.execute()
      .then((response:GetAccountsUsecaseModel) => {
        if(response.message === CODES.SUCCESS) {
          setAccounts(response.data);
        } else {
          inversify.loggerService.debug(response.error);
          setQry(qry => ({
            ...qry,
            error: response.message
          }));
        }
      })
      .catch((error:any) => {
        setQry(qry => ({
          ...qry,
          error: error.message
        }));
      })
      .finally(() => {
        setQry(qry => ({
          ...qry,
          loading: false
        }));
      });
  } else {
    accountsFormated = formatAccount(accounts);
  }

  return (
    <div className="app">
      <Bar/>
      <div className="parent_container">
        <div className="container">
          <div className='title'>
            <Trans>home.title</Trans>
          </div>
          <div>
            {accountsFormated?.map((accountFormated:any) => (
              <Account key={accountFormated.id} account={accountFormated} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
};