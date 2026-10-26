import { useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";

const initialForm = {
  title: "",
  description: "",
  category: "Tops",
  size: "M",
  brand: "",
  condition: "Good",
  buyingPrice: "",
};

const Wardrobe = () => {
  const { backendUrl, token, navigate } = useContext(ShopContext);
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [estimate, setEstimate] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const buyingPrice = form.buyingPrice ?? "";

  const loadListings = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/listings/mine`, {
        headers: { token },
      });
      setListings(data.listings || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load your wardrobe.");
    }
  }, [backendUrl, token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    Promise.resolve().then(loadListings);
  }, [loadListings, navigate, token]);

  useEffect(() => {
    let active = true;
    if (!buyingPrice.trim() && !editingId) {
      return () => {
        active = false;
      };
    }
    axios
      .post(`${backendUrl}/api/listings/estimate`, {
        category: form.category,
        condition: form.condition,
        brand: form.brand,
        ...(buyingPrice.trim()
          ? { buyingPrice: Number(buyingPrice) }
          : {}),
      })
      .then(({ data }) => {
        if (active) setEstimate(data.estimatedValue);
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || "Unable to estimate item value.");
      });
    return () => {
      active = false;
    };
  }, [backendUrl, buyingPrice, editingId, form.brand, form.category, form.condition]);

  const updateField = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const resetForm = () => {
    setForm(initialForm);
    setImages([]);
    setEditingId("");
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setImages([]);
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      size: item.size,
      brand: item.brand,
      condition: item.condition,
      buyingPrice: item.buyingPrice === undefined ? "" : String(item.buyingPrice),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!editingId && images.length === 0) {
      toast.error("Upload at least one image.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${backendUrl}/api/listings/${editingId}`, form, {
          headers: { token },
        });
        toast.success("Listing updated.");
      } else {
        const payload = new FormData();
        Object.entries(form).forEach(([key, value]) => payload.append(key, value));
        images.forEach((image) => payload.append("images", image));
        await axios.post(`${backendUrl}/api/listings`, payload, {
          headers: { token },
        });
        toast.success("Your clothing is now available to swap.");
      }
      resetForm();
      await loadListings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save listing.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await axios.delete(`${backendUrl}/api/listings/${id}`, { headers: { token } });
      toast.success("Listing removed.");
      await loadListings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to remove listing.");
    }
  };

  return (
    <main className="py-10">
      <p className="text-xs uppercase tracking-[0.25em] text-emerald-800">Your closet</p>
      <h1 className="prata-regular mt-2 text-3xl">Manage your listings</h1>
      <p className="mt-2 text-sm text-gray-600">Add clean, clear photos and honest details so neighbors can find a fair match. Your buying price is private; your estimated swap value is public.</p>

      <form onSubmit={submit} className="mt-7 grid gap-4 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
        <h2 className="font-medium sm:col-span-2">{editingId ? "Edit available listing" : "Add a clothing item"}</h2>
        <label className="text-sm">Title<input name="title" value={form.title} onChange={updateField} required maxLength="100" className="mt-1 w-full border border-stone-300 px-3 py-2" placeholder="e.g. Linen summer shirt" /></label>
        <label className="text-sm">Brand<input name="brand" value={form.brand} onChange={updateField} className="mt-1 w-full border border-stone-300 px-3 py-2" placeholder="Unbranded is okay" /></label>
        <label className="text-sm">Category<select name="category" value={form.category} onChange={updateField} className="mt-1 w-full border border-stone-300 px-3 py-2">{["Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories", "Other"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm">Size<select name="size" value={form.size} onChange={updateField} className="mt-1 w-full border border-stone-300 px-3 py-2">{["XS", "S", "M", "L", "XL", "XXL", "One size"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm">Condition<select name="condition" value={form.condition} onChange={updateField} className="mt-1 w-full border border-stone-300 px-3 py-2">{["New with tags", "Like new", "Good", "Fair"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm">Buying price (₹)<input name="buyingPrice" type="number" min="0" step="0.01" value={buyingPrice} onChange={updateField} required={!editingId || listings.find((item) => item._id === editingId)?.buyingPrice !== undefined} className="mt-1 w-full border border-stone-300 px-3 py-2" placeholder="What you paid for this item" /><span className="mt-1 block text-xs text-gray-500">Kept private. Used with brand and condition to estimate swap value.</span></label>
        <div className="flex items-center rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          Estimated swap value <strong className="ml-2">₹{!buyingPrice.trim() && !editingId ? "—" : estimate ?? "—"}</strong>
        </div>
        <label className="text-sm sm:col-span-2">Description<textarea name="description" value={form.description} onChange={updateField} required maxLength="2000" rows="4" className="mt-1 w-full border border-stone-300 px-3 py-2" placeholder="Describe the fit, fabric, and any wear…" /></label>
        {!editingId && <label className="text-sm sm:col-span-2">Photos<input type="file" accept="image/*" multiple onChange={(event) => setImages(Array.from(event.target.files || []).slice(0, 5))} className="mt-1 block w-full border border-stone-300 px-3 py-2" /><span className="mt-1 block text-xs text-gray-500">Choose up to five images.</span></label>}
        {images.length > 0 && <p className="text-xs text-gray-600 sm:col-span-2">{images.map((image) => image.name).join(", ")}</p>}
        <div className="flex gap-3 sm:col-span-2">
          <button disabled={saving} className="bg-gray-900 px-6 py-2.5 text-sm text-white disabled:opacity-50">{saving ? "Saving…" : editingId ? "Save changes" : "Publish listing"}</button>
          {editingId && <button type="button" onClick={resetForm} className="border border-gray-300 px-6 py-2.5 text-sm">Cancel</button>}
        </div>
      </form>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-medium">Your items</h2><span className="text-sm text-gray-500">{listings.length} total</span></div>
        {listings.length === 0 ? <p className="rounded-lg bg-stone-50 p-8 text-center text-sm text-gray-500">Your wardrobe is empty. Add your first item above.</p> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((item) => (
              <article key={item._id} className="flex gap-4 rounded-xl border border-stone-200 p-3">
                <img src={item.images?.[0]} alt={item.title} className="h-28 w-24 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{item.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{item.brand} · {item.size} · {item.condition}</p>
                  {item.buyingPrice !== undefined && <p className="mt-2 text-xs text-gray-500">Buying price · ₹{item.buyingPrice}</p>}
                  <p className="mt-2 text-sm">₹{item.estimatedValue} · <span className="capitalize">{item.status}</span></p>
                  <div className="mt-3 flex gap-3 text-xs">
                    {item.status === "available" && <button onClick={() => startEdit(item)} className="underline">Edit</button>}
                    {item.status === "available" && <button onClick={() => remove(item._id)} className="text-red-700 underline">Remove</button>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Wardrobe;
