import { Router } from 'express';
import { db } from '../db';
import { 
  notifications, 
  notificationPreferences, 
  insertNotificationSchema,
  insertNotificationPreferenceSchema 
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import * as notificationService from '../services/notificationService';

const router = Router();

// Get all notifications for current user
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    res.json(userNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get unread notification count
router.get('/unread-count', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.status, 'unread')
        )
      );

    res.json({ count: unreadNotifications.length });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req: any, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const updatedNotification = await db
      .update(notifications)
      .set({ 
        status: 'read',
        readAt: new Date()
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    if (updatedNotification.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(updatedNotification[0]);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.post('/mark-all-read', async (req: any, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    await db
      .update(notifications)
      .set({ 
        status: 'read',
        readAt: new Date()
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.status, 'unread')
        )
      );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// Archive notification
router.put('/:id/archive', async (req: any, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const updatedNotification = await db
      .update(notifications)
      .set({ status: 'archived' })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    if (updatedNotification.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(updatedNotification[0]);
  } catch (error) {
    console.error('Error archiving notification:', error);
    res.status(500).json({ message: 'Failed to archive notification' });
  }
});

// Delete notification
router.delete('/:id', async (req: any, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const deletedNotification = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    if (deletedNotification.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// Get notification preferences for current user
router.get('/preferences', async (req: any, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const preferences = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    // If no preferences exist, return defaults
    if (preferences.length === 0) {
      const defaultPreferences = {
        userId,
        emailNotifications: 1,
        lowStockAlerts: 1,
        paymentReminders: 1,
        monthlySummary: 1,
        gstFilingReminders: 1,
        backupReminders: 1,
        inAppNotifications: 1,
        whatsappNotifications: 0,
        lowStockThreshold: 10,
        reminderDaysBefore: 3,
      };
      res.json(defaultPreferences);
    } else {
      res.json(preferences[0]);
    }
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ message: 'Failed to fetch notification preferences' });
  }
});

// Update notification preferences
router.put('/preferences', async (req: any, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const validatedData = insertNotificationPreferenceSchema.partial().parse(req.body);

    // Check if preferences exist
    const existingPreferences = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    let updatedPreferences;

    if (existingPreferences.length === 0) {
      // Create new preferences
      updatedPreferences = await db
        .insert(notificationPreferences)
        .values({
          ...validatedData,
          userId,
        })
        .returning();
    } else {
      // Update existing preferences
      updatedPreferences = await db
        .update(notificationPreferences)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, userId))
        .returning();
    }

    res.json(updatedPreferences[0]);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Failed to update notification preferences' });
  }
});

// Test notification endpoint (for development/testing)
router.post('/test', async (req: any, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { type } = req.body;

    let result;
    switch (type) {
      case 'low_stock':
        result = await notificationService.checkLowStockAlerts();
        break;
      case 'payment_reminder':
        result = await notificationService.sendPaymentReminders();
        break;
      case 'monthly_summary':
        result = await notificationService.sendMonthlySummary();
        break;
      case 'gst_filing':
        result = await notificationService.sendGSTFilingReminders();
        break;
      case 'backup':
        result = await notificationService.sendBackupReminders();
        break;
      default:
        return res.status(400).json({ message: 'Invalid notification type' });
    }

    res.json({ 
      message: 'Test notification triggered',
      result 
    });
  } catch (error) {
    console.error('Error triggering test notification:', error);
    res.status(500).json({ message: 'Failed to trigger test notification' });
  }
});

// Create manual notification (admin only)
router.post('/', async (req: any, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const validatedData = insertNotificationSchema.parse(req.body);

    const newNotification = await db
      .insert(notifications)
      .values(validatedData)
      .returning();

    res.status(201).json(newNotification[0]);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
});

export default router;
