const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Donation = require("../../schema/donations/DonationSchema");
const User = require("../../schema/user/UserSchema");
const Club = require("../../schema/club/ClubSchema");
const Campaign = require("../../schema/campaigns/CampaignSchema");

// Helper function to create blockchain hash
const createHash = (data) => {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
};

// Helper function to get the last block
const getLastBlock = async () => {
  const lastDonation = await Donation.findOne().sort({ blockNumber: -1 });
  return lastDonation;
};

// Helper function to verify chain integrity
const verifyChainIntegrity = async (startBlock = 1, endBlock = null) => {
  const query = { blockNumber: { $gte: startBlock } };
  if (endBlock) {
    query.blockNumber.$lte = endBlock;
  }
  
  const donations = await Donation.find(query).sort({ blockNumber: 1 });
  
  for (let i = 1; i < donations.length; i++) {
    if (donations[i].previousHash !== donations[i - 1].transactionHash) {
      return {
        valid: false,
        brokenAt: donations[i].blockNumber,
        message: `Chain integrity broken at block ${donations[i].blockNumber}`,
      };
    }
  }
  
  return {
    valid: true,
    message: "Chain integrity verified",
    blocksChecked: donations.length,
  };
};

// POST /api/donations - Create a new donation (blockchain transaction)
router.post("/", async (req, res) => {
  try {
    const {
      donorId,
      recipientId,
      amount,
      purpose,
      category,
      isAnonymous,
      campaignId,
      paymentMethod,
    } = req.body;
    
    // Validation
    if (!donorId || !recipientId || !amount || !purpose || !category) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: donorId, recipientId, amount, purpose, category",
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Donation amount must be greater than 0",
      });
    }
    
    // Fetch donor and recipient details
    const donor = await User.findById(donorId);
    const recipient = await Club.findById(recipientId);
    
    if (!donor || !recipient) {
      return res.status(404).json({
        success: false,
        error: "Donor or recipient not found",
      });
    }
    
    // Get last block to chain properly
    const lastBlock = await getLastBlock();
    const blockNumber = lastBlock ? lastBlock.blockNumber + 1 : 1;
    const previousHash = lastBlock ? lastBlock.transactionHash : "0".repeat(64);
    
    // Create transaction data
    const transactionData = {
      blockNumber,
      donorId,
      donorName: isAnonymous ? "Anonymous" : donor.name,
      recipientId,
      recipientName: recipient.name,
      amount,
      timestamp: new Date(),
      previousHash,
    };
    
    // Generate transaction hash
    const transactionHash = createHash(transactionData);
    
    // Create donation record
    const donation = new Donation({
      transactionHash,
      donorId,
      donorName: isAnonymous ? "Anonymous" : donor.name,
      recipientId,
      recipientName: recipient.name,
      amount,
      currency: "INR",
      purpose,
      category,
      status: "pending", // Will be updated to "confirmed" after payment verification
      blockNumber,
      previousHash,
      timestamp: new Date(),
      verified: false,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        isAnonymous: isAnonymous || false,
        paymentMethod: paymentMethod || "Unknown",
      },
      utilization: {
        used: 0,
      },
    });
    
    await donation.save();
    
    // Update campaign if donation is for a campaign
    if (campaignId) {
      const campaign = await Campaign.findById(campaignId);
      if (campaign) {
        campaign.raised.amount += amount;
        campaign.raised.donorCount += 1;
        await campaign.save();
      }
    }
    
    res.status(201).json({
      success: true,
      message: "Donation transaction created successfully",
      donation: {
        transactionHash,
        blockNumber,
        amount,
        recipientName: recipient.name,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Error creating donation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create donation transaction",
    });
  }
});

// GET /api/donations/public-ledger - Get public donation ledger
router.get("/public-ledger", async (req, res) => {
  try {
    const { page = 1, limit = 50, status = "completed" } = req.query;
    
    const skip = (page - 1) * limit;
    
    const query = status !== "all" ? { status, verified: true } : { verified: true };
    
    const donations = await Donation.find(query)
      .sort({ blockNumber: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select("-metadata.ipAddress -metadata.userAgent"); // Hide sensitive data
    
    const total = await Donation.countDocuments(query);
    
    // Calculate total donated
    const totalDonated = await Donation.aggregate([
      { $match: { status: "completed", verified: true } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    
    res.json({
      success: true,
      ledger: donations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTransactions: total,
        transactionsPerPage: parseInt(limit),
      },
      stats: {
        totalDonated: totalDonated[0]?.total || 0,
        currency: "INR",
      },
    });
  } catch (error) {
    console.error("Error fetching public ledger:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch public ledger",
    });
  }
});

// GET /api/donations/verify/:hash - Verify a specific transaction
router.get("/verify/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    
    const donation = await Donation.findOne({ transactionHash: hash })
      .populate("donorId", "name email")
      .populate("recipientId", "name email");
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }
    
    // Verify the hash
    const transactionData = {
      blockNumber: donation.blockNumber,
      donorId: donation.donorId,
      donorName: donation.donorName,
      recipientId: donation.recipientId,
      recipientName: donation.recipientName,
      amount: donation.amount,
      timestamp: donation.timestamp,
      previousHash: donation.previousHash,
    };
    
    const calculatedHash = createHash(transactionData);
    const isHashValid = calculatedHash === donation.transactionHash;
    
    // Check if previous block exists and matches
    let isPreviousHashValid = true;
    if (donation.blockNumber > 1) {
      const previousDonation = await Donation.findOne({ 
        blockNumber: donation.blockNumber - 1 
      });
      
      if (previousDonation) {
        isPreviousHashValid = donation.previousHash === previousDonation.transactionHash;
      } else {
        isPreviousHashValid = false;
      }
    }
    
    res.json({
      success: true,
      transaction: donation,
      verification: {
        hashValid: isHashValid,
        previousHashValid: isPreviousHashValid,
        verified: donation.verified,
        status: donation.status,
        chainIntegrity: isHashValid && isPreviousHashValid,
      },
    });
  } catch (error) {
    console.error("Error verifying transaction:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify transaction",
    });
  }
});

// GET /api/donations/chain-status - Check blockchain integrity
router.get("/chain-status", async (req, res) => {
  try {
    const { startBlock = 1, endBlock } = req.query;
    
    const verification = await verifyChainIntegrity(
      parseInt(startBlock),
      endBlock ? parseInt(endBlock) : null
    );
    
    const totalBlocks = await Donation.countDocuments();
    const verifiedBlocks = await Donation.countDocuments({ verified: true });
    const totalAmount = await Donation.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    
    res.json({
      success: true,
      chainStatus: verification,
      stats: {
        totalBlocks,
        verifiedBlocks,
        unverifiedBlocks: totalBlocks - verifiedBlocks,
        totalDonations: totalAmount[0]?.total || 0,
        currency: "INR",
      },
    });
  } catch (error) {
    console.error("Error checking chain status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check chain status",
    });
  }
});

// GET /api/donations/club/:clubId - Get donations for a specific club
router.get("/club/:clubId", async (req, res) => {
  try {
    const { clubId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const donations = await Donation.find({ 
      recipientId: clubId,
      verified: true,
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select("-metadata.ipAddress -metadata.userAgent");
    
    const total = await Donation.countDocuments({ recipientId: clubId, verified: true });
    
    const stats = await Donation.aggregate([
      { $match: { recipientId: clubId, status: "completed" } },
      {
        $group: {
          _id: null,
          totalDonations: { $sum: "$amount" },
          totalUsed: { $sum: "$utilization.used" },
          donorCount: { $sum: 1 },
        },
      },
    ]);
    
    res.json({
      success: true,
      donations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalDonations: total,
      },
      stats: stats[0] || { totalDonations: 0, totalUsed: 0, donorCount: 0 },
    });
  } catch (error) {
    console.error("Error fetching club donations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch club donations",
    });
  }
});

// GET /api/donations/user/:userId - Get user's donation history
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const donations = await Donation.find({ donorId: userId })
      .sort({ timestamp: -1 })
      .populate("recipientId", "name tagLine city country");
    
    const stats = await Donation.aggregate([
      { $match: { donorId: userId, status: "completed" } },
      {
        $group: {
          _id: null,
          totalDonated: { $sum: "$amount" },
          donationCount: { $sum: 1 },
        },
      },
    ]);
    
    res.json({
      success: true,
      donations,
      stats: stats[0] || { totalDonated: 0, donationCount: 0 },
    });
  } catch (error) {
    console.error("Error fetching user donations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user donations",
    });
  }
});

// PATCH /api/donations/:id/utilization - Update fund utilization
router.patch("/:id/utilization", async (req, res) => {
  try {
    const { id } = req.params;
    const { used, description, proofUrls } = req.body;
    
    const donation = await Donation.findById(id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        error: "Donation not found",
      });
    }
    
    if (used > donation.amount) {
      return res.status(400).json({
        success: false,
        error: "Utilized amount cannot exceed donation amount",
      });
    }
    
    donation.utilization = {
      used: used || donation.utilization.used,
      description: description || donation.utilization.description,
      proofUrls: proofUrls || donation.utilization.proofUrls,
      updatedAt: new Date(),
    };
    
    await donation.save();
    
    res.json({
      success: true,
      message: "Utilization updated successfully",
      utilization: donation.utilization,
    });
  } catch (error) {
    console.error("Error updating utilization:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update utilization",
    });
  }
});

// PATCH /api/donations/:id/confirm - Confirm donation (admin/payment gateway)
router.patch("/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;
    
    const donation = await Donation.findById(id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        error: "Donation not found",
      });
    }
    
    donation.status = "confirmed";
    donation.verified = true;
    donation.verifiedAt = new Date();
    
    await donation.save();
    
    res.json({
      success: true,
      message: "Donation confirmed and verified",
      donation,
    });
  } catch (error) {
    console.error("Error confirming donation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to confirm donation",
    });
  }
});

// GET /api/donations/stats/overview - Get overall donation statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const totalStats = await Donation.aggregate([
      { $match: { status: "completed", verified: true } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalDonations: { $sum: 1 },
          totalUsed: { $sum: "$utilization.used" },
        },
      },
    ]);
    
    const categoryStats = await Donation.aggregate([
      { $match: { status: "completed", verified: true } },
      {
        $group: {
          _id: "$category",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { amount: -1 } },
    ]);
    
    const recentDonations = await Donation.find({ verified: true })
      .sort({ timestamp: -1 })
      .limit(10)
      .select("donorName recipientName amount timestamp category");
    
    const topDonors = await Donation.aggregate([
      { $match: { status: "completed", verified: true, "metadata.isAnonymous": false } },
      {
        $group: {
          _id: "$donorId",
          donorName: { $first: "$donorName" },
          totalDonated: { $sum: "$amount" },
          donationCount: { $sum: 1 },
        },
      },
      { $sort: { totalDonated: -1 } },
      { $limit: 10 },
    ]);
    
    const chainStatus = await verifyChainIntegrity();
    
    res.json({
      success: true,
      overview: totalStats[0] || { totalAmount: 0, totalDonations: 0, totalUsed: 0 },
      byCategory: categoryStats,
      recentDonations,
      topDonors,
      chainStatus,
    });
  } catch (error) {
    console.error("Error fetching overview stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
});

// POST /api/donations/fix-integrity - Fix blockchain integrity (Admin only in production)
router.post("/fix-integrity", async (req, res) => {
  try {
    console.log("Attempting to fix blockchain integrity...");
    
    // Get all donations sorted by block number
    const donations = await Donation.find().sort({ blockNumber: 1 });
    
    if (donations.length === 0) {
      return res.json({ success: true, message: "No donations to fix" });
    }
    
    let previousHash = "0".repeat(64); // Genesis block previous hash
    let fixedCount = 0;
    
    for (let i = 0; i < donations.length; i++) {
      const donation = donations[i];
      let needsUpdate = false;
      
      // Check if previous hash matches
      if (donation.previousHash !== previousHash) {
        console.log(`Fixing previousHash for block ${donation.blockNumber}`);
        donation.previousHash = previousHash;
        needsUpdate = true;
      }
      
      // Re-calculate transaction hash
      // Note: We must use the exact same fields as in the original creation
      const transactionData = {
        blockNumber: donation.blockNumber,
        donorId: donation.donorId,
        donorName: donation.donorName,
        recipientId: donation.recipientId,
        recipientName: donation.recipientName,
        amount: donation.amount,
        timestamp: donation.timestamp,
        previousHash: previousHash,
      };
      
      const newHash = createHash(transactionData);
      
      if (donation.transactionHash !== newHash) {
        console.log(`Fixing transactionHash for block ${donation.blockNumber}`);
        donation.transactionHash = newHash;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await donation.save();
        fixedCount++;
      }
      
      previousHash = donation.transactionHash;
    }
    
    res.json({
      success: true,
      message: `Blockchain integrity fixed. Updated ${fixedCount} blocks.`,
      totalBlocks: donations.length,
    });
  } catch (error) {
    console.error("Error fixing blockchain integrity:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fix blockchain integrity",
    });
  }
});

// DELETE /api/donations/:id - Delete a donation (to simulate tampering)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDonation = await Donation.findByIdAndDelete(id);

    if (!deletedDonation) {
      return res.status(404).json({
        success: false,
        error: "Donation not found",
      });
    }

    res.json({
      success: true,
      message: "Block deleted successfully (Chain integrity is now likely broken)",
      deletedBlock: deletedDonation.blockNumber
    });
  } catch (error) {
    console.error("Error deleting donation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete donation",
    });
  }
});

module.exports = router;
