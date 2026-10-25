const categoryBaseValue = {
  Tops: 650,
  Bottoms: 850,
  Dresses: 1200,
  Outerwear: 1600,
  Shoes: 1400,
  Accessories: 500,
  Other: 700,
};

const conditionMultiplier = {
  "New with tags": 1,
  "Like new": 0.85,
  Good: 0.65,
  Fair: 0.4,
};

const premiumBrands = new Set([
  "nike",
  "adidas",
  "levi's",
  "levis",
  "zara",
  "uniqlo",
  "puma",
  "reebok",
  "tommy hilfiger",
  "calvin klein",
]);
const luxuryBrands = new Set([
  "gucci",
  "prada",
  "louis vuitton",
  "chanel",
  "dior",
  "burberry",
]);

const estimateSwapValue = ({ category, condition, brand }) => {
  const base = categoryBaseValue[category] || categoryBaseValue.Other;
  const normalizedBrand = brand?.trim().toLowerCase() || "";
  const brandMultiplier = luxuryBrands.has(normalizedBrand)
    ? 1.45
    : premiumBrands.has(normalizedBrand)
      ? 1.15
      : normalizedBrand && !["unbranded", "other"].includes(normalizedBrand)
        ? 1.08
        : 1;
  return Math.round(base * (conditionMultiplier[condition] || 0.65) * brandMultiplier);
};

export default estimateSwapValue;
