import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        throwOnError: false,
        retry: (failureCount, error) => {
          if (
            error instanceof Error &&
            (error.message.includes("401") ||
              error.message.includes("403") ||
              error.message.includes("Unauthorized") ||
              error.message.includes("Authentication required") ||
              error.message.includes("Invalid or expired token"))
          ) {
            return false;
          }
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
