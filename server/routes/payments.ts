import express, { Request, Response } from 'express';
import { db } from '../db';
import { payments, invoices } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import * as razorpayService from '../services/razorpayService';
import * as mockPaymentService from '../services/mockPaymentService';

const router = express.Router();

/**
 * Create payment link for an invoice
 */
router.post('/create-link', async (req: Request, res: Response) => {
  try {
    const { invoiceId, customerId, customerName, customerEmail, customerPhone } = req.body;

    // Get invoice details
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check if we should use mock payment service
    const useMock = mockPaymentService.useMockPayments();
    
    let paymentLink: any;
    
    if (useMock) {
      console.log('🎭 Using DEMO payment service (no Razorpay keys configured)');
      
      // Create mock payment link
      paymentLink = await mockPaymentService.createMockPaymentLink({
        amount: parseFloat(invoice.totalAmount.toString()),
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
        customerName,
        customerEmail,
        customerPhone,
      });
    } else {
      console.log('💳 Using real Razorpay payment service');
      
      // Create real payment link
      paymentLink = await razorpayService.createPaymentLink({
        amount: parseFloat(invoice.totalAmount.toString()),
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
        customerName,
        customerEmail,
        customerPhone,
      });
    }

    // Save payment record
    const [payment] = await db
      .insert(payments)
      .values({
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        paymentMethod: useMock ? 'other' : 'razorpay',
        paymentStatus: 'pending',
        razorpayOrderId: paymentLink.id,
        paymentLink: paymentLink.short_url,
      })
      .returning();

    res.status(201).json({
      success: true,
      payment,
      paymentLink: paymentLink.short_url,
      isDemoMode: useMock,
    });
  } catch (error: any) {
    console.error('Error creating payment link:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment link' });
  }
});

/**
 * Razorpay webhook handler
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const webhookBody = JSON.stringify(req.body);
    const webhookSignature = req.headers['x-razorpay-signature'] as string;

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(webhookBody, webhookSignature);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload.payment.entity;

    // Handle different payment events
    if (event === 'payment.captured' || event === 'payment.authorized') {
      const razorpayPaymentId = payload.id;
      const razorpayOrderId = payload.order_id;

      // Update payment record
      await db
        .update(payments)
        .set({
          paymentStatus: 'completed',
          razorpayPaymentId,
          paymentDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.razorpayOrderId, razorpayOrderId));

      // Update invoice status
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.razorpayOrderId, razorpayOrderId))
        .limit(1);

      if (payment) {
        await db
          .update(invoices)
          .set({
            status: 'paid',
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, payment.invoiceId));
      }
    } else if (event === 'payment.failed') {
      const razorpayOrderId = payload.order_id;

      await db
        .update(payments)
        .set({
          paymentStatus: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(payments.razorpayOrderId, razorpayOrderId));
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Get payment details for an invoice
 */
router.get('/:invoiceId', async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;

    const paymentRecords = await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId));

    res.json(paymentRecords);
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

/**
 * Verify payment signature (for checkout integration)
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const isValid = razorpayService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (isValid) {
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
