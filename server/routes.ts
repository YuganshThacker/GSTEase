// JWT Authentication routes
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./jwtAuth";
import {
  insertCategorySchema,
  insertProductSchema,
  insertCustomerSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
} from "@shared/schema";
import { generateInvoicePDF, getInvoiceFilename } from './services/pdfService';
import * as inventoryService from './services/inventoryService';
import * as emailService from './services/emailService';

// Import new route modules
import paymentsRoutes from './routes/payments';
import whatsappRoutes from './routes/whatsapp';
import exportsRoutes from './routes/exports';
import vendorsRoutes from './routes/vendors';
import expensesRoutes from './routes/expenses';

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Register new routes
  app.use('/api/payments', isAuthenticated, paymentsRoutes);
  app.use('/api/whatsapp', isAuthenticated, whatsappRoutes);
  app.use('/api/export', isAuthenticated, exportsRoutes);
  app.use('/api/vendors', isAuthenticated, vendorsRoutes);
  app.use('/api/expenses', isAuthenticated, expensesRoutes);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // User is already attached to req by isAuthenticated middleware
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Category routes
  app.get('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error: any) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: error.message || "Failed to create category" });
    }
  });

  // Product routes
  app.get('/api/products', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/low-stock', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });

  app.get('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error: any) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: error.message || "Failed to create product" });
    }
  });

  app.patch('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error: any) {
      console.error("Error updating product:", error);
      res.status(400).json({ message: error.message || "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Customer routes
  app.get('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error: any) {
      console.error("Error creating customer:", error);
      res.status(400).json({ message: error.message || "Failed to create customer" });
    }
  });

  app.patch('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      res.json(customer);
    } catch (error: any) {
      console.error("Error updating customer:", error);
      res.status(400).json({ message: error.message || "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Invoice routes
  app.get('/api/invoices', isAuthenticated, async (req, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get('/api/invoices/recent', isAuthenticated, async (req, res) => {
    try {
      const invoices = await storage.getRecentInvoices(5);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching recent invoices:", error);
      res.status(500).json({ message: "Failed to fetch recent invoices" });
    }
  });

  app.get('/api/invoices/:id', isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // PDF Invoice Download
  app.get('/api/invoices/:id/pdf', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Generate PDF
      const pdfBuffer = await generateInvoicePDF(invoice as any);
      const filename = getInvoiceFilename(invoice.invoiceNumber);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Email Invoice
  app.post('/api/invoices/send-email', isAuthenticated, async (req, res) => {
    try {
      // Check if email is configured
      if (!emailService.isEmailConfigured()) {
        return res.status(400).json({ 
          message: "Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD in your environment variables." 
        });
      }

      const { invoiceId, customerId } = req.body;
      
      if (!invoiceId || !customerId) {
        return res.status(400).json({ message: "Invoice ID and Customer ID are required" });
      }

      // Get invoice with all details
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Get customer details
      const customer = await storage.getCustomer(customerId);
      if (!customer || !customer.email) {
        return res.status(400).json({ message: "Customer email not found" });
      }

      // Generate PDF
      const pdfBuffer = await generateInvoicePDF(invoice as any);

      // Send email using emailService
      await emailService.sendInvoiceEmail(
        customer.email,
        customer.name,
        invoice.invoiceNumber,
        parseFloat(invoice.totalAmount.toString()),
        pdfBuffer
      );

      res.json({ 
        success: true, 
        message: "Invoice sent successfully",
        email: customer.email 
      });
    } catch (error) {
      console.error("Error sending invoice email:", error);
      res.status(500).json({ 
        message: "Failed to send invoice email", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.post('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const { items, ...invoiceData } = req.body;

      // Generate invoice number (simple incrementing for now)
      const allInvoices = await storage.getAllInvoices();
      const invoiceNumber = `INV-${String(allInvoices.length + 1).padStart(6, '0')}`;

      // Calculate totals from items
      const subtotal = items.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.price) * parseFloat(item.quantity)), 0
      );

      const totalGst = items.reduce((sum: number, item: any) => 
        sum + parseFloat(item.gstAmount), 0
      );

      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;

      if (invoiceData.gstType === 'cgst_sgst') {
        cgstAmount = totalGst / 2;
        sgstAmount = totalGst / 2;
      } else {
        igstAmount = totalGst;
      }

      const totalAmount = subtotal + totalGst;

      const invoiceToCreate = {
        ...invoiceData,
        invoiceNumber,
        subtotal: subtotal.toString(),
        cgstAmount: cgstAmount.toString(),
        sgstAmount: sgstAmount.toString(),
        igstAmount: igstAmount.toString(),
        totalAmount: totalAmount.toString(),
        createdBy: req.user.id,
      };

      const invoice = await storage.createInvoice(invoiceToCreate, items);

      // Automatically deduct stock for each item
      try {
        for (const item of items) {
          if (item.productId) {
            await inventoryService.deductStock(
              item.productId,
              parseFloat(item.quantity),
              'invoice',
              invoice.id,
              req.user.id
            );
          }
        }
      } catch (stockError: any) {
        console.error("Stock deduction warning:", stockError.message);
        // Continue even if stock deduction fails (for low stock scenarios)
      }

      // Automatically send invoice email if customer email is available
      try {
        const customer = await storage.getCustomer(invoiceData.customerId);
        if (customer && customer.email && process.env.EMAIL_USER) {
          // Generate PDF
          const invoiceWithDetails = await storage.getInvoice(invoice.id);
          const pdfBuffer = await generateInvoicePDF(invoiceWithDetails as any);
          
          // Send email with PDF attachment
          await emailService.sendInvoiceEmail(
            customer.email,
            customer.name,
            invoiceNumber,
            totalAmount,
            pdfBuffer
          );
          
          console.log(`Invoice ${invoiceNumber} sent to ${customer.email}`);
        }
      } catch (emailError: any) {
        console.error("Failed to send invoice email:", emailError.message);
        // Don't fail the invoice creation if email fails
      }

      res.status(201).json(invoice);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      res.status(400).json({ message: error.message || "Failed to create invoice" });
    }
  });

  app.patch('/api/invoices/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateInvoiceStatus(req.params.id, status);
      res.status(204).send();
    } catch (error) {
      console.error("Error updating invoice status:", error);
      res.status(500).json({ message: "Failed to update invoice status" });
    }
  });

  // Dashboard statistics
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
