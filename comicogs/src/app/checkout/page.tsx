"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, ShoppingCart } from "lucide-react";
import { Navbar } from "@/components/ui/patterns";
import { Button } from "@/components/ui/button";

interface CheckoutItem {
  id: string;
  title: string;
  issue: string;
  series: string;
  publisher: string;
  grade: string;
  price: number;
  coverImage: string;
  condition: string;
  sellerId: string;
  sellerName: string;
}

// Mock function to simulate Stripe checkout
const createStripeCheckout = async (items: CheckoutItem[]): Promise<{ url: string; sessionId: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock Stripe session
  const sessionId = `cs_test_${Date.now()}`;
  const mockUrl = `/orders/${sessionId}?status=success`;
  
  return { url: mockUrl, sessionId };
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);

  useEffect(() => {
    // In a real app, you'd fetch the item from your cart or from the URL params
    const itemId = searchParams.get("item");
    if (itemId) {
      // Mock item data - in real app, fetch from API
      const mockItem: CheckoutItem = {
        id: itemId,
        title: "Amazing Spider-Man",
        issue: "#1",
        series: "Amazing Spider-Man",
        publisher: "Marvel Comics",
        grade: "9.8",
        price: 2500,
        coverImage: "https://via.placeholder.com/200x300/dc2626/ffffff?text=ASM+%231",
        condition: "Near Mint",
        sellerId: "seller-1",
        sellerName: "ComicVault Pro",
      };
      setCheckoutItems([mockItem]);
    }
  }, [searchParams]);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      // Create Stripe checkout session
      const { url } = await createStripeCheckout(checkoutItems);
      
      // Redirect to checkout success page (simulating Stripe redirect)
      router.push(url);
    } catch (error) {
      console.error("Checkout failed:", error);
      // In a real app, show error message to user
      alert("Checkout failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price, 0);
  const shipping = 15.99; // Fixed shipping for demo
  const tax = subtotal * 0.08; // 8% tax for demo
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Go back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
              <p className="text-muted-foreground">Review your order and complete your purchase</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Order Summary
                </h2>
                
                <div className="space-y-4">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex space-x-4">
                      <img
                        src={item.coverImage}
                        alt={`${item.title} ${item.issue} cover`}
                        className="w-16 h-24 object-cover rounded border border-border"
                      />
                      <div className="flex-1 space-y-1">
                        <h3 className="font-medium text-foreground">
                          {item.title} {item.issue}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.publisher} • Grade {item.grade}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Sold by {item.sellerName}
                        </p>
                        <p className="font-semibold text-primary">
                          ${item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t border-border pt-2">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Information
                </h2>
                
                {/* Demo Payment Form */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="card-number" className="block text-sm font-medium text-foreground mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiry" className="block text-sm font-medium text-foreground mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        id="expiry"
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled
                      />
                    </div>
                    <div>
                      <label htmlFor="cvc" className="block text-sm font-medium text-foreground mb-2">
                        CVC
                      </label>
                      <input
                        type="text"
                        id="cvc"
                        placeholder="123"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Demo Mode:</strong> This is a demonstration checkout. No real payment will be processed.
                    Click "Complete Order" to see the success page.
                  </p>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isLoading || checkoutItems.length === 0}
                  className="w-full mt-6"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    `Complete Order - $${total.toFixed(2)}`
                  )}
                </Button>
              </div>

              {/* Security Information */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-2">Secure Checkout</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>✓ 256-bit SSL encryption</p>
                  <p>✓ PCI DSS compliant</p>
                  <p>✓ Secure payment processing</p>
                  <p>✓ Buyer protection guaranteed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Navbar />
        <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </main>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
