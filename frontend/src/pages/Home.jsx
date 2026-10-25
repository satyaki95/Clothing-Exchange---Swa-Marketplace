import { Link } from "react-router-dom";
import BestSeller from "../components/BestSeller";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import NewsLetterBox from "../components/NewsLetterBox";
import OurPolicy from "../components/OurPolicy";

const Home = () => {
  return (
    <div>
      <section className="my-8 flex flex-col items-start justify-between gap-5 rounded-2xl bg-[#e9efe8] px-6 py-8 sm:flex-row sm:items-center sm:px-10 sm:py-10">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-900">Wear more. Waste less.</p>
          <h1 className="prata-regular mt-3 text-3xl sm:text-4xl">Your next favorite is already out there.</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-700">Swap well-loved clothes with people nearby. Browse community listings, compare values, and make a fair exchange.</p>
        </div>
        <Link to="/marketplace" className="shrink-0 bg-gray-900 px-6 py-3 text-sm text-white hover:bg-emerald-900">Explore the swap closet</Link>
      </section>
      <Hero />
      <LatestCollection />
      <BestSeller />
      <OurPolicy />
      <NewsLetterBox
        text1={"Discover pre-owned finds"}
        text2={
          "Get marketplace updates and discover more ways to buy and sell used clothing."
        }
      />
    </div>
  );
};

export default Home;
