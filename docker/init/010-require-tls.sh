#!/bin/sh
# First-boot only: refuse unencrypted remote connections. The port is public
# (Vercel has no fixed IPs), so every network login must be TLS + password.
set -e
sed -i -E 's/^host(\s+all\s+all\s+all\s+)/hostssl\1/' "$PGDATA/pg_hba.conf"
