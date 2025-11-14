import crypto from 'crypto';
import type { CreatePaymentLinkOptions, RazorpayPaymentLinkResponse } from './razorpayService';

/**
 * Mock Payment Service for Development/Demo
 * This service simulates payment link creation without requiring actual Razorpay API keys
 * Perfect for presentations and development
 */

// In-memory storage for demo payment links
const mockPaymentLinks = new Map<string, any>();

/**
 * Check if we should use mock payment service
 */
export function useMockPayments(): boolean {
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
  
  // Use mock if keys are not set or are placeholder values
  if (!razorpayKeyId || !razorpayKeySecret) {
    return true;
  }
  
  if (
    razorpayKeyId === 'your_razorpay_key_id' ||
    razorpayKeySecret === 'your_razorpay_key_secret'
  ) {
    return true;
  }
  
  // Also check for explicit demo mode
  if (process.env.USE_MOCK_PAYMENTS === 'true') {
    return true;
  }
  
  return false;
}

/**
 * Generate a mock payment link ID
 */
function generateMockId(): string {
  return 'plink_' + crypto.randomBytes(12).toString('hex');
}

/**
 * Create a mock payment link for demo purposes
 */
export async function createMockPaymentLink(
  options: CreatePaymentLinkOptions
): Promise<RazorpayPaymentLinkResponse> {
  const {
    amount,
    currency = 'INR',
    description,
    customerName,
    customerEmail,
    customerPhone,
    invoiceId,
    invoiceNumber,
  } = options;

  const paymentLinkId = generateMockId();
  const shortUrl = `${process.env.APP_URL || 'http://localhost:5000'}/demo/pay/${paymentLinkId}`;

  const paymentLink = {
    id: paymentLinkId,
    short_url: shortUrl,
    amount: Math.round(amount * 100), // Convert to paise
    currency,
    description: description || `Payment for Invoice ${invoiceNumber}`,
    customer: {
      name: customerName,
      email: customerEmail,
      contact: customerPhone,
    },
    status: 'created',
    created_at: Date.now(),
    invoice_id: invoiceId,
    invoice_number: invoiceNumber,
  };

  // Store in memory for potential retrieval
  mockPaymentLinks.set(paymentLinkId, paymentLink);

  console.log(`🎭 [DEMO MODE] Created mock payment link: ${shortUrl}`);
  console.log(`   Amount: ₹${amount.toFixed(2)}, Invoice: ${invoiceNumber}`);

  return paymentLink as RazorpayPaymentLinkResponse;
}

/**
 * Get a mock payment link by ID
 */
export function getMockPaymentLink(paymentLinkId: string) {
  return mockPaymentLinks.get(paymentLinkId);
}

/**
 * Mock payment verification (always returns true for demo)
 */
export function verifyMockPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  console.log(`🎭 [DEMO MODE] Mock payment verification - always returns true`);
  return true;
}

/**
 * Mock webhook verification (always returns true for demo)
 */
export function verifyMockWebhookSignature(
  webhookBody: string,
  webhookSignature: string
): boolean {
  console.log(`🎭 [DEMO MODE] Mock webhook verification - always returns true`);
  return true;
}

/**
 * Simulate a successful payment for testing
 */
export async function simulatePayment(paymentLinkId: string) {
  const paymentLink = mockPaymentLinks.get(paymentLinkId);
  
  if (!paymentLink) {
    throw new Error('Payment link not found');
  }

  const mockPaymentId = 'pay_' + crypto.randomBytes(12).toString('hex');
  
  console.log(`🎭 [DEMO MODE] Simulated successful payment: ${mockPaymentId}`);
  
  return {
    id: mockPaymentId,
    order_id: paymentLinkId,
    amount: paymentLink.amount,
    currency: paymentLink.currency,
    status: 'captured',
    method: 'card',
    captured: true,
    email: paymentLink.customer.email,
    contact: paymentLink.customer.contact,
    created_at: Date.now(),
  };
}

/**
 * Cancel a mock payment link
 */
export async function cancelMockPaymentLink(paymentLinkId: string) {
  const paymentLink = mockPaymentLinks.get(paymentLinkId);
  
  if (paymentLink) {
    paymentLink.status = 'cancelled';
    mockPaymentLinks.set(paymentLinkId, paymentLink);
  }
  
  console.log(`🎭 [DEMO MODE] Cancelled mock payment link: ${paymentLinkId}`);
  
  return { 
    success: true, 
    message: 'Mock payment link cancelled successfully' 
  };
}

export default {
  useMockPayments,
  createMockPaymentLink,
  getMockPaymentLink,
  verifyMockPaymentSignature,
  verifyMockWebhookSignature,
  simulatePayment,
  cancelMockPaymentLink,
};
