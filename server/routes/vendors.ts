import express, { Request, Response } from 'express';
import { db } from '../db';
import { vendors, insertVendorSchema } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * Get all vendors
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const allVendors = await db.select().from(vendors);
    res.json(allVendors);
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

/**
 * Get vendor by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [vendor] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error: any) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

/**
 * Create new vendor
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = insertVendorSchema.parse(req.body);

    const [newVendor] = await db
      .insert(vendors)
      .values(validatedData)
      .returning();

    res.status(201).json(newVendor);
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    res.status(400).json({ error: error.message || 'Failed to create vendor' });
  }
});

/**
 * Update vendor
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const [updatedVendor] = await db
      .update(vendors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();

    if (!updatedVendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(updatedVendor);
  } catch (error: any) {
    console.error('Error updating vendor:', error);
    res.status(400).json({ error: error.message || 'Failed to update vendor' });
  }
});

/**
 * Delete vendor
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.delete(vendors).where(eq(vendors.id, id));

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

export default router;
