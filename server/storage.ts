// Database session storage implementation
import {
  users,
  categories,
  products,
  customers,
  invoices,
  invoiceItems,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type Customer,
  type InsertCustomer,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, lte, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  getLowStockProducts(): Promise<Product[]>;
  updateProductStock(id: string, quantity: number): Promise<void>;

  // Customer operations
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Invoice operations
  getAllInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<(Invoice & { items: InvoiceItem[] }) | undefined>;
  getRecentInvoices(limit: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice>;
  updateInvoiceStatus(id: string, status: 'paid' | 'pending' | 'overdue'): Promise<void>;

  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalRevenue: number;
    totalInvoices: number;
    totalProducts: number;
    totalCustomers: number;
    pendingInvoices: number;
    lowStockProducts: number;
    todayRevenue: number;
    todayInvoices: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations for authentication
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(products.name);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...productData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        sql`${products.stockQuantity} <= ${products.lowStockThreshold}`
      )
      .orderBy(products.stockQuantity);
  }

  async updateProductStock(id: string, quantityChange: number): Promise<void> {
    await db
      .update(products)
      .set({
        stockQuantity: sql`${products.stockQuantity} - ${quantityChange}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));
  }

  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(customers.name);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Invoice operations
  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.invoiceDate));
  }

  async getInvoice(id: string): Promise<(Invoice & { items: InvoiceItem[] }) | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invoice) return undefined;

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    return { ...invoice, items };
  }

  async getRecentInvoices(limit: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .orderBy(desc(invoices.invoiceDate))
      .limit(limit);
  }

  async createInvoice(invoiceData: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(invoiceData).returning();

    // Insert invoice items
    const itemsWithInvoiceId = items.map((item) => ({
      ...item,
      invoiceId: invoice.id,
    }));
    await db.insert(invoiceItems).values(itemsWithInvoiceId);

    // Update product stock for each item
    for (const item of items) {
      if (item.productId) {
        await this.updateProductStock(item.productId, parseFloat(item.quantity.toString()));
      }
    }

    return invoice;
  }

  async updateInvoiceStatus(id: string, status: 'paid' | 'pending' | 'overdue'): Promise<void> {
    await db
      .update(invoices)
      .set({ status, updatedAt: new Date() })
      .where(eq(invoices.id, id));
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalRevenue: number;
    totalInvoices: number;
    totalProducts: number;
    totalCustomers: number;
    pendingInvoices: number;
    lowStockProducts: number;
    todayRevenue: number;
    todayInvoices: number;
  }> {
    const allInvoices = await db.select().from(invoices);
    const allProducts = await db.select().from(products);
    const allCustomers = await db.select().from(customers);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayInvoices = allInvoices.filter((inv) => {
      const invDate = new Date(inv.invoiceDate);
      invDate.setHours(0, 0, 0, 0);
      return invDate.getTime() === today.getTime();
    });

    const totalRevenue = allInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.totalAmount.toString()),
      0
    );
    const todayRevenue = todayInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.totalAmount.toString()),
      0
    );
    const pendingInvoices = allInvoices.filter((inv) => inv.status === 'pending').length;
    const lowStockProducts = allProducts.filter(
      (p) => p.stockQuantity <= (p.lowStockThreshold || 10)
    ).length;

    return {
      totalRevenue,
      totalInvoices: allInvoices.length,
      totalProducts: allProducts.length,
      totalCustomers: allCustomers.length,
      pendingInvoices,
      lowStockProducts,
      todayRevenue,
      todayInvoices: todayInvoices.length,
    };
  }
}

export const storage = new DatabaseStorage();
