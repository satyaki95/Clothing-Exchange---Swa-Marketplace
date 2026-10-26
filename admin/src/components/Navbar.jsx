import { assets } from "../assets/admin_assets";
import { toast } from "react-toastify";

const storefrontUrl = "https://clothing-exchange-frontend.vercel.app";

const Navbar = ({ setToken }) => {
  return (
    <div className="flex items-center py-2 px-[4%] justify-between">
      <img className="w-[max(10%,80px)]" src={assets.logo} alt="logo" />
      <div className="flex items-center gap-3">
        <a
          href={storefrontUrl}
          onClick={() => {
            localStorage.removeItem("token");
            setToken("");
          }}
          className="border border-gray-300 px-4 py-2 text-xs hover:bg-gray-100 sm:text-sm"
        >
          Open storefront
        </a>
        <button
          onClick={() => {
            setToken("");
            toast.success("Logged out successfully.");
          }}
          className="bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
