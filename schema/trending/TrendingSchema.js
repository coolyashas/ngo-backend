const mongoose = require("mongoose");

// Trending items schema for showcasing popular content
const TrendingSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ["Clubs", "Event", "Products", "Campaign"],
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "itemType",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    metrics: {
      views: {
        type: Number,
        default: 0,
      },
      likes: {
        type: Number,
        default: 0,
      },
      shares: {
        type: Number,
        default: 0,
      },
      donations: {
        type: Number,
        default: 0,
      },
      donationAmount: {
        type: Number,
        default: 0,
      },
      engagementScore: {
        type: Number,
        default: 0,
      },
    },
    tags: [String],
    category: {
      type: String,
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    trendingStartDate: {
      type: Date,
      default: Date.now,
    },
    trendingEndDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
TrendingSchema.index({ "metrics.engagementScore": -1 });
TrendingSchema.index({ trendingStartDate: -1 });
TrendingSchema.index({ itemType: 1, isActive: 1 });

module.exports = mongoose.model("Trending", TrendingSchema);
