import axios from '../utils/axiosConfig';

class InvoiceService {
  getInvoice(borrowId) {
    return axios.get(`/invoice/${borrowId}`);
  }
}

const invoiceService = new InvoiceService();
export default invoiceService;
