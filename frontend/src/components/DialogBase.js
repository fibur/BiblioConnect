import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Alert, Collapse } from '@mui/material';

const DialogBase = ({
  open,
  onClose,
  title,
  children,
  confirmText = 'Confirm',
  onConfirm,
  confirmDisabled = false,
  alertType,
  alertMessage,
  onClearAlert
}) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(alertType === 'success');
  }, [alertType]);

  const handleCloseAlert = () => {
    if (collapsed) {
      handleCloseDialog();
      return;
    }

    onClearAlert?.();
  };

  const handleCloseDialog = () => {
    onClose(); 
    setCollapsed(false); 
    onClearAlert?.(); 
  };

  return (
    <Dialog open={open} onClose={handleCloseDialog}>
      <DialogTitle>{title}</DialogTitle>
      <Collapse in={!collapsed}>
        <DialogContent>{children}</DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {!collapsed && (
            <Button onClick={onConfirm} disabled={confirmDisabled}>
              {confirmText}
            </Button>
          )}
        </DialogActions>
      </Collapse>
      {(alertMessage) && (
        <Alert severity={alertType} onClose={handleCloseAlert}>
          <div dangerouslySetInnerHTML={{ __html: alertMessage }} />
        </Alert>
      )}
    </Dialog>
  );
};

export default DialogBase;
