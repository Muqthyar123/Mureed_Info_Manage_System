import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/mureed/")({
  beforeLoad: () => {
    throw redirect({ to: "/mureed/dashboard" });
  },
});
