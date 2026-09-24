-- Migration V4: Add email_notifications column to notification_preferences table
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT TRUE;
