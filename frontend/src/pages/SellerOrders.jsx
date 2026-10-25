import { useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";

const nextStatus = {
  processing: "shipped",
  shipped: "delivered",
};

const SellerOrders = () => {
  const { backendUrl, token, navigate } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/order/seller-orders`, {
        headers: { token },
      });
      setOrders(data.orders || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load your sales.");
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    Promise.resolve().then(loadOrders);
  }, [loadOrders, navigate, token]);

  const advanceOrder = async (order) => {
    const status = nextStatus[order.status];
    if (!status || updatingId) return;
    setUpdatingId(order._id);
    try {
      await axios.patch(
        `${backendUrl}/api/order/seller-orders/${order._id}/status`,
        { status },
        { headers: { token } },
      );
      toast.success(`Order marked ${status}.`);
      await loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update order status.");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <main className="py-10">
      <Link to="/orders" className="text-sm text-gray-500 hover:text-black">
        ← Back to my orders
      </Link>
      <p className="mt-5 text-xs uppercase tracking-[0.25em] text-emerald-800">
        Seller workspace
      </p>
      <h1 className="prata-regular mt-2 text-3xl">Sales & fulfillment</h1>
      <p className="mt-2 text-sm text-gray-600">
        Update shipping progress for purchases of your clothing listings.
      </p>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-500">Loading sales…</p>
      ) : orders.length === 0 ? (
        <p className="mt-7 rounded-lg bg-stone-50 p-8 text-center text-sm text-gray-500">
          You have no active listing orders to fulfill.
        </p>
      ) : (
        <section className="mt-7 space-y-4">
          {orders.map((order) => {
            const orderItems = order.items.filter(
              (item) => item.listingId,
            );
            return (
              <article
                key={order._id}
                className="rounded-xl border border-stone-200 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      Order placed by {order.userId?.name || "Marketplace buyer"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {order.userId?.email} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs capitalize text-emerald-900">
                    {order.status}
                  </span>
                </div>

                <div className="mt-4 divide-y divide-stone-100">
                  {orderItems.map((item, index) => (
                    <div
                      key={`${order._id}-${item.listingId?._id || index}`}
                      className="flex items-center gap-3 py-3"
                    >
                      {item.listingId?.images?.[0] && (
                        <img
                          src={item.listingId.images[0]}
                          alt={item.listingId.title}
                          className="h-16 w-14 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {item.listingId?.title || item.name || "Clothing item"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Size {item.size} · ₹{item.unitPrice ?? 0}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-lg bg-stone-50 p-3 text-sm">
                  <p className="font-medium">Deliver to</p>
                  <p className="mt-1 text-gray-600">
                    {[
                      order.shippingAddress?.firstName,
                      order.shippingAddress?.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    {order.shippingAddress?.street
                      ? ` · ${order.shippingAddress.street}`
                      : ""}
                  </p>
                  <p className="text-gray-600">
                    {[
                      order.shippingAddress?.city,
                      order.shippingAddress?.state,
                      order.shippingAddress?.zipcode,
                      order.shippingAddress?.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="text-gray-600">
                    {order.shippingAddress?.phone}
                  </p>
                </div>

                {nextStatus[order.status] ? (
                  <button
                    onClick={() => advanceOrder(order)}
                    disabled={updatingId !== "" && updatingId !== order._id}
                    className="mt-4 bg-gray-900 px-5 py-2.5 text-sm text-white hover:bg-emerald-900 disabled:opacity-50"
                  >
                    {updatingId === order._id
                      ? "Updating…"
                      : `Mark as ${nextStatus[order.status]}`}
                  </button>
                ) : (
                  <p className="mt-4 text-xs text-emerald-800">
                    This order has been delivered.
                  </p>
                )}
                {order.statusUpdatedAt && (
                  <p className="mt-2 text-xs text-gray-500">
                    You last updated this order on{" "}
                    {new Date(order.statusUpdatedAt).toLocaleString()}.
                  </p>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
};

export default SellerOrders;
