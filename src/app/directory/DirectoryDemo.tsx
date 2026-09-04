"use client";

import { UserDirectory, type User } from "@/components/UserDirectory";

const DEMO_USERS: User[] = [
  { id: 1, name: "Ada Lovelace", email: "ada@example.com", role: "Admin", active: true },
  { id: 2, name: "Alan Turing", email: "alan@example.com", role: "Editor", active: false },
  { id: 3, name: "Grace Hopper", email: "grace@example.com", role: "Viewer", active: true },
  {
    id: 4,
    name: "Katherine Johnson",
    email: "katherine@example.com",
    role: "Editor",
    active: true,
  },
];

/**
 * A server component cannot pass a function to a client component, so the fake
 * data layer lives here on the client side.
 */
export function DirectoryDemo() {
  async function fetchUsers(query: string): Promise<User[]> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const q = query.trim().toLowerCase();
    if (!q) return DEMO_USERS;
    return DEMO_USERS.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }

  async function onDelete(ids: number[]) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    console.log("deleted", ids);
  }

  return <UserDirectory fetchUsers={fetchUsers} onDelete={onDelete} />;
}
