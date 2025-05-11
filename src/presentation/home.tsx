import * as React from 'react';
import { Link } from '@mui/material';
import { createSearchParams, useNavigate } from 'react-router-dom';

import '@presentation/home.scss';
import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { AccountUsecaseModel } from '@usecase/model/account.usecase.model';
import { GetAccountsUsecaseModel } from '@usecase/getAccounts/getAccounts.usecase.model';

type Account = {
  id: number;
  type_id: number;
  parent_account_id: number | null;
  label: string;
  description: string | null;
  balance_reconcilied: number;
  balance_not_reconcilied: number;
  creator_id: number;
  creation_date: string;
  modificator_id: number | null;
  modification_date: string;
  children?: Account[];
  balance_reconcilied_aggregate?: number;
  balance_not_reconcilied_aggregate?: number;
};

const formatAccount = (accounts:AccountUsecaseModel[]):any => {
  // Étape 1 : Organiser les données en arborescence
  const buildTree = (accounts: Account[]): Account[] => {
    const map: { [key: number]: Account } = {};
    const roots: Account[] = [];

    accounts.forEach(account => {
        map[account.id] = { ...account, children: [] };
    });

    accounts.forEach(account => {
        if (account.parent_account_id) {
            map[account.parent_account_id]?.children?.push(map[account.id]);
        } else {
            roots.push(map[account.id]);
        }
    });

    return roots;
  };

  // Étape 2 : Calculer les sommes agrégées pour chaque nœud
  const calculateAggregates = (node: Account): void => {
    if (!node.children || node.children.length === 0) {
        // Si pas d'enfants, les agrégats sont égaux aux soldes actuels
        node.balance_reconcilied_aggregate = node.balance_reconcilied;
        node.balance_not_reconcilied_aggregate = node.balance_not_reconcilied;
    } else {
        // Calculer les agrégats des enfants récursivement
        node.balance_reconcilied_aggregate = node.balance_reconcilied;
        node.balance_not_reconcilied_aggregate = node.balance_not_reconcilied;

        node.children.forEach(child => {
            calculateAggregates(child);
            node.balance_reconcilied_aggregate! += child.balance_reconcilied_aggregate!;
            node.balance_not_reconcilied_aggregate! += child.balance_not_reconcilied_aggregate!;
        });
    }
  };

  // Étape 3 : Construire et calculer
  const tree = buildTree(accounts);
  tree.forEach(root => calculateAggregates(root));

  return tree;
}

export const Home = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = React.useState<AccountUsecaseModel[]|null>(null);
  let accountsFormated = [];
  const [qry, setQry] = React.useState<{
    loading: boolean|null,
    data: any,
    error: string|Error|null
  }>({
    loading: null,
    data: null,
    error: null
  });

  const Account = (props: { account: any }) => {
    const { account } = props;
  
    let children = <div></div>;
  
    if (account.children.length > 0) {
      children =
      <ul className='account-ul'>
        {account.children?.map((account:any) => (
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
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.preventDefault();
            navigate({
              pathname: '/operations',
              search: createSearchParams({
                account_id: account.id
              }).toString()
            });
          }}
        >{account.label}</Link> 
          {(account.children.length === 0 && <>{(account.type_id === 2)?'| Modèle':''} | <span className={colorReco}>{Math.round(account.balance_reconcilied * 100) / 100} €</span> | <span className={colorNoReco}>{Math.round(account.balance_not_reconcilied * 100) / 100} €</span></>)}
          {(account.children.length > 0 && <>{(account.type_id === 2)?'| Modèle':''} | <span className={colorReco}>{Math.round(account.balance_reconcilied_aggregate * 100) / 100} €</span> | <span className={colorNoReco}>{Math.round(account.balance_not_reconcilied_aggregate * 100) / 100} €</span></>)}
        {children}
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
        if(response.message === CODES.SUCCESS && response.data) {
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
      <div className="parent_container">
        <div className="container">
          <div>
            {accountsFormated?.map((accountFormated:any) => (
              <Account key={accountFormated.id} account={accountFormated} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
};