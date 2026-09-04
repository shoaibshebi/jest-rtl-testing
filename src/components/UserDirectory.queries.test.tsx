import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UserDirectory } from './UserDirectory';
import { makeFetchUsers, renderDirectory } from './__fixtures__/users';


/**
 * Ek hi render kiye hue component par RTL ki saari queries ka tour.
 *
 * Tarteeb (Testing Library docs ke mutabiq): ByRole > ByLabelText >
 * ByPlaceholderText > ByText > ByDisplayValue > ByAltText > ByTitle > ByTestId.
 * Jo sab se pehle fit ho jaye wohi use karo - jitna neeche jaoge, test utna hi
 * kam is tarah ka rehta hai jaise ek asli banda screen pe cheezein dhoondta hai.
 */

describe('1. getByRole - the one to reach for first', () => {
  it('finds elements by their implicit role', async () => {
    await renderDirectory();

    // Landmarks aur page ka dhancha.
    expect(screen.getByRole('heading', { name: 'User directory' })).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument(); // <form role="search">
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Filter by status' })).toBeInTheDocument();

    // Table ka accessible name uske <caption> se aata hai.
    expect(
      screen.getByRole('table', { name: 'Users matching the current filters' }),
    ).toBeInTheDocument();
  });

  it('distinguishes input types by role, not by tag', async () => {
    await renderDirectory();

    // type="search" ka role searchbox hai, textbox NAHI - yahan log phansate hain.
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    // Bina `multiple` wala <select> combobox hota hai.
    expect(screen.getByRole('combobox', { name: 'Role' })).toBeInTheDocument();
  });

  it('matches the accessible name, wherever it comes from', async () => {
    await renderDirectory();

    // ...aria-label se:
    expect(screen.getByRole('checkbox', { name: 'Select all users' })).toBeInTheDocument();
    // ...element ke apne text se:
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    // ...andar wale element ke text se (<th> ka naam uske <button> se bana):
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    // ...image ke alt text se:
    expect(screen.getByRole('img', { name: 'Globe illustration' })).toBeInTheDocument();

    // Naam ke liye regex bhi chalta hai.
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('filters on ARIA state', async () => {
    await renderDirectory();

    // `selected`, `checked`, `pressed`, `expanded`, `disabled`, `level` - ye sab
    // chalte hain; ye aria-selected, aria-checked waghera parhte hain.
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('All');
    expect(screen.getAllByRole('tab', { selected: false })).toHaveLength(2);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('User directory');
  });

  it('ignores aria-hidden content by default', async () => {
    await renderDirectory();

    // Row ka avatar <svg> aria-hidden hai, is liye uska <title> cell ke
    // accessible name mein shamil NAHI hota - halanke textContent mein hota hai.
    const cell = screen.getByRole('cell', { name: 'Ada Lovelace' });
    expect(cell).toBeInTheDocument();
    expect(cell.textContent).toContain("Ada Lovelace's avatar");
  });
});

describe('2. getByLabelText - form fields', () => {
  it('finds inputs via <label for>, and via aria-label', async () => {
    await renderDirectory();

    // <label htmlFor> / id se jure hue:
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();

    // aria-label se jura hua:
    expect(screen.getByLabelText('Select Ada Lovelace')).toBeInTheDocument();
  });
});

describe('3. getByPlaceholderText - only when there is no label', () => {
  it('finds the search box by its placeholder', async () => {
    await renderDirectory();

    expect(screen.getByPlaceholderText('Name or email')).toBe(screen.getByLabelText('Search'));
  });
});

describe('4. getByText - visible copy', () => {
  it('matches strings, substrings, regexes and functions', async () => {
    const { user } = await renderDirectory();

    // Poora exact string (spaces normalise ho jate hain, magar poora match zaroori).
    expect(screen.getByText('Showing 4 of 4 users')).toBeInTheDocument();

    // Andar kahin bhi mil jaye.
    expect(screen.getByText('Showing 4 of', { exact: false })).toBeInTheDocument();

    // Regex - chhote/bare harf aur punctuation se bachne ka aam tareeqa.
    expect(screen.getByText(/showing 4 of 4/i)).toBeInTheDocument();

    // Function matcher - jab text kai child elements mein tuta hua ho.
    expect(
      screen.getByText(
        (content, element) => element?.tagName === 'P' && content.startsWith('Showing'),
      ),
    ).toBeInTheDocument();

    // "Active" 4 elements se match karta hai - ek tab, aur teen active users ki
    // rows ke status cells. Ambiguous getBy* error phenk deta hai, to ya
    // getAllBy* use karo ya query ko scope kar do.
    expect(screen.getAllByText('Active')).toHaveLength(4);
    expect(within(screen.getByRole('tablist')).getByText('Active')).toBeInTheDocument();

    // Khali state.
    await user.selectOptions(screen.getByLabelText('Role'), 'Admin');
    await user.click(screen.getByRole('tab', { name: 'Inactive' }));
    expect(screen.getByText('No users match your filters.')).toBeInTheDocument();
  });
});

describe('5. getByDisplayValue - the current value of a field', () => {
  it('finds a filled input and a chosen option', async () => {
    const { user } = await renderDirectory();

    await user.type(screen.getByLabelText('Search'), 'ada');
    expect(screen.getByDisplayValue('ada')).toBeInTheDocument();

    // <select> ke liye ye selected option ka text match karta hai.
    expect(screen.getByDisplayValue('All roles')).toBeInTheDocument();
  });
});

describe('6. getByAltText - images', () => {
  it('finds the illustration by its alt text', async () => {
    await renderDirectory();

    expect(screen.getByAltText('Globe illustration')).toBeInTheDocument();
    expect(screen.getByAltText(/globe/i)).toBeInTheDocument();
  });
});

describe('7. getByTitle - title attributes and <svg><title>', () => {
  it('finds a title attribute and an svg title', async () => {
    await renderDirectory();

    // Kisi bhi element ka title attribute:
    expect(screen.getByTitle('Results refresh as you type')).toBeInTheDocument();

    // <svg> ke andar <title> - dhyan rakho, ye <title> node khud wapas karta hai:
    expect(screen.getByTitle("Ada Lovelace's avatar")).toBeInTheDocument();
    expect(screen.getAllByTitle(/avatar$/)).toHaveLength(4);
  });
});

describe('8. getByTestId - the escape hatch', () => {
  it('finds elements with no usable role, label or stable text', async () => {
    await renderDirectory();

    expect(screen.getByTestId('result-summary')).toHaveTextContent('Showing 4 of 4 users');
    expect(screen.getAllByTestId('user-name')).toHaveLength(4);
  });
});

describe('the three prefixes: getBy / queryBy / findBy', () => {
  it('getBy* throws when nothing matches', async () => {
    await renderDirectory();

    expect(() => screen.getByRole('dialog')).toThrow(/Unable to find/);
  });

  it('queryBy* returns null - the only way to assert absence', async () => {
    await renderDirectory();

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('dialog')).toHaveLength(0);
  });

  it('findBy* waits for something that appears later', async () => {
    // Seedha render kiya hai, to pehla load abhi chal raha hai.
    render(<UserDirectory fetchUsers={makeFetchUsers()} debounceMs={0} />);

    // Ye foran maujood hai...
    expect(screen.getByRole('status')).toHaveTextContent('Loading users…');
    // ...aur ye sirf promise resolve hone ke baad.
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(await screen.findAllByTestId('user-name')).toHaveLength(4);
  });

  it('getAllBy* throws on zero matches, queryAllBy* does not', async () => {
    await renderDirectory();

    expect(() => screen.getAllByRole('dialog')).toThrow();
    expect(screen.queryAllByRole('dialog')).toEqual([]);
  });
});

describe('within() - scoping a query to a subtree', () => {})

describe('within() - scoping a query to a subtree', () => {
  it('queries inside one table row', async () => {
    await renderDirectory();

    const rows = within(screen.getByRole('table')).getAllByRole('row');
    const [header, firstRow] = rows;

    expect(within(header).getAllByRole('columnheader')).toHaveLength(6);

    // Neeche sab kuch sirf Ada ki row ke andar dhoonda ja raha hai.
    expect(within(firstRow).getByTestId('user-name')).toHaveTextContent('Ada Lovelace');
    expect(within(firstRow).getByRole('cell', { name: 'ada@example.com' })).toBeInTheDocument();
    expect(within(firstRow).getByRole('checkbox')).not.toBeChecked();
    expect(
      within(firstRow).getByRole('button', { name: 'Delete Ada Lovelace' }),
    ).toBeInTheDocument();

    // Bina scope kiye 5 checkboxes hain (4 rows + select-all).
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
  });
});

describe('container queries vs screen', () => {
  it('render() returns the same queries bound to the container', async () => {
    const { container } = await renderDirectory();

    // `screen` document.body pe dhoondta hai; yahan dono barabar hain.
    expect(within(container).getByRole('table')).toBe(screen.getByRole('table'));

    // container aam DOM node hai, to zaroorat par CSS selector bhi chalta hai
    // (aakhri option - test markup se chipak jata hai).
    expect(container.querySelectorAll('tbody tr')).toHaveLength(4);
  });
});

describe('keyboard focus', () => {
  it('tabs to the first focusable control', async () => {
    const user = userEvent.setup();
    await renderDirectory({ fetchUsers: makeFetchUsers() });

    await user.tab();

    expect(screen.getByLabelText('Search')).toHaveFocus();
  });
});
