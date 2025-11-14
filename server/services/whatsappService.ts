import axios from 'axios';

/**
 * WhatsApp Business Cloud API Service
 * Send invoices and alerts via WhatsApp
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

export interface SendMessageOptions {
  to: string;
  message: string;
  mediaUrl?: string;
  mediaType?: 'document' | 'image';
  fileName?: string;
}

/**
 * Format phone number for WhatsApp (remove special characters, add country code if needed)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present (assuming India +91)
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  return cleaned;
}

/**
 * Send text message via WhatsApp
 */
export async function sendTextMessage(to: string, message: string): Promise<any> {
  try {
    const phoneNumberId = process.env.WHATSAPP_BUSINESS_PHONE_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      throw new Error('WhatsApp credentials not configured');
    }

    const formattedPhone = formatPhoneNumber(to);

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw new Error(`Failed to send WhatsApp message: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Send document (PDF invoice) via WhatsApp
 */
export async function sendDocument(
  to: string,
  documentUrl: string,
  fileName: string,
  caption?: string
): Promise<any> {
  try {
    const phoneNumberId = process.env.WHATSAPP_BUSINESS_PHONE_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      throw new Error('WhatsApp credentials not configured');
    }

    const formattedPhone = formatPhoneNumber(to);

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'document',
        document: {
          link: documentUrl,
          filename: fileName,
          caption: caption || '',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error sending WhatsApp document:', error.response?.data || error.message);
    throw new Error(`Failed to send WhatsApp document: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Send invoice via WhatsApp with payment link
 */
export async function sendInvoiceWithPaymentLink(
  to: string,
  invoiceNumber: string,
  amount: number,
  paymentLink: string,
  customerName: string
): Promise<any> {
  try {
    const message = `Hello ${customerName},\n\n` +
      `Your invoice ${invoiceNumber} for ₹${amount.toFixed(2)} has been generated.\n\n` +
      `Please click the link below to make payment:\n${paymentLink}\n\n` +
      `Thank you for your business!\n` +
      `- ${process.env.COMPANY_NAME || 'Your Company'}`;

    return await sendTextMessage(to, message);
  } catch (error) {
    console.error('Error sending invoice WhatsApp message:', error);
    throw error;
  }
}

/**
 * Send low stock alert via WhatsApp
 */
export async function sendLowStockAlert(
  to: string,
  productName: string,
  currentStock: number,
  threshold: number
): Promise<any> {
  try {
    const message = `⚠️ LOW STOCK ALERT\n\n` +
      `Product: ${productName}\n` +
      `Current Stock: ${currentStock}\n` +
      `Threshold: ${threshold}\n\n` +
      `Please reorder stock soon.\n\n` +
      `- ${process.env.COMPANY_NAME || 'GST Ease Suite'}`;

    return await sendTextMessage(to, message);
  } catch (error) {
    console.error('Error sending low stock alert:', error);
    throw error;
  }
}

/**
 * Send payment reminder via WhatsApp
 */
export async function sendPaymentReminder(
  to: string,
  invoiceNumber: string,
  amount: number,
  dueDate: Date,
  customerName: string,
  paymentLink?: string
): Promise<any> {
  try {
    const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysOverdue > 0;

    let message = `Hello ${customerName},\n\n`;
    
    if (isOverdue) {
      message += `⚠️ PAYMENT OVERDUE\n\n`;
      message += `Your invoice ${invoiceNumber} for ₹${amount.toFixed(2)} is overdue by ${daysOverdue} days.\n\n`;
    } else {
      message += `Friendly reminder that payment for invoice ${invoiceNumber} of ₹${amount.toFixed(2)} is due.\n\n`;
    }

    if (paymentLink) {
      message += `Please click here to make payment:\n${paymentLink}\n\n`;
    }

    message += `Thank you for your prompt attention.\n`;
    message += `- ${process.env.COMPANY_NAME || 'Your Company'}`;

    return await sendTextMessage(to, message);
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    throw error;
  }
}

/**
 * Verify WhatsApp webhook (for Meta verification)
 */
export function verifyWebhook(mode: string, token: string, challenge: string): string | null {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    return challenge;
  }

  return null;
}

/**
 * Process WhatsApp webhook events (delivery receipts, read receipts, etc.)
 */
export function processWebhookEvent(body: any): any {
  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      return null;
    }

    // Handle status updates (sent, delivered, read)
    if (value.statuses) {
      return {
        type: 'status',
        statuses: value.statuses.map((status: any) => ({
          id: status.id,
          status: status.status, // sent, delivered, read, failed
          timestamp: status.timestamp,
          recipientId: status.recipient_id,
        })),
      };
    }

    // Handle incoming messages (for future interactive features)
    if (value.messages) {
      return {
        type: 'message',
        messages: value.messages.map((message: any) => ({
          from: message.from,
          id: message.id,
          timestamp: message.timestamp,
          type: message.type,
          text: message.text?.body,
        })),
      };
    }

    return null;
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    return null;
  }
}

export default {
  sendTextMessage,
  sendDocument,
  sendInvoiceWithPaymentLink,
  sendLowStockAlert,
  sendPaymentReminder,
  verifyWebhook,
  processWebhookEvent,
  formatPhoneNumber,
};
