import ExcelJS from 'exceljs';
import { Invoice, Product, Customer, Expense, PurchaseOrder } from '../../shared/schema';
import { format } from 'date-fns';

/**
 * Export invoices to Excel
 */
export async function exportInvoicesToExcel(invoices: Invoice[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Invoices');

  // Set column headers
  worksheet.columns = [
    { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
    { header: 'Date', key: 'invoiceDate', width: 15 },
    { header: 'Customer', key: 'customerId', width: 25 },
    { header: 'Type', key: 'invoiceType', width: 10 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Subtotal', key: 'subtotal', width: 15 },
    { header: 'GST Type', key: 'gstType', width: 12 },
    { header: 'CGST', key: 'cgstAmount', width: 12 },
    { header: 'SGST', key: 'sgstAmount', width: 12 },
    { header: 'IGST', key: 'igstAmount', width: 12 },
    { header: 'Total Amount', key: 'totalAmount', width: 15 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2B82D9' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  invoices.forEach((invoice) => {
    worksheet.addRow({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: format(new Date(invoice.invoiceDate), 'dd-MMM-yyyy'),
      customerId: invoice.customerId || 'N/A',
      invoiceType: invoice.invoiceType.toUpperCase(),
      status: invoice.status.toUpperCase(),
      subtotal: parseFloat(invoice.subtotal.toString()),
      gstType: invoice.gstType === 'cgst_sgst' ? 'CGST+SGST' : 'IGST',
      cgstAmount: parseFloat(invoice.cgstAmount?.toString() || '0'),
      sgstAmount: parseFloat(invoice.sgstAmount?.toString() || '0'),
      igstAmount: parseFloat(invoice.igstAmount?.toString() || '0'),
      totalAmount: parseFloat(invoice.totalAmount.toString()),
      dueDate: invoice.dueDate ? format(new Date(invoice.dueDate), 'dd-MMM-yyyy') : 'N/A',
    });
  });

  // Format currency columns
  ['E', 'F', 'H', 'I', 'J', 'K'].forEach((col) => {
    worksheet.getColumn(col).numFmt = '₹#,##0.00';
  });

  // Auto-filter
  worksheet.autoFilter = {
    from: 'A1',
    to: 'L1',
  };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export products/inventory to Excel
 */
export async function exportProductsToExcel(products: Product[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Products');

  worksheet.columns = [
    { header: 'Product Name', key: 'name', width: 30 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'HSN Code', key: 'hsnCode', width: 15 },
    { header: 'Price', key: 'price', width: 12 },
    { header: 'GST Rate (%)', key: 'gstRate', width: 12 },
    { header: 'Stock Quantity', key: 'stockQuantity', width: 15 },
    { header: 'Low Stock Alert', key: 'lowStockThreshold', width: 15 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Category', key: 'categoryId', width: 20 },
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF16A34A' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data
  products.forEach((product) => {
    const row = worksheet.addRow({
      name: product.name,
      description: product.description || '',
      hsnCode: product.hsnCode || '',
      price: parseFloat(product.price.toString()),
      gstRate: parseFloat(product.gstRate.toString()),
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold || 10,
      unit: product.unit || 'pcs',
      categoryId: product.categoryId || '',
    });

    // Highlight low stock items
    if (product.stockQuantity <= (product.lowStockThreshold || 10)) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEE2E2' },
      };
    }
  });

  // Format columns
  worksheet.getColumn('D').numFmt = '₹#,##0.00';
  worksheet.getColumn('E').numFmt = '0.00';

  worksheet.autoFilter = {
    from: 'A1',
    to: 'I1',
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export customers to Excel
 */
export async function exportCustomersToExcel(customers: Customer[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Customers');

  worksheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'GST Number', key: 'gstNumber', width: 20 },
    { header: 'Customer Type', key: 'customerType', width: 15 },
    { header: 'Address', key: 'address', width: 40 },
    { header: 'City', key: 'city', width: 20 },
    { header: 'State', key: 'state', width: 20 },
    { header: 'Pincode', key: 'pincode', width: 12 },
  ];

  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF9333EA' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  customers.forEach((customer) => {
    worksheet.addRow({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      gstNumber: customer.gstNumber || '',
      customerType: customer.customerType.toUpperCase(),
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || '',
    });
  });

  worksheet.autoFilter = {
    from: 'A1',
    to: 'I1',
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export expenses to Excel
 */
export async function exportExpensesToExcel(expenses: Expense[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Expenses');

  worksheet.columns = [
    { header: 'Expense Number', key: 'expenseNumber', width: 20 },
    { header: 'Date', key: 'expenseDate', width: 15 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'GST Amount', key: 'gstAmount', width: 15 },
    { header: 'Payment Method', key: 'paymentMethod', width: 15 },
    { header: 'Vendor', key: 'vendorId', width: 25 },
  ];

  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDC2626' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  expenses.forEach((expense) => {
    worksheet.addRow({
      expenseNumber: expense.expenseNumber,
      expenseDate: format(new Date(expense.expenseDate), 'dd-MMM-yyyy'),
      category: expense.category.toUpperCase(),
      description: expense.description,
      amount: parseFloat(expense.amount.toString()),
      gstAmount: parseFloat(expense.gstAmount?.toString() || '0'),
      paymentMethod: expense.paymentMethod.toUpperCase(),
      vendorId: expense.vendorId || 'N/A',
    });
  });

  worksheet.getColumn('E').numFmt = '₹#,##0.00';
  worksheet.getColumn('F').numFmt = '₹#,##0.00';

  worksheet.autoFilter = {
    from: 'A1',
    to: 'H1',
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export profit & loss statement to Excel
 */
export async function exportProfitLossToExcel(data: {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  periodStart: Date;
  periodEnd: Date;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  expensesByCategory: Array<{ category: string; amount: number }>;
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Profit & Loss');

  // Title
  worksheet.mergeCells('A1:D1');
  worksheet.getCell('A1').value = 'PROFIT & LOSS STATEMENT';
  worksheet.getCell('A1').font = { bold: true, size: 16 };
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

  // Period
  worksheet.mergeCells('A2:D2');
  worksheet.getCell('A2').value = `Period: ${format(data.periodStart, 'dd-MMM-yyyy')} to ${format(data.periodEnd, 'dd-MMM-yyyy')}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  // Summary
  worksheet.addRow([]);
  worksheet.addRow(['SUMMARY', '', '', '']);
  worksheet.getRow(4).font = { bold: true };

  worksheet.addRow(['Total Revenue', '', '', parseFloat(data.totalRevenue.toFixed(2))]);
  worksheet.addRow(['Total Expenses', '', '', parseFloat(data.totalExpenses.toFixed(2))]);
  worksheet.addRow(['Gross Profit', '', '', parseFloat(data.grossProfit.toFixed(2))]);
  worksheet.addRow(['Net Profit', '', '', parseFloat(data.netProfit.toFixed(2))]);

  worksheet.getColumn('D').numFmt = '₹#,##0.00';

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export default {
  exportInvoicesToExcel,
  exportProductsToExcel,
  exportCustomersToExcel,
  exportExpensesToExcel,
  exportProfitLossToExcel,
};
