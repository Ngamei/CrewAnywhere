import { APP_NAME } from '@/shared/config/site';

const foundations = [
  'Next.js App Router',
  'TypeScript domain modules',
  'Supabase auth and data foundation',
  'Backend service layer',
  'Shared UI primitives',
  'Mobile-ready layout baseline',
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center gap-8 px-5 py-12 sm:px-8">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Technical foundation
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {APP_NAME} is ready for modular platform development.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          This scaffold defines architecture, contracts, auth, state, database, and shared UI foundations only.
          Marketplace features should be added later inside domain-owned modules.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {foundations.map((foundation) => (
          <div key={foundation} className="rounded-xl border border-border bg-white p-4">
            <p className="text-sm font-medium">{foundation}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
