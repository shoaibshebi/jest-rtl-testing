import Link from "next/link";

import { Counter } from "@/components/Counter";

export default function CounterPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Counter</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Rendered from <code>src/components/Counter.tsx</code> - the same component the
          Jest tests exercise.
        </p>
        <Link href="/" className="w-fit underline">
          Back to home
        </Link>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">Default</h2>
        <Counter />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">Starts at 10, steps by 5, capped 0-20</h2>
        <Counter initialCount={10} step={5} min={0} max={20} />
      </section>
      
      
      


    </main>
  );
}
