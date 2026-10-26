import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const sections = {
  dashboard: { title: "Marketplace overview", endpoint: "/summary" },
  users: { title: "Member management", endpoint: "/users" },
  listings: { title: "Clothing listings", endpoint: "/listings" },
  swaps: { title: "Swap activity & disputes", endpoint: "/swaps" },
};

const Management = ({ section, token }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [resolutions, setResolutions] = useState({});
  const config = sections[section] || sections.dashboard;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data: response } = await axios.get(
        `${backendUrl}/api/admin${config.endpoint}`,
        { headers: { token } },
      );
      const payload =
        section === "dashboard"
          ? response.analytics
          : response[section];
      if (
        section === "dashboard"
          ? !payload || typeof payload !== "object" || Array.isArray(payload)
          : !Array.isArray(payload)
      ) {
        throw new Error("The server returned data in an unexpected format.");
      }
      setData(payload);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to load admin data.";
      setData(null);
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [config.endpoint, section, token]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const setSuspension = async (user) => {
    try {
      await axios.patch(
        `${backendUrl}/api/admin/users/${user._id}/suspension`,
        { isSuspended: !user.isSuspended },
        { headers: { token } },
      );
      toast.success(user.isSuspended ? "Member restored." : "Member suspended.");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update member.");
    }
  };

  const removeListing = async (listingId) => {
    try {
      await axios.patch(
        `${backendUrl}/api/admin/listings/${listingId}/remove`,
        {},
        { headers: { token } },
      );
      toast.success("Listing removed from the marketplace.");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to remove listing.");
    }
  };

  const resolve = async (swapId, outcome) => {
    const resolution = resolutions[swapId]?.trim();
    if (!resolution) {
      toast.error("Add a resolution note before closing this dispute.");
      return;
    }
    try {
      await axios.patch(
        `${backendUrl}/api/admin/swaps/${swapId}/resolve`,
        { outcome, resolution },
        { headers: { token } },
      );
      toast.success("Dispute resolution saved.");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to resolve dispute.");
    }
  };
  const records = Array.isArray(data) ? data : [];

  if (loading) return <p className="p-8 text-center text-gray-500">Loading marketplace data…</p>;
  if (loadError) return <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-900"><p>{loadError}</p><button onClick={load} className="mt-3 border border-red-300 px-4 py-2 text-xs">Retry</button></div>;

  return (
    <main>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div><p className="text-xs uppercase tracking-[0.2em] text-emerald-800">Clothing Exchange &amp; Swap Marketplace</p><h1 className="mt-1 text-2xl font-semibold text-gray-900">{config.title}</h1></div>
        <button onClick={load} className="border border-gray-300 px-4 py-2 text-xs">Refresh</button>
      </div>

      {section === "dashboard" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["Members", data?.users],
            ["All clothing listings", data?.listings],
            ["Available listings", data?.activeListings],
            ["Swap requests", data?.swaps],
            ["Completed swaps", data?.completedSwaps],
            ["Open disputes", data?.openDisputes],
          ].map(([label, value]) => <article key={label} className="rounded-lg border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-semibold text-gray-900">{value ?? 0}</p></article>)}
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950 sm:col-span-2 xl:col-span-3">Review reported listings and resolve swap disputes from the Swap Activity section. Member suspensions block future authenticated actions while preserving account and swap history.</div>
        </div>
      )}

      {section === "users" && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-gray-100 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead>
            <tbody>{records.map((user) => <tr key={user._id} className="border-t border-gray-100"><td className="px-4 py-3"><p className="font-medium text-gray-900">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></td><td className="px-4 py-3">{[user.city, user.state].filter(Boolean).join(", ") || "—"}</td><td className="px-4 py-3">{new Date(user.createdAt).toLocaleDateString()}</td><td className="px-4 py-3"><span className={user.isSuspended ? "text-red-700" : "text-emerald-800"}>{user.isSuspended ? "Suspended" : "Active"}</span></td><td className="px-4 py-3"><button onClick={() => setSuspension(user)} className="border border-gray-300 px-3 py-1.5 text-xs">{user.isSuspended ? "Restore" : "Suspend"}</button></td></tr>)}</tbody>
          </table>
          {data?.length === 0 && <p className="p-8 text-center text-gray-500">No members yet.</p>}
        </div>
      )}

      {section === "listings" && (
        <div className="space-y-3">
          {records.map((listing) => <article key={listing._id} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center">
            <img src={listing.images?.[0]} alt={listing.title} className="h-20 w-20 rounded object-cover" />
            <div className="min-w-0 flex-1"><p className="font-medium text-gray-900">{listing.title}</p><p className="text-xs text-gray-500">{listing.category} · {listing.size} · {listing.condition} · ₹{listing.estimatedValue}</p><p className="mt-1 text-xs text-gray-500">Owner: {listing.owner?.name || "Unknown"} ({listing.owner?.email || "no email"}) · Status: {listing.status}</p></div>
            {listing.status !== "removed" && <button onClick={() => removeListing(listing._id)} className="self-start border border-red-200 px-3 py-2 text-xs text-red-700 sm:self-center">Remove listing</button>}
          </article>)}
          {data?.length === 0 && <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">No clothing listings yet.</p>}
        </div>
      )}

      {section === "swaps" && (
        <div className="space-y-4">
          {records.map((swap) => (
            <article key={swap._id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-medium text-gray-900">{swap.fromUser?.name} ↔ {swap.toUser?.name}</p><p className="mt-1 text-xs text-gray-500">Request {swap._id} · {new Date(swap.updatedAt).toLocaleString()}</p></div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize">{swap.status}</span>
              </div>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><p><strong>Offered:</strong> {swap.offeredListing?.title || "Unavailable"} · ₹{swap.offeredListing?.estimatedValue ?? "—"}</p><p><strong>Requested:</strong> {swap.requestedListing?.title || "Unavailable"} · ₹{swap.requestedListing?.estimatedValue ?? "—"}</p></div>
              {swap.status === "disputed" && <>
                <p className="mt-3 rounded bg-amber-50 p-3 text-sm text-amber-950"><strong>Dispute:</strong> {swap.disputeReason}</p>
                <textarea value={resolutions[swap._id] || ""} onChange={(event) => setResolutions((current) => ({ ...current, [swap._id]: event.target.value }))} placeholder="Document the resolution for both members…" maxLength="2000" rows="2" className="mt-3 w-full border border-gray-300 px-3 py-2 text-sm" />
                <div className="mt-2 flex gap-2"><button onClick={() => resolve(swap._id, "completed")} className="bg-emerald-900 px-4 py-2 text-xs text-white">Resolve as completed</button><button onClick={() => resolve(swap._id, "cancelled")} className="border border-gray-300 px-4 py-2 text-xs">Cancel swap</button></div>
              </>}
            </article>
          ))}
          {data?.length === 0 && <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">No active requests or disputes.</p>}
        </div>
      )}
    </main>
  );
};

export default Management;
