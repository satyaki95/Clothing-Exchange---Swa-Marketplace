import { assets } from "../assets/assets";
import NewsLetterBox from "../components/NewsLetterBox";
import Title from "../components/Title";

const About = () => {
  return (
    <div>
      <div className="text-2xl text-center pt-8 border-t">
        <Title text1={"ABOUT"} text2={"US"} />
      </div>
      <div className="my-10 flex flex-col md:flex-row gap-16">
        <img
          className="w-full md:max-w-112.5"
          alt="about image"
          src={assets.about_img}
        />
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-gray-600">
          <p>
            FOREVER is a community marketplace for buying and selling used
            clothes. List pieces you no longer wear, discover pre-owned styles
            from other members, and find something you love while keeping
            clothes in use.
          </p>
          <p>
            Whether you're clearing space in your wardrobe or searching for your
            next favorite outfit, FOREVER brings together people who want to buy
            and sell quality used clothing. Find a new-to-you favorite and give
            the pieces you sell another chance to be loved.
          </p>
          <b className="text-gray-800">Our Mission</b>
          <p>
            Our mission is to make fashion more affordable and sustainable by
            helping people buy and sell used clothes instead of relying on new
            items. Every item shared is a chance to refresh your style while
            reducing clothing waste.
          </p>
        </div>
      </div>
      <div className="text-xl py-4">
        <Title text1={"WHY"} text2={"CHOOSE US"} />
      </div>
      <div className="flex flex-col md:flex-row text-sm mb-20">
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Easy to Sell:</b>
          <p className="text-gray-600">
            Sell used clothes you no longer wear and help someone else find
            their next favorite piece.
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Affordable Finds:</b>
          <p className="text-gray-600">
            Buy used clothing and discover great styles at prices that are kind
            to your budget.
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Fashion with Less Waste:</b>
          <p className="text-gray-600">
            Buying and selling used clothes keeps wearable items in use and
            helps make fashion a more thoughtful choice.
          </p>
        </div>
      </div>
      <NewsLetterBox
        text1={"Find your next pre-owned favorite"}
        text2={"Buy and sell used clothes with the FOREVER community."}
      />
    </div>
  );
};

export default About;
