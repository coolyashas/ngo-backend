const express = require("express");
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); // Dynamic import for node-fetch
const Campaign = require("../../schema/campaigns/CampaignSchema");
const Event = require("../../schema/events/EventSchema");

// Helper to call OpenRouter (Shared logic)
const callOpenRouter = async (messages, temperature = 0.7) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY is not set in AiFeatures.");
    return { error: "API Key missing" };
  }

  try {
    console.log("Calling OpenRouter with key length:", apiKey.length);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ngoworld.com",
        "X-Title": "NGOWorld AI"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: messages,
        temperature: temperature,
        max_tokens: 800
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenRouter API Error:", data.error);
      return { error: data.error.message || "API Error" };
    }
    
    return { content: data.choices[0].message.content };
  } catch (error) {
    console.error("AI Service Error:", error);
    return { error: error.message };
  }
};

// 1. AI Campaign Description Generator
// POST /api/ai/generate-description
router.post("/generate-description", async (req, res) => {
  try {
    const { title, category, keyPoints } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: "Title and category are required" });
    }

    const prompt = `
      You are a professional fundraising consultant. Write a compelling, emotional, and effective campaign description for a new NGO campaign.
      
      Title: ${title}
      Category: ${category}
      Key Points to Include: ${keyPoints || "General fundraising needs"}
      
      The description should:
      1. Be around 200-300 words.
      2. Have a catchy opening hook.
      3. Clearly state the problem and the solution.
      4. Include a strong call to action.
      5. Be formatted with paragraphs.
    `;

    const result = await callOpenRouter([{ role: "user", content: prompt }]);

    if (result.error) {
      console.error("AI Generation failed:", result.error);
      return res.status(503).json({ error: result.error });
    }

    res.json({ description: result.content });
  } catch (error) {
    console.error("Error generating description:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. Smart Search (Semantic-ish)
// POST /api/ai/smart-search
router.post("/smart-search", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Fetch active campaigns (limit to 50 for context window)
    const campaigns = await Campaign.find({}).limit(50).select('title description category goal');

    if (campaigns.length === 0) {
      return res.json({ results: [] });
    }

    const prompt = `
      I have a list of NGO campaigns. A user is searching for: "${query}".
      
      Please analyze the user's intent and select the top 5 most relevant campaigns from the list below.
      Return ONLY a JSON array of the indices (0-based) of the matching campaigns, sorted by relevance. 
      Example: [3, 1, 12]
      
      If no campaigns are relevant, return [].
      
      Campaigns:
      ${campaigns.map((c, i) => `${i}. ${c.title} (${c.category}): ${c.description.substring(0, 100)}...`).join('\n')}
    `;

    const result = await callOpenRouter([{ role: "user", content: prompt }], 0.1); // Low temp for logic

    if (result.error) {
      // Fallback to basic regex search if AI fails
      console.warn("AI Search failed, falling back to regex:", result.error);
      const regex = new RegExp(query, 'i');
      const fallbackResults = campaigns.filter(c => regex.test(c.title) || regex.test(c.description)).slice(0, 5);
      return res.json({ results: fallbackResults });
    }

    // Parse the indices from the AI response
    let indices = [];
    try {
      // Try to find a JSON array in the response
      const match = result.content.match(/\[.*\]/s);
      if (match) {
        indices = JSON.parse(match[0]);
      }
    } catch (e) {
      console.error("Failed to parse AI search results:", e);
    }

    const results = indices
      .filter(i => i >= 0 && i < campaigns.length)
      .map(i => campaigns[i]);

    res.json({ results });
  } catch (error) {
    console.error("Error in smart search:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. Impact Story Generator
// POST /api/ai/impact-story
router.post("/impact-story", async (req, res) => {
  try {
    const { amount, campaignTitle, donorName } = req.body;

    const prompt = `
      Write a short, personalized "Impact Story" (2-3 sentences) for a donor named ${donorName || "Friend"} who just donated $${amount} to the campaign "${campaignTitle}".
      Explain concretely what this specific amount might achieve (be creative but realistic based on the campaign title).
      Tone: Grateful, inspiring.
    `;

    const result = await callOpenRouter([{ role: "user", content: prompt }]);

    if (result.error) {
      return res.status(503).json({ error: result.error });
    }

    res.json({ story: result.content });
  } catch (error) {
    console.error("Error generating impact story:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
