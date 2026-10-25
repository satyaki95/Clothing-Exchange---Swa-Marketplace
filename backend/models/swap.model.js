import mongoose from "mongoose";

const swapSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    offeredListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    requestedListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    status: {
      type: String,
      enum: ["requested", "accepting", "accepted", "rejected", "completed", "cancelled", "disputed"],
      default: "requested",
      index: true,
    },
    confirmations: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    disputeReason: { type: String, default: "" },
    resolution: { type: String, default: "" },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

const swapModel = mongoose.models.Swap || mongoose.model("Swap", swapSchema);

export default swapModel;
