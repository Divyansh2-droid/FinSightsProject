"use client";

export default function NewsCard({ item }) {
  const dt = item.publishedAt ? new Date(item.publishedAt) : null;

  // very naive sentiment from title/description
  const text = `${item.title || ""} ${item.description || ""}`.toLowerCase();
  const up = /(rally|surge|jump|beat|record|upgrade|growth|soar)/.test(text);
  const down = /(fall|plunge|drop|miss|downgrade|loss|warning|fraud)/.test(text);
  const sentiment = up && !down ? "bullish" : down && !up ? "bearish" : "neutral";
  const badge =
    sentiment === "bullish"
      ? "bg-emerald-900/40 text-emerald-300"
      : sentiment === "bearish"
      ? "bg-rose-900/40 text-rose-300"
      : "bg-slate-800 text-slate-300";

  return (
    <article className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden hover:bg-black/50 transition">
      {item.urlToImage && (
        <div className="aspect-[16/9] overflow-hidden">
          <img src={item.urlToImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{item.source?.name || "News"}</span>
          {dt && (
            <>
              <span>•</span>
              <time dateTime={item.publishedAt}>{dt.toLocaleString()}</time>
            </>
          )}
          <span className={`ml-auto px-2 py-0.5 rounded-full capitalize ${badge}`}>{sentiment}</span>
        </div>
        <h3 className="text-base font-semibold leading-snug">{item.title}</h3>
        {item.description && <p className="text-sm text-gray-300">{item.description}</p>}
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-blue-400 text-sm hover:underline"
        >
          Read source →
        </a>
      </div>
    </article>
  );
}
