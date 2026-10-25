/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

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

      <div>
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
                      </div>
                    </div>

                    <div className="md:w-1/2 flex justify-between">
                      <div className="flex items-center gap-2">
                        <p className="min-w-2 h-2 rounded-full bg-green-500"></p>
                        <p className="text-sm md:text-base">{order.status}</p>
                      </div>
                      <button
                        onClick={loadOrderData}
                        className="border px-4 py-2 text-sm font-medium rounded-sm"
                      >
                        Track Order
                      </button>
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
