"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white" onClick={reset}>Try again</button>
    </main>
  );
}
