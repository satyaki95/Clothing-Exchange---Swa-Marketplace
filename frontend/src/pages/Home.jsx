import BestSeller from "../components/BestSeller";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import NewsLetterBox from "../components/NewsLetterBox";
import OurPolicy from "../components/OurPolicy";

const Home = () => {
  return (
    <div>
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
