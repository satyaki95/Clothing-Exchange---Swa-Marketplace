import { useState } from "react";
import { assets } from "../assets/admin_assets";

const Add = () => {
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  return (
    <form className="flex flex-col w-full items-start gap-3">
      <div>
        <p className="mb-2">Upload Image</p>

        <div className="flex gap-2">
          <label htmlFor="image1">
            <img className="w-20" src={assets.upload_area} alt="upload image" />
            <input type="file" id="image1" hidden />
          </label>
          <label htmlFor="image2">
            <img className="w-20" src={assets.upload_area} alt="upload image" />
            <input type="file" id="image2" hidden />
          </label>
          <label htmlFor="image3">
            <img className="w-20" src={assets.upload_area} alt="upload image" />
            <input type="file" id="image3" hidden />
          </label>
          <label htmlFor="image4">
            <img className="w-20" src={assets.upload_area} alt="upload image" />
            <input type="file" id="image4" hidden />
          </label>
        </div>
      </div>

      <div className="w-full">
        <p className="mb-2">Product name</p>
        <input
          className="w-full max-w-125 px-3 py-2"
          type="text"
          placeholder="Type here"
          required
        />
      </div>

      <div className="w-full">
        <p className="mb-2">Product description</p>
        <textarea
          className="w-full max-w-125 px-3 py-2"
          type="text"
          placeholder="Write content here"
          rows="5"
          cols="20"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:gap-8">
        <div>
          <p className="mb-2">Product category</p>
          <select className="w-full px-3 py-2">
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="kids">Kids</option>
          </select>
        </div>

        <div>
          <p className="mb-2">Sub category</p>
          <select className="w-full px-3 py-2">
            <option value="Topwear">Topwear</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="WinterWear">WinterWear</option>
          </select>
        </div>

        <div>
          <p className="mb-2">Product price</p>
          <input
            className="w-full px-3 py-2 sm:w-30"
            type="number"
            placeholder="25"
          />
        </div>
      </div>

      <div>
        <p className="mb-2">Product sizes</p>
        <div className="flex gap-3">
          <div>
            <p className="bg-slate-200 px-3 py-1 cursor-pointer">S</p>
          </div>
          <div>
            <p className="bg-slate-200 px-3 py-1 cursor-pointer">M</p>
          </div>
          <div>
            <p className="bg-slate-200 px-3 py-1 cursor-pointer">L</p>
          </div>
          <div>
            <p className="bg-slate-200 px-3 py-1 cursor-pointer">XL</p>
          </div>
          <div>
            <p className="bg-slate-200 px-3 py-1 cursor-pointer">XXL</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <input type="checkbox" id="bestseller" />
        <label className="cursor-pointer" htmlFor="bestseller">
          Add to bestseller
        </label>
      </div>

      <button type="submit" className="w-28 py-3 mt-4 bg-black text-white">
        Add
      </button>
    </form>
  );
};

export default Add;
