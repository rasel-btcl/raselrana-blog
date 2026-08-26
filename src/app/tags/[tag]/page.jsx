export default function tagPage({ params }) {
  const { tag } = params;
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Tag: {tag}
        </h1>
      </div>
    </main>
  );
}
