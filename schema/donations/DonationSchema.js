const mongoose = require("mongoose");

// Blockchain-style transaction schema for transparent donations
const DonationSchema = new mongoose.Schema(
  {
    transactionHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    donorName: {
      type: String,
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clubs",
      required: true,
    },
    recipientName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    purpose: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["Education", "Healthcare", "Environment", "Disaster Relief", "Community Development", "Animal Welfare", "Other"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "failed"],
      default: "pending",
    },
    blockNumber: {
      type: Number,
      required: true,
    },
    previousHash: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      isAnonymous: {
        type: Boolean,
        default: false,
      },
      paymentMethod: String,
      receiptUrl: String,
    },
    utilization: {
      used: {
        type: Number,
        default: 0,
      },
      description: String,
      proofUrls: [String],
      updatedAt: Date,
    },
  },
  { timestamps: true }
);

// Index for blockchain verification
DonationSchema.index({ blockNumber: 1, transactionHash: 1 });
DonationSchema.index({ donorId: 1, timestamp: -1 });
DonationSchema.index({ recipientId: 1, timestamp: -1 });

module.exports = mongoose.model("Donation", DonationSchema);
