import { useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";

const Swaps = () => {
  const { backendUrl, token, navigate } = useContext(ShopContext);
  const [swaps, setSwaps] = useState([]);
  const [userId, setUserId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [disputeText, setDisputeText] = useState("");
  const messageEnd = useRef(null);
  const messageErrorShown = useRef(false);

  const loadSwaps = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/swaps`, {
        headers: { token },
      });
      setSwaps(data.swaps || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load swap history.");
    }
  }, [backendUrl, token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    axios
      .get(`${backendUrl}/api/user/profile`, { headers: { token } })
      .then(({ data }) => setUserId(data.user._id))
      .catch((error) => toast.error(error.response?.data?.message || "Unable to load account."));
    Promise.resolve().then(loadSwaps);
  }, [backendUrl, loadSwaps, navigate, token]);

  const loadMessages = useCallback(async () => {
    if (!selectedId) return;
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/swaps/${selectedId}/messages`,
        { headers: { token } },
      );
      setMessages(data.messages || []);
      messageErrorShown.current = false;
    } catch (error) {
      if (!messageErrorShown.current) {
        toast.error(error.response?.data?.message || "Unable to load messages.");
        messageErrorShown.current = true;
      }
    }
  }, [backendUrl, selectedId, token]);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadMessages, 0);
    if (!selectedId) return () => window.clearTimeout(initialLoad);
    const timer = window.setInterval(loadMessages, 4000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadMessages, selectedId]);

  useEffect(() => {
    messageEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedSwap = swaps.find((swap) => swap._id === selectedId);

  const updateSwap = async (path, payload = {}) => {
    try {
      await axios.patch(`${backendUrl}/api/swaps/${path}`, payload, {
        headers: { token },
      });
      await loadSwaps();
      if (selectedId) await loadMessages();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update swap.");
      return false;
    }
  };

  const respond = async (swapId, decision) => {
    if (await updateSwap(`${swapId}/respond`, { decision })) {
      toast.success(`Swap ${decision}.`);
    }
  };

  const confirm = async (swapId) => {
    if (await updateSwap(`${swapId}/confirm`)) {
      toast.success("Your confirmation has been recorded.");
    }
  };

  const reportDispute = async (swapId) => {
    if (disputeText.trim().length < 10) {
      toast.error("Please describe the issue in at least 10 characters.");
      return;
    }
    try {
      await axios.post(
        `${backendUrl}/api/swaps/${swapId}/dispute`,
        { reason: disputeText },
        { headers: { token } },
      );
      setDisputeText("");
      toast.success("The dispute was sent to the admin team.");
      await loadSwaps();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to report dispute.");
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!messageText.trim()) return;
    try {
      await axios.post(
        `${backendUrl}/api/swaps/${selectedId}/messages`,
        { text: messageText },
        { headers: { token } },
      );
      setMessageText("");
      await loadMessages();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send message.");
    }
  };

  const listingPair = (swap) => (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {[swap.offeredListing, swap.requestedListing].map((item, index) => (
        <div key={`${swap._id}-${index}`} className="rounded-lg bg-stone-50 p-2">
          {item?.images?.[0] && <img src={item.images[0]} alt={item.title} className="mb-2 aspect-square w-full rounded object-cover" />}
          <p className="line-clamp-1 text-xs font-medium">{item?.title || "Listing unavailable"}</p>
          <p className="text-xs text-gray-500">₹{item?.estimatedValue ?? "—"} {index === 0 ? "offered" : "requested"}</p>
        </div>
      ))}
    </div>
  );

  return (
    <main className="py-10">
      <p className="text-xs uppercase tracking-[0.25em] text-emerald-800">Your exchanges</p>
      <h1 className="prata-regular mt-2 text-3xl">Swap requests & conversations</h1>
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <section className="space-y-4">
          {swaps.length === 0 ? <p className="rounded-lg bg-stone-50 p-8 text-center text-sm text-gray-500">No swap requests yet. Browse the marketplace to find your first match.</p> : swaps.map((swap) => {
            const isIncoming = swap.toUser?._id === userId;
            const otherUser = isIncoming ? swap.fromUser : swap.toUser;
            const isConfirmed = swap.confirmations?.some((id) => String(id) === userId);
            return (
              <article key={swap._id} className={`rounded-xl border p-4 ${selectedId === swap._id ? "border-emerald-700" : "border-stone-200"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-medium">{isIncoming ? "Request from" : "Request to"} {otherUser?.name || "member"}</p><p className="mt-1 text-xs text-gray-500">{new Date(swap.createdAt).toLocaleDateString()} · {swap.status}</p></div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs capitalize">{swap.status}</span>
                </div>
                {listingPair(swap)}
                {swap.disputeReason && <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-900">Dispute: {swap.disputeReason}</p>}
                {swap.resolution && <p className="mt-2 text-xs text-gray-600">Admin resolution: {swap.resolution}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(swap.status === "requested" && isIncoming) && <>
                    <button onClick={() => respond(swap._id, "accepted")} className="bg-emerald-900 px-4 py-2 text-xs text-white">Accept</button>
                    <button onClick={() => respond(swap._id, "rejected")} className="border border-stone-300 px-4 py-2 text-xs">Decline</button>
                  </>}
                  {["requested", "accepted", "disputed"].includes(swap.status) && <button onClick={() => setSelectedId(swap._id)} className="border border-stone-300 px-4 py-2 text-xs">Open chat</button>}
                  {swap.status === "accepted" && <button onClick={() => confirm(swap._id)} disabled={isConfirmed} className="bg-gray-900 px-4 py-2 text-xs text-white disabled:opacity-50">{isConfirmed ? "You confirmed" : "Confirm exchange"}</button>}
                  {swap.status === "accepted" && <button onClick={() => setSelectedId(swap._id)} className="border border-amber-300 px-4 py-2 text-xs text-amber-900">Discuss a problem</button>}
                </div>
                {selectedId === swap._id && swap.status === "accepted" && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <textarea value={disputeText} onChange={(event) => setDisputeText(event.target.value)} rows="2" placeholder="Describe an issue for admin review (10+ characters)" className="min-w-0 flex-1 border border-stone-300 px-3 py-2 text-xs" />
                    <button onClick={() => reportDispute(swap._id)} className="self-start bg-amber-800 px-3 py-2 text-xs text-white">Submit dispute</button>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <section className="flex min-h-[480px] flex-col rounded-xl border border-stone-200">
          <div className="border-b border-stone-200 p-4">
            <h2 className="font-medium">Negotiation chat</h2>
            <p className="mt-1 text-xs text-gray-500">{selectedSwap ? `About ${selectedSwap.requestedListing?.title || "your swap"}` : "Choose an active request to message the other member."}</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {selectedSwap && messages.map((message) => {
              const own = message.sender?._id === userId;
              return <div key={message._id} className={`flex ${own ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${own ? "bg-emerald-900 text-white" : "bg-stone-100 text-gray-800"}`}><p className="mb-1 text-[10px] opacity-70">{own ? "You" : message.sender?.name} · {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p><p className="whitespace-pre-wrap break-words">{message.text}</p></div></div>;
            })}
            {selectedSwap && messages.length === 0 && <p className="py-10 text-center text-xs text-gray-500">Start the conversation to agree on exchange details.</p>}
            <div ref={messageEnd} />
          </div>
          {selectedSwap && ["requested", "accepted", "disputed"].includes(selectedSwap.status) && (
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-stone-200 p-3">
              <input value={messageText} onChange={(event) => setMessageText(event.target.value)} maxLength="2000" placeholder="Message about the exchange…" className="min-w-0 flex-1 border border-stone-300 px-3 py-2 text-sm" />
              <button className="bg-gray-900 px-4 py-2 text-sm text-white">Send</button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
};

export default Swaps;
