#!/usr/bin/env bash
# Runs the migration + security tests against a throwaway local PostgreSQL database.
set -euo pipefail
cd "$(dirname "$0")"
DB=${TEST_DB:-tt_smart_test}
PSQL="psql -X -q -v ON_ERROR_STOP=1 ${PGURL:-} "
dropdb --if-exists $DB ${PGURL:+} 2>/dev/null || true
createdb $DB
$PSQL -d $DB -f supabase-stub.sql
$PSQL -d $DB -f ../migrations/20261125000000_smart_experience.sql 2>/dev/null
$PSQL -d $DB -f ../migrations/20261125000000_smart_experience.sql 2>/dev/null   # re-runnable
$PSQL -d $DB -o /dev/null -f rls.test.sql 2>&1 | sed 's/^psql:[^ ]* NOTICE:  /  /'
dropdb $DB
