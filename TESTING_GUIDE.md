# 🧪 Testing Guide - How to Run This Project

## 📋 Prerequisites

Before you start, make sure you have:

- ✅ Node.js 18+ installed
- ✅ pnpm installed (`npm install -g pnpm`)
- ✅ Supabase account with a project
- ✅ Discord Developer account (for OAuth)

---

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
# Navigate to project root
cd /Users/luismenendez/golden/challenge-t3-1

# Install all dependencies
pnpm install
```

**Expected output:** Dependencies will be installed for all packages in the monorepo.

---

### Step 2: Set Up Environment Variables

#### Option A: Quick Setup (Use Template)

```bash
# Copy the template
cp ENV_TEMPLATE.txt .env

# Edit the file with your credentials
nano .env
# or use your preferred editor: code .env, vim .env, etc.
```

#### Option B: Create .env Manually

Create a file named `.env` in the project root with:

```bash
# Get PostgreSQL connection string from Supabase
POSTGRES_URL="postgresql://postgres.brdxrzesowhzfqekukgb:[YOUR-DB-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"

# Generate with: openssl rand -base64 32
AUTH_SECRET="your-random-secret-here"

# Discord OAuth credentials
AUTH_DISCORD_ID="your-discord-client-id"
AUTH_DISCORD_SECRET="your-discord-client-secret"

NODE_ENV="development"
```

#### 🔑 How to Get Each Variable:

**POSTGRES_URL:**
1. Go to: https://supabase.com/dashboard/project/brdxrzesowhzfqekukgb/settings/database
2. Find "Connection string" → "URI" tab
3. Copy and replace `[YOUR-PASSWORD]` with your database password

**AUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Discord Credentials:**
1. Go to: https://discord.com/developers/applications
2. Create/select application
3. OAuth2 section → Copy Client ID and Secret
4. Add redirect: `http://localhost:3000/api/auth/callback/discord`

---

### Step 3: Push Database Schema

```bash
# Navigate to database package
cd packages/db

# Push schema to Supabase (creates all tables)
pnpm push
```

**Expected output:**
```
✓ Pushing schema changes
✓ Schema pushed successfully
```

**Tables created:**
- `user` (with role field for RBAC)
- `note` (personal notes table)
- `session`, `account`, `verification` (auth tables)

---

### Step 4: Start Development Server

```bash
# Go back to project root
cd ../..

# Start the dev server
pnpm dev
```

**Expected output:**
```
> turbo run dev

- @acme/nextjs:dev: ready started server on 0.0.0.0:3000
- @acme/nextjs:dev: ✓ Ready in 2.5s
```

The app will be running at: **http://localhost:3000**

---

## 🧪 Testing the Application

### Test 1: Authentication ✅

1. **Open** http://localhost:3000
2. **Click** "Sign in with Discord"
3. **Authorize** the application
4. **Verify** you're redirected back and see "Logged in as [Your Name]"

**Expected Result:** You should see your Discord profile name and a "My Notes" button.

---

### Test 2: Create a Note ✅

1. **Click** "My Notes" button
2. **Fill in** the form:
   - Title: "My First Note"
   - Content: "This is a test note"
   - Check "Make this note public" (optional)
3. **Click** "Create Note"

**Expected Result:** 
- Form clears
- New note appears below with title and content
- Note shows your name and timestamp

---

### Test 3: Edit a Note ✅

1. **Click** "Edit" button on your note
2. **Change** title to "Updated Note"
3. **Click** "Save"

**Expected Result:**
- Note updates with new title
- Returns to view mode

---

### Test 4: Delete a Note ✅

1. **Click** "Delete" button on your note
2. **Confirm** deletion in the dialog
3. **Verify** note is removed

**Expected Result:**
- Confirmation dialog appears
- Note is deleted and removed from list

---

### Test 5: Public Notes ✅

**Setup:** You need a second user for this test

1. **Create** a note with "Make this note public" checked
2. **Sign out**
3. **Sign in** with a different Discord account
4. **Go to** "My Notes"

**Expected Result:**
- Second user can see the public note from first user
- Second user CANNOT edit or delete the public note
- Note shows "by [First User's Name]"

---

### Test 6: RBAC - Admin Access ✅

**Setup Admin User:**

```bash
# Connect to Supabase SQL Editor or use psql
# Go to: https://supabase.com/dashboard/project/brdxrzesowhzfqekukgb/editor

# Run this SQL:
UPDATE "user" 
SET role = 'admin' 
WHERE email = 'your-discord-email@example.com';
```

**Test Admin Endpoints:**

Open browser console (F12) and run:

```javascript
// This should work for admins only
const adminNotes = await window.trpc.note.adminAll.query();
console.log(adminNotes);
```

**Expected Result:**
- Admins see ALL notes (including private ones)
- Non-admins get FORBIDDEN error

---

## 🎯 Complete Test Checklist

Run through this checklist:

- [ ] Dependencies installed (`pnpm install`)
- [ ] `.env` file created with all variables
- [ ] Database schema pushed (`pnpm db:push`)
- [ ] Dev server running (`pnpm dev`)
- [ ] Can sign in with Discord
- [ ] Can create a note
- [ ] Can edit own note
- [ ] Can delete own note
- [ ] Can toggle public/private
- [ ] Can view public notes from others
- [ ] Cannot edit others' notes
- [ ] Admin can view all notes (if promoted)

---

## 📱 Test Scenarios

### Scenario 1: Regular User Journey

```
1. Sign in → See home page
2. Click "My Notes" → See notes page
3. Create private note → Note appears
4. Create public note → Note appears with "Public" badge
5. Edit note → Changes saved
6. Delete note → Note removed
```

### Scenario 2: Multi-User Interaction

```
User A:
1. Create public note "Public Post"
2. Create private note "Private Thoughts"

User B:
1. Sign in with different account
2. Go to My Notes
3. See User A's "Public Post" ✓
4. Cannot see User A's "Private Thoughts" ✓
5. Cannot edit User A's "Public Post" ✓
```

### Scenario 3: Admin Privileges

```
Admin User:
1. Promoted to admin role in database
2. Can use adminAll endpoint
3. Sees all notes (public + private)
4. Can delete any user's note
```

---

## 🐛 Troubleshooting

### Issue: "Missing POSTGRES_URL"

**Solution:**
```bash
# Check .env file exists
ls -la | grep .env

# Verify content
cat .env | grep POSTGRES_URL

# Restart dev server
pnpm dev
```

---

### Issue: "Connection refused" to database

**Solution:**
1. Check password in POSTGRES_URL is correct
2. Verify port is 6543 (Transaction Mode)
3. Test connection in Supabase dashboard

---

### Issue: Discord OAuth fails

**Solution:**
1. Check redirect URI in Discord Developer Portal:
   - Should be: `http://localhost:3000/api/auth/callback/discord`
2. Verify CLIENT_ID and SECRET in .env
3. Clear browser cookies and try again

---

### Issue: "Table does not exist"

**Solution:**
```bash
cd packages/db
pnpm push
```

---

### Issue: Can't see notes

**Solution:**
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for failed requests
4. Verify you're signed in (session exists)

---

## 🔍 Verify Everything Works

### Quick Health Check:

```bash
# Terminal 1: Check dev server is running
curl http://localhost:3000

# Terminal 2: Check database connection
cd packages/db
pnpm studio
# Opens Drizzle Studio at http://localhost:4983
```

### Browser DevTools Check:

1. Open http://localhost:3000
2. Press F12 (DevTools)
3. Go to Console tab
4. Should see no errors (warnings are OK)
5. Check Application → Cookies → Should see auth cookies

---

## 📊 Expected Database State

After testing, your database should have:

### Users Table:
```
id | name        | email              | role
---+-------------+--------------------+------
1  | Your Name   | you@discord.com    | user
2  | Test User   | test@discord.com   | user
```

### Notes Table:
```
id | title          | content      | user_id | is_public
---+----------------+--------------+---------+----------
1  | My First Note  | Test content | 1       | false
2  | Public Note    | Hello World  | 1       | true
```

---

## 🎉 Success Criteria

Your setup is successful if:

✅ Dev server starts without errors  
✅ You can sign in with Discord  
✅ You can access /notes page  
✅ You can create, edit, delete notes  
✅ Public notes are visible to other users  
✅ Private notes are hidden from other users  
✅ Admin users can see all notes  

---

## 🚀 Next Steps After Testing

Once everything works:

1. **Deploy to Vercel:**
   ```bash
   vercel
   ```

2. **Set Production Environment Variables** in Vercel Dashboard

3. **Update Discord OAuth** redirect URI for production domain

4. **Invite users** to test the app

---

## 📞 Still Having Issues?

1. Check `SUPABASE_SETUP.md` for detailed Supabase configuration
2. Check `NOTES_FEATURE.md` for feature documentation
3. Check browser console for errors
4. Check terminal for server errors
5. Verify all environment variables are set correctly

---

## 💡 Pro Tips

- **Use Drizzle Studio** to inspect database:
  ```bash
  cd packages/db && pnpm studio
  ```

- **Clear cache** if things seem broken:
  ```bash
  pnpm clean
  pnpm install
  ```

- **Check logs** for detailed errors:
  ```bash
  # Server logs appear in terminal where pnpm dev is running
  ```

- **Test in incognito** to avoid cache issues

- **Use multiple browsers** to test multi-user scenarios

---

Happy Testing! 🎉

