import React, { useState, useEffect } from 'react';
import { Box, Alert, AppBar, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Toolbar, Typography, Button, Menu, MenuItem } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const ConfirmLogoutDialog = ({ open, onClose }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Potwierdzenie</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Czy na pewno chcesz się wylogować?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Anuluj
        </Button>
        <Button onClick={handleLogout} color="primary" autoFocus>
          Wyloguj
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Navbar = ({ setLoginOpen, setRegisterOpen }) => {
  const { currentUser, authorize } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null); 
  const navigate = useNavigate();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (currentUser) {
        try {
          const response = await authorize();
          setNotifications(response.data.notifications || []);
        } catch (error) {
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    };
  
    fetchNotifications();
  }, [currentUser, authorize, location]);

  const isNotificationSupported = (notification) => {
    return getNotificationMessage(notification) !== '';
  }

  const getNotificationMessage = (notification) => {
    switch (notification.type) {
      case 'upcoming_returns':
        return `Uwaga! Masz ${notification.value} wypożyczeń z terminem zwrotu w ciągu najbliższych 5 dni.`;
      case 'overdue_returns':
        return `Uwaga! Przekroczyłeś termin zwrotu dla ${notification.value} wypożyczeń. Dostęp do serwisu ograniczony.`;
      default:
        return '';
    }
  }

  const openLogoutDialog = () => setLogoutDialogOpen(true);
  const closeLogoutDialog = () => {
    handleClose();
    setLogoutDialogOpen(false);
  }
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    navigate('/user');
    handleClose();
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            BiblioConnect
          </Typography>
          {currentUser ? (
            <>
              <Button color="inherit" onClick={handleMenu}>
                {currentUser}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleProfile}>Profil</MenuItem>
                <MenuItem onClick={openLogoutDialog}>Wyloguj</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => setLoginOpen(true)}>Login</Button>
              <Button color="inherit" onClick={() => setRegisterOpen(true)}>Register</Button>
            </>
          )}
        </Toolbar>
        <ConfirmLogoutDialog open={logoutDialogOpen} onClose={closeLogoutDialog} />
      </AppBar>
      <Box sx={{ width: '100%' }}>
        {notifications.map((notification, index) => (
          isNotificationSupported(notification) && (notification.severity !== 'warning' || location.pathname === '/user') && (
            <Alert key={index} severity={notification.severity} sx={{ marginBottom: 1 }}>
              { getNotificationMessage(notification) }
            </Alert>
          )
        ))}
      </Box>
    </>
  );
};

export default Navbar;
