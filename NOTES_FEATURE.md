# Personal Notes Feature

This document describes the Personal Notes feature implementation with authentication, RBAC, and accessibility.

## 🎯 Features

- ✅ **Authentication** via better-auth with Discord OAuth
- ✅ **Database** via Drizzle ORM + Supabase/Vercel Postgres
- ✅ **RBAC** (Role-Based Access Control) - User roles: `user`, `admin`, `moderator`
- ✅ **Next.js App Router** with tRPC and Zod validation
- ✅ **Full CRUD** operations for notes
- ✅ **Public/Private Notes** - Users can make notes public for others to view
- ✅ **Accessibility** - ARIA labels, semantic HTML, keyboard navigation

## 📦 What Was Added

### 1. Database Schema (`packages/db/src/`)

#### Updated `auth-schema.ts`
- Added `role` field to the `user` table (default: "user")
- Supports RBAC with roles: `user`, `admin`, `moderator`

#### Updated `schema.ts`
- **Note Table**: Personal notes with title, content, userId, isPublic flag
- **Relations**: User has many notes, Note belongs to user
- **Validators**: `CreateNoteSchema` and `UpdateNoteSchema` with Zod

### 2. API Layer (`packages/api/src/router/`)

#### `note.ts` - Complete CRUD with RBAC
```typescript
// User endpoints (all authenticated users)
- note.all           // Get own notes + public notes from others
- note.myNotes       // Get only own notes
- note.byId          // Get specific note (if owner or public)
- note.create        // Create new note
- note.update        // Update own note
- note.delete        // Delete own note

// Admin endpoints (admins only)
- note.adminAll      // Get all notes (including private)
- note.adminDelete   // Delete any note
```

**RBAC Implementation:**
- Uses custom `requireRole` middleware to check user permissions
- Admin routes are protected and require "admin" role
- Regular users can only modify their own notes

### 3. UI Components (`apps/nextjs/src/app/_components/`)

#### `notes.tsx` - Fully accessible React components
- **CreateNoteForm**: Form with title, content, and public toggle
- **NoteCard**: Display/edit individual notes with proper ARIA labels
- **NoteList**: List all notes with loading states
- **NoteCardSkeleton**: Loading skeleton for better UX

**Accessibility Features:**
- Semantic HTML (`<article>`, `<section>`, `<header>`)
- ARIA labels and descriptions
- Proper form labels and required field indicators
- Keyboard navigation support
- Focus management
- Error announcements with `role="alert"`

### 4. Notes Page (`apps/nextjs/src/app/notes/page.tsx`)

- Protected route (requires authentication)
- Server-side session check
- Suspense boundaries for loading states
- Metadata for SEO

### 5. UI Package Updates (`packages/ui/`)

#### New `textarea.tsx` component
- Consistent styling with other form components
- Accessibility features (focus rings, ARIA support)
- Dark mode support

## 🚀 Getting Started

### 1. Set Up Environment Variables

Make sure you have the following in your `.env`:

```bash
# Database (Supabase/Vercel Postgres)
POSTGRES_URL="postgresql://..."

# Better Auth
AUTH_SECRET="your-secret-key"
AUTH_URL="http://localhost:3000"

# Discord OAuth
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"
```

### 2. Push Database Schema

```bash
cd packages/db
pnpm push
```

This will create the `user`, `note`, and auth-related tables in your database.

### 3. Run the Development Server

```bash
pnpm dev
```

### 4. Access the Notes Feature

1. Visit `http://localhost:3000`
2. Click "Sign in with Discord"
3. After authentication, click "My Notes" button
4. Create, edit, and delete notes!

## 🔐 RBAC: Setting User Roles

By default, all users have the `user` role. To promote a user to admin:

```sql
-- Connect to your database and run:
UPDATE "user" 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

**Admin Capabilities:**
- View all notes (including private ones)
- Delete any user's notes
- Access to admin-only tRPC endpoints

## 🎨 UI/UX Features

### Notes Management
- **Create**: Simple form with title, content, and public toggle
- **Edit**: Inline editing with save/cancel actions
- **Delete**: Confirmation dialog before deletion
- **Public Toggle**: Make notes visible to other users

### Accessibility
- **Screen Reader Support**: All interactive elements properly labeled
- **Keyboard Navigation**: Full keyboard support (Tab, Enter, Escape)
- **Focus Indicators**: Clear visual focus states
- **Error Messages**: Announced to screen readers
- **Loading States**: Accessible loading indicators

### Responsive Design
- Mobile-first approach
- Works on all screen sizes
- Touch-friendly buttons and inputs

## 📝 Code Examples

### Creating a Note

```typescript
const createNote = trpc.note.create.useMutation({
  onSuccess: () => {
    // Invalidate queries to refetch
    utils.note.invalidate();
  },
});

// Usage
createNote.mutate({
  title: "My Note",
  content: "Note content here",
  isPublic: false,
});
```

### Admin: View All Notes

```typescript
// Only works if user has "admin" role
const { data: allNotes } = trpc.note.adminAll.useQuery();
```

## 🧪 Testing RBAC

1. **As Regular User:**
   - Create notes (own notes only)
   - View own notes + public notes from others
   - Edit/delete only own notes

2. **As Admin:**
   - Use `adminAll` endpoint to see all notes
   - Use `adminDelete` to delete any note
   - If role is not "admin", will receive FORBIDDEN error

## 🔒 Security Features

- **Server-side validation**: All inputs validated with Zod schemas
- **Authorization checks**: Users can only modify their own notes
- **Role-based permissions**: Admin endpoints check user role
- **SQL injection protection**: Drizzle ORM with parameterized queries
- **XSS protection**: React automatically escapes content

## 📚 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS
- **Backend**: tRPC, Drizzle ORM
- **Database**: PostgreSQL (Supabase/Vercel)
- **Auth**: better-auth with Discord OAuth
- **Validation**: Zod
- **UI Components**: Custom components with Radix UI primitives

## 🎯 Future Enhancements

Potential improvements:
- [ ] Rich text editor for note content
- [ ] Note categories/tags
- [ ] Search and filter functionality
- [ ] Note sharing with specific users
- [ ] Export notes (PDF, Markdown)
- [ ] Note templates
- [ ] Collaborative notes
- [ ] Version history

## 📖 Resources

- [better-auth Documentation](https://better-auth.vercel.app/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [tRPC Documentation](https://trpc.io/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

