import React, { useEffect, useState } from 'react';
import { Grid, Box } from '@mui/material';
import BooksService from '../service/BooksService';
import SearchBooks from './SearchBooks';
import BookItem from './BookItem';

const BooksList = () => {
  const [books, setBooks] = useState([]);
  const [sortField, setSortField] = useState('title'); 
  const [sortOrder, setSortOrder] = useState('asc'); 

  useEffect(() => {
    BooksService.getAllBooks().then(response => {
      setBooks(response.data);
    });
  }, []);

  const handleSearch = ({ searchTerm, author, priceFrom, priceTo, isbn, isAvailable  }) => {
    const queryParams = new URLSearchParams({
      query: searchTerm,
      author,
      priceFrom,
      priceTo,
      isbn,
      isAvailable: isAvailable.toString(),
      sortField,
      sortOrder
    }).toString();

    BooksService.getAllBooks(queryParams).then(response => {
      setBooks(response.data);
    });
  };

  const handleSortFieldChange = (field) => {
    setSortField(field);
  };

  const handleSortOrderChange = (order) => {
    setSortOrder(order);
  };

  return (
    <Box sx={{ padding: '20px' }}>
      <SearchBooks
        onSearch={handleSearch}
        onSortFieldChange={handleSortFieldChange}
        onSortOrderChange={handleSortOrderChange}
        sortField={sortField}
        sortOrder={sortOrder}
      />
      <Grid container spacing={2}>
        {books.map(book => (
          <Grid item xs={12} sm={6} md={4} key={book.id}>
            <BookItem book={book} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default BooksList;
