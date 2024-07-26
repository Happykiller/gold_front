import * as React from 'react';
import Add from '@mui/icons-material/Add';
import { Chip, Grid, Link } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { client } from '@passwordless-id/webauthn';
import DeleteIcon from '@mui/icons-material/Delete';
import { Trans, useTranslation } from 'react-i18next';
import { Divider, IconButton, Paper, Typography } from '@mui/material';
import { RegistrationEncoded } from '@passwordless-id/webauthn/dist/esm/types';

import '@presentation/common.scss';
import { REGEX } from '@src/common/REGEX';
import { CODES } from '@src/common/codes';
import Bar from '@presentation/molecule/bar';
import inversify from '@src/common/inversify';
import { Input } from '@presentation/molecule/input';
import { Footer } from '@presentation/molecule/footer';
import { passkeyStore } from '@presentation/store/passkeyStore';
import { ContextStoreModel, contextStore } from '@presentation/store/contextStore';
import { PasskeyUsecaseModel } from '@src/usecase/model/passkey.usecase.model';
import { GetPasskeyForUserUsecaseModel } from '@src/usecase/getPasskeyForUser/getPasskeyForUser.usecase.model';

export const Profile = () => {
  const { t } = useTranslation();
  const context:ContextStoreModel = contextStore();
  const passkeyStored = passkeyStore();
  const [passkey_label, setPasskey_label] = React.useState({
    value: '',
    valid: false
  });
  const [qry, setQry] = React.useState({
    loading: false,
    data: null,
    error: null
  });
  const [qryPasskeys, setQryPasskeys] = React.useState({
    loading: false,
    data: null,
    error: null
  });
  const [passkeys, setPasskeys] = React.useState(null);

  const addPasskey = async () => {
    try {
      const challenge = crypto.randomUUID();
      const registration:RegistrationEncoded = await client.register(context.code, challenge, {
        "authenticatorType": "auto",
        "userVerification": "required",
        "discoverable": "preferred",
        "timeout": 60000,
        "attestation": true,
        "debug": false
      });

      const data = {
        label: passkey_label.value,
        challenge: challenge,
        hostname: location.hostname,
        registration: registration
      };
      inversify.loggerService.debug("Datas to record", data);
      const response = await inversify.createPasskeyUsecase.execute(data);
      passkeyStore.setState({ 
        passkey_id: response.data.id,
        user_code: context.code,
        challenge: challenge,
        credential_id: registration.credential.id
      });
      setPasskeys(null);
    } catch (error) {
      inversify.loggerService.error("Error creating credential", error);
    }
  }

  const deletePasskey = async (dto: any) => {
    await inversify.deletePasskeyUsecase.execute(dto);
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

  const defaultContentPasskeys = <Grid
    container
    display={passkeys?.length > 0?'flex':'none'}
  >
    <Grid
      container
      sx={{
        color: "#000000",
        fontWeight: "bold",
        backgroundColor: "#EA80FC",
        borderRadius: "5px 5px 0px 0px",
        fontSize: "0.875rem"
      }}
    >
      <Grid 
        xs={6}
        item
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Trans>profile.passkey.table.label</Trans>
      </Grid>
      <Grid
        item
        xs={6}
      >
      </Grid>
    </Grid>
    
    {passkeys?.map((passkey:PasskeyUsecaseModel) => {
      return (
      <Grid
        key={passkey.id}
        container
        sx={{
          backgroundColor: '#3C4042',
          marginBottom:'1px',
          "&:hover": {
            backgroundColor: "#606368"
          }
        }}
      >
        <Grid 
          xs={6}
          item
          display="flex"
          justifyContent="center"
          alignItems="center"
          title={passkey.label}
        >
          <Typography noWrap>{passkey.label}</Typography>
        </Grid>
        <Grid
          xs={6}
          item
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          {/* Delete  */}
          <IconButton 
            title={t('profile.passkey.table.delete')}
            onClick={(e) => {
              e.preventDefault();
              deletePasskey({
                passkey_id: passkey.id
              });
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
                color: passkey?.id === passkeyStored.passkey_id?'green':'grey'
              }}
            />
          </IconButton>
        </Grid>
      </Grid>
    )})}

  </Grid>;

  let contentPasskeys = <div></div>;
  if(qryPasskeys.loading) {
    contentPasskeys = <div><Trans>common.loading</Trans></div>;
  } else if(qryPasskeys.error) {
    contentPasskeys = <div><Trans>profiles.{qryPasskeys.error}</Trans></div>;
  } else if(passkeys === null) {
    setPasskeys([]);
    setQryPasskeys(qry => ({
      ...qry,
      loading: true
    }));
    inversify.getPasskeyForUserUsecase.execute()
      .then((response:GetPasskeyForUserUsecaseModel) => {
        if(response.message === CODES.SUCCESS) {
          setPasskeys(response.data);
        } else {
          inversify.loggerService.debug(response.error);
          setQryPasskeys(qry => ({
            ...qry,
            error: response.message
          }));
        }
      })
      .catch((error:any) => {
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

  let content = <div></div>;
  let errorMessage = <div></div>;

  if (qry.error) {
    errorMessage = <div><Trans>profile.{qry.error}</Trans></div>
  }

  return (
    <div className="app">
      <Bar/>
      <div className="parent_container">
        <div className="container">
          <div className='title'>
            <Trans>profile.title</Trans>
          </div>
          <div>
            <Grid
              container
            >
              <Grid 
                xs={12}
                item
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <Trans>profile.code</Trans>{context.code}
              </Grid>
              <Grid 
                xs={6}
                item
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <Trans>profile.name_first</Trans>{context.name_first}
              </Grid>
              <Grid 
                xs={6}
                item
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <Trans>profile.name_last</Trans>{context.name_last}
              </Grid>
            </Grid>
            <Divider>
              <Chip label={<Trans>profile.password</Trans>} size="small" />
            </Divider>
            {content}
            <Divider
              sx={{
                paddingBottom: 1
              }}
            >
              <Chip label={<Trans>profile.passkeys</Trans>} size="small" />
            </Divider>
            <Grid
              item
              xs={12}
              display="flex"
              justifyContent="center"
              alignItems="center"
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
                  onChange={(entity:any) => { 
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
                  title={t('bank.joinTitle')}
                  disabled={!passkey_label.valid}
                  onClick={(e) => {
                    e.preventDefault();
                    addPasskey()
                  }}
                >
                  <Add />
                </IconButton>
              </Paper>
            </Grid>
            <Grid
              item
              xs={12}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <Link href="ms-settings:savedpasskeys"><Trans>profile.keys</Trans></Link>
            </Grid>
            <Grid
              item
              xs={12}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              {errorMessage}
            </Grid>
          </div>
          <div>
            {contentPasskeys}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
};