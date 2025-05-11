// src\presentation\operations.tsx
import dayjs from 'dayjs';
import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { useSearchParams } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Trans, useTranslation } from 'react-i18next';
import MoveDownIcon from '@mui/icons-material/MoveDown';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { Grid2, IconButton, Typography } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { createSearchParams, useNavigate } from 'react-router-dom';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import '@presentation/common.scss';
import '@presentation/operations.scss';
import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { useFlashStore } from '@happykiller/sunny-ui';
import { GetAccountUsecaseModel } from '@usecase/getAccount/getAccount.usecase.model';
import { GetOperationsUsecaseModel } from '@usecase/getOperations/getOperations.usecase.model';

export const Operations = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const flash = useFlashStore();
  const [searchParams] = useSearchParams();
  const [page, setPage] = React.useState<any>(0);
  const [account, setAccount] = React.useState<any>(null);
  const [operations, setOperations] = React.useState<any[] | null>(null);
  const [qryAccount, setQryAccount] = React.useState<{
    loading: boolean | null,
    data: any,
    error: string | null
  }>({
    loading: null,
    data: null,
    error: null
  });
  const [qryOperations, setQryOperations] = React.useState<{
    loading: boolean | null,
    data: any,
    error: string | null
  }>({
    loading: null,
    data: null,
    error: null
  });
  const COLUMN_LAYOUT = {
    id: { xs: 0, sm: 0, md: 1 },
    date: { xs: 3, sm: 2, md: 1 },
    amount: { xs: 3, sm: 2, md: 1 },
    dest: { xs: 0, sm: 0, md: 1 },
    third: { xs: 0, sm: 0, md: 1 },
    category: { xs: 3, sm: 2, md: 1 },
    desc: { xs: 0, sm: 4, md: 5 },
    actions: { xs: 3, sm: 2, md: 1 },
  };

  type SizeDefinition = {
    xs: number;
    sm: number;
    md: number;
  };

  const getDisplayFromSize = (sizes: SizeDefinition): Record<'xs' | 'sm' | 'md', string> => {
    return {
      xs: sizes.xs === 0 ? 'none' : 'flex',
      sm: sizes.sm === 0 ? 'none' : 'flex',
      md: sizes.md === 0 ? 'none' : 'flex',
    };
  };

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
    let dest = <span></span>;
    let dateStr = dayjs(parseInt(operation.date)).format('DD/MM/YYYY');
    let shortDateStr = dayjs(parseInt(operation.date)).format('DD/MM');
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
      dest = <span><ArrowLeftIcon />{operation.account?.label}</span>;
    } else {
      // Vir débit
      color = "violet";
      opera = "-";
      dest = <span><ArrowRightIcon />{operation.account_dest?.label}</span>;
    }

    const goEdit = () => {
      navigate({
        pathname: '/operation_edit',
        search: createSearchParams({
          account_id: searchParams.get('account_id') ?? '0',
          operation_id: operation.id
        }).toString()
      });
    };

    return (
      <Grid2
        key={operation.id}
        container
        onClick={(e) => {
          goEdit();
        }}
        sx={{
          backgroundColor: '#3C4042',
          marginBottom: '1px',
          "&:hover": {
            backgroundColor: "#606368"
          }
        }}
      >
        <Grid2
          size={COLUMN_LAYOUT.id}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.id),
          }}
          justifyContent="center"
          alignItems="center"
          title={operation.id}
        >
          <Typography noWrap>{operation.id}</Typography>
        </Grid2>
        <Grid2
          size={COLUMN_LAYOUT.date}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.date),
          }}
          justifyContent="center"
          alignItems="center"
          title={dateStr}
        >
          <Typography noWrap
            sx={{
              display: { xs: 'none', sm: 'block' },
            }}
          >{dateStr}</Typography>
          <Typography noWrap
            sx={{
              display: { xs: 'block', sm: 'none' },
            }}
          >{shortDateStr}</Typography>
        </Grid2>
        <Grid2
          size={COLUMN_LAYOUT.amount}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.amount),
          }}
          justifyContent="center"
          alignItems="center"
          title={opera + operation.amount + '€'}
        >
          <Typography noWrap><span className={color}>{opera + operation.amount} €</span></Typography>
        </Grid2>
        <Grid2
          size={COLUMN_LAYOUT.dest}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.dest),
          }}
          justifyContent="center"
          alignItems="center"
          title={operation.account_dest}
        >
          <Typography noWrap>{dest}</Typography>
        </Grid2>
        <Grid2
          size={COLUMN_LAYOUT.third}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.third),
          }}
          justifyContent="center"
          alignItems="center"
          title={operation.third?.label}
        >
          <Typography noWrap><Trans>{operation.third?.label}</Trans></Typography>
        </Grid2>
        <Grid2
          size={COLUMN_LAYOUT.category}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.category),
          }}
          justifyContent="center"
          alignItems="center"
          title={operation.category?.label}
        >
          <Typography noWrap><Trans>{operation.category?.label}</Trans></Typography>
        </Grid2>
        <Grid2
          size={COLUMN_LAYOUT.desc}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.desc),
          }}
          justifyContent="center"
          alignItems="center"
          title={operation.description}
        >
          <Typography noWrap>{operation.description}</Typography>
        </Grid2>
        <Grid2
          size={COLUMN_LAYOUT.actions}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.actions),
          }}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              deleteOperation({
                operation_id: operation.id
              });
            }}><DeleteIcon />
          </IconButton>

          <IconButton
            size="small"
            sx={{
              display: { xs: 'none', sm: 'block' },
            }}
            onClick={(e) => {
              e.stopPropagation();
              goEdit();
            }}><EditNoteIcon />
          </IconButton>

          {(operation.status_id == 1) ? <IconButton
            size="small"
            sx={{
              display: { xs: 'none', sm: 'block' },
            }}
            onClick={(e) => {
              e.stopPropagation();
              reco({
                operation_id: operation.id
              });
            }}><CheckIcon /></IconButton> : ''}
        </Grid2>
      </Grid2>
    )
  }

  if (operations === null) {
    setOperations([]);
    setQryOperations(qry => ({
      ...qry,
      loading: true
    }));
    inversify.getOperationsUsecase.execute({
      account_id: parseInt(searchParams.get('account_id') ?? '0'),
      page
    })
      .then((response: GetOperationsUsecaseModel) => {
        if (response.message === CODES.SUCCESS && response.data) {
          setOperations(response.data);
        } else {
          inversify.loggerService.debug(response.error);
          setQryOperations(qry => ({
            ...qry,
            error: response.message
          }));
        }
      })
      .catch((error: any) => {
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

  if (account === null) {
    setAccount({});
    setQryAccount(qry => ({
      ...qry,
      loading: true
    }));
    inversify.getAccountUsecase.execute({
      account_id: parseInt(searchParams.get('account_id') ?? '0')
    })
      .then((response: GetAccountUsecaseModel) => {
        if (response.message === CODES.SUCCESS) {
          setAccount(response.data);
        } else {
          inversify.loggerService.debug(response.error);
          setQryAccount(qry => ({
            ...qry,
            error: response.message
          }));
        }
      })
      .catch((error: any) => {
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
  if (qryAccount.loading) {
    contentAccount = <div><Trans>common.loading</Trans></div>;
  } if (qryAccount.error) {
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

    contentAccount = <Grid2
      container
      display="flex"
      justifyContent="center"
      alignItems="center"
      textAlign="center"
    >
      <Grid2
        size={12}
      >
        <h2>
          {account.label}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOperations(null);
              setAccount(null);
            }}><RefreshIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate({
                pathname: '/operation_new',
                search: createSearchParams({
                  account_id: searchParams.get('account_id') ?? '0'
                }).toString()
              });
            }}><AddIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate({
                pathname: '/clone',
                search: createSearchParams({
                  account_id: searchParams.get('account_id') ?? '0'
                }).toString()
              });
            }}><MoveDownIcon />
          </IconButton>
        </h2>
      </Grid2>
      <Grid2
        size={12}
      >
        Balance reconcilé : <span className={colorReco}>{account.balance_reconcilied} €</span>
      </Grid2>
      <Grid2
        size={2}
      >
        {(page !== 0) ? page : ''}<IconButton
          size="small"
          disabled={(page === 0)}
          onClick={(e) => {
            e.stopPropagation();
            setPage(page - 1);
            setOperations(null);
          }}><ArrowBackIosIcon /></IconButton>
      </Grid2>
      <Grid2
        size={6}
      >
        Balance non-reconcilé : <span className={colorNoReco}>{account.balance_not_reconcilied} €</span>
      </Grid2>
      <Grid2
        size={2}
      >
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setPage(page + 1);
            setOperations(null);
          }}><ArrowForwardIosIcon /></IconButton>{page + 2}
      </Grid2>
    </Grid2>;
  }

  let contentOperations = <div></div>;
  if (qryOperations.loading) {
    contentOperations = <div><Trans>common.loading</Trans></div>;
  } if (qryOperations.error) {
    contentOperations = <div><Trans>operations.{qryOperations.error}</Trans></div>
  } else if (operations) {
    contentOperations = <>
      <Grid2
        container
        sx={{
          color: "#000000",
          fontWeight: "bold",
          backgroundColor: "#EA80FC",
          borderRadius: "5px 5px 0px 0px",
          fontSize: "0.875rem"
        }}
      >
        <Grid2
          size={COLUMN_LAYOUT.id}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.id),
          }}
          justifyContent="center"
          alignItems="center"
        >
          <Trans>operation.id</Trans>
        </Grid2>
        <Grid2
          size={COLUMN_LAYOUT.date}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.date),
          }}
          justifyContent="center"
          alignItems="center"
        >
          <Trans>operation.date</Trans>
        </Grid2>
        <Grid2
          size={COLUMN_LAYOUT.amount}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.amount),
          }}
          justifyContent="center"
          alignItems="center"
        >
          <Trans>operation.amount</Trans>
        </Grid2>
        <Grid2
          size={COLUMN_LAYOUT.dest}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.dest),
          }}
          justifyContent="center"
          alignItems="center"
        >
          <Trans>operation.account_dest</Trans>
        </Grid2>
        <Grid2
          size={COLUMN_LAYOUT.third}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.third),
          }}
          justifyContent="center"
          alignItems="center"
        >
          <Trans>operation.third</Trans>
        </Grid2>
        <Grid2
          size={COLUMN_LAYOUT.category}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.third),
          }}
          justifyContent="center"
          alignItems="center"
        >
          <Trans>operation.category</Trans>
        </Grid2>
        <Grid2
          size={COLUMN_LAYOUT.desc}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.desc),
          }}
          justifyContent="center"
          alignItems="center"
        >
          <Trans>operation.description</Trans>
        </Grid2>
        <Grid2
          size={COLUMN_LAYOUT.actions}
          sx={{
            display: getDisplayFromSize(COLUMN_LAYOUT.actions),
          }}
          justifyContent="center"
          alignItems="center"
        >
          <Trans>operations.actions</Trans>
        </Grid2>
      </Grid2>

      {
        operations?.map((operation: any) => (
          <Operation key={operation.id} operation={operation} />
        ))
      }

    </>;
  }

  return (
    <>
      {contentAccount}
      {contentOperations}
    </>
  )
}