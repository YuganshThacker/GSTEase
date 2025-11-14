# GST Ease Suite

A comprehensive GST-compliant billing and inventory management system for Indian businesses.

## 🚀 Features

### Core Features
- ✅ **GST-Compliant Invoicing** - B2B & B2C invoices with CGST/SGST/IGST support
- 📦 **Inventory Management** - Track products with HSN codes, stock levels, and low-stock alerts
- 👥 **Customer Management** - Manage B2B and B2C customers with GST numbers
- 📊 **Dashboard Analytics** - Real-time insights on revenue, invoices, and inventory
- 🔐 **Secure Authentication** - JWT-based authentication with role-based access
- 📱 **Responsive Design** - Modern UI built with React and Tailwind CSS
- 🌓 **Dark/Light Mode** - Theme toggle for comfortable viewing

### 🚀 Advanced Features (NEW!)

#### 💳 Payment Integration
- ✅ **Razorpay Integration** - Auto-generate payment links for invoices
- ✅ **Real-time Payment Status** - Webhook-based status updates
- ✅ **Multiple Payment Methods** - UPI, Cards, Net Banking support

#### 📲 WhatsApp Integration
- ✅ **WhatsApp Invoice Sharing** - Send invoice PDFs via WhatsApp Business API
- ✅ **Payment Link Messaging** - Auto-send payment links to customers
- ✅ **Low Stock Alerts** - WhatsApp notifications for low inventory
- ✅ **Payment Reminders** - Automated reminders for overdue invoices
- ✅ **Delivery Tracking** - Read receipts and delivery confirmation

#### 📦 Smart Inventory
- ✅ **Auto Stock Deduction** - Automatic stock updates when invoices are created
- ✅ **Low Stock Alerts** - Email & WhatsApp notifications
- ✅ **Stock History** - Complete audit trail of all stock movements
- ✅ **Reorder Suggestions** - AI-powered reorder recommendations
- ✅ **Batch/Lot Management** - Track batch numbers and expiry dates

#### 📊 Accounting & Reports
- ✅ **Expense Tracking** - Record and categorize all business expenses
- ✅ **Profit & Loss** - Auto-generated P&L statements
- ✅ **Vendor Management** - Supplier master data and outstanding tracking
- ✅ **Purchase Orders** - Create POs and track goods received
- ✅ **Excel Export** - Export invoices, products, customers, and expenses

#### 📄 PDF & Documents
- ✅ **Professional PDF Invoices** - GST-compliant invoice generation
- ✅ **Custom Templates** - Branded invoices with company logo
- ✅ **Email Invoices** - Send PDFs via email automatically

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- TanStack Query (React Query)
- Wouter (routing)
- React Hook Form + Zod

### Backend
- Node.js + Express.js
- PostgreSQL (Neon Serverless)
- Drizzle ORM
- Replit Auth (OpenID Connect)

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL database
- npm or yarn

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and add your PostgreSQL connection string:

```env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=5000
NODE_ENV=development
```

**Database Options:**
- **Replit**: Database is auto-provisioned (no manual setup needed)
- **Neon**: Get a free serverless PostgreSQL at [neon.tech](https://neon.tech)
- **Local**: Install PostgreSQL locally

### 3. Initialize Database

Push the database schema:

```bash
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at:
- **Frontend & API**: http://localhost:5000

## 📦 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run check    # Run TypeScript type checking
npm run db:push  # Push schema changes to database
```

## 🗂️ Project Structure

```
GSTEaseSuite/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities
│   │   └── pages/       # Page components
│   └── public/          # Static assets
├── server/              # Express backend
│   ├── db.ts           # Database connection
│   ├── routes.ts       # API routes
│   ├── storage.ts      # Data access layer
│   └── replitAuth.ts   # Authentication
├── shared/              # Shared types and schemas
│   └── schema.ts       # Drizzle schema + Zod validation
└── Config files
```

## 🔌 API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user

### Products
- `GET /api/products` - List all products
- `GET /api/products/low-stock` - Get low stock items
- `POST /api/products` - Create product
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `PATCH /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Invoices
- `GET /api/invoices` - List all invoices
- `GET /api/invoices/recent` - Get recent invoices
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices` - Create invoice
- `PATCH /api/invoices/:id/status` - Update invoice status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🎨 Design System

The application follows a professional design system optimized for financial data:

- **Typography**: Inter (UI) + JetBrains Mono (numbers/amounts)
- **Colors**: Professional business theme with light/dark mode
- **Components**: 60+ shadcn/ui components
- **Spacing**: Consistent 2/4/6/8 unit scale

See `design_guidelines.md` for detailed design specifications.

## 🔐 Authentication

The app uses **Replit Auth** for authentication. When running on Replit, authentication is automatically configured. For local development, you may need to configure OAuth credentials.

## 🗄️ Database Schema

Core tables:
- **users** - User accounts with roles (admin/staff/accountant)
- **categories** - Product categories
- **products** - Inventory with HSN codes and GST rates
- **customers** - B2B/B2C customer records
- **invoices** - GST-compliant invoices
- **invoice_items** - Invoice line items
- **sessions** - Session storage (required for auth)

## 📝 License

MIT

## 🙋 Support

For questions and support, please refer to the documentation or open an issue.

---

**Built with ❤️ for Indian businesses**
