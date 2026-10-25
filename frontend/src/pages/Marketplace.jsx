import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";

const Marketplace = () => {
  const { backendUrl, token, navigate } = useContext(ShopContext);
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState("");
  const [city, setCity] = useState("");
  const [nearby, setNearby] = useState(false);
  const [maxDistance, setMaxDistance] = useState(50);
  const [offeredId, setOfferedId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadListings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (size) params.set("size", size);
        if (condition) params.set("condition", condition);
        if (city.trim()) params.set("city", city.trim());
        let endpoint = `${backendUrl}/api/listings/?${params.toString()}`;
        if (nearby && token) {
          params.set("nearby", "true");
          params.set("maxDistance", maxDistance);
          endpoint = `${backendUrl}/api/listings/nearby?${params.toString()}`;
        }
        const response = await axios.get(endpoint, {
          headers: token ? { token } : {},
        });
        if (active) setListings(response.data.listings || []);
      } catch (error) {
        if (active) {
          toast.error(
            error.response?.data?.message || "Unable to load available swaps.",
          );
          setListings([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadListings();
    return () => {
      active = false;
    };
  }, [backendUrl, category, size, condition, city, nearby, maxDistance, token]);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${backendUrl}/api/listings/mine`, { headers: { token } })
      .then((response) => setMyListings(response.data.listings || []))
      .catch((error) =>
        toast.error(error.response?.data?.message || "Unable to load your items."),
      );
  }, [backendUrl, token]);

  const offeredListing = useMemo(
    () => myListings.find((item) => item._id === offeredId),
    [myListings, offeredId],
  );
  const visibleListings = useMemo(
    () => {
      const filtered = listings.filter(
        (listing) => !myListings.some((mine) => mine._id === listing._id),
      );
      if (offeredListing) {
        filtered.sort(
          (left, right) =>
            Math.abs(left.estimatedValue - offeredListing.estimatedValue) -
            Math.abs(right.estimatedValue - offeredListing.estimatedValue),
        );
      }
      return filtered;
    },
    [listings, myListings, offeredListing],
  );

  const sendRequest = async (requestedListingId) => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!offeredId) {
      toast.info("Add an available item to your wardrobe, then choose it to offer.");
      navigate("/wardrobe");
      return;
    }
    try {
      await axios.post(
        `${backendUrl}/api/swaps`,
        { offeredListingId: offeredId, requestedListingId },
        { headers: { token } },
      );
      toast.success("Swap request sent. Continue the conversation in Swaps.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send swap request.");
    }
  };

  return (
    <main className="py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-800">Circular fashion</p>
          <h1 className="prata-regular mt-2 text-3xl sm:text-4xl">Explore the swap closet</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600">
            Find pre-loved pieces, compare estimated values, and propose a direct exchange.
          </p>
        </div>
        <button
          onClick={() => navigate("/wardrobe")}
          className="mt-3 self-start border border-gray-900 px-5 py-2 text-sm hover:bg-gray-900 hover:text-white sm:mt-0"
        >
          List an item
        </button>
      </div>

      <div className="mt-8 grid gap-3 rounded-xl bg-stone-50 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs text-gray-600">
          City
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Any city"
            className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs text-gray-600">
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 text-sm">
            <option value="">All categories</option>
            {["Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories", "Other"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-600">
          Size
          <select value={size} onChange={(event) => setSize(event.target.value)} className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 text-sm">
            <option value="">Any size</option>
            {["XS", "S", "M", "L", "XL", "XXL", "One size"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-600">
          Condition
          <select value={condition} onChange={(event) => setCondition(event.target.value)} className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 text-sm">
            <option value="">Any condition</option>
            {["New with tags", "Like new", "Good", "Fair"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={nearby} onChange={(event) => setNearby(event.target.checked)} disabled={!token} />
            Nearby matches
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            Within
            <input type="number" min="1" max="500" value={maxDistance} onChange={(event) => setMaxDistance(Number(event.target.value))} disabled={!nearby} className="w-16 border border-stone-300 px-2 py-1" />
            km
          </label>
        </div>
      </div>

      {nearby && !token && <p className="mt-3 text-sm text-amber-800">Sign in and add your coordinates in your profile to use nearby matching.</p>}

      {token && myListings.some((item) => item.status === "available") && (
        <div className="mt-5 flex flex-col gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 sm:flex-row sm:items-center">
          <label htmlFor="offer-item" className="text-sm font-medium">Offer from your wardrobe:</label>
          <select id="offer-item" value={offeredId} onChange={(event) => setOfferedId(event.target.value)} className="max-w-sm border border-gray-300 bg-white px-3 py-2 text-sm">
            <option value="">Choose an available item</option>
            {myListings.filter((item) => item.status === "available").map((item) => <option key={item._id} value={item._id}>{item.title} · ₹{item.estimatedValue}</option>)}
          </select>
          {offeredListing && <span className="text-sm text-gray-600">Estimated value ₹{offeredListing.estimatedValue}</span>}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-gray-500">Finding available swaps…</p>
      ) : visibleListings.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No available items match those filters yet.</p>
      ) : (
        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleListings.map((item) => (
            <article key={item._id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <Link to={`/listing/${item._id}`} aria-label={`View ${item.title} details`}>
                <img src={item.images?.[0]} alt={item.title} className="aspect-[4/5] w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
              </Link>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><Link to={`/listing/${item._id}`} className="font-medium hover:underline">{item.title}</Link><p className="mt-1 text-xs text-gray-500">{item.brand} · {item.size} · {item.condition}</p></div>
                  <span className="whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-900">₹{item.estimatedValue}</span>
                </div>
                <p className="line-clamp-2 text-sm text-gray-600">{item.description}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{item.owner?.name || "Community member"}</span>
                  <span>{Number.isFinite(item.distanceKm) ? `${item.distanceKm} km away` : [item.owner?.city, item.owner?.state].filter(Boolean).join(", ") || "Location not set"}</span>
                </div>
                {offeredListing && (
                  <p className="border-t border-stone-100 pt-2 text-xs text-gray-600">
                    Value difference: <strong>₹{Math.abs(offeredListing.estimatedValue - item.estimatedValue)}</strong>
                    {offeredListing.estimatedValue > item.estimatedValue ? " (your offer is higher)" : offeredListing.estimatedValue < item.estimatedValue ? " (requested item is higher)" : " (estimated values are even)"}
                  </p>
                )}
                <button onClick={() => sendRequest(item._id)} className="w-full bg-gray-900 px-4 py-2.5 text-sm text-white hover:bg-emerald-900">Request a swap</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};

export default Marketplace;
