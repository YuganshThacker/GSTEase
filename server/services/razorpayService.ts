import Razorpay from 'razorpay';
import crypto from 'crypto';

// Function to check if Razorpay credentials are valid
function hasValidRazorpayCredentials(): boolean {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) return false;
  if (keyId === 'your_razorpay_key_id' || keySecret === 'your_razorpay_key_secret') return false;
  
  return true;
}

// Initialize Razorpay instance only if valid credentials are provided
let razorpayInstance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!hasValidRazorpayCredentials()) {
    throw new Error('Valid Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables, or use demo mode.');
  }
  
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });
  }
  
  return razorpayInstance;
}

export interface CreatePaymentLinkOptions {
  amount: number; // in rupees
  currency?: string;
  description: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  invoiceId: string;
  invoiceNumber: string;
  callbackUrl?: string;
  callbackMethod?: string;
}

export interface RazorpayPaymentLinkResponse {
  id: string;
  short_url: string;
  amount: number;
  currency: string;
  description: string;
  customer: any;
  status: string;
  created_at: number | string;
}

/**
 * Create a Razorpay payment link for an invoice
 */
export async function createPaymentLink(
  options: CreatePaymentLinkOptions
): Promise<RazorpayPaymentLinkResponse> {
  try {
    const {
      amount,
      currency = 'INR',
      description,
      customerName,
      customerEmail,
      customerPhone,
      invoiceId,
      invoiceNumber,
      callbackUrl,
      callbackMethod = 'get',
    } = options;

    // Amount must be in paise (smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const paymentLinkData: any = {
      amount: amountInPaise,
      currency,
      description: description || `Payment for Invoice ${invoiceNumber}`,
      customer: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },
      notify: {
        sms: true,
        email: true,
      },
      reminder_enable: true,
      notes: {
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
      },
      callback_url: callbackUrl || `${process.env.APP_URL}/api/payments/callback`,
      callback_method: callbackMethod,
    };

    const paymentLink = await getRazorpayInstance().paymentLink.create(paymentLinkData);
    return paymentLink as RazorpayPaymentLinkResponse;
  } catch (error: any) {
    console.error('Error creating Razorpay payment link:', error);
    throw new Error(`Failed to create payment link: ${error.message}`);
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  try {
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body.toString())
      .digest('hex');

    return expectedSignature === razorpaySignature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(
  webhookBody: string,
  webhookSignature: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
      .update(webhookBody)
      .digest('hex');

    return expectedSignature === webhookSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Fetch payment details from Razorpay
 */
export async function fetchPaymentDetails(paymentId: string) {
  try {
    const payment = await getRazorpayInstance().payments.fetch(paymentId);
    return payment;
  } catch (error: any) {
    console.error('Error fetching payment details:', error);
    throw new Error(`Failed to fetch payment details: ${error.message}`);
  }
}

/**
 * Cancel a payment link
 */
export async function cancelPaymentLink(paymentLinkId: string) {
  try {
    await getRazorpayInstance().paymentLink.cancel(paymentLinkId);
    return { success: true, message: 'Payment link cancelled successfully' };
  } catch (error: any) {
    console.error('Error cancelling payment link:', error);
    throw new Error(`Failed to cancel payment link: ${error.message}`);
  }
}

/**
 * Create Razorpay order (for checkout integration)
 */
export async function createOrder(amount: number, currency = 'INR', receipt?: string) {
  try {
    const amountInPaise = Math.round(amount * 100);
    
    const orderData = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {},
    };

    const order = await getRazorpayInstance().orders.create(orderData);
    return order;
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    throw new Error(`Failed to create order: ${error.message}`);
  }
}

export default {
  createPaymentLink,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchPaymentDetails,
  cancelPaymentLink,
  createOrder,
};
