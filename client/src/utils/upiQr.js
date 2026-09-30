/**
 * Utility to generate a standard UPI Payment URI
 * Format: upi://pay?pa=<UPI_ID>&pn=<PayeeName>&tn=<InvoiceNumber>&cu=INR
 * 
 * Note: No predefined payment amount ('am') parameter is attached.
 * This ensures scanning the QR code redirects directly to the payee's UPI account
 * in the client's UPI app (GPay, PhonePe, Paytm, etc.).
 */
export const generateUpiUri = ({ upiId, payeeName, invoiceNumber }) => {
  if (!upiId || !upiId.trim()) return '';

  const cleanUpi = upiId.trim();
  const params = new URLSearchParams();

  // pa = Payee Address (UPI ID) - Required
  params.append('pa', cleanUpi);

  // pn = Payee Name - Optional
  if (payeeName && payeeName.trim()) {
    params.append('pn', payeeName.trim());
  }

  // tn = Transaction Note / Invoice Ref - Optional
  if (invoiceNumber && invoiceNumber.trim()) {
    params.append('tn', `Invoice #${invoiceNumber.trim()}`);
  }

  // cu = Currency - Default INR
  params.append('cu', 'INR');

  return `upi://pay?${params.toString()}`;
};
