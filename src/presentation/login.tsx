import * as React from 'react';
import { Trans } from 'react-i18next';
import { Done } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Box, Button, InputAdornment, TextField } from '@mui/material';

import '@presentation/login.scss';
import { CODES } from '@src/common/codes';
import { Footer } from '@presentation/footer';
import inversify from '@src/common/inversify';
import { contextStore } from '@presentation/contextStore';
import { AuthUsecaseModel } from '@usecase/auth/model/auth.usecase.model';

export const Login = () => {
  const navigate = useNavigate();
  const [qry, setQry] = React.useState({
    loading: null,
    data: null,
    error: null
  });
  const [currentLogin, setCurrentLogin] = React.useState('');
  const [passVisible, setPassVisible] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');

  const handleClick = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setQry(qry => ({
      ...qry,
      loading: true
    }));
    inversify.authUsecase.execute({
      login: currentLogin,
      password: currentPassword
    }).then((response:AuthUsecaseModel) => {
      if(response.message === CODES.SUCCESS) {
        contextStore.setState({ 
          id: response.data.id,
          code: response.data.code,
          access_token: response.data.access_token,
          name_first: response.data.name_first,
          name_last: response.data.name_last,
        });
        navigate('/');
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
  }

  let form = <div></div>;
  if(qry.loading) {
    form = <div><Trans>common.loading</Trans></div>;
  } else {
    form = <form
    onSubmit={handleClick}
  >
    <Box
      display="flex"
      alignItems="center"
      sx={{ 
        flexDirection: 'column',
        gap: '10px;'
      }}
    >
      {/* Field Login */}
      <TextField
        sx={{ marginRight:1}}
        label={<Trans>login.login</Trans>}
        variant="standard"
        size="small"
        onChange={(e) => { 
          e.preventDefault();
          setCurrentLogin(e.target.value);
        }}
      />
      
      {/* Field Password */}
      <TextField
        sx={{ marginRight:1}}
        label={<Trans>login.password</Trans>}
        variant="standard"
        size="small"
        autoComplete='false'
        type={(passVisible)?'text':'password'}
        onChange={(e) => { 
          e.preventDefault();
          setCurrentPassword(e.target.value);
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment 
              position="end"
              onClick={(e) => { 
                e.preventDefault();
                setPassVisible(!passVisible);
              }}
            >
              {(passVisible?<VisibilityOffIcon/>:<VisibilityIcon />)}
            </InputAdornment>
          ),
        }}
      />

      {/* Submit button */}
      <Button 
        type="submit"
        variant="contained"
        size="small"
        startIcon={<Done />}
        disabled={!(currentLogin.length > 3 && currentPassword.length > 3)}
      ><Trans>common.done</Trans></Button>
    </Box>
  </form>
  }

  let errorMessage = <div></div>;
  if(qry.error) {
    errorMessage = <div><Trans>login.{qry.error}</Trans></div>
  }

  return (
    <div className="login">
      <div className='title'>
        <Trans>login.title</Trans>
      </div>
      <div>
        {form}
      </div>
      <div>
        {errorMessage}
      </div>
      <Footer/>
    </div>
  )
};
