-- ==============================================================================
-- TripNest — Feature 6: Performance Optimization & Document Stored Name Migration
-- Target: PostgreSQL 14+ / Azure Database for PostgreSQL Flexible Server
-- Fully compatible with Hibernate 6 / Spring Boot 3 ddl-auto=validate
-- ==============================================================================

-- 1. Travel Documents: Dedicated stored_file_name column with unique index
ALTER TABLE travel_documents ADD COLUMN IF NOT EXISTS stored_file_name varchar(255);

-- Backfill existing rows by extracting file name after the last slash of file_url
UPDATE travel_documents
SET stored_file_name = REGEXP_REPLACE(file_url, '^.*/', '')
WHERE stored_file_name IS NULL AND file_url IS NOT NULL;

-- Unique constraint / index for fast O(1) B-tree lookups during file downloads
CREATE UNIQUE INDEX IF NOT EXISTS uk_travel_documents_stored_file_name ON travel_documents (stored_file_name);

-- 2. Trips: Composite index for user trips filtered by status (e.g. COMPLETED for history)
CREATE INDEX IF NOT EXISTS idx_trips_user_status ON trips (user_id, status);

-- 3. Itineraries: Composite index for ordering itinerary days chronologically
CREATE INDEX IF NOT EXISTS idx_itineraries_trip_date ON itineraries (trip_id, date ASC);

-- 4. Activities: Composite index for ordering activities by start time within an itinerary
CREATE INDEX IF NOT EXISTS idx_activities_itin_start ON activities (itinerary_id, start_time ASC);

-- 5. Expenses: Composite index for reverse-chronological trip expenses
CREATE INDEX IF NOT EXISTS idx_expenses_trip_date ON expenses (trip_id, date DESC);

-- 6. Group Memberships: Composite index for active/pending member filtering by group
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_status ON group_memberships (group_id, status);

-- 7. Notifications: Indexes for unread count checks and reverse-chronological user listing
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);

-- 8. Destinations: Composite index for category filtering and popular destination queries
CREATE INDEX IF NOT EXISTS idx_destinations_category_popular ON destinations (category, popular);
