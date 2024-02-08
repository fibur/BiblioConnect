import React, { useState } from 'react';
import { Typography } from '@mui/material';
import DialogBase from './DialogBase';
import BooksService from '../service/BooksService';

const BorrowForm = ({ open, handleClose, book, handlePaymentStarted }) => {
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');

  const clearAlert = () => {
    setAlertMessage('');
    setAlertType('');
  };

  const handleBorrow = async () => {
    clearAlert();
    try {
      const response = await BooksService.borrowBook(book.id);

      window.open(response.data.payment_url);
      handlePaymentStarted();
      
      setAlertType('success');
      setAlertMessage('Płatność otwarta w nowej karcie, postępuj zgodnie z instrukcjami.');
    } catch (err) {
      let errorMessage = '';
      if (!err.response) {
        errorMessage = 'Nie można połączyć z serwerem';
      } else if (err.response.data.status === 403) {
        errorMessage = 'Masz przekroczone terminy zwrotu. Zwróć książki, aby móc wypożyczyć kolejne';
      } else if (err.response.data.not_available) {
        errorMessage = 'Książka nie jest dostępna';
      } else if (err.response.data.already_borrowed) {
        errorMessage = 'Użytkownik już wypożyczył tę książkę';
      } else {
        errorMessage = 'Inicjacja płatności nie powiodła się';
      }

      setAlertType('error');
      setAlertMessage(errorMessage);
    }
  };

  return (
    <DialogBase
      open={open}
      onClose={() => { handleClose(); clearAlert(); }}
      title="Potwierdź wypożyczenie"
      confirmText="Zapłać"
      onConfirm={handleBorrow}
      alertType={alertType}
      alertMessage={alertMessage}
      onClearAlert={clearAlert}
      confirmDisabled={!book}
      collapseOnAlert={alertType === 'success'}
    >
      <Typography gutterBottom>
        <strong>Tytuł:</strong> {book?.title}
      </Typography>
      <Typography gutterBottom>
        <strong>Cena:</strong> PLN {book?.rental_price}
      </Typography>
    </DialogBase>
  );
};

export default BorrowForm;