export default function Home() {
  return (
    <main className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-lg">
        <div className="text-7xl mb-6">🎵</div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
          VinylFinder
        </h1>
        <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
          Hold your phone up to any record player, identify the song, and add it
          to your Discogs collection in seconds.
        </p>

        <a
          href="/api/auth/discogs"
          className="inline-block bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-8 py-3 rounded-xl transition-colors text-base"
        >
          Connect with Discogs →
        </a>

        <div className="mt-16 grid grid-cols-3 gap-6 text-sm text-zinc-500">
          <div>
            <div className="text-2xl mb-2">🎙</div>
            <p>Listen via microphone</p>
          </div>
          <div>
            <div className="text-2xl mb-2">🔍</div>
            <p>Find on Discogs</p>
          </div>
          <div>
            <div className="text-2xl mb-2">📀</div>
            <p>Add to your collection</p>
          </div>
        </div>
      </div>
    </main>
  );
}
