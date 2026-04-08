import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  // ✅ Gatekeeper: If no session, redirect to login
  if (!session) {
    redirect("/login?callbackUrl=/orders");
  }

  // ✅ Data Filtering: Only fetch orders for this specific user
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { product: true } // Fetches product details (name, image) for each item
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-8">My Orders</h1>
        
        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center">
            <p className="text-slate-500">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Order ID</p>
                    <p className="text-sm font-bold text-slate-900">#{order.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      order.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <img src={item.product.image} className="w-16 h-16 rounded-xl object-cover bg-slate-100" />
                      <div className="flex-grow">
                        <p className="text-sm font-extrabold text-slate-900">{item.product.name}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-black text-slate-900">Ksh {item.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <p className="text-sm font-bold text-slate-400 uppercase">Total Paid</p>
                  <p className="text-xl font-black text-slate-900">Ksh {order.total.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
