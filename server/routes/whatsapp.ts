import express, { Request, Response } from 'express';
import { db } from '../db';
import { whatsappLogs, invoices, customers } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import * as whatsappService from '../services/whatsappService';
import * as pdfService from '../services/pdfService';

const router = express.Router();

/**
 * Send invoice via WhatsApp
 */
router.post('/send-invoice', async (req: Request, res: Response) => {
  try {
    const { invoiceId, phone, paymentLink } = req.body;

    // Get invoice with customer details
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get customer details
    let customerName = 'Customer';
    if (invoice.customerId) {
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, invoice.customerId))
        .limit(1);
      
      if (customer) {
        customerName = customer.name;
      }
    }

    // Send WhatsApp message
    const result = await whatsappService.sendInvoiceWithPaymentLink(
      phone,
      invoice.invoiceNumber,
      parseFloat(invoice.totalAmount.toString()),
      paymentLink || '',
      customerName
    );

    // Log WhatsApp message
    await db.insert(whatsappLogs).values({
      invoiceId: invoice.id,
      recipientPhone: phone,
      messageType: 'invoice',
      messageContent: `Invoice ${invoice.invoiceNumber} sent`,
      status: 'sent',
      sentAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Invoice sent via WhatsApp',
      result,
    });
  } catch (error: any) {
    console.error('Error sending WhatsApp invoice:', error);
    
    // Log failed attempt
    try {
      await db.insert(whatsappLogs).values({
        invoiceId: req.body.invoiceId,
        recipientPhone: req.body.phone,
        messageType: 'invoice',
        status: 'failed',
        errorMessage: error.message,
      });
    } catch (logError) {
      console.error('Error logging WhatsApp failure:', logError);
    }

    res.status(500).json({ error: error.message || 'Failed to send WhatsApp message' });
  }
});

/**
 * Send payment reminder
 */
router.post('/send-reminder', async (req: Request, res: Response) => {
  try {
    const { invoiceId, phone, paymentLink } = req.body;

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get customer details
    let customerName = 'Customer';
    if (invoice.customerId) {
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, invoice.customerId))
        .limit(1);
      
      if (customer) {
        customerName = customer.name;
      }
    }

    const result = await whatsappService.sendPaymentReminder(
      phone,
      invoice.invoiceNumber,
      parseFloat(invoice.totalAmount.toString()),
      invoice.dueDate || new Date(),
      customerName,
      paymentLink
    );

    await db.insert(whatsappLogs).values({
      invoiceId: invoice.id,
      recipientPhone: phone,
      messageType: 'reminder',
      messageContent: `Payment reminder for ${invoice.invoiceNumber}`,
      status: 'sent',
      sentAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Reminder sent via WhatsApp',
      result,
    });
  } catch (error: any) {
    console.error('Error sending reminder:', error);
    res.status(500).json({ error: error.message || 'Failed to send reminder' });
  }
});

/**
 * Get WhatsApp logs for an invoice
 */
router.get('/logs/:invoiceId', async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;

    const logs = await db
      .select()
      .from(whatsappLogs)
      .where(eq(whatsappLogs.invoiceId, invoiceId));

    res.json(logs);
  } catch (error: any) {
    console.error('Error fetching WhatsApp logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

/**
 * WhatsApp webhook verification (GET)
 */
router.get('/webhook', (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    const verifiedChallenge = whatsappService.verifyWebhook(mode, token, challenge);

    if (verifiedChallenge) {
      res.status(200).send(verifiedChallenge);
    } else {
      res.status(403).send('Verification failed');
    }
  } catch (error) {
    console.error('Error verifying webhook:', error);
    res.status(500).send('Verification error');
  }
});

/**
 * WhatsApp webhook handler (POST)
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const webhookData = whatsappService.processWebhookEvent(req.body);

    if (webhookData && webhookData.type === 'status') {
      // Update message status in database
      for (const status of webhookData.statuses) {
        // You can update the whatsapp_logs table based on message ID
        console.log('WhatsApp status update:', status);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
