import { Navbar, Hero } from "@/components/ui/patterns";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content">
        <Hero />
      </main>
    </div>
  )
}