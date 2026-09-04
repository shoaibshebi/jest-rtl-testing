# Jest + React Testing Library notes

## Layout

```
jest.config.mjs                            next/jest wiring (SWC transform, CSS mocks, @/* alias)
jest.setup.ts                              loads the jest-dom matchers

src/components/Counter.tsx                 small component - start here
src/components/Counter.test.tsx            the basics: render, click, assert

src/components/UserDirectory.tsx           bigger component: async data, tabs,
                                           debounced search, sortable table,
                                           multi-select, confirm dialog
src/components/UserDirectory.queries.test.tsx  a tour of every RTL query
src/components/UserDirectory.test.tsx      the complex scenarios
src/components/__fixtures__/users.tsx      shared fixtures + renderDirectory()

src/app/counter/page.tsx                   both components in the browser
src/app/directory/page.tsx                 (npm run dev)
```

`UserDirectory` exists to give every query type something realistic to aim at.
Read `UserDirectory.queries.test.tsx` top to bottom - it is written as a
tutorial, one `describe` per query family.

## Commands

```bash
npm test                  # run every suite once
npm run test:watch        # re-run on save (press `p` to filter by filename)
npm run test:coverage     # coverage table + coverage/lcov-report/index.html
npm run dev               # see the component at http://localhost:3000/counter
```

Narrowing a run:

```bash
npx jest Counter                       # files matching "Counter"
npx jest -t "increments"               # tests whose name matches
npx jest --watch --coverage
```

## The loop

Every RTL test is the same three steps:

```tsx
render(<Counter />);                                          // 1. render
const button = screen.getByRole('button', { name: 'Add' });   // 2. find
await user.click(button);                                     // 3. act + assert
expect(screen.getByTestId('count')).toHaveTextContent('1');
```

RTL auto-unmounts between tests, so no manual cleanup.

## Queries, best to worst

Use the first one that fits. The further down you go, the less the test
resembles how a person actually finds things.

| # | Query | Targets | Example from this project |
| - | ----- | ------- | ------------------------- |
| 1 | `getByRole` | role + accessible name | `getByRole('columnheader', { name: 'Name' })` |
| 2 | `getByLabelText` | form fields via `<label>` or `aria-label` | `getByLabelText('Select Ada Lovelace')` |
| 3 | `getByPlaceholderText` | placeholder, when there is no label | `getByPlaceholderText('Name or email')` |
| 4 | `getByText` | visible copy | `getByText('No users match your filters.')` |
| 5 | `getByDisplayValue` | the *current* value of a field | `getByDisplayValue('All roles')` |
| 6 | `getByAltText` | images | `getByAltText('Globe illustration')` |
| 7 | `getByTitle` | `title` attr, `<svg><title>` | `getByTitle("Ada Lovelace's avatar")` |
| 8 | `getByTestId` | nothing else works | `getByTestId('result-summary')` |

### getByRole is worth learning properly

Role is often not the tag you expect, and the *name* option is the accessible
name - not the text, not the id:

```tsx
screen.getByRole('searchbox')                        // input type="search", NOT textbox
screen.getByRole('combobox', { name: 'Role' })       // a plain <select>
screen.getByRole('table', { name: 'Users matching…' })  // named by its <caption>
screen.getByRole('img', { name: 'Globe illustration' }) // named by alt
screen.getByRole('search')                           // <form role="search"> landmark
```

It can also filter on ARIA state, which saves a lot of attribute assertions:

```tsx
screen.getByRole('tab', { selected: true });
screen.getAllByRole('tab', { selected: false });
screen.getByRole('heading', { level: 2 });
screen.getByRole('button', { disabled: true });
```

And it ignores `aria-hidden` subtrees by default - so the aria-hidden avatar
`<svg><title>` in each row is part of `textContent` but *not* part of the
cell's accessible name. That difference is tested in
`UserDirectory.queries.test.tsx`.

### Matchers for the text itself

```tsx
screen.getByText('Showing 4 of 4 users');                  // exact, whitespace-normalised
screen.getByText('Showing 4 of', { exact: false });        // substring
screen.getByText(/showing 4 of 4/i);                       // regex
screen.getByText((content, el) =>                          // function, for split text
  el?.tagName === 'P' && content.startsWith('Showing'));
```

### Scoping with within()

An ambiguous `getBy*` throws. Scope instead of reaching for `.first()`:

```tsx
const row = within(screen.getByRole('table')).getAllByRole('row')[1];
within(row).getByRole('checkbox');
within(row).getByRole('button', { name: 'Delete Ada Lovelace' });
```

Three prefixes, and picking the wrong one is the most common beginner mistake:

| prefix     | not found     | use for                            |
| ---------- | ------------- | ---------------------------------- |
| `getBy*`   | **throws**    | it should be there right now       |
| `queryBy*` | returns null  | asserting **absence**              |
| `findBy*`  | rejects       | it appears **later** (async, await)|

So absence is `expect(screen.queryByRole('status')).not.toBeInTheDocument()` -
`getBy*` would throw before the assertion ever ran.

`getAllBy*` / `queryAllBy*` / `findAllBy*` are the multi-element versions.

## user-event, not fireEvent

`userEvent` simulates a real interaction (hover, focus, keydown, keyup, click)
and respects things like `disabled`. `fireEvent` dispatches one raw DOM event.
Prefer `userEvent`:

```tsx
const user = userEvent.setup();   // before render
render(<Counter />);
await user.click(...);            // every method is async - always await
await user.type(input, 'hello');
await user.keyboard('{Enter}');
await user.selectOptions(select, 'Pro');
```

Forgetting the `await` is the other classic mistake - the assertion runs before
React has re-rendered.

## Useful matchers

From jest-dom (loaded in `jest.setup.ts`):

```tsx
expect(el).toBeInTheDocument();
expect(el).toHaveTextContent('5');
expect(el).toBeDisabled();  expect(el).toBeEnabled();
expect(el).toBeVisible();
expect(el).toHaveValue('ada@example.com');
expect(el).toBeChecked();
expect(el).toHaveAttribute('href', '/counter');
expect(el).toHaveClass('opacity-40');
```

From Jest itself, for mock functions:

```tsx
const onChange = jest.fn();
expect(onChange).toHaveBeenCalledTimes(2);
expect(onChange).toHaveBeenNthCalledWith(1, 1);
expect(onChange).toHaveBeenLastCalledWith(2);
expect(onChange).not.toHaveBeenCalled();
```

## Debugging a failure

```tsx
screen.debug();                    // print the whole DOM
screen.debug(screen.getByRole('button'));
screen.logTestingPlaygroundURL();  // opens testing-playground with your markup
```

A `getByRole` that cannot find anything prints every available role in the
rendered output - read that list, it usually tells you the real name.

## Complex scenarios, and how they are tested

All of these are in `UserDirectory.test.tsx`.

**Async states.** The component is handed its `fetchUsers` as a prop, so a
`jest.fn()` is all the mocking needed - no global `fetch` patching:

```tsx
const fetchUsers = makeFetchUsers();
fetchUsers.mockRejectedValueOnce(new Error('network down'));   // error path
expect(await screen.findByRole('alert')).toHaveTextContent('Could not load');
```

**Debounce, with fake timers.** The one real gotcha: under fake timers
user-event must be told how to advance them, or it hangs forever.

```tsx
jest.useFakeTimers();
const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
// ...
await act(async () => { jest.advanceTimersByTime(300); });
```

Always restore real timers in `afterEach(() => jest.useRealTimers())`.

**A pending promise.** To assert on an in-flight state ("Removing…", buttons
disabled), hold the promise open and resolve it inside `act`:

```tsx
let resolveDelete: () => void = () => {};
const onDelete = jest.fn(() => new Promise<void>((r) => { resolveDelete = r; }));
// ...assert the pending UI...
await act(async () => { resolveDelete(); });
```

**Keyboard navigation.** Roving tabindex, arrow keys, Escape:

```tsx
tab.focus();
await user.keyboard('{ArrowRight}');
expect(screen.getByRole('tab', { name: 'Active' })).toHaveFocus();
await user.keyboard('{Escape}');
```

**DOM properties that are not attributes.** A tri-state checkbox sets
`.indeterminate`, and jest-dom has a matcher for it:

```tsx
expect(selectAll).toBePartiallyChecked();
```

**A whole form at once:**

```tsx
expect(screen.getByRole('search')).toHaveFormValues({ query: 'ada', role: 'Admin' });
```

**Prop changes** use `rerender` from `render()`, not a second `render()`.

**waitFor vs findBy.** `findBy*` waits for an element to appear. `waitFor`
waits for an arbitrary assertion - use it for things that are not elements:

```tsx
await waitFor(() => expect(fetchUsers).toHaveBeenLastCalledWith('grace'));
await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
```

`waitForElementToBeRemoved` is the readable way to wait out a spinner - see
`renderDirectory()` in the fixtures file.

## Things to try next

- `waitFor` and `findBy*` for state that settles asynchronously
- `jest.mock('next/navigation')` to test components that use the router
- `rerender` from `render()` to test prop changes
- `within(element)` to scope queries to a subtree
- A custom `renderWithProviders` helper once you add a context/theme provider
- MSW (`msw`) to intercept fetch instead of mocking it by hand

Note: Jest + RTL runs in jsdom, so it cannot test async Server Components.
For those, use an end-to-end runner instead.

Docs: https://testing-library.com/docs/react-testing-library/intro
