// src/lib/api.ts
import { httpBatchLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import { type AppRouter } from '@/server/api/root';
import superjson from 'superjson';

export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    };
  },
  ssr: false,
});

// src/server/api/trpc.ts
import { TRPCError, initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req } = opts;
  const auth = getAuth(req);
  
  return {
    db,
    userId: auth.userId,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      userId: ctx.userId,
    },
  });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

// src/pages/api/trpc/[trpc].ts
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';

export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
});
