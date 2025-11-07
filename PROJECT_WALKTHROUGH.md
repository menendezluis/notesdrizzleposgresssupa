# 🎯 Personal Notes Project - Complete Walkthrough

## Project Overview

This is a **Personal Notes** application built with the T3 Stack that demonstrates:
- ✅ Authentication with Discord OAuth via Better Auth
- ✅ Role-Based Access Control (RBAC)
- ✅ Full-stack type safety with tRPC
- ✅ Database management with Drizzle ORM + Supabase Postgres
- ✅ Accessible UI with proper ARIA labels and semantic HTML

---

## 🏗️ Architecture Overview

### Tech Stack
```
Frontend:  Next.js 15 (App Router) + React 19 + TailwindCSS
Backend:   tRPC v11 + Drizzle ORM
Database:  PostgreSQL (Supabase)
Auth:      Better Auth with Discord OAuth
Validation: Zod schemas
Monorepo:  Turborepo with pnpm workspaces
```

### Project Structure
```
challenge-t3-1/
├── apps/
│   └── nextjs/          # Next.js app
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/auth/[...all]/  # Better Auth handler
│       │   │   ├── notes/              # Notes page
│       │   │   └── _components/        # UI components
│       │   ├── auth/    # Auth config
│       │   └── trpc/    # tRPC client
│       └── package.json
│
├── packages/
│   ├── api/             # tRPC router definitions
│   │   └── src/router/
│   │       ├── note.ts  # Notes API with RBAC
│   │       └── auth.ts  # Auth queries
│   │
│   ├── db/              # Database layer
│   │   └── src/
│   │       ├── client.ts        # Drizzle client
│   │       ├── schema.ts        # App tables (Note)
│   │       └── auth-schema.ts   # Auth tables (user, session, etc)
│   │
│   ├── auth/            # Better Auth config
│   ├── ui/              # Shared UI components
│   └── validators/      # Shared Zod schemas
│
└── .env                 # Environment variables
```

---

## 📊 Database Schema

### 1. User Table (with RBAC)
```typescript
user {
  id: text (pk)
  name: text
  email: text (unique)
  emailVerified: boolean
  image: text?
  role: text (default: "user")  // ← RBAC field
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Roles:**
- `user` - Default role, can manage own notes
- `admin` - Can view/delete all notes
- `moderator` - Reserved for future use

### 2. Note Table
```typescript
note {
  id: uuid (pk)
  title: varchar(256)
  content: text
  userId: text (fk → user.id)
  isPublic: boolean (default: false)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 3. Auth Tables
- `session` - Active user sessions
- `account` - OAuth account links
- `verification` - OAuth state verification

---

## 🔐 Authentication Flow

### Step 1: User Clicks "Sign in with Discord"
```typescript
// apps/nextjs/src/app/_components/auth-showcase.tsx
<Button formAction={async () => {
  "use server";
  const res = await auth.api.signInSocial({
    body: {
      provider: "discord",
      callbackURL: "/",
    },
  });
  redirect(res.url);
}}>
  Sign in with Discord
</Button>
```

### Step 2: Discord Authorization
1. User redirected to Discord OAuth page
2. User authorizes the app
3. Discord redirects back with `code` and `state`:
   ```
   http://localhost:3000/api/auth/callback/discord?code=...&state=...
   ```

### Step 3: Better Auth Callback Handler
```typescript
// apps/nextjs/src/app/api/auth/[...all]/route.ts
export const GET = auth.handler;  // Handles callback
export const POST = auth.handler;
```

Better Auth:
1. Validates the `state` token (CSRF protection)
2. Exchanges `code` for Discord access token
3. Fetches user info from Discord API
4. Creates/updates user in database
5. Creates session
6. Sets session cookies
7. Redirects to home page

### Step 4: Session Management
```typescript
// apps/nextjs/src/auth/server.ts
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
```

Sessions are cached per-request using React's `cache()`.

---

## 🛣️ API Routes (tRPC)

### Note Router (`packages/api/src/router/note.ts`)

#### 1. User Endpoints (Authentication Required)

**`note.all`** - Get own notes + public notes from others
```typescript
all: protectedProcedure.query(async ({ ctx }) => {
  return ctx.db.query.Note.findMany({
    where: or(
      eq(Note.userId, ctx.session.user.id),
      eq(Note.isPublic, true),
    ),
    orderBy: desc(Note.createdAt),
    with: { user: true },
  });
});
```

**`note.create`** - Create new note
```typescript
create: protectedProcedure
  .input(CreateNoteSchema)
  .mutation(async ({ ctx, input }) => {
    return ctx.db.insert(Note).values({
      ...input,
      userId: ctx.session.user.id,
    });
  });
```

**`note.update`** - Update own note (with ownership check)
```typescript
update: protectedProcedure
  .input(z.object({ id: z.string(), data: UpdateNoteSchema }))
  .mutation(async ({ ctx, input }) => {
    const note = await ctx.db.query.Note.findFirst({
      where: eq(Note.id, input.id),
    });
    
    if (note.userId !== ctx.session.user.id) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    
    return ctx.db.update(Note)
      .set(input.data)
      .where(eq(Note.id, input.id));
  });
```

**`note.delete`** - Delete own note (with ownership check)

#### 2. Admin Endpoints (RBAC)

**RBAC Middleware:**
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

**`note.adminAll`** - View ALL notes (admin only)
```typescript
adminAll: requireRole(["admin"]).query(async ({ ctx }) => {
  return ctx.db.query.Note.findMany({
    orderBy: desc(Note.createdAt),
    with: { user: true },
  });
});
```

**`note.adminDelete`** - Delete any note (admin only)

---

## 🎨 Frontend Components

### 1. Notes Page (`apps/nextjs/src/app/notes/page.tsx`)

**Server-side session check:**
```typescript
export default async function NotesPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/");  // Protect route
  }
  
  return (
    <HydrateClient>
      <main>
        <CreateNoteForm />
        <Suspense fallback={<NoteCardSkeleton />}>
          <NoteList />
        </Suspense>
      </main>
    </HydrateClient>
  );
}
```

### 2. CreateNoteForm Component

**Using tRPC with React Query:**
```typescript
export function CreateNoteForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  const createNote = useMutation(
    trpc.note.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.note.pathFilter());
      },
    }),
  );
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      createNote.mutate({ title, content, isPublic });
    }}>
      {/* Form fields */}
    </form>
  );
}
```

### 3. NoteCard Component

**Features:**
- Display mode: Shows note content
- Edit mode: Inline editing with form
- Owner actions: Edit/Delete buttons
- Public indicator badge

**Mutations:**
```typescript
const updateNote = useMutation(
  trpc.note.update.mutationOptions({
    onSuccess: async () => {
      setIsEditing(false);
      await queryClient.invalidateQueries(trpc.note.pathFilter());
    },
  }),
);

const deleteNote = useMutation(
  trpc.note.delete.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries(trpc.note.pathFilter());
    },
  }),
);
```

### 4. NoteList Component

**Loading data:**
```typescript
export function NoteList() {
  const trpc = useTRPC();
  const { data: notes } = useSuspenseQuery(
    trpc.note.all.queryOptions()
  );
  const { data: session } = useQuery(
    trpc.auth.getSession.queryOptions()
  );
  
  return (
    <div>
      {notes.map(note => (
        <NoteCard 
          key={note.id} 
          note={note}
          currentUserId={session?.user?.id}
        />
      ))}
    </div>
  );
}
```

---

## ♿ Accessibility Features

### 1. Semantic HTML
```typescript
<article aria-label={`Note: ${note.title}`}>
  <header>
    <h3>{note.title}</h3>
    <time dateTime={note.createdAt.toString()}>
      {formattedDate}
    </time>
  </header>
  <p>{note.content}</p>
</article>
```

### 2. ARIA Labels
```typescript
<form aria-label="Create new note">
  <Input 
    id="note-title"
    aria-required="true"
    aria-label="Note title"
  />
</form>
```

### 3. Error Announcements
```typescript
{error && (
  <div role="alert" className="error-message">
    {error.message}
  </div>
)}
```

### 4. Keyboard Navigation
- All interactive elements are focusable
- Proper tab order
- Enter key submits forms
- Escape cancels edit mode

### 5. Loading States
```typescript
<Suspense fallback={<NoteCardSkeleton />}>
  <NoteList />
</Suspense>
```

---

## 🔒 Security Features

### 1. Server-Side Authorization
```typescript
// Every mutation checks ownership
if (note.userId !== ctx.session.user.id) {
  throw new TRPCError({ code: "FORBIDDEN" });
}
```

### 2. RBAC Enforcement
```typescript
// Admin endpoints verify role server-side
const userRole = await getUserRole(ctx.session.user.id);
if (!allowedRoles.includes(userRole)) {
  throw new TRPCError({ code: "FORBIDDEN" });
}
```

### 3. Input Validation (Zod)
```typescript
export const CreateNoteSchema = createInsertSchema(Note, {
  title: z.string().min(1).max(256),
  content: z.string().min(1),
  isPublic: z.boolean().optional(),
});
```

### 4. CSRF Protection
Better Auth handles CSRF via state tokens in OAuth flow.

### 5. SQL Injection Protection
Drizzle ORM uses parameterized queries automatically.

---

## 🔄 Data Flow Example

### Creating a Note

1. **User fills form** → Client-side state
   ```typescript
   const [title, setTitle] = useState("");
   const [content, setContent] = useState("");
   ```

2. **User submits** → tRPC mutation
   ```typescript
   createNote.mutate({ title, content, isPublic });
   ```

3. **Client → Server** → HTTP POST to `/api/trpc/note.create`
   ```json
   {
     "json": {
       "title": "My Note",
       "content": "Hello World",
       "isPublic": false
     }
   }
   ```

4. **Server validates** → Zod schema
   ```typescript
   .input(CreateNoteSchema)  // Validates before handler
   ```

5. **Server checks auth** → protectedProcedure
   ```typescript
   if (!ctx.session?.user) {
     throw new TRPCError({ code: "UNAUTHORIZED" });
   }
   ```

6. **Server inserts** → Database
   ```typescript
   return ctx.db.insert(Note).values({
     ...input,
     userId: ctx.session.user.id,
   });
   ```

7. **Response** → Client
   ```typescript
   onSuccess: async () => {
     await queryClient.invalidateQueries(trpc.note.pathFilter());
   }
   ```

8. **UI updates** → React Query refetches list

---

## 🚀 Running the Project

### 1. Environment Setup
```bash
# .env file
POSTGRES_URL="postgresql://postgres.PROJECT:PASSWORD@aws-0-us-east-2.pooler.supabase.com:6543/postgres"
AUTH_SECRET="generated-secret"
AUTH_DISCORD_ID="your-discord-client-id"
AUTH_DISCORD_SECRET="your-discord-client-secret"
NODE_ENV="development"
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Push Database Schema
```bash
cd packages/db
pnpm push
```

### 4. Start Development Server
```bash
pnpm dev
```

### 5. Access Application
```
http://localhost:3000
```

---

## 🧪 Testing the Features

### As Regular User:
1. ✅ Sign in with Discord
2. ✅ Navigate to `/notes`
3. ✅ Create private note
4. ✅ Create public note
5. ✅ Edit own note
6. ✅ Delete own note
7. ✅ View public notes from others
8. ❌ Cannot edit others' notes
9. ❌ Cannot delete others' notes

### As Admin:
1. Promote user to admin:
   ```sql
   UPDATE "user" SET role = 'admin' WHERE email = 'your@email.com';
   ```
2. ✅ View all notes (including private)
3. ✅ Delete any note
4. ✅ Access admin-only tRPC endpoints

---

## 🎯 Key Takeaways

### What Makes This a Good Solution:

1. **Type Safety**
   - End-to-end TypeScript
   - Zod runtime validation
   - tRPC procedure types

2. **Security**
   - Server-side auth checks
   - RBAC enforcement
   - Input validation
   - Ownership verification

3. **Developer Experience**
   - Monorepo structure
   - Shared packages
   - Hot reload
   - Type inference

4. **User Experience**
   - Fast (React Query caching)
   - Accessible (ARIA, semantic HTML)
   - Responsive
   - Error handling

5. **Production Ready**
   - Proper error boundaries
   - Loading states
   - Optimistic updates
   - Session management

---

## 📚 Technologies Deep Dive

### tRPC
- **Why?** Type-safe API without code generation
- **How?** Procedures export TypeScript types
- **Benefit:** Autocomplete + type checking for API calls

### Drizzle ORM
- **Why?** Type-safe SQL with excellent TypeScript support
- **How?** Schema defined in TypeScript, generates types
- **Benefit:** No runtime overhead, great DX

### Better Auth
- **Why?** Modern, framework-agnostic auth library
- **How?** Handles OAuth flows, session management
- **Benefit:** Works with any database, flexible

### React Query (TanStack Query)
- **Why?** Best-in-class data fetching/caching
- **How?** Wraps tRPC calls with cache management
- **Benefit:** Automatic refetching, optimistic updates

---

## 🎓 Learning Resources

- [T3 Stack](https://create.t3.gg/)
- [tRPC Docs](https://trpc.io/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Better Auth](https://www.better-auth.com/)
- [React Query](https://tanstack.com/query/latest)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**🎉 That's the complete walkthrough!** This project demonstrates modern full-stack development with type safety, security, and best practices throughout.

