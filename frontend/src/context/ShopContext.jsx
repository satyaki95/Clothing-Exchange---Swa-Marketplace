/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = "₹";
  const delivery_fee = 10;

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [listingCartItems, setListingCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const navigate = useNavigate();

  const addToCart = async (itemId, size) => {
    if (!size) {
      toast.error("Select Product Size");
      return;
    }

    let cartData = structuredClone(cartItems);

    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += 1;
      } else {
        cartData[itemId][size] = 1;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][size] = 1;
    }

    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(
          backendUrl + "/api/cart/add",
          { itemId, size },
          { headers: { token } },
        );
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          setToken("");
        }
        toast.error(
          error.response?.data?.message ||
            (error.response?.status === 401
              ? "Your session has expired. Please sign in again."
              : "Unable to add this item to your cart. Please try again."),
        );
      }
    }
  };

  const addListingToCart = async (listingId) => {
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/cart/listing/add`,
        { listingId },
        { headers: { token } },
      );
      setListingCartItems(data.listingCartData || []);
      toast.success(data.message || "Listing added to cart.");
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setToken("");
      }
      toast.error(error.response?.data?.message || "Unable to add listing to cart.");
    }
  };

  const removeListingFromCart = async (listingId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/cart/listing/remove`,
        { listingId },
        { headers: { token } },
      );
      setListingCartItems(data.listingCartData || []);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setToken("");
      }
      toast.error(error.response?.data?.message || "Unable to remove listing from cart.");
    }
  };

  const getCartCount = () => {
    let totalCount = 0;

    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalCount += cartItems[items][item];
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
    return totalCount + listingCartItems.length;
  };

  const updateQuantity = async (itemId, size, quantity) => {
    let cartData = structuredClone(cartItems);
    if (quantity <= 0) {
      delete cartData[itemId][size];
      if (Object.keys(cartData[itemId]).length === 0) {
        delete cartData[itemId];
      }
    } else {
      cartData[itemId][size] = quantity;
    }

    setCartItems(cartData);

    if (token) {
      try {
        await axios.put(
          backendUrl + "/api/cart/update",
          { itemId, size, quantity },
          { headers: { token } },
        );
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          setToken("");
        }
      }
    }
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      if (!itemInfo) continue;

      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0) {
          totalAmount += itemInfo.price * cartItems[items][item];
        }
      }
    }
    return totalAmount;
  };

  const getProductsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");

      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to load products. Please try again.",
      );
    }
  };

  const getUserCart = async (token) => {
    if (token) {
      try {
        const response = await axios.post(
          backendUrl + "/api/cart/get",
          {},
          {
            headers: { token },
          },
        );
        setCartItems(response.data.cartData);
        setListingCartItems(response.data.listingCartData || []);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          setToken("");
        }
      }
    }
  };

  useEffect(() => {
    getProductsData();
  }, []);

  useEffect(() => {
    getUserCart(token);
  }, [token]);

  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    setCartItems,
    listingCartItems,
    setListingCartItems,
    addListingToCart,
    removeListingFromCart,
    addToCart,
    getCartCount,
    updateQuantity,
    getCartAmount,
    navigate,
    backendUrl,
    token,
    setToken,
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
