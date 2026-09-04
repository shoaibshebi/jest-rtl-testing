import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UserDirectory, type User, type UserDirectoryProps } from '../UserDirectory';

export const USERS: User[] = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin', active: true },
  { id: 2, name: 'Alan Turing', email: 'alan@example.com', role: 'Editor', active: false },
  { id: 3, name: 'Grace Hopper', email: 'grace@example.com', role: 'Viewer', active: true },
  {
    id: 4,
    name: 'Katherine Johnson',
    email: 'katherine@example.com',
    role: 'Editor',
    active: true,
  },
];

/** A stand-in for the server: filters on the query the same way an API would. */
export function makeFetchUsers(users: User[] = USERS) {
  return jest.fn(async (query: string): Promise<User[]> => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  });
}

/**
 * Renders the directory, waits out the first load, and hands back the
 * user-event instance and the fetch mock. `debounceMs: 0` keeps tests fast -
 * one test in UserDirectory.test.tsx exercises the real debounce with fake timers.
 */
export async function renderDirectory(props: Partial<UserDirectoryProps> = {}) {
  const fetchUsers = props.fetchUsers ?? makeFetchUsers();
  const user = userEvent.setup();

  const utils = render(
    <UserDirectory fetchUsers={fetchUsers} debounceMs={0} {...props} />,
  );

  await waitForElementToBeRemoved(() => screen.queryByRole('status'));

  return { ...utils, user, fetchUsers };
}

/** The rendered names, in row order. */
export const rowNames = () =>
  screen.getAllByTestId('user-name').map((el) => el.textContent);
