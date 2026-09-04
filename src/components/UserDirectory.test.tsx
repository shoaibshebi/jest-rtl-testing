import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { User, UserDirectory } from './UserDirectory';
import { USERS, makeFetchUsers, renderDirectory, rowNames } from './__fixtures__/users';

describe('loading, error and empty states', () => {
  // Zaroorat: page khulte waqt user ko "Loading users…" dikhe, phir data aane par
  // table. Load hote waqt table maujood na ho, aur server ko khali query ('') jaye.
  it('shows a loading indicator, then the table', async () => {
    const fetchUsers = makeFetchUsers();
    render(<UserDirectory fetchUsers={fetchUsers} debounceMs={0} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading users…');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(fetchUsers).toHaveBeenCalledWith('');
  });

  // Zaroorat: server fail ho to error message + Retry button dikhe, table na dikhe.
  // Retry dabane par dobara request jaye, aur kaamyabi par error gayab ho kar table aaye.
  it('shows an error with a working retry', async () => {
    const fetchUsers = makeFetchUsers();
    fetchUsers.mockRejectedValueOnce(new Error('network down'));

    const user = userEvent.setup();
    render(<UserDirectory fetchUsers={fetchUsers} debounceMs={0} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not load users.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchUsers).toHaveBeenCalledTimes(2);
  });

  // Zaroorat: filters se koi user na bache to khali table ke bajaye saaf message dikhe.
  // Summary bhi bataye ke data maujood hai, sirf filter ne chhupaya hai (0 of 4).
  it('shows an empty state when the filters exclude everyone', async () => {
    const { user } = await renderDirectory();

    await user.click(screen.getByRole('tab', { name: 'Inactive' }));
    await user.selectOptions(screen.getByLabelText('Role'), 'Admin');

    expect(screen.getByText('No users match your filters.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByTestId('result-summary')).toHaveTextContent('Showing 0 of 4 users');
  });

  // Zaroorat: Refresh dabane par server se naya data manga jaye - chahe query wohi ho.
  it('refetches when Refresh is clicked', async () => {
    const { user, fetchUsers } = await renderDirectory();

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => expect(fetchUsers).toHaveBeenCalledTimes(2));
  });
});

describe('debounced search', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  // Zaroorat: har harf par request na jaye. User type kar ke ruke, tab ek request jaye.
  // Adhoore words ("a", "ad") par server ko bilkul call na kiya jaye.
  it('sends one request per pause, not one per keystroke', async () => {
    jest.useFakeTimers();
    // With fake timers, user-event needs to be told how to advance them,
    // otherwise its internal delays never fire and it hangs.
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const fetchUsers = makeFetchUsers();
    render(<UserDirectory fetchUsers={fetchUsers} debounceMs={300} />);

    // The initial load is debounced too.
    expect(fetchUsers).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(fetchUsers).toHaveBeenCalledTimes(1);

    await user.type(screen.getByLabelText('Search'), 'ada');

    // Three keystrokes, still no second request - each one reset the timer.
    expect(fetchUsers).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(fetchUsers).toHaveBeenCalledTimes(2);
    expect(fetchUsers).toHaveBeenLastCalledWith('ada');
    expect(fetchUsers).not.toHaveBeenCalledWith('a');
    expect(fetchUsers).not.toHaveBeenCalledWith('ad');
  });

  // Zaroorat: search ka kaam server par ho (client-side filter nahi) - jo query type ki
  // wo server tak jaye, aur uska jawab table mein nazar aaye.
  it('passes the query to the server and renders the result', async () => {
    const { user, fetchUsers } = await renderDirectory();

    await user.type(screen.getByLabelText('Search'), 'grace');

    await waitFor(() => expect(fetchUsers).toHaveBeenLastCalledWith('grace'));
    await waitFor(() => expect(rowNames()).toEqual(['Grace Hopper']));
    expect(screen.getByTestId('result-summary')).toHaveTextContent('Showing 1 of 1 users');
  });

  // Zaroorat: search clear karne par saare users wapas aa jayein aur input khali ho.
  // Koi purana filter atka na reh jaye.
  it('clears the search box and gets everyone back', async () => {
    const { user } = await renderDirectory();

    const search = screen.getByLabelText('Search');
    await user.type(search, 'grace');
    await waitFor(() => expect(rowNames()).toHaveLength(1));

    await user.clear(search);

    await waitFor(() => expect(rowNames()).toHaveLength(4));
    expect(search).toHaveValue('');
  });
});

describe('tabs', () => {
  // Zaroorat: tab click karne par list us status ke mutabiq filter ho, selected tab par
  // aria-selected="true" lage, aur panel sahi tab se linked rahe (screen reader ke liye).
  it('filters by status on click', async () => {
    const { user } = await renderDirectory();

    expect(rowNames()).toEqual([
      'Ada Lovelace',
      'Alan Turing',
      'Grace Hopper',
      'Katherine Johnson',
    ]);

    await user.click(screen.getByRole('tab', { name: 'Inactive' }));

    expect(rowNames()).toEqual(['Alan Turing']);
    expect(screen.getByRole('tab', { name: 'Inactive' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-Inactive');
  });

  // Zaroorat: bina mouse tabs chalein - arrow keys se move, aakhir se wapas shuru mein,
  // Home/End se pehla/aakhri. Aur poora tablist Tab key ka sirf EK stop ho.
  it('moves between tabs with the arrow keys (roving tabindex)', async () => {
    const { user } = await renderDirectory();

    const all = screen.getByRole('tab', { name: 'All' });
    const active = screen.getByRole('tab', { name: 'Active' });
    const inactive = screen.getByRole('tab', { name: 'Inactive' });

    // Only the selected tab is in the tab sequence.
    expect(all).toHaveAttribute('tabindex', '0');
    expect(active).toHaveAttribute('tabindex', '-1');

    all.focus();
    await user.keyboard('{ArrowRight}');
    expect(active).toHaveFocus();
    expect(active).toHaveAttribute('aria-selected', 'true');
    expect(rowNames()).toEqual(['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson']);

    await user.keyboard('{ArrowRight}');
    expect(inactive).toHaveFocus();

    // Wraps around at the end.
    await user.keyboard('{ArrowRight}');
    expect(all).toHaveFocus();

    await user.keyboard('{End}');
    expect(inactive).toHaveFocus();

    await user.keyboard('{Home}');
    expect(all).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(inactive).toHaveFocus();
  });
});

describe('role filter and sorting', () => {
  // Zaroorat: Role dropdown chunne par sirf usi role ke users bachein, aur dropdown
  // mein chuni hui value nazar bhi aaye.
  it('filters by role', async () => {
    const { user } = await renderDirectory();

    await user.selectOptions(screen.getByLabelText('Role'), 'Editor');

    expect(rowNames()).toEqual(['Alan Turing', 'Katherine Johnson']);
    expect(screen.getByLabelText('Role')).toHaveValue('Editor');
  });

  // Zaroorat: search aur role dono form ki state mein sahi mahfooz hon - yani form ki
  // andar ki value screen par dikhne wali cheez se match kare.
  it('records the filters in the form state', async () => {
    const { user } = await renderDirectory();

    await user.type(screen.getByLabelText('Search'), 'ada');
    await user.selectOptions(screen.getByLabelText('Role'), 'Admin');

    expect(screen.getByRole('search')).toHaveFormValues({ query: 'ada', role: 'Admin' });
  });

  // Zaroorat: Name column click karne par tarteeb ulti ho, aur aria-sort bhi badle
  // taake screen reader ko current sorting ka pata chale (sirf dikhne ka farq na ho).
  it('toggles sort direction and updates aria-sort', async () => {
    const { user } = await renderDirectory();

    const header = screen.getByRole('columnheader', { name: 'Name' });
    expect(header).toHaveAttribute('aria-sort', 'ascending');

    await user.click(screen.getByRole('button', { name: 'Name' }));

    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(rowNames()).toEqual([
      'Katherine Johnson',
      'Grace Hopper',
      'Alan Turing',
      'Ada Lovelace',
    ]);

    await user.click(screen.getByRole('button', { name: 'Name' }));
    expect(header).toHaveAttribute('aria-sort', 'ascending');
  });
});

describe('row selection', () => {
  // Zaroorat: ek row select karne par "select all" adhoori halat (indeterminate) mein
  // jaye, sab select karne par poori checked, aur "Delete selected (N)" sahi count ke
  // sath aaye - selection khatam hone par button gayab ho jaye.
  it('goes unchecked -> indeterminate -> checked', async () => {
    const { user } = await renderDirectory();

    const selectAll = screen.getByRole('checkbox', { name: 'Select all users' });
    expect(selectAll).not.toBeChecked();
    expect(selectAll).not.toBePartiallyChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Select Ada Lovelace' }));

    // The DOM `indeterminate` property, not an attribute.
    expect(selectAll).toBePartiallyChecked();
    expect(screen.getByRole('button', { name: 'Delete selected (1)' })).toBeInTheDocument();

    await user.click(selectAll);

    expect(selectAll).toBeChecked();
    expect(selectAll).not.toBePartiallyChecked();
    screen.getAllByRole('checkbox').forEach((box) => expect(box).toBeChecked());
    expect(screen.getByRole('button', { name: 'Delete selected (4)' })).toBeInTheDocument();

    await user.click(selectAll);

    expect(selectAll).not.toBeChecked();
    expect(screen.queryByRole('button', { name: /Delete selected/ })).not.toBeInTheDocument();
  });

  // Zaroorat: naya data aane par purani selection khatam ho jaye - warna user un rows
  // ko delete kar baithega jo ab screen par bhi nahi hain.
  it('drops the selection when the query changes', async () => {
    const { user } = await renderDirectory();

    await user.click(screen.getByRole('checkbox', { name: 'Select Ada Lovelace' }));
    expect(screen.getByRole('button', { name: 'Delete selected (1)' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search'), 'grace');

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Delete selected/ })).not.toBeInTheDocument(),
    );
  });
});

describe('delete flow', () => {
  // Zaroorat: Delete dabane par seedha delete na ho - pehle confirm dialog aaye, aur
  // focus khud Cancel par jaye (safe default, aur keyboard user ko dialog mil jaye).
  it('opens a confirm dialog and focuses Cancel', async () => {
    const { user } = await renderDirectory();

    await user.click(screen.getByRole('button', { name: 'Delete Ada Lovelace' }));

    const dialog = screen.getByRole('dialog', { name: 'Remove 1 user(s)?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  // Zaroorat: Cancel par dialog band ho, koi delete request na jaye, aur saari rows
  // apni jagah salamat rahein.
  it('cancels without calling onDelete', async () => {
    const onDelete = jest.fn();
    const { user } = await renderDirectory({ onDelete });

    await user.click(screen.getByRole('button', { name: 'Delete Ada Lovelace' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
    expect(rowNames()).toHaveLength(4);
  });

  // Zaroorat: Escape key se bhi dialog band ho - sirf Cancel button par nirbhar na ho -
  // aur us se kuch delete na ho jaye.
  it('closes on Escape', async () => {
    const onDelete = jest.fn();
    const { user } = await renderDirectory({ onDelete });

    await user.click(screen.getByRole('button', { name: 'Delete Ada Lovelace' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  // Zaroorat: Confirm par sahi id server ko jaye, row list se hate, summary update ho,
  // aur user ko role="status" ke zariye confirmation sunaya/dikhaya jaye.
  it('removes the row and announces the result on confirm', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const { user } = await renderDirectory({ onDelete });

    await user.click(screen.getByRole('button', { name: 'Delete Ada Lovelace' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(onDelete).toHaveBeenCalledWith([1]);
    expect(rowNames()).toEqual(['Alan Turing', 'Grace Hopper', 'Katherine Johnson']);
    expect(screen.getByRole('status')).toHaveTextContent('Removed 1 user(s)');
    expect(screen.getByTestId('result-summary')).toHaveTextContent('Showing 3 of 3 users');
  });

  // Zaroorat: bulk delete saari selected ids EK hi request mein bheje, dialog sahi
  // count dikhaye, aur sab hat jane par empty state aa jaye.
  it('deletes every selected row in one go', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const { user } = await renderDirectory({ onDelete });

    await user.click(screen.getByRole('checkbox', { name: 'Select all users' }));
    await user.click(screen.getByRole('button', { name: 'Delete selected (4)' }));

    expect(screen.getByRole('dialog', { name: 'Remove 4 user(s)?' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onDelete).toHaveBeenCalledWith(USERS.map((u) => u.id));
    expect(screen.getByText('No users match your filters.')).toBeInTheDocument();
  });

  // Zaroorat: request chalte waqt buttons disable hon aur "Removing…" dikhe, taake user
  // dobara click kar ke do dafa delete na kar de.
  it('disables the buttons while the delete is in flight', async () => {
    // A deferred promise lets the test hold the component in its pending state.
    let resolveDelete: () => void = () => {};
    const onDelete = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
    );
    const { user } = await renderDirectory({ onDelete });

    await user.click(screen.getByRole('button', { name: 'Delete Ada Lovelace' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    const removing = screen.getByRole('button', { name: 'Removing…' });
    expect(removing).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(rowNames()).toHaveLength(4);

    // Resolving is a state update, so it has to happen inside act().
    await act(async () => {
      resolveDelete();
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(rowNames()).toHaveLength(3);
  });

  // Zaroorat: delete fail ho to dialog band na ho, error dikhe, rows waisi hi rahein,
  // aur buttons dobara enable ho jayein taake user retry ya cancel kar sake.
  it('keeps the dialog open and shows an error when the delete fails', async () => {
    const onDelete = jest.fn().mockRejectedValue(new Error('conflict'));
    const { user } = await renderDirectory({ onDelete });

    await user.click(screen.getByRole('button', { name: 'Delete Ada Lovelace' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    const dialog = screen.getByRole('dialog');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Could not remove the selected users',
    );
    expect(dialog).toBeInTheDocument();
    expect(rowNames()).toHaveLength(4);

    // The buttons come back enabled so the user can retry or bail out.
    expect(within(dialog).getByRole('button', { name: 'Confirm' })).toBeEnabled();
  });
});

describe('rerender - testing a prop change', () => {
  // Zaroorat: naya fetchUsers prop milne par component dobara data laaye - purana
  // data screen par atka na rahe.
  it('re-fetches when a new fetchUsers arrives', async () => {
    const first = makeFetchUsers();
    const second = makeFetchUsers([USERS[0]]);

    const { rerender } = render(<UserDirectory fetchUsers={first} debounceMs={0} />);
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(rowNames()).toHaveLength(4);

    rerender(<UserDirectory fetchUsers={second} debounceMs={0} />);

    await waitFor(() => expect(rowNames()).toEqual(['Ada Lovelace']));
    expect(second).toHaveBeenCalledTimes(1);
  });
});

// export function makeFetchUsers(users: User[] = USERS) {
//   return jest.fn(async (query: string): Promise<User[]> => {
//     const q = query.trim().toLowerCase();
//     if (!q) return users;
//     return users.filter(
//       (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
//     );
//   });
// }

// export function makeFetchUsers(users: User[]=USERS){
//   return jest.fn(async(query: string): Promise<User[]> =>{
//     return users.filter((u) => u.name.includes(query))
//   })
// }

