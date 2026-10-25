/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

const trackingSteps = [
  ["processing", "Order placed"],
  ["shipped", "Shipped"],
  ["delivered", "Delivered"],
];

const Orders = () => {
  const { backendUrl, token, currency, setCartItems } = useContext(ShopContext);

  const [orderData, setOrderData] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const loadOrderData = async () => {
    try {
      if (!token) {
        return;
      }

      const response = await axios.post(
        `${backendUrl}/api/order/user-orders`,
        {},
        {
          headers: { token },
        },
      );
      setOrderData(response.data.orders || []);
    } catch (error) {
      console.error("Error fetching user orders:", error);
    }
  };

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!token) return;

    const loadOrdersAfterPayment = async () => {
      if (sessionId) {
        try {
          const response = await axios.post(
            `${backendUrl}/api/order/stripe/verify`,
            { sessionId },
            { headers: { token } },
          );

          if (response.data.success) {
            if (response.data.source !== "listing") setCartItems({});
            toast.success(
              response.data.source === "listing"
                ? "Purchase payment successful."
                : "Payment successful. Your cart has been cleared.",
            );
            setSearchParams({}, { replace: true });
          }
        } catch (error) {
          console.error("Error verifying Stripe payment:", error);
          toast.error(
            error.response?.data?.message ||
              "Unable to verify your payment. Please try again.",
          );
        }
      }

      await loadOrderData();
    };

    loadOrdersAfterPayment();
  }, [token, searchParams]);

  return (
    <div className="border-t pt-16">
      <div className="text-2xl">
        <Title text1={"MY"} text2={"ORDERS"} />
      </div>
      <div className="mb-5 flex justify-end">
        <Link to="/seller-orders" className="border px-4 py-2 text-sm hover:bg-gray-50">
          Manage my sales
        </Link>
      </div>

      <div>
        {orderData.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">You have no orders yet.</p>
        )}
        {orderData.map((order) => (
          <div key={order._id} className="border-t border-b">
            {order.items
              .filter((item) => item.productId || item.listingId || item.name)
              .map((item, index) => {
                const product = item.productId;
                const listing = item.listingId;
                const itemName =
                  product?.name || listing?.title || item.name || "Clothing item";
                const itemImage =
                  product?.image?.[0] || listing?.images?.[0] || "";
                const itemPrice =
                  product?.price ?? item.unitPrice ?? listing?.estimatedValue ?? 0;

                return (
                  <div
                    key={`${order._id}-${product?._id || listing?._id || index}-${item.size}-${index}`}
                    className="py-4 text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="flex items-start gap-6 text-sm">
                      <img
                        className="w-16 sm:w-20"
                        src={itemImage}
                        alt={itemName}
                      />
                      <div>
                        <p className="sm:text-base font-medium">{itemName}</p>
                        <div className="flex items-center gap-3 mt-1 text-base text-gray-700">
                          <p>
                            {currency}
                            {itemPrice * item.quantity}
                          </p>
                          <p>Quantity: {item.quantity}</p>
                          <p>Size: {item.size}</p>
                        </div>
                        <p className="mt-1">
                          Date:{" "}
                          <span className="text-gray-400">
                            {new Date(order.createdAt).toDateString()}
                          </span>
                        </p>
                        <p className="mt-1">
                          Payment:{" "}
                          <span className="text-gray-400">
                            {order.paymentMethod.toUpperCase()}
                          </span>
                        </p>
                        {listing?.owner?.name && (
                          <p className="mt-1">
                            Listed by:{" "}
                            <span className="text-gray-500">{listing.owner.name}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="md:w-1/2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium capitalize">
                          {order.status}
                        </p>
                        <button
                          onClick={loadOrderData}
                          className="border px-4 py-2 text-sm font-medium rounded-sm"
                        >
                          Refresh tracking
                        </button>
                      </div>
                      {order.source === "listing" && (
                        <>
                          <ol className="mt-3 flex items-start">
                            {trackingSteps.map(([status, label], stepIndex) => {
                              const currentIndex = trackingSteps.findIndex(
                                ([currentStatus]) => currentStatus === order.status,
                              );
                              const isComplete =
                                order.status === "delivered" ||
                                (currentIndex >= 0 && stepIndex <= currentIndex);
                              return (
                                <li
                                  key={status}
                                  className="flex min-w-0 flex-1 flex-col items-center text-center"
                                >
                                  <span
                                    className={`h-2.5 w-2.5 rounded-full ${
                                      isComplete ? "bg-emerald-700" : "bg-gray-200"
                                    }`}
                                  />
                                  <span className="mt-1 text-[10px] text-gray-500">
                                    {label}
                                  </span>
                                </li>
                              );
                            })}
                          </ol>
                          {order.status === "cancelled" ? (
                            <p className="mt-2 text-xs text-red-700">
                              This order was cancelled.
                            </p>
                          ) : order.status === "pending" ? (
                            <p className="mt-2 text-xs text-amber-700">
                              Payment is pending; shipping updates are not available yet.
                            </p>
                          ) : order.statusUpdatedBy?.name ? (
                            <p className="mt-2 text-xs text-gray-500">
                              Shipping updated by {order.statusUpdatedBy.name} (listing owner)
                              {order.statusUpdatedAt
                                ? ` · ${new Date(order.statusUpdatedAt).toLocaleString()}`
                                : ""}
                            </p>
                          ) : (
                            <p className="mt-2 text-xs text-gray-500">
                              Waiting for {listing?.owner?.name || "the listing owner"} to update shipping.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
