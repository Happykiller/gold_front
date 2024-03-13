import * as React from 'react';
import { create } from 'zustand';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export interface FlashStore {
  visible: boolean,
  msg: string,
  close: () => void,
  open: (msg: string) => void
}

export const flashStore = create<FlashStore>((set) => ({
  visible: false,
  msg: null,
  close: () => set((state:FlashStore) => ({ visible: false })),
  open: (msg: string) => set((state:FlashStore) => ({ 
    visible: true,
    msg
  }))
}))

export default function Flash() {
  const flash:FlashStore = flashStore();

  const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    flash.close();
  };

  const action = (
    <React.Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  return (
    <div>
      <Snackbar
        anchorOrigin={{vertical: 'bottom', horizontal:'right'}}
        open={flash.visible}
        autoHideDuration={6000}
        onClose={handleClose}
        message={flash.msg}
        action={action}
      />
    </div>
  );
}