/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { useState } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { assets } from "../assets/admin_assets";

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = async () => {
    if (!token) return;

    try {
      const response = await axios.post(
        `${backendUrl}/api/order/list`,
        {},
        {
          headers: {
            token,
          },
        },
      );

      if (response.data.success && Array.isArray(response.data.orders)) {
        setOrders(response.data.orders);
      } else {
        toast.error(response.data.message || "Failed to fetch orders.");
      }
    } catch (error) {
      console.error("Error fetching all orders:", error);
      toast.error(error.message || "Failed to fetch orders. Please try again.");
    }
  };

  const statusHandler = async (orderId, newStatus) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId, status: newStatus },
        {
          headers: {
            token,
          },
        },
      );

      if (response.data.success && response.data.order) {
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order._id === response.data.order._id
              ? { ...order, status: response.data.order.status }
              : order,
          ),
        );
      } else {
        toast.error(response.data.message || "Failed to update order status.");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(
        error.message || "Failed to update order status. Please try again.",
      );
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [token]);

  return (
    <div>
      <h3>Order Page</h3>
      <div>
        {orders.map((order) => (
          <div
            className="grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700"
            key={order._id}
          >
            <img className="w-12" src={assets.parcel_icon} alt="icon" />
            <div>
              <div>
                {order.items.map((item, index) => (
                  <p
                    className="py-0.5"
                    key={`${order._id}-${item.productId?._id || index}`}
                  >
                    {item.productId?.name || "Product unavailable"} x{" "}
                    {item.quantity} <span>{item.size}</span>
                  </p>
                ))}
              </div>
              <p className="mt-3 mb-2 font-medium">
                {order.shippingAddress.firstName +
                  " " +
                  order.shippingAddress.lastName}
              </p>
              <div>
                <p>{order.shippingAddress.street + ","}</p>
                <p>
                  {order.shippingAddress.city +
                    ", " +
                    order.shippingAddress.state +
                    ", " +
                    order.shippingAddress.country +
                    ", " +
                    order.shippingAddress.zipcode}
                </p>
              </div>
              <p>{order.shippingAddress.phone}</p>
            </div>

            <div>
              <p className="text-sm sm:text-[15px]">
                Items : {order.items[0].quantity}
              </p>
              <p className="mt-3">
                Method : {order.paymentMethod.toUpperCase()}
              </p>
              <p>Payment : {order.status}</p>
              <p>Date : {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <p className="text-sm sm:text-[15px]">
              {currency}
              {order.totalAmount}
            </p>
            <select
              value={order.status}
              onChange={(e) => statusHandler(order._id, e.target.value)}
              className="p-2 font-semibold"
            >
              <option value="Order Placed">Order Placed</option>
              <option value="Packing">Packing</option>
              <option value="Shipped">Shipped</option>
              <option value="Out for delivery">Out for delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
