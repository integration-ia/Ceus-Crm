import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const propertyNotesRouter = createTRPCRouter({
  createNote: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().cuid2(),
        content: z
          .string()
          .min(5, "Se necesita una nota de al menos 5 caracteres")
          .trim(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { content, propertyId } = input;
      const user = ctx.session.user;

      console.info(`User with ID ${user.id} is creating a new property note`);

      const note = await ctx.db.propertyNote.create({
        data: {
          content,
          author: { connect: { id: user.id } },
          property: { connect: { id: propertyId } },
        },
      });

      console.info(`Property note with ID ${note.id} created successfully!`);
    }),
  updateNote: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
        content: z
          .string()
          .min(5, "Se necesita una nota de al menos 5 caracteres")
          .trim(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, content } = input;
      const userId = ctx.session.user.id;

      console.info("Updating property note with ID:", id);

      const note = await ctx.db.propertyNote.update({
        where: { id, authorId: userId },
        data: { content },
      });

      console.info(`Property note with ID ${id} updated successfully!`);

      return note;
    }),
  deleteNote: protectedProcedure
    .input(z.string().cuid2())
    .mutation(async ({ input, ctx }) => {
      const noteId = input;
      const userId = ctx.session.user.id;

      console.info("Deleting property note with ID:", noteId);

      await ctx.db.propertyNote.delete({
        where: { id: noteId, authorId: userId },
      });

      console.info(`Property note with ID ${noteId} deleted successfully!`);
    }),
});
