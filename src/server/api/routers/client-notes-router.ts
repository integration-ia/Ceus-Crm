import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const clientNotesRouter = createTRPCRouter({
  createNote: protectedProcedure
    .input(
      z.object({
        clientId: z.string().cuid2(),
        content: z
          .string()
          .min(5, "Se necesita una nota de al menos 5 caracteres")
          .trim(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { content, clientId } = input;
      const user = ctx.session.user;

      console.info(`User with ID ${user.id} is creating a new client note`);

      const note = await ctx.db.clientNote.create({
        data: {
          content,
          author: { connect: { id: user.id } },
          client: { connect: { id: clientId } },
        },
      });

      console.info(`client note with ID ${note.id} created successfully!`);
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

      console.info("Updating client note with ID:", id);

      const note = await ctx.db.clientNote.update({
        where: { id, authorId: userId },
        data: { content },
      });

      console.info(`client note with ID ${id} updated successfully!`);

      return note;
    }),
  deleteNote: protectedProcedure
    .input(z.string().cuid2())
    .mutation(async ({ input, ctx }) => {
      const noteId = input;
      const userId = ctx.session.user.id;

      console.info("Deleting client note with ID:", noteId);

      await ctx.db.clientNote.delete({
        where: { id: noteId, authorId: userId },
      });

      console.info(`client note with ID ${noteId} deleted successfully!`);
    }),
});
