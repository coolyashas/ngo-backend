const express = require("express");
const router = express.Router();
const Campaign = require("../../schema/campaigns/CampaignSchema");
const User = require("../../schema/user/UserSchema");
const Trending = require("../../schema/trending/TrendingSchema");

// GET /api/campaigns - Get all campaigns
router.get("/", async (req, res) => {
  try {
    const { 
      status = "active", 
      category, 
      page = 1, 
      limit = 10,
      featured,
      sort = "-createdAt"
    } = req.query;
    
    const query = {};
    
    if (status && status !== "all") {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (featured === "true") {
      query.isFeatured = true;
    }
    
    const skip = (page - 1) * limit;
    
    const campaigns = await Campaign.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate("clubId", "name email city country");
    
    const total = await Campaign.countDocuments(query);
    
    res.json({
      success: true,
      campaigns,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCampaigns: total,
      },
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch campaigns",
    });
  }
});

// GET /api/campaigns/:slug - Get campaign by slug
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    
    const campaign = await Campaign.findOne({ slug })
      .populate("clubId", "name email city country tagLine website");
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: "Campaign not found",
      });
    }
    
    // Calculate progress percentage
    const progressPercentage = (campaign.raised.amount / campaign.goal.amount * 100).toFixed(2);
    
    res.json({
      success: true,
      campaign,
      progress: {
        percentage: progressPercentage,
        remaining: campaign.goal.amount - campaign.raised.amount,
      },
    });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch campaign",
    });
  }
});

// POST /api/campaigns - Create new campaign
router.post("/", async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      clubId,
      category,
      images,
      goalAmount,
      startDate,
      endDate,
      beneficiaries,
      tags,
    } = req.body;
    
    // Validation
    if (!title || !slug || !description || !clubId || !category || !goalAmount || !startDate || !endDate || !beneficiaries) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }
    
    // Check if club exists (User with type 'club')
    const club = await User.findById(clubId);
    if (!club || club.userType !== 'club') {
      return res.status(404).json({
        success: false,
        error: "Club not found or invalid account type",
      });
    }
    
    // Check if slug is unique
    const existingCampaign = await Campaign.findOne({ slug });
    if (existingCampaign) {
      return res.status(400).json({
        success: false,
        error: "Slug already exists",
      });
    }
    
    const campaign = new Campaign({
      title,
      slug,
      description,
      clubId,
      clubName: club.name,
      category,
      images: images || [],
      goal: {
        amount: goalAmount,
        currency: "USD",
      },
      startDate,
      endDate,
      status: "active",
      beneficiaries,
      tags: tags || [],
    });
    
    await campaign.save();

    // Add to Trending automatically so it shows up in the feed
    try {
      await Trending.create({
        itemType: "Campaign",
        itemId: campaign._id,
        title: campaign.title,
        description: campaign.description,
        category: campaign.category,
        imageUrl: campaign.images && campaign.images.length > 0 ? campaign.images[0].url : null,
        metrics: {
          engagementScore: 100, // Initial boost
          views: 0
        },
        isActive: true,
        isFeatured: false
      });
    } catch (trendingError) {
      console.error("Failed to add to trending:", trendingError);
      // Continue even if trending fails
    }
    
    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      campaign,
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create campaign",
    });
  }
});

// PATCH /api/campaigns/:id - Update campaign
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow updating certain fields
    delete updates._id;
    delete updates.createdAt;
    delete updates.raised;
    
    const campaign = await Campaign.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: "Campaign not found",
      });
    }
    
    res.json({
      success: true,
      message: "Campaign updated successfully",
      campaign,
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update campaign",
    });
  }
});

// POST /api/campaigns/:id/update - Post campaign update
router.post("/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, images } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: "Title and content are required",
      });
    }
    
    const campaign = await Campaign.findById(id);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: "Campaign not found",
      });
    }
    
    campaign.updates.push({
      title,
      content,
      images: images || [],
      postedAt: new Date(),
    });
    
    await campaign.save();
    
    res.status(201).json({
      success: true,
      message: "Campaign update posted successfully",
      update: campaign.updates[campaign.updates.length - 1],
    });
  } catch (error) {
    console.error("Error posting campaign update:", error);
    res.status(500).json({
      success: false,
      error: "Failed to post campaign update",
    });
  }
});

// GET /api/campaigns/:id/donations - Get campaign donations
router.get("/:id/donations", async (req, res) => {
  try {
    const { id } = req.params;
    const Donation = require("../../schema/donations/DonationSchema");
    
    const campaign = await Campaign.findById(id);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: "Campaign not found",
      });
    }
    
    // Find donations by matching purpose or recipient
    const donations = await Donation.find({
      recipientId: campaign.clubId,
      verified: true,
      $or: [
        { purpose: { $regex: campaign.title, $options: "i" } },
        { purpose: campaign.title },
      ],
    })
      .sort({ timestamp: -1 })
      .select("-metadata.ipAddress -metadata.userAgent");
    
    res.json({
      success: true,
      donations,
      totalDonations: donations.length,
    });
  } catch (error) {
    console.error("Error fetching campaign donations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch campaign donations",
    });
  }
});

// GET /api/campaigns/club/:clubId - Get campaigns by club
router.get("/club/:clubId", async (req, res) => {
  try {
    const { clubId } = req.params;
    const { status } = req.query;
    
    const query = { clubId };
    if (status) {
      query.status = status;
    }
    
    const campaigns = await Campaign.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      campaigns,
      totalCampaigns: campaigns.length,
    });
  } catch (error) {
    console.error("Error fetching club campaigns:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch club campaigns",
    });
  }
});

// DELETE /api/campaigns/:id - Delete campaign (soft delete by setting status to cancelled)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaign = await Campaign.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: "Campaign not found",
      });
    }
    
    res.json({
      success: true,
      message: "Campaign cancelled successfully",
    });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete campaign",
    });
  }
});

module.exports = router;
