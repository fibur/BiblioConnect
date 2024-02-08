import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Avatar,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CardMedia,
  TextField,
  Rating,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BorrowForm from './BorrowForm';
import BooksService from '../service/BooksService';
import ReviewsService from '../service/ReviewsService';
import { useAuth } from '../context/AuthContext';
import MessageBox from './MessageBox';

const BookDetails = ({ setLoginOpen }) => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [borrowStatus, setBorrowStatus] = useState(null);
  const [openBorrowForm, setOpenBorrowForm] = useState(false);
  const [openMessageBox, setOpenMessageBox] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewError, setReviewError] = useState('');
  const [canAddReview, setCanAddReview] = useState(false);
  const [message, setMessage] = useState('');
  const [opinionFormMessage, setOpinionFormMessage] = useState('');
  const [accessLimited, setAccessLimited] = useState(false);
  const { currentUser, authorize } = useAuth();
  const placeholderImage = 'https://via.placeholder.com/150';

  const fetchBookDetails = () => {
    BooksService.getBookById(id)
      .then((response) => {
        setBook(response.data);
        if (openBorrowForm && response.data.currently_available === 0) {
          setOpenBorrowForm(false);
        }
      })
      .catch((error) => handleServiceError(error, 'Błąd połączenia z serwerem'));
  };

  const fetchReviews = () => {
    ReviewsService.getReviewsByBookId(id)
      .then((response) => setReviews(response.data))
      .catch((error) => handleServiceError(error, 'Błąd połączenia z serwerem'));
  };

  const checkUserPermissions = () => {
    BooksService.checkBorrowStatus(id)
      .then((response) => {
        setAccessLimited(false);
        setBorrowStatus(response.data);
      })
      .catch((error) => handleBorrowStatusError(error));

    ReviewsService.checkIfCanAddReview(id)
      .then((response) => handleReviewPermissionResponse(response))
      .catch((error) => handleServiceError(error, 'Błąd połączenia z serwerem'));
  };

  const handleBorrowStatusError = (error) => {
    if (error.response && error.response.status === 403) {
      setAccessLimited(true);
    }
    setBorrowStatus(null);
  };

  const handleReviewPermissionResponse = (response) => {
    const { canAddReview, forbidden, already_added, not_borrowed } = response.data;
    setCanAddReview(canAddReview);

    if (!canAddReview) {
      setOpinionFormMessage(
        forbidden ? 'Masz przekroczone terminy zwrotu. Zwróć książki, aby móc wypożyczyć kolejne' :
        already_added ? 'Opinia od tego użytkownika dla tej książki już istnieje' :
        not_borrowed ? 'Możesz dodać opinię tylko dla książki, którą wypożyczyłeś i zwróciłeś' :
        'Nie możesz dodać opinii do tej książki'
      );
    }
  };

  const handleServiceError = (error, defaultMessage) => {
    console.error(error);
    setCanAddReview(false);
    setMessage(defaultMessage);
    setOpenMessageBox(true);
  };

  const handleReviewChange = (event) => {
    const value = event.target.value;
    setNewReview(value);
    setReviewError(value.length < 3 || value.length > 200 ? 'Opinia musi zawierać od 3 do 200 znaków.' : '');
  };

  const handleRatingChange = (newValue) => setRating(newValue);

  const handleOpenBorrowForm = () => setOpenBorrowForm(true);

  const handleCloseBorrowForm = () => setOpenBorrowForm(false);

  const handleReturnBook = () => {
    if (!borrowStatus) return;

    BooksService.returnBook(borrowStatus.borrow_id)
      .then(() => {
        setMessage('Książka została zwrócona, dziękujemy.');
        authorize();
        setOpenMessageBox(true);
        fetchBookDetails();
        checkUserPermissions();
      })
      .catch((err) => handleReturnBookError(err));
  };

  const handleReturnBookError = (err) => {
    const errorMessage = !err.response ? 'Nie można połączyć z serwerem' :
                         err.response.data.status === 400 ? 'Tej książki nie da się zwrócić' :
                         'Nie udało się zwrócić książki.';
    setMessage(errorMessage);
    setOpenMessageBox(true);
  };

  const submitReview = () => {
    if (reviewError || !newReview || rating <= 0 || rating > 5) return;

    ReviewsService.addReview(id, { content: newReview, rating })
      .then(() => {
        setReviews([...reviews, { username: currentUser, rating, content: newReview }]);
        setNewReview('');
        setRating(0);
        setMessage('Opinia została dodana');
        setOpenMessageBox(true);
        setCanAddReview(false);
        setOpinionFormMessage('Opinia od tego użytkownika dla tej książki już istnieje');
      })
      .catch((err) => handleAddReviewError(err));
  };

  const handleAddReviewError = (err) => {
    const errorMessage = !err.response ? 'Nie można połączyć z serwerem' :
                         err.response.data.status === 403 ? 'Masz przekroczone terminy zwrotu. Zwróć książki, aby móc wypożyczyć kolejne' :
                         err.response.data.length ? 'Treść opinii musi zawierać od 3 do 200 znaków' :
                         err.response.data.range ? 'Ocena musi być wartością od 1 do 5' :
                         err.response.data.already_added ? 'Opinia od tego użytkownika dla tej książki już istnieje' :
                         err.response.data.not_borrowed ? 'Możesz dodać opinię tylko dla książki, którą wypożyczyłeś i zwróciłeś' :
                         'Nie udało się dodać opinii';
    setMessage(errorMessage);
    setOpenMessageBox(true);
  };

  const handlePaymentStarted = () => {
    setBorrowStatus({ ...borrowStatus, payment_status: 'pending' });
  };

  useEffect(() => {
    fetchBookDetails();
    fetchReviews();
    if (currentUser) {
      checkUserPermissions();
    } else {
      setOpinionFormMessage('Aby dodać opinie musisz być zalogowany.');
    }
  }, [id, currentUser, openBorrowForm]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', margin: '20px' }}>
      <Box sx={{ display: 'flex', marginBottom: '20px' }}>
        {book && (
          <CardMedia
            component="img"
            sx={{ width: 151, height: 'auto', marginRight: '20px' }}
            image={book.cover_source || placeholderImage}
            alt={`Okładka książki "${book.title}"`}
          />
        )}
        <Card sx={{ flex: 1 }}>
          {book && (
            <CardContent>
              <Typography gutterBottom variant="h4" component="div">
                {book.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Autor: {book.author}
              </Typography>
              <Typography variant="body1" gutterBottom>
                ISBN: {book.isbn}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Cena: {book.rental_price.toFixed(2)} zł
              </Typography>
              <Typography variant="body1" gutterBottom style={{ color: book.currently_available > 0 ? 'green' : 'red' }}>
                {book.currently_available > 0 ? `Dostępnych egzemplarzy: ${book.currently_available}` : 'Niedostępna'}
              </Typography>
              {borrowStatus && borrowStatus.is_borrowed ? (
                borrowStatus.payment_status === 'pending' ? (
                  <Typography>
                    Płatność w toku. Możesz <Link to={borrowStatus.payment_url}>wrócić do płatności</Link>.
                  </Typography>
                ) : borrowStatus.payment_status === 'success' && !borrowStatus.is_returned ? (
                  <>
                    <Typography style={{ color: 'gray', marginTop: '10px' }}>
                      Książka jest w twoim posiadaniu. Data wypożyczenia: {borrowStatus.borrow_date}. Zwróć przed {borrowStatus.return_by_date}.
                    </Typography>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={ handleReturnBook }
                      sx={{ mt: 1 }}
                    >
                      Zwróć książkę
                    </Button>
                  </>
                ) : (!accessLimited ? 
                      book.currently_available > 0 ? (
                        <Button variant="contained" onClick={handleOpenBorrowForm} sx={{ mt: 2 }}>
                          Wypożycz
                        </Button>
                      ) : (
                        <Typography style={{ color: 'red', marginTop: '10px' }}>
                          Książka nie jest aktualnie dostępna do wypożyczenia.
                        </Typography>
                      )
                      :
                    (<Typography style={{ color: 'gray', marginTop: '10px' }}>
                        Masz przekroczone terminy zwrotu. Zwróć książki, aby móc wypożyczyć kolejne.
                    </Typography>)
                )
              ) : currentUser ? (!accessLimited ? 
                  book.currently_available > 0 ? (
                    <Button variant="contained" onClick={handleOpenBorrowForm} sx={{ mt: 2 }}>
                      Wypożycz
                    </Button>
                  ) : (
                    <Typography style={{ color: 'red', marginTop: '10px' }}>
                      Książka nie jest aktualnie dostępna do wypożyczenia.
                    </Typography>
                  )
                  :
                (<Typography style={{ color: 'gray', marginTop: '10px' }}>
                    Masz przekroczone terminy zwrotu. Zwróć książki, aby móc wypożyczyć kolejne.
                </Typography>)
              ) : (
                <Button variant="contained" onClick={() => setLoginOpen(true)} sx={{ mt: 2 }}>
                  Zaloguj się, aby wypożyczyć.
                </Button>
              )}
            </CardContent>
          )}
        </Card>
      </Box>
      <Card sx={{ flex: 1, marginTop: '20px' }}>
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Opinie
            </Typography>
            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <Box key={index} sx={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', display: 'flex', gap: '10px' }}>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">{review.username}</Typography>
                    <Rating name="read-only" value={review.rating} readOnly />
                    <Typography variant="body2">{review.content}</Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography variant="subtitle1">Nie ma jeszcze opinii dla tej książki.</Typography>
            )}
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, marginTop: '20px' }}>
          <CardContent>
          <Typography variant="h6">Dodaj opinię</Typography>
          {currentUser && canAddReview && (
              <>
                <Rating
                  name="simple-controlled"
                  value={rating}
                  onChange={(event, newValue) => {
                    handleRatingChange(newValue);
                  }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="Twoja opinia"
                  value={newReview}
                  onChange={handleReviewChange}
                  error={!!reviewError}
                  helperText={reviewError}
                  margin="normal"
                />
                <Button variant="contained" onClick={submitReview} disabled={!!reviewError || !newReview || rating === 0}>
                  Dodaj
                </Button>
              </>
            )}
            {(!currentUser || !canAddReview) && (
              <Typography variant="body1" color="text.secondary">
                { opinionFormMessage }
              </Typography>
            )}
          </CardContent>
        </Card>
        {openBorrowForm && <BorrowForm open={openBorrowForm} handleClose={handleCloseBorrowForm} handlePaymentStarted={handlePaymentStarted} book={book} />}
        <MessageBox open={openMessageBox} message={message} onClose={() => { setOpenMessageBox(false) }} />
    </Box>
  );
};

export default BookDetails;
