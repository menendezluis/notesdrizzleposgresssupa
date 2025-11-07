import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "~/auth/server";
import { HydrateClient } from "~/trpc/server";
import {
  CreateNoteForm,
  NoteCardSkeleton,
  NoteList,
} from "../_components/notes";

export const metadata = {
  title: "Personal Notes",
  description: "Manage your personal notes",
};

export default async function NotesPage() {
  const session = await auth.api.getSession({
    headers: await (async () => {
      const { headers } = await import("next/headers");
      return headers();
    })(),
  });

  if (!session) {
    redirect("/");
  }

  return (
    <HydrateClient>
      <main className="container min-h-screen py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <header>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Personal <span className="text-primary">Notes</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Create, manage, and share your notes
            </p>
          </header>

          {/* Create Note Form */}
          <section aria-label="Create new note">
            <CreateNoteForm />
          </section>

          {/* Notes List */}
          <section aria-label="Your notes">
            <h2 className="mb-4 text-2xl font-semibold">Your Notes</h2>
            <Suspense
              fallback={
                <div className="space-y-4" aria-label="Loading notes">
                  <NoteCardSkeleton />
                  <NoteCardSkeleton />
                  <NoteCardSkeleton />
                </div>
              }
            >
              <NoteList />
            </Suspense>
          </section>
        </div>
      </main>
    </HydrateClient>
  );
}

