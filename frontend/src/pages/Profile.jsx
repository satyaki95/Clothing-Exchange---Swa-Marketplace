import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";

const Profile = () => {
  const { backendUrl, token, navigate } = useContext(ShopContext);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    city: "",
    state: "",
    postalCode: "",
    latitude: "",
    longitude: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    axios
      .get(`${backendUrl}/api/user/profile`, { headers: { token } })
      .then(({ data }) => {
        const user = data.user;
        setProfile({
          name: user.name || "",
          email: user.email || "",
          city: user.city || "",
          state: user.state || "",
          postalCode: user.postalCode || "",
          latitude: user.location?.latitude ?? "",
          longitude: user.location?.longitude ?? "",
        });
      })
      .catch((error) => toast.error(error.response?.data?.message || "Unable to load profile."));
  }, [backendUrl, navigate, token]);

  const updateField = (event) =>
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location services are not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setProfile((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        })),
      () => toast.error("Could not access your location. Check your browser permissions."),
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/user/profile`,
        {
          name: profile.name,
          city: profile.city,
          state: profile.state,
          postalCode: profile.postalCode,
          ...(profile.latitude !== "" && profile.longitude !== ""
            ? { latitude: profile.latitude, longitude: profile.longitude }
            : {}),
        },
        { headers: { token } },
      );
      setProfile((current) => ({ ...current, ...data.user }));
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto my-12 max-w-2xl">
      <p className="text-xs uppercase tracking-[0.25em] text-emerald-800">Your account</p>
      <h1 className="prata-regular mt-2 text-3xl">Profile & location</h1>
      <p className="mt-2 text-sm text-gray-600">Your city appears on your listings. Coordinates are only used to find nearby swap opportunities.</p>
      <form onSubmit={submit} className="mt-8 grid gap-5 rounded-xl border border-stone-200 p-6 sm:grid-cols-2">
        <label className="text-sm">Name<input name="name" value={profile.name} onChange={updateField} required className="mt-1 w-full border border-stone-300 px-3 py-2" /></label>
        <label className="text-sm">Email<input value={profile.email} disabled className="mt-1 w-full border border-stone-200 bg-stone-50 px-3 py-2 text-gray-500" /></label>
        <label className="text-sm">City<input name="city" value={profile.city} onChange={updateField} className="mt-1 w-full border border-stone-300 px-3 py-2" /></label>
        <label className="text-sm">State / region<input name="state" value={profile.state} onChange={updateField} className="mt-1 w-full border border-stone-300 px-3 py-2" /></label>
        <label className="text-sm sm:col-span-2">Postal code<input name="postalCode" value={profile.postalCode} onChange={updateField} className="mt-1 w-full border border-stone-300 px-3 py-2" /></label>
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between gap-2"><p className="text-sm font-medium">Nearby matching coordinates</p><button type="button" onClick={useCurrentLocation} className="text-xs underline">Use current location</button></div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <label className="text-xs text-gray-500">Latitude<input name="latitude" type="number" step="any" value={profile.latitude} onChange={updateField} className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm" /></label>
            <label className="text-xs text-gray-500">Longitude<input name="longitude" type="number" step="any" value={profile.longitude} onChange={updateField} className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm" /></label>
          </div>
        </div>
        <button disabled={saving} className="bg-gray-900 px-5 py-3 text-sm text-white disabled:opacity-60 sm:col-span-2">{saving ? "Saving…" : "Save profile"}</button>
      </form>
    </main>
  );
};

export default Profile;
