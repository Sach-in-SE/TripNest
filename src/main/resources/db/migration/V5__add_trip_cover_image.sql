-- V5: Add cover_image_url column to trips table for custom cover image uploads
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(1000);
