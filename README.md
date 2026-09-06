# Samjho — Testing ki poori kahani

Ye file un dono projects ko asaan zubaan mein samjhati hai jo humne banaye:
`~/Documents/playwright-testing` aur `~/Documents/jest-rtl-testing`.

Zyada hissa **jest-rtl-testing** ka hai, kyunke yahan tests zyada aur thoda
complex hain. Aakhir mein Playwright wale project se farq bhi likha hai.

---

## 1. Sab se pehle: 2 tarah ki testing

Do bilkul alag cheezein hain, log inko mix kar dete hain:

| | Jest + RTL | Playwright |
| - | ---------- | ---------- |
| Kya test karta hai | Ek component akela | Poori app, real browser mein |
| Browser | **Nahi** (jsdom = fake DOM) | Haan (Chrome, Firefox, Safari) |
| Speed | Bohot tez (1-2 second) | Slow (15-20 second) |
| Naam | Unit / component test | End-to-end (E2E) test |
| Kab likhte hain | Har component ke liye, bohot saare | Sirf important user journeys |

**jsdom** ka matlab: Node ke andar JavaScript se banaya gaya nakli DOM. Isme
koi window nahi khulti, kuch nazar nahi aata — sirf memory mein HTML banta hai
aur hum uspe assert karte hain. Isi wajah se ye itna tez hai.

Rule of thumb: **90% Jest + RTL, 10% Playwright.**

---

## 2. jest-rtl-testing — kaun si file kya karti hai

| File | Kaam |
| ---- | ---- |
| `jest.config.mjs` | Jest ki settings. `next/jest` use kiya hai jo TypeScript/JSX ko samajhne ka kaam khud kar leta hai |
| `jest.setup.ts` | Har test se pehle chalti hai. `jest-dom` ke matchers load karti hai (`toBeInTheDocument` waghera) |
| `src/components/Counter.tsx` | Chhota, asaan component — yahan se shuru karo |
| `src/components/Counter.test.tsx` | 9 tests. Basics: render karo, click karo, check karo |
| `src/components/UserDirectory.tsx` | Bara component — API se data, tabs, search, table, dialog |
| `src/components/UserDirectory.queries.test.tsx` | 19 tests. **Sirf ye sikhane ke liye ke elements dhoondne ke kitne tareeqe hain** |
| `src/components/UserDirectory.test.tsx` | 22 tests. Mushkil scenarios — loading, error, keyboard, delete |
| `src/components/__fixtures__/users.tsx` | Fake data aur helper functions, taake har test mein dobara na likhna paray |
| `src/app/counter/page.tsx` | Browser mein Counter dekhne ke liye |
| `src/app/directory/page.tsx` | Browser mein UserDirectory dekhne ke liye |
| `JEST.md` | English cheat-sheet |
| `SAMJHO.md` | Ye file |

Note: file ka naam `*.test.tsx` hona zaroori hai, warna Jest usay test nahi
samjhega. `__fixtures__` folder ki files test nahi samjhi jati — isi liye
helper wahan rakhe hain.

---

## 3. Ek test ke andar kya hota hai — 3 qadam

Har RTL test bilkul yehi 3 kaam karta hai:

```tsx
// 1. RENDER — component ko nakli DOM mein laga do
render(<Counter />);

// 2. DHOONDO — jaise ek banda screen pe dhoondta hai
const button = screen.getByRole('button', { name: 'Increment' });

// 3. KARO aur CHECK KARO
await user.click(button);
expect(screen.getByTestId('count')).toHaveTextContent('1');
```

Bas. Baqi sab isi ki tafseel hai.

Aur ek achi baat: har test ke baad RTL component ko khud hata deta hai
(auto cleanup), to har test bilkul saaf shuruaat karta hai.

---

## 4. `Counter.test.tsx` — basics

9 tests hain, har ek 3-4 line ka:

- Shuru mein count `0` dikhta hai
- `initialCount={7}` do to `7` dikhta hai
- Increment/Decrement/Reset buttons theek chal rahe hain
- `step={5}` do to 5-5 badhta hai
- `min`/`max` par buttons **disable** ho jate hain
- `max` pe pohanch kar "Maximum reached" message aata hai
- `onChange` prop sahi value ke sath call hota hai
- Sirf render karne se `onChange` call **nahi** hota

Aakhri do tests mein `jest.fn()` use hua hai — ye ek **nakli function** hai.
Ye asal mein kuch nahi karta, bas yaad rakhta hai ke kitni martaba aur kis
value ke sath call hua:

```tsx
const onChange = jest.fn();
render(<Counter onChange={onChange} />);

await user.click(screen.getByRole('button', { name: 'Increment' }));

expect(onChange).toHaveBeenCalledTimes(1);      // ek dafa call hua
expect(onChange).toHaveBeenCalledWith(1);       // aur value 1 thi
```

---

## 5. `UserDirectory.tsx` — bara component

Isko jaan boojh kar bara banaya hai, taake har tarah ka test practice ho sake.
Isme ye sab hai:

- **Server se data** — `fetchUsers` prop ke zariye (loading / error / khali / data)
- **Tabs** — All / Active / Inactive, arrow keys se bhi chalte hain
- **Search box** — debounce ke sath (har harf pe request nahi jati)
- **Role filter** — dropdown
- **Table** — Name column pe click karke sorting ulti ho jati hai
- **Checkboxes** — har row ka, aur ek "select all" jo teen halat mein hota hai
- **Delete** — pehle confirm dialog aata hai, phir delete hota hai
- **Toast** — "Removed 1 user(s)" ka message

Ek important design decision: `fetchUsers` ko **prop** banaya hai, component
ke andar `fetch` nahi likha. Faida: test mein asli network ki zaroorat nahi,
bas ek `jest.fn()` de do. Isko **dependency injection** kehte hain, aur testing
ke liye ye sab se saaf tareeqa hai.

---

## 6. `UserDirectory.queries.test.tsx` — elements dhoondne ke 8 tareeqe

Ye file tutorial ki tarah likhi hai. Har `describe` ek tareeqa samjhata hai.

**Tarteeb yaad rakho — upar wala behtar hai:**

| # | Query | Kya dhoondta hai |
| - | ----- | ---------------- |
| 1 | `getByRole` | Element ka role + uska naam. **Sab se pehle yehi try karo** |
| 2 | `getByLabelText` | Form fields, label ya `aria-label` se |
| 3 | `getByPlaceholderText` | Placeholder se (jab label na ho) |
| 4 | `getByText` | Screen pe likha hua text |
| 5 | `getByDisplayValue` | Field mein jo **abhi** likha hua hai |
| 6 | `getByAltText` | Images, `alt` se |
| 7 | `getByTitle` | `title` attribute ya `<svg><title>` |
| 8 | `getByTestId` | Jab koi tareeqa kaam na kare. **Aakhri option** |

Kyun ye tarteeb? Kyunke `getByRole` wo cheez dhoondta hai jo ek asli banda
(aur screen reader) dekhta hai. `getByTestId` sirf developer ke lagaye hue
`data-testid` pe chalta hai — user ko uska pata bhi nahi. To agar test
`getByTestId` se bhara hua hai, matlab test ye check nahi kar raha ke app
**istemaal ho sakti hai ya nahi**, bas code ka dhancha check kar raha hai.

### `getByRole` ko theek se seekho

Do cheezein yahan phansati hain:

**Pehli — role wo nahi hota jo tag hai:**

```tsx
screen.getByRole('searchbox')                    // input type="search" — textbox NAHI
screen.getByRole('combobox', { name: 'Role' })   // simple <select>
screen.getByRole('search')                       // <form role="search">
```

`type="search"` ka role `searchbox` hai, `textbox` nahi. Isi liye test mein
humne dono cheezein likhi hain — ek pass hoti hai, doosri nahi.

**Doosri — `name` ka matlab "accessible name" hai**, text nahi, id nahi.
Ye naam 5 alag jagah se aa sakta hai:

```tsx
{ name: 'Refresh' }                  // button ke andar ka text
{ name: 'Select all users' }         // aria-label se
{ name: 'Name' }                     // andar wale <button> se (th ka naam)
{ name: 'Globe illustration' }       // image ke alt se
{ name: 'Users matching…' }          // table ke <caption> se
```

**Bonus:** `getByRole` state pe bhi filter kar sakta hai, isse bohot lines bachti hain:

```tsx
screen.getByRole('tab', { selected: true });      // aria-selected="true"
screen.getByRole('button', { disabled: true });
screen.getByRole('heading', { level: 2 });        // h2
```

**Aur ek maze ki baat:** `getByRole` `aria-hidden` wali cheezein ignore kar
deta hai. Humare table mein har row ka avatar `<svg aria-hidden>` hai jiske
andar `<title>Ada Lovelace's avatar</title>` hai. To:

```tsx
cell.textContent                                  // "Ada Lovelace's avatarAda Lovelace"
screen.getByRole('cell', { name: 'Ada Lovelace' }) // sirf "Ada Lovelace" — kaam karta hai
```

Yani accessible name aur textContent do alag cheezein hain. Ye test file mein
dono likh kar dikhaya hai.

### Text match karne ke 4 tareeqe

```tsx
screen.getByText('Showing 4 of 4 users');            // poora exact
screen.getByText('Showing 4 of', { exact: false });   // andar kahin bhi
screen.getByText(/showing 4 of 4/i);                  // regex (i = case ignore)
screen.getByText((content, el) =>                     // function — jab text tuta hua ho
  el?.tagName === 'P' && content.startsWith('Showing'));
```

### `within()` — ek hisse ke andar dhoondna

Agar do elements match ho gaye to `getBy*` **error de deta hai** (isko strict
mode kehte hain). Iska sahi hal `.first()` lagana **nahi** hai — sahi hal
scoping hai:

```tsx
const row = within(screen.getByRole('table')).getAllByRole('row')[1];

within(row).getByRole('checkbox');                          // sirf is row ka
within(row).getByRole('button', { name: 'Delete Ada Lovelace' });
```

Misaal: humare page pe "Active" 4 martaba aata hai — 1 tab aur 3 rows ke
status cells. To ya `getAllByText('Active')` use karo, ya `within(tablist)`
laga do.

---

## 7. Sab se zaroori cheez: `getBy` vs `queryBy` vs `findBy`

Ye 3 prefixes hain aur **ghalat prefix chunna sab se aam galti hai**:

| Prefix | Na mile to | Kab use karo |
| ------ | ---------- | ------------ |
| `getBy*` | **Error phenk deta hai** | Cheez abhi, isi waqt, wahan honi chahiye |
| `queryBy*` | `null` deta hai | Ye check karne ke liye ke cheez **nahi** hai |
| `findBy*` | Wait karta hai, phir fail | Cheez **baad mein** aane wali hai (async) — `await` lazmi |

To "ye cheez nahi honi chahiye" aise likho:

```tsx
expect(screen.queryByRole('dialog')).not.toBeInTheDocument();   // sahi
expect(screen.getByRole('dialog')).not.toBeInTheDocument();     // GALAT
```

Doosri line kabhi chalegi hi nahi — `getBy*` khud hi error de dega assertion
tak pohanchne se pehle.

Aur async ke liye:

```tsx
expect(screen.getByRole('status')).toHaveTextContent('Loading users…'); // foran
expect(await screen.findByRole('table')).toBeInTheDocument();           // data aane ke baad
```

Teeno ke `All` versions bhi hain: `getAllBy*`, `queryAllBy*`, `findAllBy*` —
jab ek se zyada elements chahiye.

---

## 8. `UserDirectory.test.tsx` — mushkil scenarios

Yahan asli maza hai. 22 tests, groups mein:

### (a) Loading, error, khali state

```tsx
const fetchUsers = makeFetchUsers();
fetchUsers.mockRejectedValueOnce(new Error('network down'));  // pehli dafa fail karo

render(<UserDirectory fetchUsers={fetchUsers} debounceMs={0} />);

expect(await screen.findByRole('alert')).toHaveTextContent('Could not load');
await user.click(screen.getByRole('button', { name: 'Retry' }));
expect(await screen.findByRole('table')).toBeInTheDocument();
```

`mockRejectedValueOnce` = sirf **ek** dafa fail karo, agli dafa normal chalo.
Isse error state aur retry dono ek hi test mein cover ho gaye.

### (b) Debounce + fake timers — yahan log sab se zyada phansate hain

Search box mein debounce hai: har harf pe request nahi jati, sirf rukne pe
jati hai. Isko test karne ke liye waqt ko "nakli" karna parta hai:

```tsx
jest.useFakeTimers();
const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
```

**Ye doosri line bohot zaroori hai.** Fake timers ke sath agar user-event ko
ye na batao ke waqt kaise aage barhana hai, to `user.type()` hamesha ke liye
atak jata hai aur test timeout ho jata hai. Ye ek raat kharab karne wala bug
hai — yaad rakho.

Phir waqt aage barhao:

```tsx
await act(async () => { jest.advanceTimersByTime(300); });

expect(fetchUsers).toHaveBeenCalledTimes(2);        // 1 pehla load + 1 search
expect(fetchUsers).not.toHaveBeenCalledWith('a');   // adhoore harf pe request nahi gayi
expect(fetchUsers).not.toHaveBeenCalledWith('ad');
```

Aur aakhir mein waqt wapas asli karna **na bhoolo**, warna agle tests kharab
honge:

```tsx
afterEach(() => { jest.useRealTimers(); });
```

### (c) Adhoora (pending) promise — "Removing…" wali halat

Sawal: jab delete chal raha ho aur button pe "Removing…" likha ho, us waqt ka
test kaise likhein? Promise to foran resolve ho jata hai.

Hal: promise ko **haath mein rok lo**:

```tsx
let resolveDelete: () => void = () => {};
const onDelete = jest.fn(
  () => new Promise<void>((resolve) => { resolveDelete = resolve; })
);
```

Ab promise kabhi resolve nahi hoga jab tak hum khud na karein. To beech wali
halat check kar sakte hain:

```tsx
expect(screen.getByRole('button', { name: 'Removing…' })).toBeDisabled();
expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

await act(async () => { resolveDelete(); });   // ab jane do

expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
```

### (d) Keyboard navigation

Tabs arrow keys se chalte hain (isko "roving tabindex" pattern kehte hain —
sirf selected tab `Tab` key ki line mein hota hai):

```tsx
all.focus();
await user.keyboard('{ArrowRight}');
expect(active).toHaveFocus();
expect(active).toHaveAttribute('aria-selected', 'true');

await user.keyboard('{ArrowRight}');   // aakhir se wapas shuru mein
await user.keyboard('{End}');          // aakhri tab
await user.keyboard('{Home}');         // pehla tab
await user.keyboard('{Escape}');       // dialog band
```

### (e) Delete ka poora flow

6 tests, har ek alag raasta:

1. Dialog khulta hai **aur focus khud Cancel pe chala jata hai** (`toHaveFocus`)
2. Cancel dabao → `onDelete` call **nahi** hota
3. Escape dabao → dialog band, kuch delete nahi hua
4. Confirm dabao → row gayab, toast aaya, `onDelete` ko `[1]` mila
5. Select all → 4 rows ek sath delete
6. `onDelete` fail ho jaye → dialog khula rehta hai, error dikhta hai, row wapas nahi jati

Point number 6 zaroori hai: **failure ka test likhna success ke test se zyada
qeemti hota hai.** Success wala raasta developer khud dekh leta hai, failure
wala nahi.

### (f) Chhoti magar kaam ki cheezein

```tsx
// Tri-state checkbox — ye DOM ki "property" hai, attribute nahi
expect(selectAll).toBePartiallyChecked();

// Poora form ek sath check karo
expect(screen.getByRole('search')).toHaveFormValues({ query: 'ada', role: 'Admin' });

// Prop badalne ka test — dobara render() NAHI, rerender() use karo
rerender(<UserDirectory fetchUsers={second} debounceMs={0} />);
```

---

## 9. `waitFor` aur `findBy` mein farq

Dono wait karte hain, magar kaam alag hai:

```tsx
// findBy* — kisi ELEMENT ke aane ka intezar
expect(await screen.findByRole('table')).toBeInTheDocument();

// waitFor — kisi bhi ASSERTION ke sach hone ka intezar (element ho ya na ho)
await waitFor(() => expect(fetchUsers).toHaveBeenLastCalledWith('grace'));
await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
```

Yani: element chahiye to `findBy*`, koi doosri cheez (mock call, ya kisi cheez
ka **gayab** hona) chahiye to `waitFor`.

Spinner ke gayab hone ka aur bhi saaf tareeqa hai, jo humne
`__fixtures__/users.tsx` mein use kiya:

```tsx
await waitForElementToBeRemoved(() => screen.queryByRole('status'));
```

---

## 10. `__fixtures__/users.tsx` — repetition khatam

Har test mein wohi 4 users aur wohi setup likhna bekaar hai. To:

- `USERS` — 4 fake users ka data
- `makeFetchUsers()` — nakli server, query ke hisab se filter karta hai
- `renderDirectory()` — render karo **aur** pehla loading khatam hone ka wait karo
- `rowNames()` — table mein jo naam dikh rahe hain, tarteeb ke sath

Isi liye test itne chhote lagte hain:

```tsx
const { user, fetchUsers } = await renderDirectory();
```

Ek line, aur component data ke sath tayyar hai.

---

## 11. Aam galtiyan — ye 6 yaad rakho

**1. `await` bhool jana.** `userEvent` ka har function async hai:

```tsx
user.click(button);          // GALAT — React ne dobara render bhi nahi kiya
await user.click(button);    // sahi
```

**2. `await` ghalat jagah lagana:**

```tsx
expect(await screen.findByRole('table')).toBeInTheDocument();   // sahi
await expect(screen.findByRole('table')).toBeInTheDocument();   // galat
```

**3. Absence ke liye `getBy*`** — upar section 7 mein bata diya. `queryBy*` use karo.

**4. `fireEvent` istemaal karna.** `userEvent` asli banda banta hai (hover,
focus, keydown, keyup, click — poori tarteeb se) aur `disabled` button ko
respect karta hai. `fireEvent` sirf ek raw event phenk deta hai. Hamesha
`userEvent`.

**5. Fake timers ke sath `advanceTimers` na dena** — test hamesha ke liye atak
jayega.

**6. Sab kuch `getByTestId` se dhoondna.** Chalega, magar test se ye pata nahi
chalega ke app asal mein istemaal ki ja sakti hai ya nahi.

---

## 12. Test fail ho to kya karo

```tsx
screen.debug();                            // poora DOM print karo
screen.debug(screen.getByRole('table'));   // sirf ek hissa
screen.logTestingPlaygroundURL();          // browser mein khol kar dekho
```

Aur ek bohot kaam ki baat: jab `getByRole` ko kuch na mile, wo **saare
maujood roles ki list print kar deta hai**. Us list ko dhyan se parho — 90%
dafa asli naam wahin likha hota hai.

Note: `logTestingPlaygroundURL()` aapka HTML ek bahar ki website
(testing-playground.com) pe bhejta hai. Asli data wale tests mein isay na
chhoro.

---

## 13. Commands

```bash
npm test
```

```bash
npm run test:watch
```

Ye sab se zyada kaam ka hai — file save karo, test khud dobara chal jate hain.
`p` dabao to file ke naam se filter, `t` dabao to test ke naam se.

```bash
npm run test:coverage
```

Iske baad `coverage/lcov-report/index.html` browser mein khol kar dekho —
line by line rang laga hota hai ke kaun sa code test hua aur kaun sa nahi.

```bash
npx jest -t "debounce"
```

Sirf wo tests jinke naam mein "debounce" hai.

```bash
npm run dev
```

Components ko browser mein dekhne ke liye — `/counter` aur `/directory`.

---

## 14. Playwright wala project — farq kya hai

`~/Documents/playwright-testing` mein:

- `playwright.config.ts` — 3 browsers, aur Playwright khud `next dev` chala leta hai
- `src/app/playground/page.tsx` — practice ka page
- `tests/home.spec.ts`, `tests/playground.spec.ts`, `tests/api.spec.ts`
- 13 tests × 3 browsers = 39 tests

**Achi khabar:** locators wahan bhi bilkul yehi hain — `getByRole`,
`getByLabel`, `getByText`, `getByTestId`. Jo aap ne yahan seekha, wahan bhi
chalega. Sirf naam thoda chhota hai (`getByLabel` na ke `getByLabelText`).

**Bara farq — assertions:**

```tsx
// Playwright — khud baar baar koshish karta hai (auto-retry)
await expect(page.getByTestId('count')).toHaveText('2');

// RTL — foran check karta hai; wait karna ho to findBy/waitFor khud lagao
expect(screen.getByTestId('count')).toHaveTextContent('2');
```

Isi liye Playwright mein `waitForTimeout` ki zaroorat hi nahi parti.

**Ek Next.js ka phansane wala point:** Next har page mein apna
`<div role="alert">` (route announcer) daal deta hai. To browser mein
`page.getByRole('alert')` do elements match karta hai aur test fail ho jata
hai — humare pehle run mein 9 tests isi wajah se fail hue the. Hal: scope
karo, `.first()` na lagao.

RTL mein ye masla nahi hota, kyunke wahan sirf component render hota hai,
poora Next page nahi.

---

## 15. Aage kya seekho

Tarteeb se:

1. `Counter.test.tsx` parho — 5 minute
2. `UserDirectory.queries.test.tsx` parho — ye tutorial ki tarah likha hai
3. `npm run test:watch` chalao aur jaan boojh kar kuch todo — dekho error kaisa aata hai
4. Component mein ek nayi cheez dalo (jaise pagination) aur uska test likho
5. Phir seekho: `page.route()` / MSW se network mock karna, `storageState` se login ek dafa karke reuse karna

Aur yaad rakho: **jsdom mein async Server Components test nahi hote.** Un ke
liye Playwright hi chalega.
