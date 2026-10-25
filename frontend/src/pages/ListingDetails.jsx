import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";

const ListingDetails = () => {
  const { listingId } = useParams();
  const { backendUrl, token } = useContext(ShopContext);
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [myListings, setMyListings] = useState([]);
  const [offeredId, setOfferedId] = useState("");
  const [loadedListingId, setLoadedListingId] = useState("");
  const loading = loadedListingId !== listingId;

  useEffect(() => {
    let active = true;
    axios
      .get(`${backendUrl}/api/listings/${listingId}`, {
        headers: token ? { token } : {},
      })
      .then(({ data }) => {
        if (!active) return;
        setListing(data.listing);
        setSelectedImage(data.listing.images?.[0] || "");
      })
      .catch((error) => {
        if (active) {
          toast.error(error.response?.data?.message || "Unable to load this listing.");
          setListing(null);
        }
      })
      .finally(() => {
        if (active) setLoadedListingId(listingId);
      });
    return () => {
      active = false;
    };
  }, [backendUrl, listingId, token]);

  useEffect(() => {
    let active = true;
    if (!token) return () => {
      active = false;
    };
    axios
      .get(`${backendUrl}/api/listings/mine`, { headers: { token } })
      .then(({ data }) => {
        if (active) setMyListings(data.listings || []);
      })
      .catch((error) => {
        if (active) {
          toast.error(error.response?.data?.message || "Unable to load your wardrobe.");
        }
      });
    return () => {
      active = false;
    };
  }, [backendUrl, token]);

  const sendRequest = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!offeredId) {
      toast.info("Choose an available item from your wardrobe to offer.");
      return;
    }
    try {
      await axios.post(
        `${backendUrl}/api/swaps`,
        { offeredListingId: offeredId, requestedListingId: listingId },
        { headers: { token } },
      );
      toast.success("Swap request sent. Continue the conversation in Swap Requests.");
      navigate("/swaps");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send swap request.");
    }
  };

  if (loading) {
    return <main className="py-20 text-center text-gray-500">Loading listing…</main>;
  }

  if (!listing) {
    return (
      <main className="py-20 text-center">
        <h1 className="prata-regular text-3xl">Listing unavailable</h1>
        <p className="mt-2 text-sm text-gray-600">This item may have been removed or swapped already.</p>
        <Link to="/collection" className="mt-5 inline-block underline">Back to collection</Link>
      </main>
    );
  }

  const availableOffers = token
    ? myListings.filter((item) => item.status === "available")
    : [];

  return (
    <main className="py-8">
      <Link to="/collection" className="text-sm text-gray-500 hover:text-black">← Back to collection</Link>
      <div className="mt-5 grid gap-8 md:grid-cols-2">
        <section>
          <img src={selectedImage} alt={listing.title} className="aspect-[4/5] w-full rounded-xl bg-stone-100 object-cover" />
          {listing.images?.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto">
              {listing.images.map((image, index) => (
                <button key={image} onClick={() => setSelectedImage(image)} className={`shrink-0 overflow-hidden rounded border ${image === selectedImage ? "border-emerald-800" : "border-stone-200"}`} aria-label={`Show image ${index + 1}`}>
                  <img src={image} alt={`${listing.title} ${index + 1}`} className="h-20 w-16 object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="py-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-800">{listing.category}</p>
          <h1 className="prata-regular mt-2 text-3xl sm:text-4xl">{listing.title}</h1>
          <p className="mt-3 text-sm text-gray-600">{listing.brand} · Size {listing.size} · {listing.condition}</p>
          <p className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-950">
            Estimated swap value <strong className="ml-2 text-lg">₹{listing.estimatedValue}</strong>
          </p>
          <div className="mt-6 border-t border-stone-200 pt-5">
            <h2 className="font-medium">About this item</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{listing.description}</p>
          </div>
          <div className="mt-6 border-t border-stone-200 pt-5">
            <h2 className="font-medium">Listed by</h2>
            <p className="mt-2 text-sm text-gray-600">{listing.owner?.name || "Community member"}</p>
            <p className="mt-1 text-sm text-gray-500">{[listing.owner?.city, listing.owner?.state].filter(Boolean).join(", ") || "Location not set"}</p>
          </div>

          {token && availableOffers.length > 0 && (
            <label className="mt-7 block text-sm">
              Choose an item to offer
              <select value={offeredId} onChange={(event) => setOfferedId(event.target.value)} className="mt-2 w-full border border-stone-300 bg-white px-3 py-3">
                <option value="">Select from your wardrobe</option>
                {availableOffers.map((item) => <option key={item._id} value={item._id}>{item.title} · ₹{item.estimatedValue}</option>)}
              </select>
            </label>
          )}
          {token && availableOffers.length === 0 && (
            <Link to="/wardrobe" className="mt-7 block rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
              Add an available item to your wardrobe before requesting a swap.
            </Link>
          )}
          <button onClick={sendRequest} className="mt-5 w-full bg-gray-900 px-6 py-3 text-sm text-white hover:bg-emerald-900">
            {token ? "Request a swap" : "Sign in to request a swap"}
          </button>
          <button
            onClick={() => token ? navigate(`/listing/${listingId}/checkout`) : navigate("/login")}
            className="mt-3 w-full border border-gray-900 px-6 py-3 text-sm hover:bg-stone-50"
          >
            {token ? `Buy for ₹${listing.estimatedValue}` : "Sign in to buy"}
          </button>
        </section>
      </div>
    </main>
  );
};

export default ListingDetails;
