import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for user authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'staff', 'accountant']);
export const invoiceTypeEnum = pgEnum('invoice_type', ['b2b', 'b2c']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['paid', 'pending', 'overdue']);
export const gstTypeEnum = pgEnum('gst_type', ['cgst_sgst', 'igst']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'processing', 'completed', 'failed', 'refunded']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'upi', 'netbanking', 'razorpay', 'other']);
export const expenseCategoryEnum = pgEnum('expense_category', ['purchase', 'salary', 'rent', 'utilities', 'transport', 'marketing', 'other']);
export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', ['draft', 'sent', 'received', 'cancelled']);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // Hashed password for JWT auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum('role').default('staff').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories for products
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products/Inventory
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => categories.id, { onDelete: 'set null' }),
  hsnCode: varchar("hsn_code", { length: 50 }),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).notNull(), // e.g., 18.00 for 18%
  stockQuantity: integer("stock_quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  unit: varchar("unit", { length: 50 }).default('pcs'), // pcs, kg, ltr, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email"),
  phone: varchar("phone", { length: 20 }),
  gstNumber: varchar("gst_number", { length: 15 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pincode: varchar("pincode", { length: 10 }),
  customerType: invoiceTypeEnum('customer_type').default('b2c').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: 'set null' }),
  invoiceType: invoiceTypeEnum('invoice_type').notNull(),
  invoiceDate: timestamp("invoice_date").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  status: invoiceStatusEnum('status').default('pending').notNull(),
  
  // Amounts
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  gstType: gstTypeEnum('gst_type').notNull(),
  cgstAmount: numeric("cgst_amount", { precision: 12, scale: 2 }).default('0'),
  sgstAmount: numeric("sgst_amount", { precision: 12, scale: 2 }).default('0'),
  igstAmount: numeric("igst_amount", { precision: 12, scale: 2 }).default('0'),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice Items
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  productId: varchar("product_id").references(() => products.id, { onDelete: 'set null' }),
  productName: varchar("product_name", { length: 255 }).notNull(), // Store name in case product is deleted
  description: text("description"),
  hsnCode: varchar("hsn_code", { length: 50 }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).default('pcs'),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).notNull(),
  gstAmount: numeric("gst_amount", { precision: 12, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments - Track all payment transactions
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
  razorpayPaymentId: varchar("razorpay_payment_id"),
  razorpayOrderId: varchar("razorpay_order_id"),
  razorpaySignature: varchar("razorpay_signature"),
  paymentLink: text("payment_link"),
  transactionId: varchar("transaction_id"),
  paymentDate: timestamp("payment_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendors - Supplier management
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email"),
  phone: varchar("phone", { length: 20 }),
  gstNumber: varchar("gst_number", { length: 15 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pincode: varchar("pincode", { length: 10 }),
  bankName: varchar("bank_name"),
  accountNumber: varchar("account_number"),
  ifscCode: varchar("ifsc_code"),
  outstandingBalance: numeric("outstanding_balance", { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase Orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poNumber: varchar("po_number", { length: 50 }).notNull().unique(),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: 'set null' }),
  orderDate: timestamp("order_date").notNull().defaultNow(),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  status: purchaseOrderStatusEnum('status').default('draft').notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  gstAmount: numeric("gst_amount", { precision: 12, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase Order Items
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseOrderId: varchar("purchase_order_id").references(() => purchaseOrders.id, { onDelete: 'cascade' }).notNull(),
  productId: varchar("product_id").references(() => products.id, { onDelete: 'set null' }),
  productName: varchar("product_name", { length: 255 }).notNull(),
  hsnCode: varchar("hsn_code", { length: 50 }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  receivedQuantity: numeric("received_quantity", { precision: 10, scale: 2 }).default('0'),
  unit: varchar("unit", { length: 50 }).default('pcs'),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).notNull(),
  gstAmount: numeric("gst_amount", { precision: 12, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  batchNumber: varchar("batch_number"),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expenses - Track all business expenses
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  expenseNumber: varchar("expense_number", { length: 50 }).notNull().unique(),
  category: expenseCategoryEnum('category').notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  gstAmount: numeric("gst_amount", { precision: 12, scale: 2 }).default('0'),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: 'set null' }),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  expenseDate: timestamp("expense_date").notNull().defaultNow(),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp Logs - Track WhatsApp message delivery
export const whatsappLogs = pgTable("whatsapp_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").references(() => invoices.id, { onDelete: 'cascade' }),
  recipientPhone: varchar("recipient_phone", { length: 20 }).notNull(),
  messageType: varchar("message_type", { length: 50 }).notNull(), // 'invoice', 'reminder', 'alert'
  messageContent: text("message_content"),
  status: varchar("status", { length: 50 }).default('pending'), // 'pending', 'sent', 'delivered', 'read', 'failed'
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product Stock History - Track stock movements
export const stockHistory = pgTable("stock_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id, { onDelete: 'cascade' }).notNull(),
  changeType: varchar("change_type", { length: 50 }).notNull(), // 'sale', 'purchase', 'adjustment', 'return'
  quantityChange: numeric("quantity_change", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: numeric("balance_after", { precision: 10, scale: 2 }).notNull(),
  referenceType: varchar("reference_type", { length: 50 }), // 'invoice', 'purchase_order', 'manual'
  referenceId: varchar("reference_id"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  invoiceItems: many(invoiceItems),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  invoices: many(invoices),
}));

export const usersRelations = relations(users, ({ many }) => ({
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  createdByUser: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

// Payment relations
export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

// Vendor relations
export const vendorsRelations = relations(vendors, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
  expenses: many(expenses),
}));

// Purchase Order relations
export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [purchaseOrders.vendorId],
    references: [vendors.id],
  }),
  createdByUser: one(users, {
    fields: [purchaseOrders.createdBy],
    references: [users.id],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id],
  }),
}));

// Expense relations
export const expensesRelations = relations(expenses, ({ one }) => ({
  vendor: one(vendors, {
    fields: [expenses.vendorId],
    references: [vendors.id],
  }),
  createdByUser: one(users, {
    fields: [expenses.createdBy],
    references: [users.id],
  }),
}));

// Stock history relations
export const stockHistoryRelations = relations(stockHistory, ({ one }) => ({
  product: one(products, {
    fields: [stockHistory.productId],
    references: [products.id],
  }),
  createdByUser: one(users, {
    fields: [stockHistory.createdBy],
    references: [users.id],
  }),
}));

// WhatsApp logs relations
export const whatsappLogsRelations = relations(whatsappLogs, ({ one }) => ({
  invoice: one(invoices, {
    fields: [whatsappLogs.invoiceId],
    references: [invoices.id],
  }),
}));

// Insert Schemas
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({ id: true, createdAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  expenseNumber: z.string().optional(),
});
export const insertWhatsappLogSchema = createInsertSchema(whatsappLogs).omit({ id: true, createdAt: true });
export const insertStockHistorySchema = createInsertSchema(stockHistory).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type WhatsappLog = typeof whatsappLogs.$inferSelect;
export type InsertWhatsappLog = z.infer<typeof insertWhatsappLogSchema>;

export type StockHistory = typeof stockHistory.$inferSelect;
export type InsertStockHistory = z.infer<typeof insertStockHistorySchema>;
