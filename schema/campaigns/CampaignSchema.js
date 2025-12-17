const mongoose = require("mongoose");

// Campaign schema for fundraising campaigns
const CampaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    clubName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["Education", "Healthcare", "Environment", "Disaster Relief", "Community Development", "Animal Welfare", "Other"],
      required: true,
    },
    images: [
      {
        url: String,
        caption: String,
      },
    ],
    goal: {
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: "INR",
      },
    },
    raised: {
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      donorCount: {
        type: Number,
        default: 0,
      },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "completed", "cancelled"],
      default: "draft",
    },
    milestones: [
      {
        title: String,
        description: String,
        targetAmount: Number,
        achieved: {
          type: Boolean,
          default: false,
        },
        achievedAt: Date,
      },
    ],
    updates: [
      {
        title: String,
        content: String,
        images: [String],
        postedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    beneficiaries: {
      type: String,
      required: true,
    },
    impact: {
      description: String,
      metrics: [
        {
          label: String,
          value: String,
        },
      ],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    tags: [String],
  },
  { timestamps: true }
);

// Indexes
CampaignSchema.index({ clubId: 1, status: 1 });
CampaignSchema.index({ category: 1, status: 1 });
CampaignSchema.index({ endDate: 1, status: 1 });

module.exports = mongoose.model("Campaign", CampaignSchema);
