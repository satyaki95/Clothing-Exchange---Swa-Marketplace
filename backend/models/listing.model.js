import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    images: { type: [String], required: true, validate: (images) => images.length > 0 },
    category: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    brand: { type: String, default: "Unbranded", trim: true },
    condition: {
      type: String,
      required: true,
      enum: ["New with tags", "Like new", "Good", "Fair"],
    },
    buyingPrice: { type: Number, min: 0 },
    estimatedValue: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["available", "reserved", "swapped", "sold", "removed"],
      default: "available",
      index: true,
    },
    reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Swap", default: null },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    reservationExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const listingModel =
  mongoose.models.Listing || mongoose.model("Listing", listingSchema);

export default listingModel;
