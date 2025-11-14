# 🚀 Quick Setup Guide for Advanced Features

This guide will help you set up and configure all the advanced features in GST Ease Suite.

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL database
- Active internet connection (for API integrations)

## 🔧 Step-by-Step Configuration

### 1. Database Setup ✅

**Already Done!** The database schema has been updated with all new tables:
- ✅ payments
- ✅ vendors
- ✅ purchase_orders
- ✅ purchase_order_items
- ✅ expenses
- ✅ whatsapp_logs
- ✅ stock_history

### 2. Razorpay Payment Integration

#### a) Create Razorpay Account
1. Go to https://razorpay.com and sign up
2. Complete KYC verification
3. Get your API credentials from Dashboard → Settings → API Keys

#### b) Configure in .env
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

#### c) Set Up Webhook
1. In Razorpay Dashboard, go to Settings → Webhooks
2. Add webhook URL: `https://yourapp.com/api/payments/webhook`
3. Select events: `payment.authorized`, `payment.captured`, `payment.failed`
4. Copy the webhook secret to `.env`

#### d) Test Mode
Start with test keys (`rzp_test_*`) for development. Switch to live keys in production.

---

### 3. WhatsApp Business API Integration

#### Option A: WhatsApp Cloud API (Recommended)

1. **Create Meta Business Account**
   - Go to https://business.facebook.com
   - Create a business account

2. **Set Up WhatsApp Business API**
   - Visit https://developers.facebook.com
   - Create a new app → Business → WhatsApp
   - Get Phone Number ID and Access Token

3. **Configure in .env**
```env
WHATSAPP_BUSINESS_PHONE_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token_123
```

4. **Set Up Webhook**
   - Webhook URL: `https://yourapp.com/api/whatsapp/webhook`
   - Verify Token: Use the same as `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to: `messages`, `message_deliveries`, `message_reads`

#### Option B: Skip for Now
If you don't need WhatsApp immediately, leave these fields empty. The app will work without it.

---

### 4. Email Configuration (Gmail)

#### a) Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication

#### b) Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select app: Mail
3. Select device: Other (Custom name) → "GST Ease Suite"
4. Click Generate
5. Copy the 16-character password

#### c) Configure in .env
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
```

#### For Other Email Providers
- **Outlook:** smtp-mail.outlook.com (Port 587)
- **Yahoo:** smtp.mail.yahoo.com (Port 587)
- **Custom SMTP:** Use your provider's settings

---

### 5. Company Details

Update your company information in `.env`:

```env
COMPANY_NAME=Your Company Pvt Ltd
COMPANY_GST=29ABCDE1234F1Z5
COMPANY_ADDRESS=123, Business Street
COMPANY_CITY=Bangalore
COMPANY_STATE=Karnataka
COMPANY_PINCODE=560001
COMPANY_EMAIL=info@yourcompany.com
COMPANY_PHONE=+91-1234567890
```

These details will appear on PDF invoices and emails.

---

### 6. Application URLs

```env
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5000
```

**For Production:**
```env
APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

---

### 7. Admin Contact (for Alerts)

```env
ADMIN_PHONE=+919876543210
ADMIN_EMAIL=admin@yourcompany.com
```

These will receive low stock alerts and system notifications.

---

## 🧪 Testing the Features

### Test Razorpay Integration

```bash
# Use test card in Razorpay test mode
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
```

### Test WhatsApp (with Cloud API Test Number)

Meta provides a test number for development. You can send messages to your own WhatsApp number.

### Test Email

Send a test email to yourself to verify SMTP configuration.

---

## 📦 Install Additional Dependencies

All required dependencies are already installed:
- ✅ razorpay
- ✅ axios (for WhatsApp API)
- ✅ pdfkit (for PDF generation)
- ✅ exceljs (for Excel export)
- ✅ nodemailer (for email)

---

## 🚀 Start the Application

```bash
npm run dev
```

The server will start at http://localhost:5000

---

## 🎯 Feature Status After Configuration

| Feature | Configuration Required | Status |
|---------|----------------------|--------|
| JWT Authentication | ✅ Done | Ready |
| Dark Mode | ✅ Done | Ready |
| Inventory Management | ✅ Done | Ready |
| PDF Invoices | Company details in .env | Ready with defaults |
| Excel Export | None | Ready |
| Razorpay Payments | API keys needed | Optional |
| WhatsApp Messages | API access needed | Optional |
| Email Notifications | SMTP config needed | Optional |

---

## ⚡ Quick Start (Minimal Setup)

If you want to start immediately without external integrations:

1. **Update only these in .env:**
```env
# Database (already set)
DATABASE_URL=postgresql://localhost:5432/gstease

# Company Details (for PDF)
COMPANY_NAME=My Business
COMPANY_EMAIL=info@mybusiness.com
COMPANY_PHONE=+91-9876543210
```

2. **Start the app:**
```bash
npm run dev
```

3. **All features will work except:**
   - Payment links (can still record cash/UPI payments manually)
   - WhatsApp messaging (invoices can be downloaded and shared manually)
   - Email alerts (can be added later)

---

## 📝 Production Checklist

Before deploying to production:

- [ ] Switch Razorpay to live keys
- [ ] Get WhatsApp Business API approval (if using)
- [ ] Use production SMTP server
- [ ] Update APP_URL to production domain
- [ ] Set strong JWT_SECRET and SESSION_SECRET
- [ ] Enable HTTPS
- [ ] Set up automatic backups
- [ ] Configure webhook endpoints with proper authentication

---

## 🆘 Troubleshooting

### Razorpay Issues
- **Error: Invalid key**: Check if using correct test/live keys
- **Webhook not working**: Verify webhook secret matches

### WhatsApp Issues
- **403 Forbidden**: Check access token validity
- **Rate limit**: WhatsApp has messaging limits

### Email Issues
- **Authentication failed**: Use app password, not regular password
- **Connection timeout**: Check port (587 for TLS, 465 for SSL)

### Database Issues
- **Tables not found**: Run `npm run db:push` again
- **Connection error**: Verify DATABASE_URL

---

## 📚 Additional Resources

- **Razorpay Docs**: https://razorpay.com/docs
- **WhatsApp Cloud API**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **Nodemailer Guide**: https://nodemailer.com/about
- **PDF Generation**: https://pdfkit.org

---

## 🎉 You're All Set!

Your GST Ease Suite now has:
- ✅ Payment processing
- ✅ WhatsApp integration
- ✅ Smart inventory
- ✅ Expense tracking
- ✅ Purchase management
- ✅ Professional PDFs
- ✅ Excel exports

Start using it and grow your business! 🚀

---

**Need help?** Check `/docs` folder or create an issue on GitHub.
