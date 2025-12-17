const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const ChatHistory = require("../../schema/chatbot/ChatHistorySchema");
const Club = require("../../schema/club/ClubSchema");
const Event = require("../../schema/events/EventSchema");
const Product = require("../../schema/shop/ProductSchema");
const Campaign = require("../../schema/campaigns/CampaignSchema");
const Donation = require("../../schema/donations/DonationSchema");
const Trending = require("../../schema/trending/TrendingSchema");

// Helper function to generate session ID
const generateSessionId = () => {
  return crypto.randomBytes(16).toString("hex");
};

// Helper to fetch context data for the AI
const getContextData = async () => {
  try {
    const [campaigns, events, clubs, products, trending, donations] = await Promise.all([
      Campaign.find({ status: "active" }).limit(10).select('title description goal raised category'),
      Event.find({ startDate: { $gte: new Date() } }).limit(10).select('name startDate mode city country description hostName'),
      Club.find().limit(10).select('name tagLine city country description website userName'),
      Product.find({ productQty: { $gt: 0 } }).limit(10).select('productName productPrice productType'),
      Trending.find({ isActive: true }).limit(5).select('title description itemType metrics'),
      Donation.find({ status: "completed" }).sort({ createdAt: -1 }).limit(5).select('donorName recipientName amount purpose')
    ]);
    return { campaigns, events, clubs, products, trending, donations };
  } catch (error) {
    console.error("Error fetching context data:", error);
    return { campaigns: [], events: [], clubs: [], products: [], trending: [], donations: [] };
  }
};

// Call OpenRouter API
const callOpenRouter = async (messages) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY is not set.");
    return "I'm currently running in offline mode because my AI connection key is missing. Please contact the administrator.";
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ngoworld.com", // Required by OpenRouter
        "X-Title": "NGOWorld Assistant"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // Using a fast, cost-effective model
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenRouter API Error:", data.error);
      throw new Error(data.error.message || "API Error");
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI Service Error:", error);
    return "I'm having trouble connecting to my AI brain right now. Please try again in a moment.";
  }
};

// POST /api/chatbot/session/new - Create new chat session
router.post("/session/new", async (req, res) => {
  try {
    const { userId } = req.body;
    
    const sessionId = generateSessionId();
    
    const chatHistory = new ChatHistory({
      userId: userId || null,
      sessionId: sessionId,
      messages: [],
      isActive: true,
      lastActivity: new Date(),
    });
    
    await chatHistory.save();
    
    res.status(201).json({
      success: true,
      sessionId: sessionId,
      message: "Chat session created successfully",
    });
  } catch (error) {
    console.error("Error creating chat session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create chat session",
    });
  }
});

// POST /api/chatbot/message - Send message and get response
router.post("/message", async (req, res) => {
  try {
    const { sessionId, message, userId } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: "Session ID and message are required",
      });
    }
    
    // Find or create session
    let chatSession = await ChatHistory.findOne({ sessionId });
    
    if (!chatSession) {
      chatSession = new ChatHistory({
        userId: userId || null,
        sessionId: sessionId,
        messages: [],
        isActive: true,
      });
    }
    
    // Add user message to DB
    chatSession.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
      metadata: {
        intent: "user_query",
        confidence: 1.0,
      },
    });

    // Prepare context for AI
    const contextData = await getContextData();
    
    const systemPrompt = `You are the AI Assistant for NGOWorld (OpenGiv), a platform connecting donors with NGOs.
    Your goal is to help users find campaigns to donate to, events to attend, or NGOs to support.
    
    Here is the current real-time data from our platform:
    
    ACTIVE CAMPAIGNS:
    ${contextData.campaigns.map((c, i) => `${i+1}. ${c.title} (${c.category}) - Goal: $${c.goal.amount}, Raised: $${c.raised.amount}. Desc: ${c.description.substring(0, 150)}...`).join('\n')}
    
    UPCOMING EVENTS:
    ${contextData.events.map((e, i) => `${i+1}. ${e.name} by ${e.hostName} - Date: ${new Date(e.startDate).toLocaleDateString()} (${e.mode}). Location: ${e.city || 'Online'}.`).join('\n')}
    
    FEATURED NGOs/CLUBS:
    ${contextData.clubs.map((c, i) => `${i+1}. ${c.name} - ${c.tagLine} (${c.city}, ${c.country}). Link: /club/${c.userName}`).join('\n')}
    
    SHOP PRODUCTS:
    ${contextData.products.map((p, i) => `${i+1}. ${p.productName} - $${p.productPrice} (${p.productType})`).join('\n')}
    
    TRENDING ON PLATFORM:
    ${contextData.trending.map((t, i) => `${i+1}. ${t.title} (${t.itemType}) - ${t.description.substring(0, 100)}...`).join('\n')}
    
    RECENT DONATIONS:
    ${contextData.donations.map((d, i) => `${i+1}. ${d.donorName} donated $${d.amount} to ${d.recipientName} for "${d.purpose}"`).join('\n')}
    
    Instructions:
    1. Answer the user's question based on the data above.
    2. Be helpful, encouraging, and concise.
    3. If the user asks about something not in the list, suggest they browse the specific section of the website (Campaigns, Events, Clubs).
    4. Do not make up information that is not provided here.
    5. Marketplace items prices are in rupees, not $.
    6. Format your response naturally and clearly:
       - Do NOT use bold text (**text**) anywhere.
       - Use bullet points or numbered lists for multiple items.
       - Start each point in a new line.
       - Add a blank line between items to ensure good spacing.
       - Avoid large blocks of text.
   `;

    // Get recent conversation history (last 6 messages)
    const history = chatSession.messages.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...history
    ];
    
    // Generate AI response
    const aiResponseContent = await callOpenRouter(aiMessages);
    
    // Add assistant message to DB
    chatSession.messages.push({
      role: "assistant",
      content: aiResponseContent,
      timestamp: new Date(),
      metadata: {
        intent: "ai_response",
      },
    });
    
    chatSession.lastActivity = new Date();
    await chatSession.save();
    
    res.json({
      success: true,
      response: aiResponseContent,
      sessionId: sessionId,
    });
  } catch (error) {
    console.error("Error processing message:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process message",
    });
  }
});

// GET /api/chatbot/session/:sessionId - Get conversation history
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const chatSession = await ChatHistory.findOne({ sessionId });
    
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }
    
    res.json({
      success: true,
      session: chatSession,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch session",
    });
  }
});

// POST /api/chatbot/session/:sessionId/rate - Rate conversation
router.post("/session/:sessionId/rate", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { score, feedback } = req.body;
    
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        error: "Score must be between 1 and 5",
      });
    }
    
    const chatSession = await ChatHistory.findOne({ sessionId });
    
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }
    
    chatSession.rating = {
      score: score,
      feedback: feedback || "",
    };
    chatSession.isActive = false;
    
    await chatSession.save();
    
    res.json({
      success: true,
      message: "Rating submitted successfully",
    });
  } catch (error) {
    console.error("Error rating session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit rating",
    });
  }
});

// DELETE /api/chatbot/session/:sessionId - End session
router.delete("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const chatSession = await ChatHistory.findOne({ sessionId });
    
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }
    
    chatSession.isActive = false;
    await chatSession.save();
    
    res.json({
      success: true,
      message: "Session ended successfully",
    });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to end session",
    });
  }
});

module.exports = router;
