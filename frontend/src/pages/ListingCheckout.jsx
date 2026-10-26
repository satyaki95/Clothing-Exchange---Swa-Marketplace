import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
    document.body.appendChild(script);
  });

const addressFields = [
  ["firstName", "First name"],
  ["lastName", "Last name"],
  ["email", "Email address"],
  ["street", "Street address"],
  ["city", "City"],
  ["state", "State"],
  ["zipcode", "Postal code"],
  ["country", "Country"],
  ["phone", "Phone"],
];

const ListingCheckout = () => {
  const { listingId } = useParams();
  const { backendUrl, token, navigate, removeListingFromCart } = useContext(ShopContext);
  const routerNavigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canceledOrderId = searchParams.get("canceled") === "1"
    ? searchParams.get("orderId")
    : null;
  const [listing, setListing] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  useEffect(() => {
    if (canceledOrderId || !token) {
      if (canceledOrderId) return undefined;
      navigate("/login");
      return;
    }
    let active = true;
    axios
      .get(`${backendUrl}/api/listings/${listingId}`, { headers: { token } })
      .then(({ data }) => {
        if (active) setListing(data.listing);
      })
      .catch((error) => {
        if (active) {
          toast.error(error.response?.data?.message || "This listing is unavailable.");
          routerNavigate("/collection");
        }
      });
    return () => {
      active = false;
    };
  }, [backendUrl, canceledOrderId, listingId, navigate, routerNavigate, token]);

  useEffect(() => {
    if (!canceledOrderId || !token) return;
    axios
      .post(
        `${backendUrl}/api/order/listing/${canceledOrderId}/cancel`,
        {},
        { headers: { token } },
      )
      .then(() => toast.info("Checkout cancelled. The listing is available again."))
      .catch((error) =>
        toast.error(error.response?.data?.message || "Unable to release listing reservation."),
      )
      .finally(() => routerNavigate(`/listing/${listingId}/checkout`, { replace: true }));
  }, [backendUrl, canceledOrderId, listingId, routerNavigate, token]);

  const handleAddressChange = (event) =>
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));

  const completeOrder = () => {
    removeListingFromCart(listingId);
    toast.success("Purchase confirmed. You can track it in Orders.");
    routerNavigate("/orders");
  };

  const verifyRazorpay = async (paymentResponse) => {
    const response = await axios.post(
      `${backendUrl}/api/order/razorpay/verify`,
      paymentResponse,
      { headers: { token } },
    );
    if (!response.data.success) {
      throw new Error(response.data.message || "Unable to verify Razorpay payment.");
    }
    completeOrder();
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!listing || submitting) return;
    setSubmitting(true);
    try {
      const payload = { listingId, address };
      if (paymentMethod === "cod") {
        await axios.post(`${backendUrl}/api/order/listing/place`, payload, {
          headers: { token },
        });
        completeOrder();
        return;
      }
      if (paymentMethod === "stripe") {
        const { data } = await axios.post(
          `${backendUrl}/api/order/listing/stripe`,
          payload,
          { headers: { token } },
        );
        if (!data.checkoutUrl) {
          throw new Error(data.message || "Unable to start Stripe checkout.");
        }
        window.location.assign(data.checkoutUrl);
        return;
      }

      await loadRazorpayScript();
      const { data } = await axios.post(
        `${backendUrl}/api/order/listing/razorpay`,
        payload,
        { headers: { token } },
      );
      if (!data.keyId || !data.razorpayOrder || !data.order?._id) {
        throw new Error(data.message || "Unable to start Razorpay checkout.");
      }
      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "Clothing Exchange & Swap Marketplace",
        description: `Purchase: ${listing.title}`,
        order_id: data.razorpayOrder.id,
        prefill: {
          name: `${address.firstName} ${address.lastName}`.trim(),
          email: address.email,
          contact: address.phone,
        },
        handler: (paymentResponse) =>
          verifyRazorpay(paymentResponse).catch((error) => {
            toast.error(error.response?.data?.message || error.message || "Payment verification failed.");
          }),
        modal: {
          ondismiss: () => {
            toast.info("Checkout was closed. The listing reservation expires automatically in 35 minutes.");
          },
        },
        theme: { color: "#064e3b" },
      });
      checkout.open();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to complete purchase.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) return null;
  if (!listing) return <main className="py-20 text-center text-gray-500">Loading checkout…</main>;

  return (
    <main className="mx-auto max-w-5xl py-10">
      <Link to={`/listing/${listingId}`} className="text-sm text-gray-500 hover:text-black">← Back to item</Link>
      <h1 className="prata-regular mt-4 text-3xl">Complete your purchase</h1>
      <p className="mt-2 text-sm text-gray-600">Pay the listed estimated value. This listing will be reserved while online payment is pending.</p>
      <form onSubmit={submit} className="mt-7 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="rounded-xl border border-stone-200 p-5">
          <h2 className="text-lg font-medium">Delivery address</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {addressFields.map(([name, label]) => (
              <label key={name} className={`text-xs text-gray-600 ${["street", "email"].includes(name) ? "sm:col-span-2" : ""}`}>
                {label}
                <input
                  name={name}
                  type={name === "email" ? "email" : name === "phone" || name === "zipcode" ? "text" : "text"}
                  required
                  value={address[name]}
                  onChange={handleAddressChange}
                  className="mt-1 w-full border border-stone-300 px-3 py-2.5 text-sm"
                />
              </label>
            ))}
          </div>
        </section>

        <aside className="h-fit rounded-xl border border-stone-200 p-5">
          <div className="flex gap-3">
            <img src={listing.images?.[0]} alt={listing.title} className="h-20 w-16 rounded object-cover" />
            <div><h2 className="font-medium">{listing.title}</h2><p className="mt-1 text-xs text-gray-500">{listing.brand} · {listing.size}</p></div>
          </div>
          <div className="mt-5 space-y-2 border-t border-stone-200 pt-4 text-sm">
            <p className="flex justify-between"><span>Item price</span><span>₹{listing.estimatedValue}</span></p>
            <p className="flex justify-between"><span>Delivery</span><span>₹10</span></p>
            <p className="flex justify-between border-t border-stone-200 pt-3 text-base font-semibold"><span>Total</span><span>₹{listing.estimatedValue + 10}</span></p>
          </div>
          <h3 className="mt-6 text-sm font-medium">Payment method</h3>
          <div className="mt-2 space-y-2">
            {[
              ["cod", "Cash on delivery"],
              ["razorpay", "Razorpay"],
              ["stripe", "Stripe"],
            ].map(([method, label]) => (
              <label key={method} className="flex cursor-pointer items-center gap-2 rounded border border-stone-200 px-3 py-2.5 text-sm">
                <input type="radio" name="paymentMethod" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />
                {label}
              </label>
            ))}
          </div>
          <button disabled={submitting} className="mt-5 w-full bg-gray-900 px-4 py-3 text-sm text-white disabled:opacity-50">
            {submitting ? "Processing…" : `Pay ₹${listing.estimatedValue + 10}`}
          </button>
        </aside>
      </form>
    </main>
  );
};

export default ListingCheckout;
