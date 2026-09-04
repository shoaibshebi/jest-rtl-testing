"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

export type Role = "Admin" | "Editor" | "Viewer";

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
};

export type UserDirectoryProps = {
  /** Injected so tests can hand in a jest.fn() instead of mocking global fetch. */
  fetchUsers: (query: string) => Promise<User[]>;
  /** Resolves when the users are gone; rejecting shows an error in the dialog. */
  onDelete?: (ids: number[]) => Promise<void> | void;
  /** Debounce applied to the search box. Tests pass 0 to skip the wait. */
  debounceMs?: number;
};

type Tab = "All" | "Active" | "Inactive";
type Status = "loading" | "ready" | "error";

const TABS: Tab[] = ["All", "Active", "Inactive"];
const ROLES: Role[] = ["Admin", "Editor", "Viewer"];

export function UserDirectory({
  fetchUsers,
  onDelete,
  debounceMs = 300,
}: UserDirectoryProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("All");
  const [roleFilter, setRoleFilter] = useState<Role | "All">("All");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<number[]>([]);
  const [pendingIds, setPendingIds] = useState<number[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [toast, setToast] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  /* --- data loading, debounced on `query` --- */
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      setStatus("loading");
      fetchUsers(query)
        .then((result) => {
          if (cancelled) return;
          setUsers(result);
          setSelected([]);
          setStatus("ready");
        })
        .catch(() => {
          if (!cancelled) setStatus("error");
        });
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, reloadToken, debounceMs, fetchUsers]);

  const visible = useMemo(() => {
    let list = users;
    if (tab === "Active") list = list.filter((u) => u.active);
    if (tab === "Inactive") list = list.filter((u) => !u.active);
    if (roleFilter !== "All") list = list.filter((u) => u.role === roleFilter);
    return [...list].sort((a, b) =>
      sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
  }, [users, tab, roleFilter, sortDir]);

  /* --- "select all" needs a DOM property, not an attribute --- */
  const selectAllRef = useRef<HTMLInputElement>(null);
  const allSelected = visible.length > 0 && selected.length === visible.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selected.length > 0 && selected.length < visible.length;
    }
  }, [selected.length, visible.length]);

  /* --- roving tabindex for the tablist --- */
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onTabKeyDown(event: React.KeyboardEvent, index: number) {
    const last = TABS.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;

    event.preventDefault();
    setTab(TABS[next]);
    tabRefs.current[next]?.focus();
  }

  /* --- delete flow --- */
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogOpen = pendingIds !== null;

  useEffect(() => {
    if (!dialogOpen) return;
    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDialog();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dialogOpen]);

  function closeDialog() {
    setPendingIds(null);
    setDeleteError("");
  }

  async function confirmDelete() {
    if (!pendingIds) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await onDelete?.(pendingIds);
      setUsers((list) => list.filter((u) => !pendingIds.includes(u.id)));
      setSelected((ids) => ids.filter((id) => !pendingIds.includes(id)));
      setToast(`Removed ${pendingIds.length} user(s)`);
      setPendingIds(null);
    } catch {
      setDeleteError("Could not remove the selected users");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section aria-labelledby="directory-heading" className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Image
          src="/globe.svg"
          alt="Globe illustration"
          width={40}
          height={40}
          unoptimized
          className="dark:invert"
        />
        <h2 id="directory-heading" className="text-2xl font-semibold">
          User directory
        </h2>
        <span title="Results refresh as you type" className="cursor-help text-zinc-500">
          (?)
        </span>
      </header>

      {/* role="search" is a landmark - findable with getByRole('search') */}
      <form
        role="search"
        aria-label="Filter users"
        onSubmit={(event) => event.preventDefault()}
        className="flex flex-wrap items-end gap-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="user-search">Search</label>
          <input
            id="user-search"
            name="query"
            type="search"
            placeholder="Name or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="rounded border px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="role-filter">Role</label>
          <select
            id="role-filter"
            name="role"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as Role | "All")}
            className="rounded border px-3 py-2"
          >
            <option value="All">All roles</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setReloadToken((token) => token + 1)}
          className="rounded-full border px-4 py-2 text-sm"
        >
          Refresh
        </button>
      </form>

      <div role="tablist" aria-label="Filter by status" className="flex gap-2">
        {TABS.map((item, index) => (
          <button
            key={item}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${item}`}
            aria-selected={tab === item}
            aria-controls="user-panel"
            tabIndex={tab === item ? 0 : -1}
            onClick={() => setTab(item)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              tab === item ? "bg-black text-white dark:bg-white dark:text-black" : ""
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div id="user-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {status === "loading" && <p role="status">Loading users…</p>}

        {status === "error" && (
          <div role="alert" className="flex flex-col items-start gap-2">
            <p>Could not load users.</p>
            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
              className="rounded-full border px-4 py-2 text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {status === "ready" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <p data-testid="result-summary">
                Showing {visible.length} of {users.length} users
              </p>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPendingIds([...selected])}
                  className="rounded-full border px-4 py-2 text-sm"
                >
                  Delete selected ({selected.length})
                </button>
              )}
            </div>

            {visible.length === 0 ? (
              <p>No users match your filters.</p>
            ) : (
              <table className="w-full text-left">
                <caption className="sr-only">Users matching the current filters</caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        aria-label="Select all users"
                        checked={allSelected}
                        onChange={(event) =>
                          setSelected(event.target.checked ? visible.map((u) => u.id) : [])
                        }
                      />
                    </th>
                    <th scope="col" aria-sort={sortDir === "asc" ? "ascending" : "descending"}>
                      <button
                        type="button"
                        onClick={() => setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))}
                        className="font-semibold underline"
                      >
                        Name
                      </button>
                    </th>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${user.name}`}
                          checked={selected.includes(user.id)}
                          onChange={(event) =>
                            setSelected((ids) =>
                              event.target.checked
                                ? [...ids, user.id]
                                : ids.filter((id) => id !== user.id),
                            )
                          }
                        />
                      </td>
                      <td>
                        <span className="flex items-center gap-2">
                          {/* An <svg> <title> is what getByTitle matches on. */}
                          <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
                            <title>{`${user.name}'s avatar`}</title>
                            <circle cx="16" cy="16" r="16" fill="currentColor" opacity="0.1" />
                          </svg>
                          <span data-testid="user-name">{user.name}</span>
                        </span>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.active ? "Active" : "Inactive"}</td>
                      <td>
                        <button
                          type="button"
                          aria-label={`Delete ${user.name}`}
                          onClick={() => setPendingIds([user.id])}
                          className="text-sm underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {toast && <p role="status">{toast}</p>}

      {dialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-heading"
          className="flex flex-col items-start gap-3 rounded border p-4"
        >
          <h3 id="confirm-heading" className="text-lg font-medium">
            Remove {pendingIds.length} user(s)?
          </h3>
          <p>This cannot be undone.</p>
          {deleteError && <p role="alert">{deleteError}</p>}
          <div className="flex gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={closeDialog}
              disabled={deleting}
              className="rounded-full border px-4 py-2 text-sm disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="rounded-full border px-4 py-2 text-sm disabled:opacity-40"
            >
              {deleting ? "Removing…" : "Confirm"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
