-- =====================================================
-- GSTEaseSuite Database Demo Queries
-- For Presentation Purposes
-- =====================================================

-- 1. SHOW ALL TABLES IN DATABASE
-- =====================================================
SELECT table_name, 
       (SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;


-- 2. COUNT RECORDS IN ALL TABLES
-- =====================================================
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
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
SELECT 'purchase_order_items', COUNT(*) FROM purchase_order_items
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'whatsapp_logs', COUNT(*) FROM whatsapp_logs
UNION ALL
SELECT 'stock_history', COUNT(*) FROM stock_history
ORDER BY table_name;


-- 3. SHOW COMPLETE DATABASE STRUCTURE
-- =====================================================
SELECT 
    c.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;


-- 4. SHOW ALL FOREIGN KEY RELATIONSHIPS
-- =====================================================
SELECT
    tc.table_name as "From Table", 
    kcu.column_name as "From Column", 
    ccu.table_name AS "To Table",
    ccu.column_name AS "To Column",
    rc.delete_rule as "On Delete"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;


-- 5. SHOW ALL ENUMS (CUSTOM TYPES)
-- =====================================================
SELECT 
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;


-- 6. SHOW DATABASE SIZE AND TABLE SIZES
-- =====================================================
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;


-- 7. USERS OVERVIEW
-- =====================================================
SELECT 
    id,
    email,
    first_name || ' ' || last_name as full_name,
    role,
    created_at
FROM users
ORDER BY created_at DESC;


-- 8. CUSTOMERS SUMMARY
-- =====================================================
SELECT 
    c.name,
    c.email,
    c.phone,
    c.customer_type,
    c.gst_number,
    c.city,
    c.state,
    COUNT(i.id) as total_invoices,
    COALESCE(SUM(i.total_amount), 0) as total_business
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id
GROUP BY c.id
ORDER BY total_business DESC;


-- 9. PRODUCTS WITH INVENTORY STATUS
-- =====================================================
SELECT 
    p.name,
    p.hsn_code,
    c.name as category,
    p.price,
    p.gst_rate,
    p.stock_quantity,
    p.low_stock_threshold,
    CASE 
        WHEN p.stock_quantity = 0 THEN 'OUT OF STOCK'
        WHEN p.stock_quantity <= p.low_stock_threshold THEN 'LOW STOCK'
        ELSE 'IN STOCK'
    END as stock_status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.stock_quantity ASC;


-- 10. INVOICE SUMMARY WITH CUSTOMER INFO
-- =====================================================
SELECT 
    i.invoice_number,
    i.invoice_date,
    c.name as customer_name,
    i.invoice_type,
    i.status,
    i.subtotal,
    i.total_amount,
    CASE 
        WHEN i.gst_type = 'cgst_sgst' THEN i.cgst_amount + i.sgst_amount
        ELSE i.igst_amount
    END as total_gst,
    COUNT(ii.id) as item_count
FROM invoices i
LEFT JOIN customers c ON i.customer_id = c.id
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
GROUP BY i.id, c.name
ORDER BY i.invoice_date DESC
LIMIT 20;


-- 11. PAYMENT STATUS OVERVIEW
-- =====================================================
SELECT 
    i.invoice_number,
    c.name as customer_name,
    i.total_amount as invoice_amount,
    p.amount as payment_amount,
    p.payment_method,
    p.payment_status,
    p.payment_date,
    p.razorpay_payment_id
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
LEFT JOIN customers c ON i.customer_id = c.id
ORDER BY p.created_at DESC;


-- 12. VENDOR SUMMARY
-- =====================================================
SELECT 
    v.name,
    v.email,
    v.phone,
    v.gst_number,
    v.outstanding_balance,
    COUNT(DISTINCT po.id) as total_purchase_orders,
    COUNT(DISTINCT e.id) as total_expenses
FROM vendors v
LEFT JOIN purchase_orders po ON v.id = po.vendor_id
LEFT JOIN expenses e ON v.id = e.vendor_id
GROUP BY v.id
ORDER BY v.name;


-- 13. EXPENSES BY CATEGORY
-- =====================================================
SELECT 
    category,
    COUNT(*) as expense_count,
    SUM(amount) as total_amount,
    SUM(gst_amount) as total_gst,
    AVG(amount) as average_amount
FROM expenses
GROUP BY category
ORDER BY total_amount DESC;


-- 14. STOCK MOVEMENT HISTORY
-- =====================================================
SELECT 
    p.name as product_name,
    sh.change_type,
    sh.quantity_change,
    sh.balance_after,
    sh.reference_type,
    sh.created_at
FROM stock_history sh
JOIN products p ON sh.product_id = p.id
ORDER BY sh.created_at DESC
LIMIT 50;


-- 15. REVENUE SUMMARY BY MONTH
-- =====================================================
SELECT 
    TO_CHAR(invoice_date, 'YYYY-MM') as month,
    COUNT(*) as invoice_count,
    SUM(subtotal) as total_subtotal,
    SUM(CASE 
        WHEN gst_type = 'cgst_sgst' THEN cgst_amount + sgst_amount
        ELSE igst_amount
    END) as total_gst,
    SUM(total_amount) as total_revenue
FROM invoices
WHERE status = 'paid'
GROUP BY TO_CHAR(invoice_date, 'YYYY-MM')
ORDER BY month DESC;


-- 16. TOP SELLING PRODUCTS
-- =====================================================
SELECT 
    p.name as product_name,
    p.hsn_code,
    COUNT(ii.id) as times_sold,
    SUM(ii.quantity) as total_quantity_sold,
    SUM(ii.total_amount) as total_revenue
FROM invoice_items ii
JOIN products p ON ii.product_id = p.id
GROUP BY p.id
ORDER BY total_revenue DESC
LIMIT 10;


-- 17. PENDING INVOICES (ACCOUNTS RECEIVABLE)
-- =====================================================
SELECT 
    i.invoice_number,
    c.name as customer_name,
    i.invoice_date,
    i.due_date,
    i.total_amount,
    CASE 
        WHEN i.due_date < CURRENT_DATE THEN 'OVERDUE'
        WHEN i.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 THEN 'DUE SOON'
        ELSE 'PENDING'
    END as urgency,
    CURRENT_DATE - i.due_date as days_overdue
FROM invoices i
LEFT JOIN customers c ON i.customer_id = c.id
WHERE i.status IN ('pending', 'overdue')
ORDER BY i.due_date;


-- 18. GST SUMMARY REPORT
-- =====================================================
SELECT 
    TO_CHAR(invoice_date, 'YYYY-MM') as month,
    gst_type,
    invoice_type,
    COUNT(*) as invoice_count,
    SUM(subtotal) as taxable_amount,
    SUM(cgst_amount) as total_cgst,
    SUM(sgst_amount) as total_sgst,
    SUM(igst_amount) as total_igst,
    SUM(total_amount) as gross_amount
FROM invoices
GROUP BY TO_CHAR(invoice_date, 'YYYY-MM'), gst_type, invoice_type
ORDER BY month DESC, gst_type;


-- 19. WHATSAPP DELIVERY STATUS
-- =====================================================
SELECT 
    i.invoice_number,
    wl.recipient_phone,
    wl.message_type,
    wl.status,
    wl.sent_at,
    wl.delivered_at,
    wl.read_at
FROM whatsapp_logs wl
LEFT JOIN invoices i ON wl.invoice_id = i.id
ORDER BY wl.created_at DESC
LIMIT 20;


-- 20. COMPLETE BUSINESS OVERVIEW (DASHBOARD DATA)
-- =====================================================
SELECT 
    'Total Customers' as metric, COUNT(*)::text as value FROM customers
UNION ALL
SELECT 'Total Products', COUNT(*)::text FROM products
UNION ALL
SELECT 'Total Invoices', COUNT(*)::text FROM invoices
UNION ALL
SELECT 'Paid Invoices', COUNT(*)::text FROM invoices WHERE status = 'paid'
UNION ALL
SELECT 'Pending Invoices', COUNT(*)::text FROM invoices WHERE status = 'pending'
UNION ALL
SELECT 'Total Revenue', 'Rs. ' || SUM(total_amount)::text FROM invoices WHERE status = 'paid'
UNION ALL
SELECT 'Total Expenses', 'Rs. ' || SUM(amount)::text FROM expenses
UNION ALL
SELECT 'Active Vendors', COUNT(*)::text FROM vendors
UNION ALL
SELECT 'Low Stock Items', COUNT(*)::text FROM products WHERE stock_quantity <= low_stock_threshold
UNION ALL
SELECT 'Out of Stock Items', COUNT(*)::text FROM products WHERE stock_quantity = 0;


-- 21. AUDIT TRAIL - RECENT ACTIVITIES
-- =====================================================
SELECT 'Invoice Created' as activity, 
       invoice_number as reference, 
       created_at as timestamp 
FROM invoices 
ORDER BY created_at DESC LIMIT 5
UNION ALL
SELECT 'Product Added', name, created_at FROM products ORDER BY created_at DESC LIMIT 5
UNION ALL
SELECT 'Customer Added', name, created_at FROM customers ORDER BY created_at DESC LIMIT 5
ORDER BY timestamp DESC
LIMIT 20;


-- 22. DATA INTEGRITY CHECK
-- =====================================================
-- Check for invoices without items
SELECT 'Invoices without items' as issue, COUNT(*) as count
FROM invoices i
WHERE NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.invoice_id = i.id)
UNION ALL
-- Check for products without category
SELECT 'Products without category', COUNT(*)
FROM products
WHERE category_id IS NULL
UNION ALL
-- Check for orphaned invoice items
SELECT 'Orphaned invoice items', COUNT(*)
FROM invoice_items ii
WHERE NOT EXISTS (SELECT 1 FROM invoices i WHERE i.id = ii.invoice_id);
