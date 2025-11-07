# Candidate Submission — Personal Notes Challenge

## Overview

I built a full-stack Personal Notes application with role-based access control using the T3 Stack. The solution demonstrates:

- **Authentication** via Better Auth with Discord OAuth
- **Server-side RBAC** enforced through tRPC middleware
- **Type-safe API** with end-to-end TypeScript via tRPC
- **PostgreSQL database** managed with Drizzle ORM on Supabase
- **Accessible UI** with proper semantic HTML, ARIA labels, and keyboard navigation

The approach prioritizes **security** (server-side authorization checks), **developer experience** (full type safety), and **code quality** (clear separation of concerns across the monorepo).

---

## ✅ Features Completed

| Feature                                  | Status | Notes |
| ---------------------------------------- | ------ | ----- |
| Supabase setup                           | ✅ Complete | Postgres connection via pooler (Transaction Mode) |
| Drizzle schema + migrations              | ✅ Complete | `Note` table with relations, `role` field on `user` |
| better-auth login                        | ✅ Complete | Discord OAuth with session management |
| Admin + member roles                     | ✅ Complete | `user.role` field with default "user", admin capabilities |
| Create notes                             | ✅ Complete | `note.create` with title, content, public toggle |
| List (member = own only)                 | ✅ Complete | `note.myNotes` + `note.all` (own + public from others) |
| List (admin = all)                       | ✅ Complete | `note.adminAll` endpoint with role middleware |
| Delete note with RBAC                    | ✅ Complete | Ownership check for users, `adminDelete` for admins |
| Zod validation                           | ✅ Complete | Shared schemas in DB package, validated client + server |
| Accessibility (labels, aria-live, focus) | ✅ Complete | ARIA labels, semantic HTML, keyboard nav, focus management |

**Status key**: ✅ Complete | ⚠️ Partial | ❌ Not attempted

---

## 🧠 Design Decisions

### Architecture

**Monorepo structure** leverages the existing T3 Turbo setup:
- `packages/api` - tRPC router with business logic isolated from UI
- `packages/db` - Single source of truth for schema and Zod validators
- `packages/ui` - Reusable, accessible components
- `apps/nextjs` - Thin presentation layer consuming typed APIs

**Why this matters:** Changes to the database schema automatically propagate type updates through tRPC to the frontend without code generation. Adding a new field to `Note` instantly gives autocomplete in UI components.

### Auth & RBAC

**Server-side enforcement is critical.** The solution implements RBAC in three layers:

1. **Database layer** - `user.role` field (default: "user")
2. **API layer** - Custom `requireRole()` middleware:
   ```typescript
   const requireRole = (allowedRoles: string[]) => {
     return protectedProcedure.use(async ({ ctx, next }) => {
       const userRecord = await ctx.db.query.user.findFirst({
         where: eq(user.id, ctx.session.user.id),
       });
       if (!userRecord || !allowedRoles.includes(userRecord.role)) {
         throw new TRPCError({ code: "FORBIDDEN" });
       }
       return next({ ctx: { ...ctx, userRole: userRecord.role } });
     });
   };
   ```
3. **UI layer** - Conditional rendering (convenience only, not security)

**Key decision:** Never trust client-side role checks. Every sensitive operation (delete any note, view all notes) goes through the `requireRole` middleware which fetches the user's role fresh from the database on each request.

**Better Auth choice:** Selected Discord OAuth because it's already configured in the template and provides a production-ready flow with minimal setup. Better Auth handles session management, CSRF protection, and OAuth state validation automatically.

### Data Model

**Note schema:**
```typescript
{
  id: uuid (pk)
  title: varchar(256) - Required, user-facing title
  content: text - Required, main note body
  userId: text (fk) - Owner reference with cascade delete
  isPublic: boolean - Visibility toggle (default: false)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Design rationale:**
- **`userId` foreign key** ensures referential integrity (user deletion cascades)
- **`isPublic` flag** enables sharing without complex permissions system
- **Separate title/content** supports better UX (searchability, summaries)
- **UUID primary key** avoids enumeration attacks
- **Timestamps** enable sorting and audit trails

**User-Note relationship:** One-to-many with explicit Drizzle relations enables eager loading:
```typescript
with: { user: { columns: { name: true, image: true } } }
```

### Accessibility

**Semantic HTML first:**
- `<article>` for note cards
- `<time>` with `dateTime` attribute
- `<form>` with proper `<label>` associations
- `<section>` for content grouping

**ARIA where needed:**
- `aria-label` on forms and complex components
- `aria-required` on required fields
- `aria-describedby` for help text
- `role="alert"` for error messages
- `role="list"` for note collections

**Keyboard navigation:**
- All interactive elements in tab order
- Form submission via Enter
- Disabled states prevent confusion
- Visual focus indicators (via Tailwind focus-visible)

**Screen reader considerations:**
- Loading states announced via Suspense boundaries
- Error messages in alert regions
- Public badge has `aria-label="Public note"`

---

## 🧪 If I Had More Time

- **Rich text editor** - Implement Tiptap or Lexical for formatted notes
- **Search & filter** - Full-text search across notes, filter by public/private
- **Tags/categories** - Multi-tag system with many-to-many relationships
- **Collaborative notes** - Real-time editing with WebSockets or PartyKit
- **Export functionality** - Export notes to Markdown, PDF, or JSON
- **Note templates** - Predefined note structures for common use cases
- **Revision history** - Track changes with versioning and rollback
- **Advanced RBAC** - Moderator role with content moderation capabilities
- **Optimistic updates** - Instant UI feedback before server confirmation
- **Mobile app** - React Native with Expo (template already includes expo plugin)

---

## ⏱ Time Spent

> Approximate time: ~2 hours (within the suggested 1-2 hour timebox)

**Breakdown:**
- Initial codebase exploration: 10 min
- Database schema design: 15 min
- tRPC API implementation: 30 min
- Frontend components: 30 min
- RBAC middleware: 15 min
- Accessibility additions: 15 min
- Testing & debugging: 15 min

---

## 🚀 Run Instructions

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables
# Create .env in project root with:
# - POSTGRES_URL (from Supabase dashboard)
# - AUTH_SECRET (generate with: openssl rand -base64 32)
# - AUTH_DISCORD_ID (from Discord Developer Portal)
# - AUTH_DISCORD_SECRET (from Discord Developer Portal)

# 3. Generate Better Auth schema
pnpm --filter @acme/auth generate

# 4. Push database schema to Supabase
cd packages/db
pnpm push
cd ../..

# 5. Start development server
pnpm dev

# 6. Open browser
# Visit: http://localhost:3000
# Click "Sign in with Discord"
# After login, click "My Notes"
```

### Testing Admin Role

```sql
-- Connect to Supabase SQL Editor
-- Promote a user to admin:
UPDATE "user" 
SET role = 'admin' 
WHERE email = 'your-discord-email@example.com';
```

---

## 📝 Notes & Assumptions

### Technical Decisions:

1. **Used `postgres` driver instead of `@vercel/postgres`**
   - Original template used Vercel's driver which has strict connection string requirements
   - Switched to `postgres` (postgres-js) for better Supabase compatibility
   - This change is in `packages/db/src/client.ts`

2. **Removed oAuthProxy plugin**
   - Template included `oAuthProxy` for production deployments
   - Simplified local development by removing it
   - Production deployments would re-enable this for cross-origin OAuth

3. **Role field added to Better Auth schema**
   - Extended generated `user` table with `role` field
   - Maintains compatibility with Better Auth's schema generation
   - Allows custom RBAC without forking Better Auth

### Challenges Encountered:

1. **Vercel Postgres connection string validation** - Resolved by switching drivers
2. **Better Auth schema generation** - `verification.value` needed to be `text` not `jsonb`
3. **TypeScript types for process.env** - Added `@types/node` to db package
4. **tRPC v11 API changes** - Used `useTRPC()` hook with React Query primitives

### Assumptions:

- Users sign in via Discord (other OAuth providers could be added easily)
- Default role is "user" (can be changed in database)
- Public notes are visible to all authenticated users
- Notes use plain text (rich text could be added)
- Single workspace deployment (monorepo stays together)

### Production Considerations:

For production deployment, you would:
- Re-enable `oAuthProxy` plugin for proper redirect handling
- Add production Discord OAuth redirect URIs
- Set up rate limiting on tRPC endpoints
- Add database indexes for performance
- Implement proper error logging (Sentry, LogRocket)
- Add E2E tests with Playwright
- Set up CI/CD pipeline

---

## 🎉 Thank You!

This challenge showcased the power of the T3 Stack's type safety and developer experience. The combination of tRPC, Drizzle, and Better Auth creates a foundation that's both secure and maintainable.

**Key highlights:**
- ✅ Zero client-server type mismatches
- ✅ Security enforced server-side
- ✅ Accessible by default
- ✅ Fast development iteration
- ✅ Production-ready patterns

The monorepo structure and shared packages make it easy to add new features (like a mobile app with the existing `expo` plugin) while maintaining consistency across the codebase.

---

## 📚 Additional Documentation

- `PROJECT_WALKTHROUGH.md` - Detailed technical walkthrough with code examples
- `NOTES_FEATURE.md` - Feature documentation and API reference
- `SUPABASE_SETUP.md` - Database configuration guide
- `TESTING_GUIDE.md` - Complete testing scenarios
- `QUICK_START.md` - Quick reference for running the project

---

**GitHub Repository:** [Your repo link here]

**Live Demo:** [Your deployment URL here] (if deployed)

**Contact:** [Your email/contact info]

