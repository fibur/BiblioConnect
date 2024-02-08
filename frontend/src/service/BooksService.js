import axios from '../utils/axiosConfig';

class BooksService {
  getAllBooks(queryParams) {
    return axios.get(`/books?${queryParams}`);
  }

  getBookById(id) {
    return axios.get(`/books/${id}`);
  }

  borrowBook(bookId) {
    return axios.post(`/borrow/${bookId}`);
  }

  returnBook(borrowId) {
    return axios.post(`/return/${borrowId}`);
  }

  checkBorrowStatus(bookId) {
    return axios.get(`/book/status/${bookId}`);
  }

  getBorrowStatus(borrowId) {
    return axios.get(`/borrow/info/${borrowId}`);
  }
}

const booksService = new BooksService();
export default booksService;
