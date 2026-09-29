/**
 * Utility to generate a standard UPI Payment URI
 * Format: upi://pay?pa=<UPI_ID>&pn=<PayeeName>&am=<Amount>&tn=<InvoiceNumber>&cu=INR
 */
export const generateUpiUri = ({ upiId, payeeName, amount, invoiceNumber }) => {
  if (!upiId || !upiId.trim()) return '';

  const cleanUpi = upiId.trim();
  const params = new URLSearchParams();

  // pa = Payee Address (UPI ID) - Required
  params.append('pa', cleanUpi);

  // pn = Payee Name - Optional
  if (payeeName && payeeName.trim()) {
    params.append('pn', payeeName.trim());
  }

  // am = Amount - Optional (pre-fills amount in client's UPI app)
  if (amount !== undefined && amount !== null && !isNaN(Number(amount)) && Number(amount) > 0) {
    params.append('am', Number(amount).toFixed(2));
  }

  // tn = Transaction Note / Invoice Ref - Optional
  if (invoiceNumber && invoiceNumber.trim()) {
    params.append('tn', `Invoice #${invoiceNumber.trim()}`);
  }

  // cu = Currency - Default INR
  params.append('cu', 'INR');

  return `upi://pay?${params.toString()}`;
};
