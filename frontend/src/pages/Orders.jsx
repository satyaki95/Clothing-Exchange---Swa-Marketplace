import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";

const Orders = () => {
  const { products, currency } = useContext(ShopContext);

  return <div>Orders</div>;
};

export default Orders;
