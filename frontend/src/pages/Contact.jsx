import { assets } from "../assets/assets";
import NewsLetterBox from "../components/NewsLetterBox";
import Title from "../components/Title";

const Contact = () => {
  return (
    <div>
      <div className="text-center text-2xl pt-10 border-t">
        <Title text1={"CONTACT"} text2={"US"} />
      </div>
      <div className="my-10 flex flex-col justify-center md:flex-row gap-10 mb-28">
        <img
          className="w-full md:max-w-120"
          alt="contact image"
          src={assets.contact_img}
        />
        <div className="flex flex-col justify-center items-start gap-6">
          <p className="font-semibold text-xl text-gray-600">
            Marketplace Support
          </p>
          <p className="text-gray-500">
            Questions about buying or selling pre-owned clothes? Get in touch
            with the FOREVER team.
          </p>
          <p className="text-gray-500">
            Tel: (415) 555-0132 <br />
            Email: admin@forever.com
          </p>
        </div>
      </div>
      <NewsLetterBox
        text1={"Discover pre-owned finds"}
        text2={
          "Get updates from FOREVER and find more ways to buy and sell used clothing."
        }
      />
    </div>
  );
};

export default Contact;
