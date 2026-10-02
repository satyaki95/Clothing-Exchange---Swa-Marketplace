import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <div>
      <div class="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        <div>
          <img class="mb-5 w-32" alt="logo" src={assets.logo} />
          <p class="w-full md:w-2/3 text-gray-600">
            Discover fresh, pre-loved fashion and smart swaps designed to help
            you refresh your wardrobe while giving quality pieces a second life.
          </p>
        </div>
        <div>
          <p class="text-xl font-medium mb-5">COMPANY</p>
          <ul class="flex flex-col gap-1 text-gray-600">
            <li>Home</li>
            <li>About us</li>
            <li>Delivery</li>
            <li>Privacy policy</li>
          </ul>
        </div>
        <div>
          <p class="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul class="flex flex-col gap-1 text-gray-600">
            <li>+1-212-456-7890</li>
            <li>contact@foreveryou.com</li>
          </ul>
        </div>
      </div>
      <div>
        <hr />
        <p class="py-5 text-sm text-center">
          Copyright {new Date().getFullYear()}@ Satyaki - All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;
