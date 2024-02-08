import axios from '../utils/axiosConfig';

class ReviewsService {
  getReviewsByBookId(bookId) {
    return axios.get(`/books/${bookId}/reviews`);
  }

  addReview(bookId, reviewData) {
    return axios.post(`/books/${bookId}/reviews`, reviewData);
  }

  checkIfCanAddReview(bookId) {
    return axios.get(`/reviews/can_add/${bookId}`);
  }
}

const reviewsService = new ReviewsService();
export default reviewsService;
