export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-200 to-white dark:from-zinc-800 dark:to-zinc-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            Welcome to Comicogs
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            The ultimate marketplace for comic book collectors
          </p>
          <div className="space-y-4">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              🚀 Multi-Agent Development System Initialized
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              <div className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-2">Browse Comics</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Discover thousands of comic books from various publishers
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-2">Sell & Trade</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  List your comics for sale or trade with other collectors
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-2">Manage Collection</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Track your collection and create wishlists
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}