"use client";

import Link from "next/link";

import Users from "@/components/Users";

const DEMO_USERS = ["Ada Lovelace", "Alan Turing", "Grace Hopper"];

/**
 * Defined at module scope on purpose. `Users` lists `fetchUsers` in its effect
 * deps, so an inline arrow function here would be a new reference on every
 * render and the effect would re-run forever.
 *
 * The page is a Client Component because a Server Component cannot pass a
 * function across the boundary.
 */
async function fetchUsers(): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return DEMO_USERS;
}

export default function UsersPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          <code>src/components/Users.tsx</code> — takes its data-fetching function as a
          prop, which is what lets the tests hand it a <code>jest.fn()</code>.
        </p>
        <Link href="/" className="w-fit underline">
          Back to home
        </Link>
      </header>

      <Users fetchUsers={fetchUsers} />
    </main>
  );
}
