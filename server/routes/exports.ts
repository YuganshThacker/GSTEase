import express, { Request, Response } from 'express';
import { db } from '../db';
import { invoices, products, customers, expenses } from '../../shared/schema';
import * as excelService from '../services/excelService';

const router = express.Router();

/**
 * Export invoices to Excel
 */
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const allInvoices = await db.select().from(invoices);

    const buffer = await excelService.exportInvoicesToExcel(allInvoices);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=invoices.xlsx');
    res.send(buffer);
  } catch (error: any) {
    console.error('Error exporting invoices:', error);
    res.status(500).json({ error: 'Failed to export invoices' });
  }
});

/**
 * Export products to Excel
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    const allProducts = await db.select().from(products);

    const buffer = await excelService.exportProductsToExcel(allProducts);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
    res.send(buffer);
  } catch (error: any) {
    console.error('Error exporting products:', error);
    res.status(500).json({ error: 'Failed to export products' });
  }
});

/**
 * Export customers to Excel
 */
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const allCustomers = await db.select().from(customers);

    const buffer = await excelService.exportCustomersToExcel(allCustomers);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=customers.xlsx');
    res.send(buffer);
  } catch (error: any) {
    console.error('Error exporting customers:', error);
    res.status(500).json({ error: 'Failed to export customers' });
  }
});

/**
 * Export expenses to Excel
 */
router.get('/expenses', async (req: Request, res: Response) => {
  try {
    const allExpenses = await db.select().from(expenses);

    const buffer = await excelService.exportExpensesToExcel(allExpenses);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.xlsx');
    res.send(buffer);
  } catch (error: any) {
    console.error('Error exporting expenses:', error);
    res.status(500).json({ error: 'Failed to export expenses' });
  }
});

/**
 * Export profit & loss statement
 */
router.get('/profit-loss', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Calculate P&L data
    const allInvoices = await db.select().from(invoices);
    const allExpenses = await db.select().from(expenses);

    const totalRevenue = allInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.totalAmount.toString()),
      0
    );

    const totalExpenses = allExpenses.reduce(
      (sum, exp) => sum + parseFloat(exp.amount.toString()),
      0
    );

    const grossProfit = totalRevenue - totalExpenses;
    const netProfit = grossProfit; // Simplified, can add more calculations

    const buffer = await excelService.exportProfitLossToExcel({
      totalRevenue,
      totalExpenses,
      grossProfit,
      netProfit,
      periodStart: startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1),
      periodEnd: endDate ? new Date(endDate as string) : new Date(),
      revenueByMonth: [],
      expensesByCategory: [],
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=profit-loss.xlsx');
    res.send(buffer);
  } catch (error: any) {
    console.error('Error exporting P&L:', error);
    res.status(500).json({ error: 'Failed to export P&L' });
  }
});

export default router;
