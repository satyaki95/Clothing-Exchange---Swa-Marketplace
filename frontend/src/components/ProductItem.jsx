import { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";

const ProductItem = ({ id, image, name, price, sizes = [] }) => {
  const { currency, addToCart } = useContext(ShopContext);
  const [selectedSize, setSelectedSize] = useState("");

  return (
    <div className="text-gray-700">
      <Link className="cursor-pointer" to={`/product/${id}`}>
        <div className="overflow-hidden">
          <img
            className="hover:scale-110 transition ease-in-out"
            src={image[0]}
            alt={name}
          />
        </div>
        <p className="pt-3 pb-1 text-sm">{name}</p>
        <p className="text-sm font-medium">
          {currency}
          {price}
        </p>
      </Link>
      <div className="mt-3 flex gap-2">
        <select
          aria-label={`Select size for ${name}`}
          className="min-w-0 flex-1 border border-gray-300 bg-white px-2 py-2 text-xs"
          value={selectedSize}
          onChange={(event) => setSelectedSize(event.target.value)}
        >
          <option value="">Select size</option>
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => addToCart(id, selectedSize)}
          className="bg-black px-3 py-2 text-xs text-white hover:bg-gray-700"
        >
          ADD
        </button>
      </div>
    </div>
  );
};

export default ProductItem;
