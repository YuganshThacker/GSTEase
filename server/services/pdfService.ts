import PDFDocument from 'pdfkit';
import { Invoice, InvoiceItem, Customer } from '../../shared/schema';
import { format } from 'date-fns';

export interface InvoiceWithDetails extends Invoice {
  customer: Customer | null;
  items: InvoiceItem[];
}

/**
 * Generate PDF invoice and return as buffer
 */
export async function generateInvoicePDF(invoiceData: InvoiceWithDetails): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Company Header
      doc
        .fontSize(24)
        .text(process.env.COMPANY_NAME || 'Your Company', 50, 50);

      doc
        .fontSize(10)
        .text(process.env.COMPANY_ADDRESS || '', 50, 85)
        .text(`${process.env.COMPANY_CITY}, ${process.env.COMPANY_STATE} - ${process.env.COMPANY_PINCODE}`, 50, 100)
        .text(`GST: ${process.env.COMPANY_GST}`, 50, 115)
        .text(`Email: ${process.env.COMPANY_EMAIL}`, 50, 130)
        .text(`Phone: ${process.env.COMPANY_PHONE}`, 50, 145);

      // Invoice Title
      doc
        .fontSize(20)
        .text('TAX INVOICE', 400, 50, { align: 'right' });

      // Invoice Details Box
      doc
        .fontSize(10)
        .text(`Invoice No: ${invoiceData.invoiceNumber}`, 400, 85, { align: 'right' })
        .text(`Date: ${format(new Date(invoiceData.invoiceDate), 'dd-MMM-yyyy')}`, 400, 100, { align: 'right' })
        .text(`Status: ${invoiceData.status.toUpperCase()}`, 400, 115, { align: 'right' });

      if (invoiceData.dueDate) {
        doc.text(`Due Date: ${format(new Date(invoiceData.dueDate), 'dd-MMM-yyyy')}`, 400, 130, { align: 'right' });
      }

      // Customer Details
      doc
        .fontSize(12)
        .text('Bill To:', 50, 180);

      doc
        .fontSize(10)
        .text(invoiceData.customer?.name || 'N/A', 50, 200)
        .text(invoiceData.customer?.address || '', 50, 215);

      if (invoiceData.customer?.city) {
        doc.text(`${invoiceData.customer.city}, ${invoiceData.customer.state} - ${invoiceData.customer.pincode}`, 50, 230);
      }

      if (invoiceData.customer?.gstNumber) {
        doc.text(`GST: ${invoiceData.customer.gstNumber}`, 50, 245);
      }

      if (invoiceData.customer?.phone) {
        doc.text(`Phone: ${invoiceData.customer.phone}`, 50, 260);
      }

      // Table Header
      const tableTop = 300;
      const itemCodeX = 50;
      const descriptionX = 120;
      const quantityX = 300;
      const rateX = 360;
      const gstX = 420;
      const amountX = 480;

      doc
        .fontSize(10)
        .rect(50, tableTop - 5, 495, 25)
        .fillAndStroke('#2B82D9', '#2B82D9')
        .fill('#FFFFFF')
        .text('HSN', itemCodeX + 5, tableTop + 5)
        .text('Description', descriptionX + 5, tableTop + 5)
        .text('Qty', quantityX + 5, tableTop + 5)
        .text('Rate', rateX + 5, tableTop + 5)
        .text('GST%', gstX + 5, tableTop + 5)
        .text('Amount', amountX + 5, tableTop + 5);

      // Table Items
      let y = tableTop + 30;
      doc.fill('#000000');

      invoiceData.items.forEach((item, index) => {
        const itemPrice = parseFloat(item.price.toString());
        const quantity = parseFloat(item.quantity.toString());
        const gstRate = parseFloat(item.gstRate.toString());
        const total = parseFloat(item.totalAmount.toString());

        // Add background for alternate rows
        if (index % 2 === 0) {
          doc.rect(50, y - 5, 495, 20).fillAndStroke('#F9FAFB', '#E8E8E8');
        }

        doc
          .fill('#000000')
          .fontSize(9)
          .text(item.hsnCode || '-', itemCodeX + 5, y, { width: 60 })
          .text(item.productName, descriptionX + 5, y, { width: 170 })
          .text(`${quantity} ${item.unit}`, quantityX + 5, y, { width: 50 })
          .text(`₹${itemPrice.toFixed(2)}`, rateX + 5, y, { width: 50 })
          .text(`${gstRate}%`, gstX + 5, y, { width: 50 })
          .text(`₹${total.toFixed(2)}`, amountX + 5, y, { width: 60, align: 'right' });

        y += 25;

        // Add new page if needed
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
      });

      // Totals Section
      y += 20;
      const totalsX = 370;

      doc
        .fontSize(10)
        .text('Subtotal:', totalsX, y)
        .text(`₹${parseFloat(invoiceData.subtotal.toString()).toFixed(2)}`, 480, y, { align: 'right' });

      y += 20;

      if (invoiceData.gstType === 'cgst_sgst') {
        doc
          .text('CGST:', totalsX, y)
          .text(`₹${parseFloat(invoiceData.cgstAmount?.toString() || '0').toFixed(2)}`, 480, y, { align: 'right' });
        y += 20;
        doc
          .text('SGST:', totalsX, y)
          .text(`₹${parseFloat(invoiceData.sgstAmount?.toString() || '0').toFixed(2)}`, 480, y, { align: 'right' });
      } else {
        doc
          .text('IGST:', totalsX, y)
          .text(`₹${parseFloat(invoiceData.igstAmount?.toString() || '0').toFixed(2)}`, 480, y, { align: 'right' });
      }

      y += 20;
      doc
        .fontSize(12)
        .rect(370, y - 5, 175, 25)
        .fillAndStroke('#2B82D9', '#2B82D9')
        .fill('#FFFFFF')
        .text('Total Amount:', totalsX + 5, y + 3)
        .text(`₹${parseFloat(invoiceData.totalAmount.toString()).toFixed(2)}`, 480, y + 3, { align: 'right' });

      // Notes
      if (invoiceData.notes) {
        y += 50;
        doc
          .fill('#000000')
          .fontSize(10)
          .text('Notes:', 50, y);
        doc
          .fontSize(9)
          .text(invoiceData.notes, 50, y + 15, { width: 495 });
      }

      // Footer
      doc
        .fontSize(8)
        .text(
          'This is a computer-generated invoice and does not require a signature.',
          50,
          750,
          { align: 'center', width: 495 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate filename for invoice PDF
 */
export function getInvoiceFilename(invoiceNumber: string): string {
  return `Invoice_${invoiceNumber.replace(/\//g, '-')}_${Date.now()}.pdf`;
}

export default {
  generateInvoicePDF,
  getInvoiceFilename,
};
