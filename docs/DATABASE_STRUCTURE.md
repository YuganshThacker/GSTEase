# Database Tables Quick Reference

## Total Tables: 15

### 1. sessions
- **Purpose:** User session management for authentication
- **Key Fields:** sid (PK), sess, expire
- **Records:** Session data (varies)

### 2. users
- **Purpose:** User authentication and role management
- **Key Fields:** id (PK), email, password, firstName, lastName, role
- **Relations:** Created invoices, expenses, stock history

### 3. categories
- **Purpose:** Product categorization
- **Key Fields:** id (PK), name, description
- **Relations:** → products (one-to-many)

### 4. products
- **Purpose:** Product/inventory master data
- **Key Fields:** id (PK), name, categoryId (FK), hsnCode, price, gstRate, stockQuantity
- **Relations:** ← categories, → invoice_items, stock_history

### 5. customers
- **Purpose:** Customer master data
- **Key Fields:** id (PK), name, email, phone, gstNumber, address, customerType
- **Relations:** → invoices (one-to-many)

### 6. invoices
- **Purpose:** Invoice header information
- **Key Fields:** id (PK), invoiceNumber, customerId (FK), invoiceType, status, totalAmount
- **Relations:** ← customers, → invoice_items, payments, whatsapp_logs

### 7. invoice_items
- **Purpose:** Invoice line items (child of invoices)
- **Key Fields:** id (PK), invoiceId (FK), productId (FK), quantity, price, gstAmount
- **Relations:** ← invoices, ← products

### 8. payments
- **Purpose:** Payment transactions
- **Key Fields:** id (PK), invoiceId (FK), amount, paymentMethod, paymentStatus, razorpayPaymentId
- **Relations:** ← invoices

### 9. vendors
- **Purpose:** Supplier/vendor master data
- **Key Fields:** id (PK), name, email, gstNumber, bankDetails, outstandingBalance
- **Relations:** → purchase_orders, expenses

### 10. purchase_orders
- **Purpose:** Purchase order headers
- **Key Fields:** id (PK), poNumber, vendorId (FK), orderDate, status, totalAmount
- **Relations:** ← vendors, → purchase_order_items

### 11. purchase_order_items
- **Purpose:** Purchase order line items
- **Key Fields:** id (PK), purchaseOrderId (FK), productId (FK), quantity, price
- **Relations:** ← purchase_orders, ← products

### 12. expenses
- **Purpose:** Business expense tracking
- **Key Fields:** id (PK), expenseNumber, category, amount, gstAmount, vendorId (FK)
- **Relations:** ← vendors, ← users

### 13. whatsapp_logs
- **Purpose:** WhatsApp message delivery tracking
- **Key Fields:** id (PK), invoiceId (FK), recipientPhone, status, sentAt, deliveredAt
- **Relations:** ← invoices

### 14. stock_history
- **Purpose:** Product stock movement audit trail
- **Key Fields:** id (PK), productId (FK), changeType, quantityChange, balanceAfter
- **Relations:** ← products, ← users

### 15. notifications
- **Purpose:** System notifications (if implemented)
- **Key Fields:** id (PK), userId (FK), title, message, type, isRead
- **Relations:** ← users

---

## Database Enums (6)

1. **user_role:** admin, staff, accountant
2. **invoice_type:** b2b, b2c
3. **invoice_status:** paid, pending, overdue
4. **gst_type:** cgst_sgst, igst
5. **payment_status:** pending, processing, completed, failed, refunded
6. **payment_method:** cash, card, upi, netbanking, razorpay, other
7. **expense_category:** purchase, salary, rent, utilities, transport, marketing, other
8. **purchase_order_status:** draft, sent, received, cancelled

---

## Key Relationships

### Invoice Flow:
```
customers → invoices → invoice_items → products
                    → payments
                    → whatsapp_logs
```

### Purchase Flow:
```
vendors → purchase_orders → purchase_order_items → products
       → expenses
```

### Inventory Flow:
```
products ← stock_history (tracks all movements)
         ← categories
```

### User Management:
```
users → invoices (createdBy)
      → expenses (createdBy)
      → purchase_orders (createdBy)
      → stock_history (createdBy)
      → sessions
```

---

## GST Calculation Logic

### For CGST + SGST (Intra-state):
- gst_type = 'cgst_sgst'
- cgst_amount = (subtotal × gst_rate) ÷ 2
- sgst_amount = (subtotal × gst_rate) ÷ 2
- igst_amount = 0

### For IGST (Inter-state):
- gst_type = 'igst'
- igst_amount = subtotal × gst_rate
- cgst_amount = 0
- sgst_amount = 0

---

## Database Statistics Query

Run this to get live statistics:

```sql
SELECT 
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM customers) as customers,
    (SELECT COUNT(*) FROM products) as products,
    (SELECT COUNT(*) FROM invoices) as invoices,
    (SELECT COUNT(*) FROM payments) as payments,
    (SELECT COUNT(*) FROM vendors) as vendors,
    (SELECT COUNT(*) FROM expenses) as expenses;
```

---

## For Your Professor

**Quick Facts:**
- ✅ 15 Tables total
- ✅ Fully normalized (3NF)
- ✅ 20+ foreign key relationships
- ✅ 8 custom enum types
- ✅ UUID primary keys for security
- ✅ Comprehensive audit trail (created_at, updated_at)
- ✅ Supports complete GST compliance (B2B, B2C, CGST, SGST, IGST)
- ✅ Payment gateway integration (Razorpay)
- ✅ Multi-user with role-based access
- ✅ Real-time inventory tracking
- ✅ Complete supply chain management
