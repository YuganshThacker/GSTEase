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

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
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

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
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

// Insert Schemas
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true, createdAt: true });

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
