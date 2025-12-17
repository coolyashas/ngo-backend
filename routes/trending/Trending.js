const express = require("express");
const router = express.Router();
const Trending = require("../../schema/trending/TrendingSchema");

// GET /api/trending - Get all trending items
router.get("/", async (req, res) => {
  try {
    const { 
      type, 
      featured, 
      limit = 20,
      sort = "-metrics.engagementScore" 
    } = req.query;
    
    const query = { isActive: true };
    
    if (type) {
      const typeMap = {
        club: "Clubs",
        event: "Event",
        product: "Products",
        campaign: "Campaign"
      };
      query.itemType = typeMap[type] || type;
    }
    
    if (featured === "true") {
      query.isFeatured = true;
    }
    
    const trendingItems = await Trending.find(query)
      .sort(sort)
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      trending: trendingItems,
      count: trendingItems.length,
    });
  } catch (error) {
    console.error("Error fetching trending items:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch trending items",
    });
  }
});

// GET /api/trending/:type - Get trending items by type
router.get("/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 10 } = req.query;
    
    const validTypes = ["club", "event", "product", "campaign"];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid type. Must be: club, event, product, or campaign",
      });
    }

    const typeMap = {
      club: "Clubs",
      event: "Event",
      product: "Products",
      campaign: "Campaign"
    };
    
    const trendingItems = await Trending.find({
      itemType: typeMap[type],
      isActive: true,
    })
      .sort({ "metrics.engagementScore": -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      type,
      trending: trendingItems,
      count: trendingItems.length,
    });
  } catch (error) {
    console.error("Error fetching trending items by type:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch trending items",
    });
  }
});

// POST /api/trending/:id/interact - Record user interaction
router.post("/:id/interact", async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // view, like, share, donate
    
    const validActions = ["view", "like", "share", "donate"];
    
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Invalid action. Must be: view, like, share, or donate",
      });
    }
    
    const trendingItem = await Trending.findById(id);
    
    if (!trendingItem) {
      return res.status(404).json({
        success: false,
        error: "Trending item not found",
      });
    }
    
    // Update metrics based on action
    switch (action) {
      case "view":
        trendingItem.metrics.views += 1;
        break;
      case "like":
        trendingItem.metrics.likes += 1;
        break;
      case "share":
        trendingItem.metrics.shares += 1;
        break;
      case "donate":
        trendingItem.metrics.donations += 1;
        if (req.body.amount) {
          trendingItem.metrics.donationAmount += req.body.amount;
        }
        break;
    }
    
    // Recalculate engagement score
    trendingItem.metrics.engagementScore = 
      (trendingItem.metrics.views * 1) +
      (trendingItem.metrics.likes * 5) +
      (trendingItem.metrics.shares * 10) +
      (trendingItem.metrics.donations * 20);
    
    await trendingItem.save();
    
    res.json({
      success: true,
      message: "Interaction recorded",
      metrics: trendingItem.metrics,
    });
  } catch (error) {
    console.error("Error recording interaction:", error);
    res.status(500).json({
      success: false,
      error: "Failed to record interaction",
    });
  }
});

// POST /api/trending - Create new trending item
router.post("/", async (req, res) => {
  try {
    const {
      itemType,
      itemId,
      title,
      description,
      imageUrl,
      category,
      tags,
      isFeatured,
    } = req.body;
    
    if (!itemType || !itemId || !title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }
    
    const trendingItem = new Trending({
      itemType,
      itemId,
      title,
      description,
      imageUrl,
      category,
      tags: tags || [],
      isFeatured: isFeatured || false,
      metrics: {
        views: 0,
        likes: 0,
        shares: 0,
        donations: 0,
        donationAmount: 0,
        engagementScore: 0,
      },
      trendingStartDate: new Date(),
      isActive: true,
    });
    
    await trendingItem.save();
    
    res.status(201).json({
      success: true,
      message: "Trending item created successfully",
      trendingItem,
    });
  } catch (error) {
    console.error("Error creating trending item:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create trending item",
    });
  }
});

// PATCH /api/trending/:id - Update trending item
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow updating certain fields
    delete updates._id;
    delete updates.metrics;
    delete updates.createdAt;
    
    const trendingItem = await Trending.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );
    
    if (!trendingItem) {
      return res.status(404).json({
        success: false,
        error: "Trending item not found",
      });
    }
    
    res.json({
      success: true,
      message: "Trending item updated successfully",
      trendingItem,
    });
  } catch (error) {
    console.error("Error updating trending item:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update trending item",
    });
  }
});

// DELETE /api/trending/:id - Remove from trending (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const trendingItem = await Trending.findByIdAndUpdate(
      id,
      { isActive: false, trendingEndDate: new Date() },
      { new: true }
    );
    
    if (!trendingItem) {
      return res.status(404).json({
        success: false,
        error: "Trending item not found",
      });
    }
    
    res.json({
      success: true,
      message: "Item removed from trending",
    });
  } catch (error) {
    console.error("Error removing trending item:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove trending item",
    });
  }
});

module.exports = router;
