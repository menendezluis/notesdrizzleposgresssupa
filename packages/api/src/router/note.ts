import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq, or } from "@acme/db";
import { CreateNoteSchema, Note, UpdateNoteSchema, user } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

// Middleware to check user role
const requireRole = (allowedRoles: string[]) => {
  return protectedProcedure.use(async ({ ctx, next }) => {
    // Get user with role from database
    const userRecord = await ctx.db.query.user.findFirst({
      columns: {
        id: true,
        role: true,
      },
      where: eq(user.id, ctx.session.user.id),
    });

    if (!userRecord || !allowedRoles.includes(userRecord.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action",
      });
    }

    return next({
      ctx: {
        ...ctx,
        userRole: userRecord.role,
      },
    });
  });
};

export const noteRouter = {
  // Get all notes (own notes + public notes from others)
  all: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.Note.findMany({
      where: or(
        eq(Note.userId, ctx.session.user.id),
        eq(Note.isPublic, true),
      ),
      orderBy: desc(Note.createdAt),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            role: true,
            image: true,
          },
        },
      },
    });
  }),

  // Get only user's own notes
  myNotes: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.Note.findMany({
      where: eq(Note.userId, ctx.session.user.id),
      orderBy: desc(Note.createdAt),
    });
  }),

  // Get note by ID (own note or public note)
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const note = await ctx.db.query.Note.findFirst({
        where: and(
          eq(Note.id, input.id),
          or(
            eq(Note.userId, ctx.session.user.id),
            eq(Note.isPublic, true),
          ),
        ),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              role: true,
              image: true,
            },
          },
        },
      });

      if (!note) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found or you don't have access",
        });
      }

      return note;
    }),

  // Create a new note
  create: protectedProcedure
    .input(CreateNoteSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .insert(Note)
        .values({
          ...input,
          userId: ctx.session.user.id,
        })
        .returning();
    }),

  // Update own note
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: UpdateNoteSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const note = await ctx.db.query.Note.findFirst({
        where: eq(Note.id, input.id),
      });

      if (!note) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found",
        });
      }

      if (note.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own notes",
        });
      }

      return ctx.db
        .update(Note)
        .set(input.data)
        .where(eq(Note.id, input.id))
        .returning();
    }),

  // Delete own note
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const note = await ctx.db.query.Note.findFirst({
        where: eq(Note.id, input),
      });

      if (!note) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found",
        });
      }

      if (note.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own notes",
        });
      }

      return ctx.db.delete(Note).where(eq(Note.id, input));
    }),

  // Admin: Get all notes (including private) - RBAC
  adminAll: requireRole(["admin"]).query(async ({ ctx }) => {
    return ctx.db.query.Note.findMany({
      orderBy: desc(Note.createdAt),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
      },
    });
  }),

  // Admin: Delete any note - RBAC
  adminDelete: requireRole(["admin"])
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.query.Note.findFirst({
        where: eq(Note.id, input),
      });

      if (!note) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found",
        });
      }

      return ctx.db.delete(Note).where(eq(Note.id, input));
    }),
} satisfies TRPCRouterRecord;

