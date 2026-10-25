import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import PlaceOrder from "./pages/PlaceOrder";
import Orders from "./pages/Orders";
import Marketplace from "./pages/Marketplace";
import Wardrobe from "./pages/Wardrobe";
import Profile from "./pages/Profile";
import Swaps from "./pages/Swaps";
import ListingDetails from "./pages/ListingDetails";
import ListingCheckout from "./pages/ListingCheckout";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import { ToastContainer } from "react-toastify";

const App = () => {
  return (
    <div className="px-4 sm:px-[5vw] md:px-[7vw]lg:px-[9vw]">
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Navbar />
      <SearchBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/collection" element={<Marketplace />} />
        <Route path="/shop" element={<Marketplace />} />
        <Route path="/store" element={<Collection />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/place-order" element={<PlaceOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/listing/:listingId" element={<ListingDetails />} />
        <Route path="/listing/:listingId/checkout" element={<ListingCheckout />} />
        <Route path="/wardrobe" element={<Wardrobe />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/swaps" element={<Swaps />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
