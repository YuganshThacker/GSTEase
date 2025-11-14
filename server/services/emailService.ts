import nodemailer from 'nodemailer';

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn('⚠️  Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env file.');
    return false;
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email service configured and ready');
    return true;
  } catch (error) {
    console.error('❌ Email configuration verification failed:', error);
    return false;
  }
}

/**
 * Create email transporter
 */
function createTransporter() {
  if (!isEmailConfigured()) {
    throw new Error('Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD in your environment variables.');
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send low stock alert email
 */
export async function sendLowStockEmail(
  to: string,
  productName: string,
  currentStock: number,
  threshold: number
): Promise<void> {
  try {
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || 'GST Ease Suite'}" <${process.env.EMAIL_USER}>`,
      to,
      subject: `⚠️ Low Stock Alert - ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">⚠️ Low Stock Alert</h2>
          <p>The following product is running low on stock:</p>
          <div style="background-color: #FEE2E2; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Product:</strong> ${productName}<br>
            <strong>Current Stock:</strong> ${currentStock}<br>
            <strong>Threshold:</strong> ${threshold}
          </div>
          <p>Please reorder stock soon to avoid stockouts.</p>
          <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
            This is an automated alert from ${process.env.COMPANY_NAME || 'GST Ease Suite'}
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending low stock email:', error);
    throw error;
  }
}

/**
 * Send invoice email with PDF attachment
 */
export async function sendInvoiceEmail(
  to: string,
  customerName: string,
  invoiceNumber: string,
  amount: number,
  pdfBuffer: Buffer,
  paymentLink?: string
): Promise<void> {
  try {
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || 'GST Ease Suite'}" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Invoice ${invoiceNumber} from ${process.env.COMPANY_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2B82D9;">Invoice Generated</h2>
          <p>Dear ${customerName},</p>
          <p>Your invoice has been generated. Please find the details below:</p>
          <div style="background-color: #F0F9FF; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Invoice Number:</strong> ${invoiceNumber}<br>
            <strong>Amount:</strong> ₹${amount.toFixed(2)}
          </div>
          ${
            paymentLink
              ? `<p><a href="${paymentLink}" style="background-color: #2B82D9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Pay Now</a></p>`
              : ''
          }
          <p>The invoice PDF is attached to this email.</p>
          <p>Thank you for your business!</p>
          <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
            ${process.env.COMPANY_NAME || 'Your Company'}<br>
            ${process.env.COMPANY_EMAIL}
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice_${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  to: string,
  customerName: string,
  invoiceNumber: string,
  amount: number,
  transactionId: string
): Promise<void> {
  try {
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || 'GST Ease Suite'}" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Payment Received - Invoice ${invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16A34A;">✅ Payment Received</h2>
          <p>Dear ${customerName},</p>
          <p>We have received your payment. Thank you!</p>
          <div style="background-color: #DCFCE7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Invoice Number:</strong> ${invoiceNumber}<br>
            <strong>Amount Paid:</strong> ₹${amount.toFixed(2)}<br>
            <strong>Transaction ID:</strong> ${transactionId}
          </div>
          <p>If you have any questions, please contact us.</p>
          <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
            ${process.env.COMPANY_NAME || 'Your Company'}<br>
            ${process.env.COMPANY_EMAIL}
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    throw error;
  }
}

export default {
  sendLowStockEmail,
  sendInvoiceEmail,
  sendPaymentConfirmationEmail,
  isEmailConfigured,
  verifyEmailConfig,
};
