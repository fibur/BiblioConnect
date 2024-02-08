import React, { useState } from 'react';
import { Box, TextField, Button, IconButton, Collapse, FormGroup, FormControlLabel, Checkbox, Paper, Select, FormControl, InputLabel, Typography, MenuItem } from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const SearchBooks = ({ onSearch, onSortFieldChange, onSortOrderChange, sortField, sortOrder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [author, setAuthor] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [isbn, setIsbn] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState(false);

  const handleSearch = () => {
    onSearch({ searchTerm, author, priceFrom, priceTo, isbn, isAvailable });
  };

  const handleSortOrderToggle = () => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    onSortOrderChange(newSortOrder);
    onSearch({ searchTerm, author, priceFrom, priceTo, isbn, isAvailable });
  };

  return (
    <Paper style={{ padding: '20px', margin: '20px 0' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="10px">
        <Box flex={1} marginRight="10px">
          <TextField
            fullWidth
            label="Szukaj książek"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>
        <Button variant="contained" onClick={handleSearch}>
          Szukaj
        </Button>
        <IconButton onClick={() => setAdvancedSearch(!advancedSearch)} style={{ marginLeft: '10px' }}>
          <Typography variant="button">{advancedSearch ? 'Mniej opcji' : 'Więcej opcji'}</Typography>
          <ExpandMoreIcon />
        </IconButton>
        <Box display="flex" alignItems="center" marginLeft="auto">
          <FormControl variant="outlined" style={{ minWidth: 120, marginRight: '10px' }}>
            <InputLabel>Sortuj po</InputLabel>
            <Select
              value={sortField}
              onChange={(e) => onSortFieldChange(e.target.value)}
              label="Sortuj po"
            >
              <MenuItem value="title">Tytuł</MenuItem>
              <MenuItem value="author">Autor</MenuItem>
              <MenuItem value="rental_price">Cena</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={handleSortOrderToggle}>
            <SortIcon style={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
          </IconButton>
        </Box>
      </Box>
      <Collapse in={advancedSearch}>
        <FormGroup>
          <TextField label="Autor" variant="outlined" fullWidth value={author} onChange={(e) => setAuthor(e.target.value)} style={{ marginBottom: '10px' }} />
          <TextField label="ISBN" variant="outlined" fullWidth value={isbn} onChange={(e) => setIsbn(e.target.value)} style={{ marginBottom: '10px' }} />
          <Box display="flex" justifyContent="space-between">
            <TextField label="Cena od" type="number" variant="outlined" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} style={{ marginRight: '10px', flex: 1 }} />
            <TextField label="Cena do" type="number" variant="outlined" value={priceTo} onChange={(e) => setPriceTo(e.target.value)} style={{ flex: 1 }} />
          </Box>
          <FormControlLabel control={<Checkbox checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />} label="Dostępne tylko" style={{ marginTop: '10px' }} />
        </FormGroup>
      </Collapse>
    </Paper>
  );
};

export default SearchBooks;
