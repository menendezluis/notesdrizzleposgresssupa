# 🗄️ Supabase Setup Guide

## Important Note About Your Credentials

You provided:
- **Project URL**: `https://brdxrzesowhzfqekukgb.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

⚠️ **However**, this project uses **Drizzle ORM** which requires a direct **PostgreSQL connection string**, not the Supabase API URL and anon key.

The anon key is for client-side Supabase API calls, but we're connecting directly to the PostgreSQL database.

---

## 🔑 Getting Your Database Connection String

### Step 1: Go to Supabase Dashboard

Visit: https://supabase.com/dashboard/project/brdxrzesowhzfqekukgb

### Step 2: Navigate to Database Settings

1. Click the **Settings** icon (⚙️) in the sidebar
2. Click **Database** in the settings menu

### Step 3: Get Connection String

1. Scroll down to **"Connection string"** section
2. Select **"URI"** mode (not "Transaction" tabs)
3. You'll see a connection string like:

```
postgresql://postgres.brdxrzesowhzfqekukgb:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

4. Replace `[YOUR-PASSWORD]` with your actual database password
   - If you forgot it, you can reset it in the Database settings

### Step 4: Choose Connection Mode

Supabase offers three connection modes:

- **Transaction Mode** (port 6543) - Recommended for serverless ✅
- **Session Mode** (port 5432) - For long-lived connections
- **Direct Connection** (port 5432) - Direct to database

**For this project, use Transaction Mode (port 6543)** for best Vercel compatibility.

---

## 📝 Setting Up Environment Variables

### Create `.env` file

Create a `.env` file in the root of your project:

```bash
# Navigate to project root
cd /Users/luismenendez/golden/challenge-t3-1

# Create .env file
touch .env
```

### Add Your Credentials

Add the following to your `.env` file:

```bash
# Supabase Database Connection (Transaction Mode - port 6543)
POSTGRES_URL="postgresql://postgres.brdxrzesowhzfqekukgb:[YOUR-DATABASE-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"

# Better Auth Secret (generate with: openssl rand -base64 32)
AUTH_SECRET="your-generated-secret-here"

# Discord OAuth Credentials
AUTH_DISCORD_ID="your-discord-client-id"
AUTH_DISCORD_SECRET="your-discord-client-secret"

# Environment
NODE_ENV="development"
```

---

## 🎮 Setting Up Discord OAuth (Optional but Recommended)

### Step 1: Go to Discord Developer Portal

Visit: https://discord.com/developers/applications

### Step 2: Create Application

1. Click **"New Application"**
2. Name it (e.g., "Personal Notes App")
3. Click **"Create"**

### Step 3: Get OAuth Credentials

1. Click **"OAuth2"** in the sidebar
2. Copy your **Client ID**
3. Copy your **Client Secret** (click "Reset Secret" if needed)

### Step 4: Add Redirect URIs

1. Still in OAuth2 section
2. Click **"Add Redirect"**
3. Add for local development:
   ```
   http://localhost:3000/api/auth/callback/discord
   ```
4. Add for production (when deployed):
   ```
   https://your-domain.com/api/auth/callback/discord
   ```
5. Click **"Save Changes"**

---

## 🚀 Push Schema to Database

Once your `.env` is configured:

```bash
# Navigate to db package
cd packages/db

# Push schema to Supabase
pnpm push

# This will create all tables: user, note, session, account, verification
```

### Expected Output

You should see:
```
✓ Pushing schema to database...
✓ Schema pushed successfully
```

---

## 🔒 Security Best Practices

### ⚠️ Never Commit `.env` File

Your `.env` file contains secrets and should never be committed to Git.

It's already in `.gitignore`, but verify:

```bash
cat .gitignore | grep .env
```

Should show:
```
.env
.env*.local
```

### 🔐 For Production (Vercel)

When deploying to Vercel, add environment variables in:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - `POSTGRES_URL`
   - `AUTH_SECRET`
   - `AUTH_DISCORD_ID`
   - `AUTH_DISCORD_SECRET`

---

## ✅ Verify Setup

### Test Database Connection

```bash
# From project root
cd packages/db
pnpm studio
```

This will open Drizzle Studio where you can browse your database.

### Test Application

```bash
# From project root
pnpm dev
```

Visit `http://localhost:3000` and try:
1. Sign in with Discord
2. Navigate to `/notes`
3. Create a note

---

## 🆘 Troubleshooting

### Error: "Missing POSTGRES_URL"

- Make sure `.env` file is in the project root
- Check that the variable name is exactly `POSTGRES_URL`
- Restart your dev server after adding variables

### Error: "Connection refused"

- Verify your database password is correct
- Check that you're using port 6543 (Transaction Mode)
- Ensure your IP is allowed (Supabase allows all IPs by default)

### Error: "AUTH_SECRET is required"

Generate a secret:
```bash
openssl rand -base64 32
```

Add it to your `.env` file.

### Error: Discord OAuth fails

- Check redirect URIs are correct
- Verify Discord Client ID and Secret
- Make sure you saved changes in Discord Developer Portal

---

## 📋 Quick Reference

Your Supabase project details:

- **Project Ref**: `brdxrzesowhzfqekukgb`
- **Project URL**: `https://brdxrzesowhzfqekukgb.supabase.co`
- **Dashboard**: `https://supabase.com/dashboard/project/brdxrzesowhzfqekukgb`

Connection string format:
```
postgresql://postgres.brdxrzesowhzfqekukgb:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

Replace:
- `[PASSWORD]` - Your database password
- `[region]` - Your Supabase region (e.g., us-east-1, eu-west-1)

---

## 📞 Need Help?

1. Check Supabase docs: https://supabase.com/docs/guides/database/connecting-to-postgres
2. Check better-auth docs: https://better-auth.com/docs
3. Review project docs: `QUICK_START.md`, `NOTES_FEATURE.md`

