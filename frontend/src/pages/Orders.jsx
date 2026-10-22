/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { useContext, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import axios from "axios";

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);

  const [orderData, setOrderData] = useState([]);

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
    loadOrderData();
  }, [token]);

  return (
    <div className="border-t pt-16">
      <div className="text-2xl">
        <Title text1={"MY"} text2={"ORDERS"} />
      </div>

      <div>
        {orderData.map((order) => (
          <div key={order._id} className="border-t border-b">
            {order.items
              .filter((item) => item.productId)
              .map((item, index) => (
                <div
                  key={`${order._id}-${item.productId._id}-${item.size}-${index}`}
                  className="py-4 text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="flex items-start gap-6 text-sm">
                    <img
                      className="w-16 sm:w-20"
                      src={item.productId.image?.[0] || ""}
                      alt={item.productId.name}
                    />
                    <div>
                      <p className="sm:text-base font-medium">
                        {item.productId.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-base text-gray-700">
                        <p>
                          {currency}
                          {item.productId.price * item.quantity}
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
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
