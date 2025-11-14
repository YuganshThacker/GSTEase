# 🎯 SIMPLE GUIDE: View Your Database in pgAdmin

## Step-by-Step (5 Minutes Total)

### STEP 1: Install pgAdmin (1 minute)

**Download Link:** https://www.pgadmin.org/download/pgadmin-4-macos/

1. Click the link above
2. Download the `.dmg` file
3. Open the downloaded file
4. Drag pgAdmin 4 to Applications folder
5. Open pgAdmin 4 from Applications

### STEP 2: Create Server Connection (2 minutes)

When pgAdmin opens (in your browser):

1. **Right-click on "Servers"** (in left sidebar)
2. Click **"Register" → "Server"**
3. Fill in these details:

#### General Tab:
```
Name: GSTEaseSuite
```

#### Connection Tab:
```
Host name/address: localhost
Port: 5432
Maintenance database: gstease
Username: yugansh (or postgres)
Password: (leave blank if no password set, or enter your password)
```

4. Check ☑️ **"Save password"**
5. Click **"Save"**

### STEP 3: View Your Tables (1 minute)

Navigate through this path in the left sidebar:

```
Servers
  └── GSTEaseSuite
      └── Databases
          └── gstease
              └── Schemas
                  └── public
                      └── Tables  👈 CLICK HERE!
```

**🎉 You'll see all 15 tables:**

1. categories
2. customers
3. expenses
4. invoice_items
5. invoices
6. notifications
7. payments
8. products
9. purchase_order_items
10. purchase_orders
11. sessions
12. stock_history
13. users
14. vendors
15. whatsapp_logs

### STEP 4: View Data in a Table (1 minute)

To see the data in any table:

1. **Right-click on any table** (e.g., `customers`)
2. Select **"View/Edit Data"** → **"All Rows"**
3. The data will show in a grid view ✨

---

## 🎯 For Your Presentation

### Quick Demo Query:

1. Click the **⚡ Query Tool** icon (top menu)
2. Paste this query:

```sql
-- Show all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

3. Click **▶ Execute** button
4. Show the result to your professor (15 tables!) 🎓

---

## 🆘 Troubleshooting

### Can't Connect?

Make sure PostgreSQL is running:

```bash
# Check if running
brew services list

# If not running, start it:
brew services start postgresql
# or
brew services start postgresql@14
```

### Wrong Username/Password?

Try these usernames:
- `yugansh` (your Mac username)
- `postgres` (default PostgreSQL user)

If password is required and you don't know it, you can reset it.

### Database "gstease" doesn't exist?

Check your `.env` file:
```bash
cat .env | grep DATABASE_URL
```

It should show: `postgresql://localhost:5432/gstease`

---

## 🎬 Visual Reference

### What You'll See:

```
pgAdmin 4 Interface:

┌─────────────────────────────────────────────────────┐
│ File  Object  Tools  Help                          │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│ Servers      │  Properties / SQL / Statistics      │
│   ├── GST... │                                      │
│       ├── DB │  [Table details shown here]         │
│         ├── g│                                      │
│           ├──│                                      │
│             T│  Or run queries here...             │
│             ├│                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
    Tree View          Main Panel (Data/Queries)
```

---

## ✅ Success Checklist

- [ ] pgAdmin 4 installed and opens
- [ ] Server "GSTEaseSuite" created and connected
- [ ] Can see database "gstease"
- [ ] Can see "public" schema
- [ ] Can see all 15 tables
- [ ] Can view data in tables
- [ ] Can run queries

---

## 📞 Quick Commands (Alternative)

If pgAdmin doesn't work, use terminal:

```bash
# Connect to database
psql -d gstease

# List all tables
\dt

# See table structure
\d customers

# Run a query
SELECT * FROM customers LIMIT 5;

# Exit
\q
```

---

**You're all set! 🚀 See you at the presentation tomorrow! 🎓**
