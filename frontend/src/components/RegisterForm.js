import React, { useState, useCallback, useEffect } from 'react';
import { TextField, Tooltip, Typography, LinearProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import DialogBase from './DialogBase';
import { isValidEmail, isValidUsername, isPasswordSecure, getPasswordStrength } from '../utils/validationUtils';

const PasswordRequirements = () => (
  <Typography variant="caption">
    Hasło musi zawierać co najmniej 8 znaków, w tym 1 dużą literę, 1 małą literę i 1 cyfrę.
  </Typography>
);

const RegisterForm = ({ open, handleClose }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password));
  }, [password]);

  const resetForm = useCallback(() => {
    setUsername('');
    setEmail('');
    setPassword('');
    clearAlert();
  }, []);

  const clearAlert = () => {
    setAlertMessage('');
    setAlertType('');
  };

  const handleRegister = async () => {
    if (!isFormValid) return;
    setLoading(true);
    clearAlert();
    try {
      await register(username, email, password);
      setAlertType('success');
      setAlertMessage('Zarejestrowano! Zaloguj się teraz aby móc korzystać z serwisu!');
    } catch (err) {
      setAlertType('error');

      let errorMessage = '';
      if (!err.response) {
        errorMessage = 'Nie można połączyć z serwerem';
      } else if (err.response.data.invalid_credentials) {
        errorMessage = 'Nieprawidłowa nazwa użytkownika lub hasło';
      } else if (err.response.data.already_exist) {
        errorMessage = 'Nazwa użytkownika lub email już istnieje';
      } else {
        errorMessage = 'Nie udało się zarejestrować';
      }

      setAlertMessage(errorMessage);
    }
    setLoading(false);
  };

  const handleCloseAndReset = () => {
    handleClose();
    resetForm();
  };

  const isFormValid = isValidEmail(email) && isValidUsername(username) && isPasswordSecure(password);
  const passwordStrengthLabel = (strength) => {
    if (strength <= 0.2) {
      return 'Bardzo słabe';
    } 
    
    if (strength <= 0.4) {
      return 'Słabe';
    } 
    
    if (strength <= 0.6) {
      return 'Średnie';
    } 
    
    if (strength <= 0.8) {
      return 'Silne';
    }

    return 'Bardzo silne';
  }
  
  return (
    <DialogBase
      open={open}
      onClose={handleCloseAndReset}
      title="Register"
      confirmText="Register"
      onConfirm={handleRegister}
      alertType={alertType}
      alertMessage={alertMessage}
      onClearAlert={clearAlert}
      collapseOnAlert={alertType === 'success'}
      confirmDisabled={!isFormValid || loading}
    >
      <TextField
        autoFocus
        margin="dense"
        name="username"
        label="Username"
        type="text"
        fullWidth
        variant="standard"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <TextField
        margin="dense"
        name="email"
        label="Email"
        type="email"
        fullWidth
        variant="standard"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Tooltip title={<PasswordRequirements />} placement="right" arrow>
        <TextField
          margin="dense"
          name="password"
          label="Hasło"
          type="password"
          fullWidth
          variant="standard"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Tooltip>
      <LinearProgress
        variant="determinate"
        value={passwordStrength * 100}
        sx={{
          height: '4px',
          borderRadius: '2px',
          backgroundColor: (theme) => theme.palette.grey[300],
          '& .MuiLinearProgress-bar': {
            transition: 'background-color .5s ease',
            backgroundColor: (theme) =>
              passwordStrength > 0 
                ? `rgba(${255 * (1 - passwordStrength)}, ${255 * passwordStrength}, 0, 1)`
                : theme.palette.grey[300], 
          },
        }}
    />

    <Typography variant="caption" color="textSecondary">
      Siła hasła: {passwordStrengthLabel(passwordStrength)}
    </Typography>
    </DialogBase>
  );
};

export default RegisterForm;
