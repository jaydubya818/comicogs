import { notFound } from 'next/navigation';

interface OrderPageProps {
  params: { id: string };
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  listing: {
    id: string;
    comic: {
      title: string;
      series: string;
      issue: string;
      grade?: string;
      coverUrl?: string;
    };
  };
  buyer: {
    id: string;
    name?: string;
  };
}

async function getOrder(id: string): Promise<Order | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}`, {
      headers: {
        'x-user-email': 'demo@comicogs.com', // Demo auth
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch order');
    }

    const data = await response.json();
    return data.order;
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return null;
  }
}

export default async function OrderPage({ params }: OrderPageProps) {
  const order = await getOrder(params.id);

  if (!order) {
    notFound();
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'refunded':
        return 'text-red-600 bg-red-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Confirmation</h1>
        <p className="text-gray-600 mt-2">Thank you for your purchase!</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Order #{order.id}
              </h2>
              <p className="text-sm text-gray-600">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Comic Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Details</h3>
              <div className="flex space-x-4">
                {order.listing.comic.coverUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={order.listing.comic.coverUrl}
                      alt={`${order.listing.comic.series} #${order.listing.comic.issue}`}
                      className="w-20 h-28 object-cover rounded border"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {order.listing.comic.series} #{order.listing.comic.issue}
                  </h4>
                  {order.listing.comic.title && (
                    <p className="text-gray-600 text-sm mt-1">
                      {order.listing.comic.title}
                    </p>
                  )}
                  {order.listing.comic.grade && (
                    <p className="text-sm text-gray-500 mt-1">
                      Grade: {order.listing.comic.grade}
                    </p>
                  )}
                  <p className="text-lg font-semibold text-gray-900 mt-2">
                    {formatPrice(order.total)}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => window.print()}
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                📄 Print Receipt
              </button>
              <a
                href="/marketplace"
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue Shopping
              </a>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">What happens next?</h4>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>The seller will be notified of your purchase</li>
                    <li>You'll receive shipping information once the item is sent</li>
                    <li>Questions? Contact our support team</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}