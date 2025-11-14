import { db } from '../db';
import { products, stockHistory } from '../../shared/schema';
import { eq, lte, and } from 'drizzle-orm';
import * as emailService from './emailService';

/**
 * Deduct stock when invoice is created
 */
export async function deductStock(
  productId: string,
  quantity: number,
  referenceType: string,
  referenceId: string,
  userId?: string
): Promise<void> {
  try {
    // Get current product
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const currentStock = product.stockQuantity;
    const newStock = currentStock - quantity;

    if (newStock < 0) {
      throw new Error(
        `Insufficient stock for ${product.name}. Available: ${currentStock}, Required: ${quantity}`
      );
    }

    // Update product stock
    await db
      .update(products)
      .set({ 
        stockQuantity: newStock,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    // Log stock history
    await db.insert(stockHistory).values({
      productId,
      changeType: 'sale',
      quantityChange: (-quantity).toString(),
      balanceAfter: newStock.toString(),
      referenceType,
      referenceId,
      createdBy: userId,
    });

    // Check if stock is low
    if (newStock <= (product.lowStockThreshold || 10)) {
      await sendLowStockAlert(product.id, product.name, newStock, product.lowStockThreshold || 10);
    }
  } catch (error) {
    console.error('Error deducting stock:', error);
    throw error;
  }
}

/**
 * Add stock when purchase is received
 */
export async function addStock(
  productId: string,
  quantity: number,
  referenceType: string,
  referenceId: string,
  userId?: string,
  batchNumber?: string,
  expiryDate?: Date
): Promise<void> {
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const currentStock = product.stockQuantity;
    const newStock = currentStock + quantity;

    // Update product stock
    await db
      .update(products)
      .set({ 
        stockQuantity: newStock,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    // Log stock history
    await db.insert(stockHistory).values({
      productId,
      changeType: 'purchase',
      quantityChange: quantity.toString(),
      balanceAfter: newStock.toString(),
      referenceType,
      referenceId,
      notes: batchNumber ? `Batch: ${batchNumber}` : undefined,
      createdBy: userId,
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    throw error;
  }
}

/**
 * Adjust stock manually (corrections, damages, etc.)
 */
export async function adjustStock(
  productId: string,
  quantityChange: number,
  reason: string,
  userId?: string
): Promise<void> {
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const currentStock = product.stockQuantity;
    const newStock = currentStock + quantityChange;

    if (newStock < 0) {
      throw new Error(`Invalid adjustment. Stock cannot be negative.`);
    }

    // Update product stock
    await db
      .update(products)
      .set({ 
        stockQuantity: newStock,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    // Log stock history
    await db.insert(stockHistory).values({
      productId,
      changeType: 'adjustment',
      quantityChange: quantityChange.toString(),
      balanceAfter: newStock.toString(),
      referenceType: 'manual',
      notes: reason,
      createdBy: userId,
    });

    // Check if stock is low
    if (newStock <= (product.lowStockThreshold || 10)) {
      await sendLowStockAlert(product.id, product.name, newStock, product.lowStockThreshold || 10);
    }
  } catch (error) {
    console.error('Error adjusting stock:', error);
    throw error;
  }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts() {
  try {
    const lowStockItems = await db
      .select()
      .from(products)
      .where(
        lte(products.stockQuantity, products.lowStockThreshold || 10)
      );

    return lowStockItems;
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    throw error;
  }
}

/**
 * Send low stock alert
 */
async function sendLowStockAlert(
  productId: string,
  productName: string,
  currentStock: number,
  threshold: number
): Promise<void> {
  try {
    // Get admin email from env
    const adminEmail = process.env.ADMIN_EMAIL;

    // Send email alert if configured
    if (adminEmail && process.env.EMAIL_USER) {
      try {
        await emailService.sendLowStockEmail(adminEmail, productName, currentStock, threshold);
        console.log(`Low stock alert sent to ${adminEmail} for ${productName}`);
      } catch (error) {
        console.error('Failed to send email alert:', error);
      }
    } else {
      console.warn('Admin email or email configuration not set. Skipping low stock alert.');
    }
  } catch (error) {
    console.error('Error sending low stock alert:', error);
    // Don't throw - this shouldn't stop the main operation
  }
}

/**
 * Check for expiring products (for FMCG/Pharma)
 */
export async function checkExpiringProducts(daysThreshold: number = 30) {
  // This would require tracking batch expiry dates in purchase order items
  // Implementation depends on whether you track batch-wise inventory
  // For now, return empty array
  return [];
}

/**
 * Get reorder suggestions based on sales velocity
 */
export async function getReorderSuggestions() {
  try {
    // Get products below threshold
    const lowStockItems = await getLowStockProducts();

    // Calculate suggested reorder quantity (simple rule: 2x threshold)
    const suggestions = lowStockItems.map((product) => ({
      productId: product.id,
      productName: product.name,
      currentStock: product.stockQuantity,
      threshold: product.lowStockThreshold || 10,
      suggestedReorderQty: (product.lowStockThreshold || 10) * 2,
      unit: product.unit || 'pcs',
    }));

    return suggestions;
  } catch (error) {
    console.error('Error generating reorder suggestions:', error);
    throw error;
  }
}

/**
 * Get stock movement history for a product
 */
export async function getStockHistory(productId: string, limit: number = 50) {
  try {
    const history = await db
      .select()
      .from(stockHistory)
      .where(eq(stockHistory.productId, productId))
      .orderBy(stockHistory.createdAt)
      .limit(limit);

    return history;
  } catch (error) {
    console.error('Error fetching stock history:', error);
    throw error;
  }
}

export default {
  deductStock,
  addStock,
  adjustStock,
  getLowStockProducts,
  checkExpiringProducts,
  getReorderSuggestions,
  getStockHistory,
};
