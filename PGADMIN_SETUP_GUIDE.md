# pgAdmin Setup Guide for Presentation

## Database Overview
Your GSTEaseSuite application uses PostgreSQL database with **15 main tables** for comprehensive GST management.

## Database Connection Details
- **Host:** localhost
- **Port:** 5432
- **Database Name:** gstease
- **Username:** (your PostgreSQL username, typically your macOS username)
- **Password:** (your PostgreSQL password if set)

---

## Step-by-Step Guide to View Database in pgAdmin

### Step 1: Install pgAdmin (if not already installed)
1. Download pgAdmin from: https://www.pgadmin.org/download/
2. Install the application
3. Open pgAdmin 4

### Step 2: Create a Server Connection
1. Open pgAdmin 4
2. Right-click on "Servers" in the left panel
3. Select **Create** → **Server**
4. In the **General** tab:
   - **Name:** GSTEaseSuite (or any name you prefer)
5. In the **Connection** tab:
   - **Host:** localhost
   - **Port:** 5432
   - **Database:** gstease
   - **Username:** (your PostgreSQL username)
   - **Password:** (your PostgreSQL password)
   - Check "Save password" for convenience
6. Click **Save**

### Step 3: Navigate to Your Database
1. Expand "Servers" → "GSTEaseSuite"
2. Expand "Databases" → "gstease"
3. Expand "Schemas" → "public"
4. Expand "Tables" - **Here you'll see all 15 tables!**

---

## 📊 Complete List of Tables (15 Tables)

### 1. **users** 👥
   - User authentication and management
   - Fields: id, email, password, firstName, lastName, role, etc.

### 2. **sessions** 🔐
   - User session management for authentication
   - Fields: sid, sess, expire

### 3. **categories** 📁
   - Product categories
   - Fields: id, name, description, createdAt

### 4. **products** 📦
   - Product/inventory management
   - Fields: id, name, description, categoryId, hsnCode, price, gstRate, stockQuantity, etc.

### 5. **customers** 👤
   - Customer information
   - Fields: id, name, email, phone, gstNumber, address, city, state, etc.

### 6. **invoices** 🧾
   - Main invoice records
   - Fields: id, invoiceNumber, customerId, invoiceType, status, subtotal, totalAmount, etc.

### 7. **invoice_items** 📝
   - Individual line items in invoices
   - Fields: id, invoiceId, productId, quantity, price, gstAmount, etc.

### 8. **payments** 💰
   - Payment transaction records
   - Fields: id, invoiceId, amount, paymentMethod, paymentStatus, razorpayPaymentId, etc.

### 9. **vendors** 🏪
   - Supplier/vendor management
   - Fields: id, name, email, phone, gstNumber, bankDetails, etc.

### 10. **purchase_orders** 📋
   - Purchase orders to vendors
   - Fields: id, poNumber, vendorId, orderDate, status, totalAmount, etc.

### 11. **purchase_order_items** 🛒
   - Items in purchase orders
   - Fields: id, purchaseOrderId, productId, quantity, price, etc.

### 12. **expenses** 💸
   - Business expense tracking
   - Fields: id, expenseNumber, category, description, amount, gstAmount, etc.

### 13. **whatsapp_logs** 📱
   - WhatsApp message delivery tracking
   - Fields: id, invoiceId, recipientPhone, messageType, status, etc.

### 14. **stock_history** 📊
   - Product stock movement tracking
   - Fields: id, productId, changeType, quantityChange, balanceAfter, etc.

### 15. **notifications** 🔔
   - System notifications
   - Fields: id, userId, title, message, type, isRead, etc.

---

## Step 4: View Table Structure
To view the structure of any table:
1. Right-click on the table name
2. Select **Properties**
3. Go to the **Columns** tab to see all fields
4. Go to the **Constraints** tab to see primary keys, foreign keys, etc.

## Step 5: View Table Data
To view the data in any table:
1. Right-click on the table name
2. Select **View/Edit Data** → **All Rows**
3. The data will appear in a grid view

**OR**

1. Click on the **Query Tool** icon (or Tools → Query Tool)
2. Run this query:
```sql
SELECT * FROM table_name LIMIT 100;
```

---

## 🎯 For Your Presentation - Quick Demo Queries

### 1. Show All Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 2. Count Records in Each Table
```sql
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'invoice_items', COUNT(*) FROM invoice_items
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'purchase_orders', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
ORDER BY table_name;
```

### 3. Show Database Schema Information
```sql
SELECT 
    t.table_name,
    COUNT(c.column_name) as column_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;
```

### 4. Show All Relationships (Foreign Keys)
```sql
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

### 5. Show Complete Invoice Information (with joins)
```sql
SELECT 
    i.invoice_number,
    c.name as customer_name,
    i.invoice_date,
    i.status,
    i.total_amount,
    COUNT(ii.id) as item_count
FROM invoices i
LEFT JOIN customers c ON i.customer_id = c.id
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
GROUP BY i.id, c.name
ORDER BY i.created_at DESC
LIMIT 10;
```

---

## 🎓 Key Points to Mention to Your Professor

### Database Design Features:
1. **Normalized Structure**: Follows 3NF (Third Normal Form) to avoid data redundancy
2. **Referential Integrity**: All foreign keys with proper constraints
3. **Data Types**: Appropriate use of VARCHAR, TEXT, NUMERIC, TIMESTAMP, JSONB
4. **Enums**: Type-safe enumerations for status fields (invoice_status, payment_status, etc.)
5. **Audit Trail**: Created_at, updated_at timestamps on all major tables
6. **UUID Primary Keys**: Using UUIDs instead of auto-increment integers for security
7. **Indexing**: Proper indexes on foreign keys and frequently queried columns
8. **Cascade Operations**: ON DELETE CASCADE/SET NULL for data integrity

### Business Logic Covered:
1. **Complete GST Compliance**: Supports B2B and B2C invoices, CGST/SGST/IGST calculations
2. **Inventory Management**: Stock tracking with history
3. **Multi-user Support**: Role-based access (admin, staff, accountant)
4. **Payment Gateway Integration**: Razorpay integration with payment tracking
5. **Vendor Management**: Complete supply chain management
6. **Expense Tracking**: Comprehensive business expense management
7. **Communication Tracking**: WhatsApp integration logging
8. **Reporting**: Data structure supports complex financial reports

---

## 🚀 Alternative: Terminal Commands (Faster Demo)

If you prefer terminal for quick demonstration:

### Connect to Database
```bash
psql -d gstease
```

### List All Tables
```sql
\dt
```

### Describe a Table
```sql
\d table_name
```

### Count All Tables
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

### Exit
```sql
\q
```

---

## 📸 Tips for Presentation

1. **Prepare Sample Data**: Make sure you have some sample data in tables (use the application to create some invoices, customers, products)

2. **Open Multiple Tabs**: Keep multiple table views open in pgAdmin for quick switching

3. **Use Explain Plans**: Show query execution plans to demonstrate optimization:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM invoices WHERE status = 'pending';
   ```

4. **Show Database Size**:
   ```sql
   SELECT pg_size_pretty(pg_database_size('gstease'));
   ```

5. **Export Schema**: You can export the entire schema as SQL for documentation
   - Right-click on database → Backup
   - Select "Schema only" format

---

## 🎯 Questions Your Professor Might Ask

### Q: How many tables are there?
**A:** 15 tables covering complete GST business operations

### Q: What type of relationships exist?
**A:** One-to-Many (customers to invoices), Many-to-Many (through junction tables), and proper foreign key constraints

### Q: How do you handle GST calculations?
**A:** Separate fields for CGST, SGST, IGST with gst_type enum determining which to apply based on state

### Q: How is data integrity maintained?
**A:** Through foreign key constraints, CASCADE operations, NOT NULL constraints, and UNIQUE constraints where needed

### Q: What about scalability?
**A:** UUID primary keys, indexed foreign keys, proper normalization, and uses PostgreSQL which scales well

### Q: Security features?
**A:** Password hashing, JWT authentication, role-based access control, and session management

Good luck with your presentation! 🎉
