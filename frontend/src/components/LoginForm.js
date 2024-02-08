import React, { useState } from 'react';
import { TextField } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import DialogBase from './DialogBase';
import { isValidUsername } from '../utils/validationUtils';

const LoginForm = ({ open, handleClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');

  const resetForm = () => {
    setUsername('');
    setPassword('');
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(username, password);
      handleDialogClose();
    } catch (error) {
      let errorMessage = '';

      if (!error.response) {
        errorMessage = 'Nie można połączyć z serwerem.'
      } else if (error.response.status === 401) {
        errorMessage = 'Nieprawidłowe dane logowania.'
      } else {
        errorMessage = 'Nie udało się zalogować.'
      }

      setAlertMessage(errorMessage);
      setAlertType('error');
    }
    setLoading(false);
  };

  const handleDialogClose = () => {
    resetForm();
    handleClose();
    clearAlert();
  };

  const clearAlert = () => {
    setAlertMessage('');
    setAlertType('');
  };

  const isFormValid = isValidUsername(username) && password;

  return (
    <DialogBase
      open={open}
      onClose={handleDialogClose}
      title="Login"
      confirmText="Login"
      onConfirm={handleLogin}
      alertType={alertType}
      alertMessage={alertMessage}
      onClearAlert={clearAlert}
      confirmDisabled={!isFormValid || loading}
    >
      <TextField
        autoFocus
        margin="dense"
        label="Username"
        type="text"
        fullWidth
        variant="standard"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <TextField
        margin="dense"
        label="Password"
        type="password"
        fullWidth
        variant="standard"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </DialogBase>
  );
};

export default LoginForm;
