import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, Typography, Button, Box, CardMedia, Link as MuiLink } from '@mui/material';
import BooksService from '../service/BooksService';
import { useAuth } from '../context/AuthContext';
import MessageBox from './MessageBox';
import { format, parseISO } from 'date-fns';

const BorrowDetails = () => {
  const { borrowId } = useParams();
  const [borrow, setBorrow] = useState(null);
  const { currentUser } = useAuth();
  const [openMessageBox, setOpenMessageBox] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (currentUser && borrowId) {
      BooksService.getBorrowStatus(borrowId)
        .then(response => {
          setBorrow(response.data);
          if (response.data.book_id) {
            BooksService.getBookById(response.data.book_id).then(bookResponse => {
              setBorrow(prevState => ({ ...prevState, book: bookResponse.data }));
            });
          }
        })
        .catch(error => {
          setMessage("Nie odnaleziono wypożyczenia dla danego użytkownika");
          setOpenMessageBox(true);
        });
    }
  }, [borrowId, currentUser]);

  const handleReturnBook = () => {
    BooksService.returnBook(borrowId).then(() => {
      setBorrow(prevState => ({ ...prevState, returned: true }));
      setMessage('Książka została zwrócona, dziękujemy.');
      setOpenMessageBox(true);
    }).catch(err => {
      let errorMessage = '';
      if (!err.response) {
        errorMessage = 'Nie można połączyć z serwerem';
      } else if (err.response.data.status === 400) {
        errorMessage = 'Tej książki nie da się zwrócić';
      } else {
        errorMessage = 'Nie udało się zwrócić książki.';
      }

      setMessage(errorMessage);
      setOpenMessageBox(true);
    });
  };

  if (!currentUser) {
    return <Typography variant="h6">Musisz być zalogowany, aby zobaczyć szczegóły wypożyczenia.</Typography>;
  }

  return (
    <Box sx={{ margin: '20px' }}>
      {borrow && borrow.book ? (
        <Card>
          <Box sx={{ display: 'flex' }}>
            <CardMedia
              component="img"
              sx={{ width: 151, height: 'auto', marginRight: '20px' }}
              image={borrow.book.cover_source || 'https://via.placeholder.com/150'}
              alt={`Okładka książki "${borrow.book.title}"`}
            />
            <CardContent sx={{ flex: 1 }}>
              <Typography gutterBottom variant="h5" component="div">
                {borrow.book.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Autor: {borrow.book.author}
              </Typography>
              <Typography variant="body1" gutterBottom>
                ISBN: {borrow.book.isbn}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Cena: {borrow.book.rental_price.toFixed(2)} zł
              </Typography>
              <Typography variant="body1" gutterBottom>
                Data wypożyczenia: {format(new Date(borrow.borrow_date), 'dd.MM.yyyy')}
              </Typography>
              {borrow.payment_status === 'success' && (
                <Typography variant="body1" gutterBottom>
                  Termin zwrotu: {format(new Date(borrow.return_by_date), 'dd.MM.yyyy')}
                </Typography>
              )}
              {borrow.payment_status === 'success' && borrow.returned && (
                <Typography variant="body1" gutterBottom>
                  Data zwrotu: {format(new Date(borrow.return_date), 'dd.MM.yyyy')}
                </Typography>
              )}
              <Typography variant="body1" gutterBottom> Status: 
                <span style={{ color: borrow.returned && borrow.payment_status !== 'canceled' ? 'green' : 'lightcoral' }}>
                    {borrow.payment_status !== 'success' ? (
                                borrow.payment_status === 'pending' ? 'Płatność oczekująca' : ('Płatność anulowana')
                                ) : (
                                    borrow.returned ? 'Zwrócone' : 'Nie zwrócone'
                                )}
                </span>
              </Typography>
              {borrow.payment_status === 'pending' && (
                <MuiLink href={borrow.payment_url} underline="hover" target="_blank" rel="noopener">
                  <Button variant="contained" color="warning">
                    Przejdź do płatności
                  </Button>
                </MuiLink>
              )}
              {(!borrow.returned && borrow.payment_status === 'success') && (
                <Button variant="contained" color="secondary" onClick={handleReturnBook} sx={{ mt: 2 }}>
                  Zwróć książkę
                </Button>
              )}
              {borrow.payment_status === 'success' && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <MuiLink href={`/invoice/${borrow.id}`}  underline="hover" target="_blank" rel="noopener">
                  <Button variant="contained" color="primary">
                    Pobierz fakturę
                  </Button>
                </MuiLink>
              </Box>
            )}
            </CardContent>
          </Box>
        </Card>
      ) : (
        <Typography variant="h6">Brak danych o wypożyczeniu.</Typography>
      )}
      <MessageBox open={openMessageBox} message={message} onClose={() => { setOpenMessageBox(false) }} />
    </Box>
  );
};

export default BorrowDetails;
