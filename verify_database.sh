#!/bin/bash

# GSTEaseSuite Database Verification Script
# This script verifies database connection and shows table information

echo "======================================"
echo "GSTEaseSuite Database Verification"
echo "======================================"
echo ""

# Check if PostgreSQL is running
echo "1. Checking PostgreSQL service..."
if pgrep -x "postgres" > /dev/null; then
    echo "   ✅ PostgreSQL is running"
else
    echo "   ❌ PostgreSQL is NOT running"
    echo "   Start it with: brew services start postgresql@14"
    exit 1
fi

echo ""
echo "2. Connecting to database 'gstease'..."
echo ""

# Run database queries
psql -d gstease << EOF

-- Show database information
\echo '======================================'
\echo 'DATABASE INFORMATION'
\echo '======================================'
SELECT current_database() as database_name, 
       current_user as connected_as,
       version() as postgres_version;

\echo ''
\echo '======================================'
\echo 'TOTAL NUMBER OF TABLES'
\echo '======================================'
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

\echo ''
\echo '======================================'
\echo 'ALL TABLES WITH RECORD COUNTS'
\echo '======================================'

-- Create a temporary function to get all table counts
DO \$\$
DECLARE
    r RECORD;
    table_count INTEGER;
BEGIN
    FOR r IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', r.table_name) INTO table_count;
        RAISE NOTICE '% | Records: %', RPAD(r.table_name, 30), table_count;
    END LOOP;
END \$\$;

\echo ''
\echo '======================================'
\echo 'TABLE STRUCTURE OVERVIEW'
\echo '======================================'
SELECT 
    t.table_name,
    COUNT(c.column_name) as columns,
    string_agg(c.column_name, ', ' ORDER BY c.ordinal_position) as sample_columns
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;

\echo ''
\echo '======================================'
\echo 'FOREIGN KEY RELATIONSHIPS'
\echo '======================================'
SELECT
    COUNT(*) as total_foreign_keys
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public';

\echo ''
\echo '======================================'
\echo 'CUSTOM ENUM TYPES'
\echo '======================================'
SELECT 
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

\echo ''
\echo '======================================'
\echo 'DATABASE SIZE'
\echo '======================================'
SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;

\echo ''
\echo '✅ Database verification complete!'
\echo ''

EOF
