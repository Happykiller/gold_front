import * as React from 'react';
import * as dayjs from 'dayjs';
import CheckIcon from '@mui/icons-material/Check';
import { useSearchParams } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Trans, useTranslation } from 'react-i18next';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { Grid, IconButton, Typography } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { createSearchParams, useNavigate } from 'react-router-dom';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import '@presentation/common.scss';
import Bar from '@src/presentation/molecule/bar';
import '@presentation/operations.scss';
import { CODES } from '@src/common/codes';
import { Footer } from '@presentation/footer';
import inversify from '@src/common/inversify';
import { FlashStore, flashStore} from '@src/presentation/molecule/flash';
import { GetAccountUsecaseModel } from '@usecase/getAccount/getAccount.usecase.model';
import { GetOperationsUsecaseModel } from '@usecase/getOperations/getOperations.usecase.model';

export const Operations = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const flash:FlashStore = flashStore();
  const [searchParams] = useSearchParams();
  const [page, setPage] = React.useState<any>(0);
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
    flash.open(t('operations.recoSucced'));
    setOperations(null);
    setAccount(null);
  }

  const deleteOperation = async (dto: {
    operation_id: string
  }) => {
    await inversify.deleteOperationUsecase.execute({
      operation_id: parseInt(dto.operation_id)
    });
    flash.open(t('operations.deleteSucced'));
    setOperations(null);
    setAccount(null);
  }

  const Operation = (props: { operation: any }) => {
    const { operation } = props;

    // Amount
    let color = "gray";
    let opera = "+";
    let dest = <div></div>;
    if (operation.type_id == 1) {
      // Crédit Vert
      if (operation.status_id == 1) {
        color = "lightGreen";
      } else {
        color = "green";
      }
    } else if (operation.type_id == 2) {
      // Débit rouge
      if (operation.status_id == 1) {
        color = "lightRed";
      } else {
        color = "red";
      }
      opera = "-";
    } else if (operation.type_id == 3 && operation.account_id_dest == searchParams.get('account_id')) {
      // Vir crédit
      color = "blue";
      dest = <div><ArrowLeftIcon/>{operation.account?.label}</div>;
    } else {
      // Vir débit
      color = "violet";
      opera = "-";
      dest = <div><ArrowRightIcon/>{operation.account_dest?.label}</div>;
    }
  
    return (
      <tr>
        <td>{operation.id}</td>
        <td>{dayjs(parseInt(operation.date)).format('DD/MM/YYYY')}</td>
        <td className={color}>{opera+operation.amount} €</td>
        <td>{dest}</td>
        <td><Trans>{operation.third?.label}</Trans></td>
        <td><Trans>{operation.category?.label}</Trans></td>
        <td className='desc' title={operation.description}><Typography noWrap>{operation.description}</Typography></td>
        <td>
          <IconButton 
            size="small"
            onClick={(e) => {
              e.preventDefault();
              deleteOperation({
                operation_id: operation.id
              });
            }}><DeleteIcon />
          </IconButton>

          <IconButton 
            size="small"
            onClick={(e) => {
              e.preventDefault();
              navigate({
                pathname: '/editOperation',
                search: createSearchParams({
                  account_id: searchParams.get('account_id'),
                  operation_id: operation.id
                }).toString()
              });
            }}><EditNoteIcon />
          </IconButton>

          {(operation.status_id == 1)?<IconButton 
          size="small"
          onClick={(e) => {
            e.preventDefault();
            reco({
              operation_id: operation.id
            });
          }}><CheckIcon /></IconButton>:''}
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
      account_id: parseInt(searchParams.get('account_id')),
      page
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
    let colorReco = 'green';
    if (account.balance_reconcilied < 0) {
      colorReco = 'red';
    }
    let colorNoReco = 'lightGreen';
    if (account.balance_not_reconcilied < 0) {
      colorNoReco = 'lightRed';
    }

    contentAccount = <Grid
      container
      display="flex"
      justifyContent="center"
      alignItems="center"
      textAlign="center"
    >
      <Grid
        xs={12}
        item
      >
        <h2>{account.label}<IconButton 
          size="small"
          onClick={(e) => {
            e.preventDefault();
            setOperations(null);
            setAccount(null);
          }}><RefreshIcon /></IconButton></h2>
      </Grid>
      <Grid
        xs={12}
        item
      >
        Balance reconcilé : <span className={colorReco}>{account.balance_reconcilied} €</span>
      </Grid>
      <Grid
        xs={2}
        item
      >
        {(page!==0)?page:''}<IconButton 
          size="small"
          disabled={(page === 0)}
          onClick={(e) => {
            e.preventDefault();
            setPage(page-1);
            setOperations(null);
          }}><ArrowBackIosIcon /></IconButton>
      </Grid>
      <Grid
        xs={6}
        item
      >
        Balance non-reconcilé : <span className={colorNoReco}>{account.balance_not_reconcilied} €</span>
      </Grid>
      <Grid
        xs={2}
        item
      >
        <IconButton 
          size="small"
          onClick={(e) => {
            e.preventDefault();
            setPage(page+1);
            setOperations(null);
          }}><ArrowForwardIosIcon /></IconButton>{page+2}
      </Grid>
    </Grid>;
  } 

  let contentOperations = <div></div>;
  if(qryOperations.loading) {
    contentOperations = <div><Trans>common.loading</Trans></div>;
  } if(qryOperations.error) {
    contentOperations = <div><Trans>operations.{qryOperations.error}</Trans></div>
  } else if (operations) {
    contentOperations = <table className='table'>
      <thead>
        <tr>
          <th>Id</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Account</th>
          <th>Third</th>
          <th>Category</th>
          <th>Description</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {operations?.map((operation:any) => (
          <Operation key={operation.id} operation={operation} />
        ))}
      </tbody>
    </table>;
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