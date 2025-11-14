import express, { Request, Response } from 'express';
import { db } from '../db';
import { expenses, insertExpenseSchema } from '../../shared/schema';
import { eq, sql, and, gte, lte } from 'drizzle-orm';

const router = express.Router();

/**
 * Get all expenses
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, category } = req.query;

    let query = db.select().from(expenses);

    // Apply filters if provided
    const conditions = [];
    if (startDate) {
      conditions.push(gte(expenses.expenseDate, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(expenses.expenseDate, new Date(endDate as string)));
    }
    if (category) {
      conditions.push(eq(expenses.category, category as any));
    }

    const allExpenses = conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;

    res.json(allExpenses);
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

/**
 * Get expense by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .limit(1);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error: any) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

/**
 * Create new expense
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = insertExpenseSchema.parse(req.body);

    // Generate expense number if not provided
    if (!validatedData.expenseNumber) {
      const count = await db.select({ count: sql<number>`count(*)` }).from(expenses);
      const expenseCount = Number(count[0].count) + 1;
      const prefix = process.env.EXPENSE_PREFIX || 'EXP-';
      validatedData.expenseNumber = `${prefix}${expenseCount.toString().padStart(4, '0')}`;
    }

    const [newExpense] = await db
      .insert(expenses)
      .values(validatedData)
      .returning();

    res.status(201).json(newExpense);
  } catch (error: any) {
    console.error('Error creating expense:', error);
    res.status(400).json({ error: error.message || 'Failed to create expense' });
  }
});

/**
 * Update expense
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const [updatedExpense] = await db
      .update(expenses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(expenses.id, id))
      .returning();

    if (!updatedExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(updatedExpense);
  } catch (error: any) {
    console.error('Error updating expense:', error);
    res.status(400).json({ error: error.message || 'Failed to update expense' });
  }
});

/**
 * Delete expense
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.delete(expenses).where(eq(expenses.id, id));

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

/**
 * Get expense summary/statistics
 */
router.get('/summary/stats', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    let query = db.select().from(expenses);

    if (startDate && endDate) {
      query = query.where(
        and(
          gte(expenses.expenseDate, new Date(startDate as string)),
          lte(expenses.expenseDate, new Date(endDate as string))
        )
      ) as any;
    }

    const allExpenses = await query;

    const total = allExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);

    const byCategory = allExpenses.reduce((acc, exp) => {
      const category = exp.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += parseFloat(exp.amount.toString());
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalExpenses: total,
      expenseCount: allExpenses.length,
      byCategory,
    });
  } catch (error: any) {
    console.error('Error fetching expense summary:', error);
    res.status(500).json({ error: 'Failed to fetch expense summary' });
  }
});

export default router;
