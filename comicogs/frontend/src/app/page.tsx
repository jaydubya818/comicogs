export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Welcome to Comicogs</h1>
          <p className="text-lg text-muted-foreground">
            Your ultimate comic book collection and marketplace platform
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <a href="/vault" className="p-6 border rounded-lg hover:bg-muted transition-colors">
            <h2 className="text-xl font-semibold mb-2">My Vault</h2>
            <p className="text-muted-foreground">Manage your comic collection</p>
          </a>
          
          <a href="/marketplace" className="p-6 border rounded-lg hover:bg-muted transition-colors">
            <h2 className="text-xl font-semibold mb-2">Marketplace</h2>
            <p className="text-muted-foreground">Buy and sell comics</p>
          </a>
          
          <a href="/checkout" className="p-6 border rounded-lg hover:bg-muted transition-colors">
            <h2 className="text-xl font-semibold mb-2">Checkout</h2>
            <p className="text-muted-foreground">Complete your purchase</p>
          </a>
        </div>
      </div>
    </div>
  );
}
