import Link from "next/link";

import { DirectoryDemo } from "./DirectoryDemo";

export default function DirectoryPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Directory</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          The component exercised by <code>UserDirectory.test.tsx</code> and{" "}
          <code>UserDirectory.queries.test.tsx</code>. Deletes are faked and logged to the
          console.
        </p>
        <Link href="/" className="w-fit underline">
          Back to home
        </Link>
      </header>

      <DirectoryDemo />
    </main>
  );
}
