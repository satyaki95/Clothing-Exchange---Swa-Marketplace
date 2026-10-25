import listingModel from "../models/listing.model.js";
import messageModel from "../models/message.model.js";
import swapModel from "../models/swap.model.js";

const swapPopulation = [
  { path: "fromUser", select: "name city state" },
  { path: "toUser", select: "name city state" },
  { path: "offeredListing", select: "title images category size brand condition estimatedValue status" },
  { path: "requestedListing", select: "title images category size brand condition estimatedValue status" },
];

const listSwaps = async (req, res) => {
  try {
    const swaps = await swapModel
      .find({ $or: [{ fromUser: req.userId }, { toUser: req.userId }] })
      .populate(swapPopulation)
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, swaps });
  } catch (error) {
    console.error("Failed to load swap history:", error);
    res.status(500).json({ success: false, message: "Unable to load swap history." });
  }
};

const createSwap = async (req, res) => {
  try {
    const { offeredListingId, requestedListingId } = req.body;
    if (!offeredListingId || !requestedListingId || offeredListingId === requestedListingId) {
      return res.status(400).json({ success: false, message: "Choose one of your items and a different item to request" });
    }
    const [offered, requested] = await Promise.all([
      listingModel.findOne({ _id: offeredListingId, owner: req.userId, status: "available" }),
      listingModel.findOne({ _id: requestedListingId, status: "available" }),
    ]);
    if (!offered) {
      return res.status(400).json({ success: false, message: "Your offered listing must be available and belong to you" });
    }
    if (!requested || requested.owner.toString() === req.userId) {
      return res.status(400).json({ success: false, message: "Choose an available item owned by another user" });
    }
    const swap = await swapModel.create({
      fromUser: req.userId,
      toUser: requested.owner,
      offeredListing: offered._id,
      requestedListing: requested._id,
    });
    await swap.populate(swapPopulation);
    res.status(201).json({ success: true, swap });
  } catch (error) {
    console.error("Failed to create swap request:", error);
    res.status(500).json({ success: false, message: "Unable to send swap request." });
  }
};

const respondToSwap = async (req, res) => {
  let acceptanceClaimId;
  let acceptanceCommitted = false;
  try {
    const { decision } = req.body;
    if (!["accepted", "rejected"].includes(decision)) {
      return res.status(400).json({ success: false, message: "Decision must be accepted or rejected" });
    }
    const swap = await swapModel.findOneAndUpdate(
      {
        _id: req.params.id,
        toUser: req.userId,
        status: "requested",
      },
      { $set: { status: decision === "accepted" ? "accepting" : "rejected" } },
      { new: true },
    );
    if (!swap) {
      return res.status(404).json({ success: false, message: "Pending swap request not found" });
    }

    if (decision === "accepted") {
      acceptanceClaimId = swap._id;
      const reservedIds = [swap.offeredListing, swap.requestedListing];
      for (const listingId of reservedIds) {
        const listing = await listingModel.findOneAndUpdate(
          { _id: listingId, status: "available" },
          { $set: { status: "reserved", reservedBy: swap._id } },
          { new: true },
        );
        if (!listing) {
          await listingModel.updateMany(
            { reservedBy: swap._id },
            { $set: { status: "available", reservedBy: null } },
          );
          await swapModel.updateOne(
            { _id: swap._id, status: "accepting" },
            { $set: { status: "requested" } },
          );
          return res.status(409).json({ success: false, message: "One of these listings is no longer available" });
        }
      }
      const updated = await swapModel.findOneAndUpdate(
        { _id: swap._id, status: "accepting" },
        { $set: { status: "accepted" } },
        { new: true },
      );
      if (!updated) {
        await listingModel.updateMany(
          { reservedBy: swap._id },
          { $set: { status: "available", reservedBy: null } },
        );
        return res.status(409).json({ success: false, message: "Swap request has already been updated" });
      }
      acceptanceCommitted = true;
      await updated.populate(swapPopulation);
      return res.status(200).json({ success: true, swap: updated });
    }
    await swap.populate(swapPopulation);
    res.status(200).json({ success: true, swap });
  } catch (error) {
    if (acceptanceClaimId && !acceptanceCommitted) {
      try {
        await listingModel.updateMany(
          { reservedBy: acceptanceClaimId },
          { $set: { status: "available", reservedBy: null } },
        );
        await swapModel.updateOne(
          { _id: acceptanceClaimId, status: "accepting" },
          { $set: { status: "requested" } },
        );
      } catch (cleanupError) {
        console.error("Failed to clean up swap acceptance:", cleanupError);
      }
    }
    console.error("Failed to respond to swap request:", error);
    res.status(500).json({ success: false, message: "Unable to update swap request." });
  }
};

const confirmSwap = async (req, res) => {
  try {
    const swap = await swapModel.findOne({
      _id: req.params.id,
      $or: [{ fromUser: req.userId }, { toUser: req.userId }],
      status: "accepted",
    });
    if (!swap) {
      return res.status(404).json({ success: false, message: "Accepted swap not found" });
    }
    await swapModel.updateOne(
      { _id: swap._id, status: "accepted", confirmations: { $ne: req.userId } },
      { $addToSet: { confirmations: req.userId } },
    );
    const completed = await swapModel.findOneAndUpdate(
      {
        _id: swap._id,
        status: "accepted",
        confirmations: { $all: [swap.fromUser, swap.toUser] },
      },
      { $set: { status: "completed" } },
      { new: true },
    );
    if (completed) {
      await listingModel.updateMany(
        { reservedBy: swap._id },
        { $set: { status: "swapped" }, $unset: { reservedBy: 1 } },
      );
    }
    const updated = await swapModel.findById(swap._id).populate(swapPopulation);
    res.status(200).json({ success: true, swap: updated });
  } catch (error) {
    console.error("Failed to confirm swap:", error);
    res.status(500).json({ success: false, message: "Unable to confirm swap." });
  }
};

const reportDispute = async (req, res) => {
  try {
    const reason = String(req.body.reason || "").trim();
    if (reason.length < 10 || reason.length > 2000) {
      return res.status(400).json({ success: false, message: "Describe the dispute in 10 to 2000 characters" });
    }
    const swap = await swapModel.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [{ fromUser: req.userId }, { toUser: req.userId }],
        status: "accepted",
      },
      { $set: { status: "disputed", disputeReason: reason } },
      { new: true },
    ).populate(swapPopulation);
    if (!swap) {
      return res.status(404).json({ success: false, message: "Accepted swap not found" });
    }
    res.status(200).json({ success: true, swap });
  } catch (error) {
    console.error("Failed to report swap dispute:", error);
    res.status(500).json({ success: false, message: "Unable to report dispute." });
  }
};

const getMessages = async (req, res) => {
  try {
    const swap = await swapModel.findOne({
      _id: req.params.id,
      $or: [{ fromUser: req.userId }, { toUser: req.userId }],
    });
    if (!swap) {
      return res.status(404).json({ success: false, message: "Swap conversation not found" });
    }
    const messages = await messageModel
      .find({ swap: swap._id })
      .populate("sender", "name")
      .sort({ createdAt: 1 })
      .limit(500);
    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Failed to load swap messages:", error);
    res.status(500).json({ success: false, message: "Unable to load messages." });
  }
};

const sendMessage = async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();
    if (!text || text.length > 2000) {
      return res.status(400).json({ success: false, message: "Message must be between 1 and 2000 characters" });
    }
    const swap = await swapModel.findOne({
      _id: req.params.id,
      $or: [{ fromUser: req.userId }, { toUser: req.userId }],
      status: { $in: ["requested", "accepted", "disputed"] },
    });
    if (!swap) {
      return res.status(404).json({ success: false, message: "Active swap conversation not found" });
    }
    const message = await messageModel.create({ swap: swap._id, sender: req.userId, text });
    await message.populate("sender", "name");
    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Failed to send swap message:", error);
    res.status(500).json({ success: false, message: "Unable to send message." });
  }
};

export { listSwaps, createSwap, respondToSwap, confirmSwap, reportDispute, getMessages, sendMessage };
