import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";

const Cart = () => {
  const {
    products,
    currency,
    cartItems,
    listingCartItems,
    removeListingFromCart,
    updateQuantity,
    navigate,
    backendUrl,
    token,
  } =
    useContext(ShopContext);
  const [listingCartData, setListingCartData] = useState([]);

  useEffect(() => {
    let active = true;
    if (!listingCartItems.length) {
      return () => {
        active = false;
      };
    }
    axios
      .get(`${backendUrl}/api/cart/listing/items`, { headers: { token } })
      .then(({ data }) => {
        if (active) setListingCartData(data.listings || []);
      })
      .catch((error) => {
        if (active) {
          toast.error(error.response?.data?.message || "Unable to load marketplace cart items.");
        }
      });
    return () => {
      active = false;
    };
  }, [backendUrl, listingCartItems, token]);

  const cartData = Object.entries(cartItems).flatMap(([itemId, sizes]) =>
    Object.entries(sizes)
      .filter(([, quantity]) => quantity > 0)
      .map(([size, quantity]) => ({ _id: itemId, size, quantity })),
  );

  return (
    <div className="border-t pt-14">
      <div className="text-2xl mb-3">
        <Title text1={"YOUR"} text2={"CART"} />
      </div>

      {cartData.length === 0 && listingCartItems.length === 0 ? (
        <p className="py-10 text-center text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          {cartData.length > 0 && <div>
            {cartData.map((item, index) => {
              const productData = products.find(
                (product) => product._id === item._id,
              );
              if (!productData) return null;

              return (
                <div
                  key={index}
                  className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
                >
                  <div className="flex items-start gap-6">
                    <img
                      className="w-16 sm:w-20"
                      src={productData.image[0]}
                      alt="image"
                    />
                    <div>
                      <p className="text-xs sm:text-lg font-medium">
                        {productData.name}
                      </p>
                      <div className="flex items-center gap-5 mt-2">
                        <p>
                          {currency}
                          {productData.price}
                        </p>
                        <p className="px-2 sm:px-3 sm:py-1 border bg-slate-50">
                          {item.size}
                        </p>
                      </div>
                    </div>
                  </div>

                  <input
                    onChange={(e) =>
                      e.target.value === "" || e.target.value === "0"
                        ? null
                        : updateQuantity(
                            item._id,
                            item.size,
                            Number(e.target.value),
                          )
                    }
                    className="border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1"
                    min={1}
                    type="number"
                    defaultValue={item.quantity}
                  />
                  <img
                    onClick={() => updateQuantity(item._id, item.size, 0)}
                    className="w-4 mr-4 sm:w-5 cursor-pointer"
                    src={assets.bin_icon}
                    alt="image"
                  />
                </div>
              );
            })}
          </div>}

          {listingCartItems.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 text-lg font-medium">Marketplace listings</h2>
              <div>
                {listingCartItems.map((listingId) => {
                  const listing = listingCartData.find((item) => item._id === listingId);
                  return (
                    <div key={listingId} className="grid grid-cols-[4fr_1fr] items-center gap-4 border-t border-b py-4 text-gray-700 sm:grid-cols-[4fr_1fr_1fr]">
                      {listing ? (
                        <div className="flex items-start gap-4">
                          <img className="h-20 w-16 rounded object-cover" src={listing.images?.[0]} alt={listing.title} />
                          <div>
                            <p className="font-medium">{listing.title}</p>
                            <p className="mt-1 text-sm text-gray-500">{listing.brand} · Size {listing.size}</p>
                            <p className="mt-1">{currency}{listing.estimatedValue}</p>
                            {!listing.canBuy && (
                              <p className="mt-1 text-xs text-amber-700">
                                {listing.status === "reserved"
                                  ? "This listing is temporarily reserved."
                                  : "This listing is no longer available to buy."}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">This listing is no longer available.</p>
                      )}
                      <button
                        onClick={() => navigate(`/listing/${listingId}/checkout`)}
                        disabled={!listing?.canBuy}
                        className="bg-black px-3 py-2 text-xs text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        BUY
                      </button>
                      <button
                        onClick={() => removeListingFromCart(listingId)}
                        className="text-left text-sm text-gray-500 underline hover:text-black"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {cartData.length > 0 && (
            <div className="my-20 flex justify-end">
              <div className="w-full sm:w-112.5">
                <CartTotal />
                <div className="w-full text-end">
                  <button
                    onClick={() => navigate("place-order")}
                    className="my-8 bg-black px-8 py-3 text-sm text-white"
                  >
                    PROCEED TO CHECKOUT
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Cart;
