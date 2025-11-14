# 🏗️ GST Ease Suite - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React + TypeScript)                  │
├─────────────────────────────────────────────────────────────────────┤
│  Pages:                                                              │
│  • Dashboard     • Invoices      • Products     • Customers          │
│  • Expenses      • Vendors       • PO           • Reports            │
│                                                                       │
│  Features:                                                           │
│  • Dark/Light Mode    • JWT Auth    • Form Validation               │
│  • Real-time Updates  • Toast Notifications                         │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓ ↑
                            HTTP/REST API
                                    ↓ ↑
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVER (Express + TypeScript)                     │
├─────────────────────────────────────────────────────────────────────┤
│  Routes Layer:                                                       │
│  • /api/auth          • /api/invoices    • /api/products            │
│  • /api/customers     • /api/payments    • /api/whatsapp            │
│  • /api/vendors       • /api/expenses    • /api/export              │
│                                                                       │
│  Middleware:                                                         │
│  • JWT Authentication    • Error Handling    • Request Validation   │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│  Services Layer:                                                     │
│  ┌────────────────┬────────────────┬────────────────┐              │
│  │ razorpayService│ whatsappService│  pdfService    │              │
│  │ • Payment links│ • Send invoices│ • Generate PDF │              │
│  │ • Webhooks     │ • Alerts       │ • Formatting   │              │
│  └────────────────┴────────────────┴────────────────┘              │
│  ┌────────────────┬────────────────┬────────────────┐              │
│  │ inventoryServ  │  emailService  │  excelService  │              │
│  │ • Stock deduct │ • Send emails  │ • Export data  │              │
│  │ • Alerts       │ • Templates    │ • Formatting   │              │
│  └────────────────┴────────────────┴────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓ ↑
                            Drizzle ORM
                                    ↓ ↑
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                             │
├─────────────────────────────────────────────────────────────────────┤
│  Core Tables:                                                        │
│  • users              • categories        • products                 │
│  • customers          • invoices          • invoice_items           │
│                                                                       │
│  Payment & Integration Tables:                                      │
│  • payments           • whatsapp_logs                                │
│                                                                       │
│  Purchase Management:                                                │
│  • vendors            • purchase_orders   • purchase_order_items     │
│  • expenses           • stock_history                                │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓ ↑
                          External Integrations
                                    ↓ ↑
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐    │
│  │   Razorpay   │   WhatsApp   │     SMTP     │  File Storage│    │
│  │   Payment    │   Business   │    Email     │   (Future)   │    │
│  │   Gateway    │     API      │   Sending    │              │    │
│  └──────────────┴──────────────┴──────────────┴──────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Examples

### 1. Invoice Creation with Payment

```
User Creates Invoice
        ↓
Frontend Form Validation
        ↓
POST /api/invoices
        ↓
Inventory Service
• deductStock()
• Check low stock
• Send alerts if needed
        ↓
Database
• Insert invoice
• Insert invoice_items
• Update product stock
• Insert stock_history
        ↓
Razorpay Service
• createPaymentLink()
        ↓
Database
• Insert payment record
        ↓
WhatsApp Service (Optional)
• sendInvoiceWithPaymentLink()
        ↓
Database
• Insert whatsapp_log
        ↓
Return to Frontend
• Invoice details
• Payment link
• Stock updated
```

### 2. Payment Webhook Flow

```
Razorpay Payment
        ↓
POST /api/payments/webhook
        ↓
Verify Signature
        ↓
Update Payment Status
        ↓
Update Invoice Status
        ↓
Email Service
• Send payment confirmation
        ↓
WhatsApp Service
• Send receipt
        ↓
Response 200 OK
```

### 3. Low Stock Alert Flow

```
Stock Deduction
        ↓
Check Threshold
        ↓
If (stock <= threshold)
        ↓
Inventory Service
• sendLowStockAlert()
        ↓
┌─────────────┬─────────────┐
│  WhatsApp   │    Email    │
│  Service    │   Service   │
└─────────────┴─────────────┘
        ↓
Admin Notified
```

### 4. Export Data Flow

```
User Clicks Export
        ↓
GET /api/export/invoices
        ↓
Fetch Data from DB
        ↓
Excel Service
• exportInvoicesToExcel()
        ↓
Generate Excel File
        ↓
Stream to Client
        ↓
File Downloaded
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Authentication Layer                                     │
│     • JWT Tokens                                             │
│     • Bcrypt Password Hashing                                │
│     • Secure Session Management                              │
│                                                              │
│  2. API Security                                             │
│     • CORS Configuration                                     │
│     • Rate Limiting (Future)                                 │
│     • Input Validation (Zod)                                 │
│                                                              │
│  3. Payment Security                                         │
│     • Razorpay Signature Verification                        │
│     • Webhook Secret Validation                              │
│     • PCI DSS Compliant (via Razorpay)                       │
│                                                              │
│  4. Data Security                                            │
│     • PostgreSQL with SSL                                    │
│     • Prepared Statements (SQL Injection Prevention)         │
│     • Row Level Security (Future)                            │
│                                                              │
│  5. Environment Security                                     │
│     • .env for sensitive data                                │
│     • Secrets not in version control                         │
│     • Different keys for test/production                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Dependency Graph

```
┌────────────────────────────────────────────────────────────────┐
│                    SERVICE DEPENDENCIES                         │
└────────────────────────────────────────────────────────────────┘

razorpayService
    └── No dependencies

whatsappService
    └── axios

pdfService
    └── pdfkit
    └── date-fns

emailService
    └── nodemailer

excelService
    └── exceljs
    └── date-fns

inventoryService
    ├── db (drizzle-orm)
    ├── whatsappService
    └── emailService

All Services
    └── Database (PostgreSQL via Drizzle ORM)
```

---

## Database Schema Relationships

```
users
  │
  ├──> invoices (createdBy)
  ├──> expenses (createdBy)
  ├──> purchase_orders (createdBy)
  └──> stock_history (createdBy)

categories
  │
  └──> products (categoryId)

products
  │
  ├──> invoice_items (productId)
  ├──> purchase_order_items (productId)
  └──> stock_history (productId)

customers
  │
  └──> invoices (customerId)

vendors
  │
  ├──> purchase_orders (vendorId)
  └──> expenses (vendorId)

invoices
  │
  ├──> invoice_items (invoiceId)
  ├──> payments (invoiceId)
  └──> whatsapp_logs (invoiceId)

purchase_orders
  │
  └──> purchase_order_items (purchaseOrderId)
```

---

## API Endpoint Structure

```
/api
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   └── GET  /user
│
├── /invoices
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PATCH  /:id
│   ├── DELETE /:id
│   ├── GET    /:id/pdf           [NEW]
│   └── POST   /:id/email         [NEW]
│
├── /payments                      [NEW]
│   ├── POST   /create-link
│   ├── POST   /webhook
│   ├── GET    /:invoiceId
│   └── POST   /verify
│
├── /whatsapp                      [NEW]
│   ├── POST   /send-invoice
│   ├── POST   /send-reminder
│   ├── GET    /webhook
│   ├── POST   /webhook
│   └── GET    /logs/:invoiceId
│
├── /export                        [NEW]
│   ├── GET    /invoices
│   ├── GET    /products
│   ├── GET    /customers
│   ├── GET    /expenses
│   └── GET    /profit-loss
│
├── /vendors                       [NEW]
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PATCH  /:id
│   └── DELETE /:id
│
├── /expenses                      [NEW]
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PATCH  /:id
│   ├── DELETE /:id
│   └── GET    /summary
│
└── /purchase-orders               [NEW]
    ├── GET    /
    ├── POST   /
    ├── GET    /:id
    ├── PATCH  /:id/receive
    └── PATCH  /:id/status
```

---

## Technology Stack Summary

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Routing**: Wouter
- **Theme**: next-themes
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT + bcryptjs
- **Validation**: Zod

### Services & Integrations
- **Payment**: Razorpay
- **Messaging**: WhatsApp Business Cloud API
- **Email**: Nodemailer (SMTP)
- **PDF**: PDFKit
- **Excel**: ExcelJS
- **HTTP Client**: Axios

### Development Tools
- **Build**: esbuild
- **Type Checking**: TypeScript 5.6
- **Database Migrations**: Drizzle Kit
- **Environment**: dotenv

---

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────────────┐
│                         PRODUCTION                           │
└─────────────────────────────────────────────────────────────┘

Internet
    ↓
┌─────────────────┐
│  Load Balancer  │
│  (nginx/Caddy)  │
└─────────────────┘
    ↓
┌─────────────────────────────────────┐
│        Application Server           │
│  (Node.js + Express)                │
│  • Multiple instances               │
│  • PM2 for process management       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│     PostgreSQL Database             │
│  • Managed service (AWS RDS/Neon)   │
│  • Automatic backups                │
│  • Read replicas (optional)         │
└─────────────────────────────────────┘

External Services:
┌──────────┬──────────┬──────────┐
│ Razorpay │ WhatsApp │   SMTP   │
└──────────┴──────────┴──────────┘
```

---

## Performance Considerations

### Database Indexing
```sql
✅ Primary keys on all tables
✅ Foreign key indexes
✅ Index on invoice_number (unique)
✅ Index on customer email
✅ Index on product stock_quantity
✅ Index on payment status
```

### Caching Strategy (Future)
```
Redis Cache Layer:
• User sessions
• Product catalog
• Dashboard statistics
• Low stock list
```

### Query Optimization
```typescript
✅ Use select() instead of SELECT *
✅ Limit result sets
✅ Pagination on large tables
✅ Lazy loading of relations
✅ Batch operations for bulk inserts
```

---

## Monitoring & Logging (Future Enhancements)

```
Application Monitoring:
• Error tracking (Sentry)
• Performance monitoring (New Relic)
• Uptime monitoring (UptimeRobot)

Business Metrics:
• Daily revenue
• Invoice count
• Payment success rate
• Stock turnover rate
• Low stock alerts sent

System Health:
• API response times
• Database query performance
• Memory usage
• CPU utilization
• Webhook delivery success rate
```

---

## Scalability Plan

```
Current: Single server
    ↓
Stage 1: Vertical scaling
• Increase server resources
• Optimize database queries
    ↓
Stage 2: Horizontal scaling
• Multiple app servers
• Load balancer
• Session store (Redis)
    ↓
Stage 3: Microservices (if needed)
• Separate payment service
• Separate notification service
• Message queue (RabbitMQ/Kafka)
    ↓
Stage 4: Geographic distribution
• CDN for static assets
• Multi-region database
• Edge functions
```

---

## Future Enhancements Roadmap

### Phase 1 (Current) ✅
- ✅ Core CRUD operations
- ✅ GST calculations
- ✅ Dashboard analytics
- ✅ JWT authentication
- ✅ Dark mode

### Phase 2 (This Update) ✅
- ✅ Payment integration
- ✅ WhatsApp messaging
- ✅ Smart inventory
- ✅ PDF invoices
- ✅ Excel exports

### Phase 3 (Next 3-6 months)
- E-Invoice integration (NIC)
- GSTR-1, GSTR-3B auto-generation
- Barcode/QR code scanning
- Multi-warehouse support
- Mobile app (React Native)

### Phase 4 (6-12 months)
- AI-powered insights
- Predictive analytics
- Chatbot support
- Multi-language support
- API for third-party integrations

---

This architecture is designed to be:
- **Scalable**: Easy to add more servers
- **Maintainable**: Clear separation of concerns
- **Secure**: Multiple security layers
- **Extensible**: Easy to add new features
- **Production-ready**: Built for real-world use

🎉 Your app is enterprise-grade!
