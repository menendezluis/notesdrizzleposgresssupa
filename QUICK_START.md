# 🚀 Quick Start - Personal Notes Feature

## One-Command Setup

```bash
# 1. Push database schema
cd packages/db && pnpm push

# 2. Start dev server (from root)
cd ../.. && pnpm dev

# 3. Open http://localhost:3000 and sign in!
```

## 📍 Key URLs

- **Home**: `http://localhost:3000`
- **Notes**: `http://localhost:3000/notes` (requires login)

## 🎯 What You Can Do

### As a User
- ✅ Create personal notes
- ✅ Make notes public or private
- ✅ Edit and delete your own notes
- ✅ View public notes from other users

### As an Admin
- ✅ View ALL notes (including private)
- ✅ Delete any user's notes

## 🔑 Becoming an Admin

Connect to your database and run:

```sql
UPDATE "user" 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## 📁 Important Files

### Backend
- `packages/db/src/schema.ts` - Note schema + validators
- `packages/api/src/router/note.ts` - API endpoints with RBAC

### Frontend  
- `apps/nextjs/src/app/notes/page.tsx` - Notes page
- `apps/nextjs/src/app/_components/notes.tsx` - UI components

## 🎨 Features

- 🔐 Authentication with Discord
- 📝 Full CRUD operations
- 🔒 Role-based access control
- ♿ Accessible (ARIA, keyboard nav)
- 🌙 Dark mode support
- 📱 Responsive design

## 🧪 Quick Test

1. Sign in with Discord
2. Click "My Notes" button
3. Create a note with title "Test" and content "Hello World"
4. Toggle "Make this note public"
5. Submit the form
6. Edit the note
7. Delete the note

## 📚 Full Documentation

- `NOTES_FEATURE.md` - Complete feature docs
- `IMPLEMENTATION_SUMMARY.md` - Technical details

## ⚡ Tech Stack

Next.js 15 • React 19 • tRPC • Drizzle ORM • PostgreSQL • better-auth • Zod • TailwindCSS

