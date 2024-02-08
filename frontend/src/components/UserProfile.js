import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Container, Typography, Grid, Paper, Avatar, Box } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BookItem from './BookItem';

const UserProfile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [borrows, setBorrows] = useState([]);
  const { logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await axiosInstance.get('/user/info');
        setUserInfo(userResponse.data);

        const borrowsResponse = await axiosInstance.get('/user/borrows');
        setBorrows(borrowsResponse.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          logout();
        }
      }
    };

    fetchData();
  }, [logout]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Profil użytkownika</Typography>
      {userInfo && (
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar>
                <PersonIcon />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h6">{userInfo.username}</Typography>
              <Box display="flex" alignItems="center">
                <EmailIcon sx={{ mr: 1 }} />
                <Typography variant="body1">{userInfo.email}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      <Typography variant="h6" gutterBottom>Wypożyczenia:</Typography>
      <Grid container spacing={8}>
        {borrows.map(borrow => (
          <Grid item xs={12} sm={6} md={4} key={borrow.borrow_id}>
            <BookItem
              book={borrow.book}
              rentalInfo={{
                borrow_id: borrow.borrow_id,
                paymentStatus: borrow.payment_status,
                returned: borrow.returned,
                return_date: borrow.return_date,
                return_by_date: borrow.return_by_date,
                borrow_date: borrow.borrow_date
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default UserProfile;
