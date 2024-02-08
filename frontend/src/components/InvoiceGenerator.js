import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import InvoiceService from '../service/InvoiceService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { font } from "../fonts/Lato"

const InvoiceGenerator = () => {
    const { borrowId } = useParams();
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        var callAddFont = function () {
            this.addFileToVFS('Lato-Regular-normal.ttf', font);
            this.addFont('Lato-Regular-normal.ttf', 'Lato-Regular', 'normal');
        };
        jsPDF.API.events.push(['addFonts', callAddFont]);

        const fetchAndDisplayInvoice = async () => {
            try {
                const invoiceResponse = await InvoiceService.getInvoice(borrowId);
                const { id, seller, NIP, payment_date, price, user, book } = invoiceResponse.data;

                const VAT_RATE = 0.23;
                const netPrice = price / (1 + VAT_RATE);
                const vatAmount = price - netPrice;

                const doc = new jsPDF();
                doc.setFont('Lato-Regular');

                console.log(doc.getFontList());
                console.log(doc.getFont());
                doc.setFontSize(10);
                doc.text(`Sprzedawca: ${seller}, NIP: ${NIP}`, 10, 10);
                doc.text(`Nabywca: ${user.username}, Email: ${user.email}`, 10, 20);

                doc.setFontSize(14);
                const year = new Date(payment_date).getFullYear().toString().substr(-2);
                doc.text(`Faktura ${id}/${year}`, 105, 30, null, null, 'center');

                doc.autoTable({
                    startY: 40,
                    styles: { 
                        fontSize: 8,
                        font: 'Lato-Regular',
                        fontStyle: 'normal', 
                    },
                    columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 30 }, 2: { cellWidth: 20 }, 3: { cellWidth: 20 }, 4: { cellWidth: 20 }, 5: { cellWidth: 20 } },
                    head: [['Tytuł książki', 'Autor', 'Ilość', 'Cena netto', 'VAT', 'Cena brutto']],
                    body: [
                        [book.title, book.author, 1, `${netPrice.toFixed(2)} PLN`, `${vatAmount.toFixed(2)} PLN`, `${price.toFixed(2)} PLN`],
                    ],
                });

                const finalY = doc.lastAutoTable.finalY + 10;
                doc.setFontSize(10);
                doc.text('Podpis sprzedawcy:', 10, finalY + 20);
                doc.text('Podpis nabywcy:', 150, finalY + 20);

                const pdfBlob = doc.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);
                window.open(pdfUrl, '_self');
                
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setErrorMessage('Nie znaleziono wypożyczenia ani faktury o podanym ID.');
                } else {
                    setErrorMessage('Wystąpił nieoczekiwany błąd, spróbuj ponownie później.');
                }
            }
        };

        fetchAndDisplayInvoice();
    }, [borrowId]);

    return (
        <div>
            {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
        </div>
    );
};

export default InvoiceGenerator;