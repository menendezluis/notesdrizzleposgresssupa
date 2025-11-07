"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { Field } from "@acme/ui/field";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";

import { useTRPC } from "~/trpc/react";

export function CreateNoteForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const createNote = useMutation(
    trpc.note.create.mutationOptions({
      onSuccess: async () => {
        setTitle("");
        setContent("");
        setIsPublic(false);
        await queryClient.invalidateQueries(trpc.note.pathFilter());
      },
    }),
  );

  return (
    <form
      className="w-full max-w-2xl space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      onSubmit={(e) => {
        e.preventDefault();
        createNote.mutate({
          title,
          content,
          isPublic,
        });
      }}
      aria-label="Create new note"
    >
      <h2 className="text-xl font-semibold">Create New Note</h2>

      <Field>
        <Label htmlFor="note-title">Title</Label>
        <Input
          id="note-title"
          type="text"
          placeholder="Enter note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={createNote.isPending}
          required
          aria-required="true"
        />
      </Field>

      <Field>
        <Label htmlFor="note-content">Content</Label>
        <Textarea
          id="note-content"
          placeholder="Enter note content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={createNote.isPending}
          required
          aria-required="true"
          rows={4}
        />
      </Field>

      <Field>
        <div className="flex items-center gap-2">
          <input
            id="note-public"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            disabled={createNote.isPending}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
            aria-describedby="note-public-description"
          />
          <Label htmlFor="note-public" className="mb-0">
            Make this note public
          </Label>
        </div>
        <p
          id="note-public-description"
          className="text-muted-foreground text-sm"
        >
          Public notes can be viewed by other users
        </p>
      </Field>

      <Button
        type="submit"
        disabled={createNote.isPending || !title || !content}
        className="w-full"
      >
        {createNote.isPending ? "Creating..." : "Create Note"}
      </Button>

      {createNote.error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {createNote.error.message}
        </div>
      )}
    </form>
  );
}

interface Note {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date | null;
  user?: {
    id: string;
    name: string;
    image: string | null;
  };
}

export function NoteCard({
  note,
  currentUserId,
}: {
  note: Note;
  currentUserId?: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isPublic, setIsPublic] = useState(note.isPublic);

  const deleteNote = useMutation(
    trpc.note.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.note.pathFilter());
      },
    }),
  );

  const updateNote = useMutation(
    trpc.note.update.mutationOptions({
      onSuccess: async () => {
        setIsEditing(false);
        await queryClient.invalidateQueries(trpc.note.pathFilter());
      },
    }),
  );

  const isOwner = currentUserId === note.userId;
  const formattedDate = new Date(note.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateNote.mutate({
      id: note.id,
      data: {
        title,
        content,
        isPublic,
      },
    });
  };

  return (
    <article
      className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      aria-label={`Note: ${note.title}`}
    >
      {isEditing ? (
        <form onSubmit={handleUpdate} className="space-y-4">
          <Field>
            <Label htmlFor={`edit-title-${note.id}`}>Title</Label>
            <Input
              id={`edit-title-${note.id}`}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={updateNote.isPending}
              required
              aria-required="true"
            />
          </Field>

          <Field>
            <Label htmlFor={`edit-content-${note.id}`}>Content</Label>
            <Textarea
              id={`edit-content-${note.id}`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={updateNote.isPending}
              required
              aria-required="true"
              rows={4}
            />
          </Field>

          <Field>
            <div className="flex items-center gap-2">
              <input
                id={`edit-public-${note.id}`}
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={updateNote.isPending}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
              />
              <Label htmlFor={`edit-public-${note.id}`} className="mb-0">
                Public
              </Label>
            </div>
          </Field>

          <div className="flex gap-2">
            <Button type="submit" disabled={updateNote.isPending} size="sm">
              {updateNote.isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setTitle(note.title);
                setContent(note.content);
                setIsPublic(note.isPublic);
              }}
              disabled={updateNote.isPending}
              size="sm"
            >
              Cancel
            </Button>
          </div>

          {updateNote.error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
            >
              {updateNote.error.message}
            </div>
          )}
        </form>
      ) : (
        <>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{note.title}</h3>
              <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                <time dateTime={note.createdAt.toString()}>
                  {formattedDate}
                </time>
                {note.isPublic && (
                  <span
                    className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    aria-label="Public note"
                  >
                    Public
                  </span>
                )}
                {!isOwner && note.user && (
                  <span className="text-xs">by {note.user.name}</span>
                )}
              </div>
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit note"
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this note?",
                      )
                    ) {
                      deleteNote.mutate(note.id);
                    }
                  }}
                  disabled={deleteNote.isPending}
                  aria-label="Delete note"
                >
                  {deleteNote.isPending ? "..." : "Delete"}
                </Button>
              </div>
            )}
          </div>

          <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            {note.content}
          </p>

          {deleteNote.error && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
            >
              {deleteNote.error.message}
            </div>
          )}
        </>
      )}
    </article>
  );
}

export function NoteList() {
  const trpc = useTRPC();
  const { data: notesQuery } = useSuspenseQuery(trpc.note.all.queryOptions());
  const { data: session } = useQuery(trpc.auth.getSession.queryOptions());

  if (!notesQuery || notesQuery.length === 0) {
    return (
      <div className="text-muted-foreground text-center">
        <p>No notes yet. Create your first note above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="list">
      {notesQuery.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          currentUserId={session?.user?.id}
        />
      ))}
    </div>
  );
}

export function NoteCardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      aria-hidden="true"
    >
      <div className="mb-4 space-y-2">
        <div className="h-6 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

