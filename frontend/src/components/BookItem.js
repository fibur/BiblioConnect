import React, { useState } from 'react';
import { Card, CardContent, CardMedia, Button, Typography, Box, Rating } from '@mui/material';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';

const placeholderImage = 'https://via.placeholder.com/150';

const BookItem = ({ book, rentalInfo }) => {
  const { id, title, author, currently_available, rental_price, cover_source, average_rating } = book;
  const [imageSrc, setImageSrc] = useState(cover_source || placeholderImage);

  const handleImageError = () => {
    setImageSrc(placeholderImage);
  };

  const getRentalInfoStyle = () => {
    if (!rentalInfo) return { backgroundColor: "gray" };
    
    const returnByDate = new Date(rentalInfo.return_by_date);
    const today = new Date();
    const isOverdue = isPast(returnByDate) && !rentalInfo.returned;
    const isDueSoon = isWithinInterval(today, { start: today, end: addDays(today, 5) }) && isWithinInterval(returnByDate, { start: today, end: addDays(today, 5) }) && !rentalInfo.returned;
  
    switch (rentalInfo.paymentStatus) {
      case 'pending':
        return { backgroundColor: 'yellow' };
      case 'canceled':
        return { backgroundColor: 'lightcoral' };
      case 'success':
        if (rentalInfo.returned) {
          return { backgroundColor: 'lightgreen' };
        } else if (isOverdue) {
          return { backgroundColor: 'lightcoral' };
        } else if (isDueSoon) {
          return { backgroundColor: 'orange' };
        } else {
          return { backgroundColor: 'lightyellow' };
        }
      default:
        return { backgroundColor: "gray" };
    }
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd.MM.yyyy');
  };

  const renderRentalDetails = () => {
    let returnDateTextStyle = {};
    let returnDateText = null;

    if (rentalInfo.paymentStatus === 'success') {
      const returnByDate = new Date(rentalInfo.return_by_date);
      const today = new Date();
      const isOverdue = isPast(returnByDate) && !rentalInfo.returned;
      const isDueSoon = isWithinInterval(today, { start: today, end: addDays(today, 5) }) && isWithinInterval(returnByDate, { start: today, end: addDays(today, 5) }) && !rentalInfo.returned;

      if (isOverdue) {
        returnDateTextStyle = { color: 'red', fontWeight: 'bold' };
      } else if (isDueSoon) {
        returnDateTextStyle = { color: 'orange' };
      }

      returnDateText = rentalInfo.returned ? `Data zwrotu: ${formatDate(rentalInfo.return_date)}` : `Termin zwrotu: ${formatDate(rentalInfo.return_by_date)}`;
    }

    return (
      <>
        <Typography variant="body2" sx={{ textAlign: 'center', mt: 1 }}>
          {`Data wypożyczenia: ${rentalInfo.borrow_date}`}
        </Typography>
        {returnDateText && (
          <Typography variant="body2" sx={{ textAlign: 'center', mt: 1, ...returnDateTextStyle }}>
          {returnDateText}
        </Typography>
        )}
      </>
    );
  };

  return (
    <Card sx={{ display: 'flex', width: 400, height: 350, position: 'relative', overflow: 'visible' }}>
      <CardMedia
        component="img"
        sx={{ width: 180 }}
        image={imageSrc}
        alt="Book cover"
        onError={handleImageError}
      />
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {author}
        </Typography>
        {rentalInfo && renderRentalDetails()}
        {!rentalInfo && (
          <>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{ color: currently_available > 0 ? 'green' : 'red', fontWeight: 'bold' }}
                gutterBottom
              >
                {currently_available > 0 ? 'Dostępny' : 'Niedostępny'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cena: {rental_price.toFixed(2)} zł
              </Typography>
            </Box>
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <Rating name="read-only" value={average_rating} readOnly precision={0.5} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Średnia ocena: {average_rating}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
      {rentalInfo && (
        <Box sx={{
          ...getRentalInfoStyle(),
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          bottom: '48px',
          marginLeft: '180px',
          width: '220px',
          height: '48px'
        }}>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            {rentalInfo.paymentStatus !== 'success' ? (
              rentalInfo.paymentStatus === 'pending' ? 'Płatność oczekująca' : 'Płatność anulowana'
            ) : (
              rentalInfo.returned ? 'Zwrócone' : 'Nie zwrócone'
            )}
          </Typography>
        </Box>
      )}
      <Button
        variant="contained"
        color="primary"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '180px',
          right: 0,
          height: '48px',
          borderRadius: 0,
          textTransform: 'none',
        }}
        href={rentalInfo ? `/borrows/${rentalInfo.borrow_id}` : `/books/${id}`}
      >
        {rentalInfo ? 'Sprawdź informacje' : 'Sprawdź'}
      </Button>
    </Card>
  );
};

export default BookItem;
