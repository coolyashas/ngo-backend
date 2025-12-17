const mongoose = require("mongoose");

// Chat history schema for AI chatbot conversations
const ChatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant", "system"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        metadata: {
          intent: String, // donation_inquiry, event_search, club_info, general_help
          entities: [String], // extracted entities from the message
          confidence: Number,
        },
      },
    ],
    context: {
      currentIntent: String,
      relatedClubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clubs",
      },
      relatedEventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
      relatedProductId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Products",
      },
      userPreferences: {
        interests: [String],
        location: String,
        donationBudget: Number,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
      },
      feedback: String,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for quick session retrieval
ChatHistorySchema.index({ sessionId: 1, lastActivity: -1 });
ChatHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ChatHistory", ChatHistorySchema);
