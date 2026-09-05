"use client";

import { useEffect, useState } from "react";

type Props = { fetchUsers?: () => Promise<string[]> };

const defaultFetchUsers = () => fetch('/api/users').then((r) => r.json());

function Users({ fetchUsers = defaultFetchUsers }: Props) {
  const [users, setUsers] = useState<string[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchUsers && fetchUsers()
      .then((r) => { if (!cancelled) { setUsers(r); setState('ready'); } })
      .catch(() => !cancelled && setState('error'));
    return () => { cancelled = true; };
  }, [fetchUsers, reload]);

  if (state === 'loading') return <p role="status">Loading...</p>;
  if (state === 'error') return (
    <div role="alert">
      <p>Could not load users.</p>
      <button
        onClick={() => {
          setState('loading');
          setReload((n) => n + 1);
        }}
      >
        Retry
      </button>
    </div>
  );
  if (users.length === 0) return <p>No users yet.</p>;
  return <ul aria-label="Users">{users.map((u) => <li key={u}>{u}</li>)}</ul>;
}

export default Users