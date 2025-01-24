// src\pages\Profile.tsx
import React from 'react';
import moment from 'moment';
import Add from '@mui/icons-material/Add';
import { Chip, Grid2, Link } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { client } from '@passwordless-id/webauthn';
import DeleteIcon from '@mui/icons-material/Delete';
import { Trans, useTranslation } from 'react-i18next';
import { Divider, IconButton, Paper, Typography } from '@mui/material';
import { RegisterOptions, RegistrationJSON } from '@passwordless-id/webauthn/dist/esm/types';

import '@presentation/common.scss';
import Bar from '@components/molecule/bar';
import { Input } from '@components/molecule/input';
import { CODES } from '@src/common/codes';
import { REGEX } from '@src/common/REGEX';
import inversify from '@src/common/inversify';
import { passkeyStore } from '@components/store/passkeyStore';
import { FlashStore, flashStore } from '@components/molecule/flash';
import { ContextStoreModel, contextStore } from '@components/store/contextStore';
import { PasskeyUsecaseModel } from '@usecases/model/passkey.usecase.model';
import CreatePasskeyUsecaseDto from '@usecases/createPasskey/createPasskey.usecase.dto';
import { GetPasskeyForUserUsecaseModel } from '@usecases/getPasskeyForUser/getPasskeyForUser.usecase.model';

export const Profile = () => {
  const { t } = useTranslation();
  const passkeyStored = passkeyStore();
  const flash: FlashStore = flashStore();
  const context: ContextStoreModel = contextStore();
  const resetPasskeyStore = passkeyStore((state: any) => state.reset);
  const [passkey_label, setPasskey_label] = React.useState({
    value: '',
    valid: false
  });
  const [qryPasskeys, setQryPasskeys] = React.useState({
    loading: false,
    data: null,
    error: null
  });
  const [passkeys, setPasskeys] = React.useState<any>(null);

  const addPasskey = async () => {
    try {
      const challenge = crypto.randomUUID();
      const formattedDate = moment().format('YYMMDDHHmmss');
      const passkey_display = `${context.code} (${passkey_label.value} - ${formattedDate})`;

      /**
       * Ask device passkey auth
       */
      const registerOptions: RegisterOptions = {
        user: passkey_display,
        challenge: challenge,
        userVerification: "required",
        discoverable: "preferred",
        timeout: 60000,
        attestation: true,
      }
      const registration: RegistrationJSON = await client.register(registerOptions);

      /**
       * Record to back passkey
       */
      const data: CreatePasskeyUsecaseDto = {
        label: passkey_label.value,
        challenge: challenge,
        hostname: location.hostname,
        registration: registration
      };
      inversify.loggerService.debug("Datas to record", data);
      const response = await inversify.createPasskeyUsecase.execute(data);
      if (!response.data) {
        throw new Error("Data empty");
      }

      /**
       * Record local storage passkey
       */
      passkeyStore.setState({
        display: passkey_display,
        passkey_id: response.data.id,
        user_code: context.code,
        challenge: challenge,
        credential_id: registration.id
      });

      setPasskeys(null);
    } catch (error) {
      inversify.loggerService.error("Error creating credential", error);
    }
  }


  const deletePasskey = async (dto: PasskeyUsecaseModel) => {
    await inversify.deletePasskeyUsecase.execute({
      passkey_id: dto.id
    });
    if ((dto.id === passkeyStored.passkey_id)) {
      flash.open(t('profile.passkey_delete', { display: passkeyStored.display }));
      resetPasskeyStore();
    }
    setPasskeys(null);
  }

  const activePasskey = async (dto: any) => {
    passkeyStore.setState({
      passkey_id: dto.passkey_id,
      user_code: dto.user_code,
      challenge: dto.challenge,
      credential_id: dto.credential_id
    });
    setPasskeys(null);
  }

  const defaultContentPasskeys = <>
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
        size={6}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Trans>profile.passkey.table.label</Trans>
      </Grid2>
      <Grid2
        size={6}
      >
      </Grid2>
    </Grid2>

    {passkeys?.map((passkey: PasskeyUsecaseModel) => {
      return (
        <Grid2
          key={passkey.id}
          container
          sx={{
            backgroundColor: '#3C4042',
            marginBottom: '1px',
            "&:hover": {
              backgroundColor: "#606368"
            }
          }}
        >
          <Grid2
            size={6}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            title={passkey.label}
          >
            <Typography noWrap>{passkey.label}</Typography>
          </Grid2>
          <Grid2
            size={6}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Delete  */}
            <IconButton
              title={t('profile.passkey.table.delete')}
              onClick={(e) => {
                e.preventDefault();
                deletePasskey(passkey);
              }}>
              <DeleteIcon />
            </IconButton>

            {/* Active  */}
            <IconButton
              title={t('profile.passkey.table.active')}
              disabled={(passkey?.id === passkeyStored.passkey_id)}
              onClick={(e) => {
                e.preventDefault();
                activePasskey({
                  passkey_id: passkey.id,
                  user_code: passkey.user_code,
                  challenge: passkey.challenge,
                  credential_id: passkey.credential_id
                });
              }}>
              <CheckIcon
                sx={{
                  color: passkey?.id === passkeyStored.passkey_id ? 'green' : 'grey'
                }}
              />
            </IconButton>
          </Grid2>
        </Grid2>
      )
    })}

  </>;

  let contentPasskeys = <div></div>;
  if (qryPasskeys.loading) {
    contentPasskeys = <div><Trans>common.loading</Trans></div>;
  } else if (qryPasskeys.error) {
    contentPasskeys = <div><Trans>ERRORS.{qryPasskeys.error}</Trans></div>;
  } else if (passkeys === null) {
    setPasskeys([]);
    setQryPasskeys(qry => ({
      ...qry,
      loading: true
    }));
    inversify.getPasskeyForUserUsecase.execute()
      .then((response: GetPasskeyForUserUsecaseModel) => {
        if (response.message === CODES.SUCCESS) {
          setPasskeys(response.data);
        } else {
          inversify.loggerService.debug(response.error);
          setQryPasskeys((qry: any) => ({
            ...qry,
            error: response.message
          }));
        }
      })
      .catch((error: any) => {
        setQryPasskeys(qry => ({
          ...qry,
          error: error.message
        }));
      })
      .finally(() => {
        setQryPasskeys(qry => ({
          ...qry,
          loading: false
        }));
      });
  } else {
    contentPasskeys = defaultContentPasskeys;
  }

  return (
    <div className="app">
      <Bar />
      <div className="parent_container">
        <div className="container">
          <div className='title'>
            <Trans>profile.title</Trans>
          </div>
          <div>
            <Grid2
              container
            >
              <Grid2
                size={12}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Trans>profile.code</Trans>{context.code}
              </Grid2>
              <Grid2
                size={6}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Trans>profile.name_first</Trans>{context.name_first}
              </Grid2>
              <Grid2
                size={6}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Trans>profile.name_last</Trans>{context.name_last}
              </Grid2>
            </Grid2>

            <Divider
              sx={{
                paddingBottom: 1
              }}
            >
              <Chip label={<Trans>profile.passkeys</Trans>} size="small" />
            </Divider>
            <Grid2
              size={12}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* Add passkey */}
              <Paper
                component="form"
                sx={{
                  p: '2px 4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Input
                  label={<Trans>profile.passkey_label</Trans>}
                  tooltip={<Trans>REGEX.PASSKEY_LABEL</Trans>}
                  regex={REGEX.PASSKEY_LABEL}
                  entity={passkey_label}
                  onChange={(entity: any) => {
                    setPasskey_label({
                      value: entity.value,
                      valid: entity.valid
                    });
                  }}
                  require
                  virgin
                />
                <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                <IconButton
                  color="primary"
                  sx={{ p: '10px' }}
                  title={t('profile.add_passkey')}
                  disabled={!passkey_label.valid}
                  onClick={(e) => {
                    e.preventDefault();
                    addPasskey()
                  }}
                >
                  <Add />
                </IconButton>
              </Paper>
            </Grid2>
            <Grid2
              size={12}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Link href="ms-settings:savedpasskeys"><Trans>profile.keys</Trans></Link>
            </Grid2>
            {contentPasskeys}
          </div>
          <div>
          </div>
        </div>
      </div>
    </div>
  )
};