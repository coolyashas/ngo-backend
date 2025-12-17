const mongoose = require("mongoose");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

// Import schemas
const User = require("./schema/user/UserSchema");
const Club = require("./schema/club/ClubSchema");
const Event = require("./schema/events/EventSchema");
const Product = require("./schema/shop/ProductSchema");
const Campaign = require("./schema/campaigns/CampaignSchema");
const Donation = require("./schema/donations/DonationSchema");
const Trending = require("./schema/trending/TrendingSchema");
const ChatHistory = require("./schema/chatbot/ChatHistorySchema");

// Import seed data
const { clubsData, eventsData, productsData } = require("./utils/seedData");

// Helper function to create blockchain hash
const createHash = (data) => {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
};

// Helper function for random selection
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper function for random number in range
const randomNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Clear existing data (optional - use with caution)
const clearDatabase = async () => {
  console.log("🗑️  Clearing existing data...");
  await User.deleteMany({});
  await Club.deleteMany({});
  await Event.deleteMany({});
  await Product.deleteMany({});
  await Campaign.deleteMany({});
  await Donation.deleteMany({});
  await Trending.deleteMany({});
  await ChatHistory.deleteMany({});
  console.log("✅ Database cleared");
};

// Seed Users
const seedUsers = async () => {
  console.log("👥 Seeding users...");
  
  const users = [
    {
      userName: "rahulSharma",
      name: "Rahul Sharma",
      email: "rahul.sharma@example.com",
      phone: "+91-9876543210",
      password: "$2b$10$YourHashedPasswordHere",
      userType: "donor",
      description: "Passionate about environmental causes",
      profilePicture: "https://randomuser.me/api/portraits/men/1.jpg",
      address: {
        line1: "123 MG Road",
        city: "New Delhi",
        state: "Delhi",
        country: "India",
        pincode: "110001",
      },
      config: { hasCompletedProfile: true },
      cart: [],
    },
    {
      userName: "priyaPatel",
      name: "Priya Patel",
      email: "priya.patel@example.com",
      phone: "+91-9876543211",
      password: "$2b$10$YourHashedPasswordHere",
      userType: "donor",
      description: "Supporting education for underprivileged children",
      profilePicture: "https://randomuser.me/api/portraits/women/2.jpg",
      address: {
        line1: "456 Linking Road",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        pincode: "400050",
      },
      config: { hasCompletedProfile: true },
      cart: [],
    },
    {
      userName: "smritiV",
      name: "Smriti V",
      email: "smriti.v@example.com",
      phone: "+44-20-5550103",
      password: "$2b$10$YourHashedPasswordHere",
      userType: "volunteer",
      description: "Tech volunteer helping NGOs with digital solutions",
      profilePicture: "https://randomuser.me/api/portraits/men/3.jpg",
      address: {
        line1: "789 Tech Street",
        city: "London",
        state: "England",
        country: "UK",
        pincode: "SW1A 2AA",
      },
      config: { hasCompletedProfile: true },
      cart: [],
    },
    {
      userName: "chiragGupta",
      name: "Chirag Gupta",
      email: "chirag.gupta@example.com",
      phone: "+34-91-5550104",
      password: "$2b$10$YourHashedPasswordHere",
      userType: "donor",
      description: "Healthcare advocate and regular donor",
      profilePicture: "https://randomuser.me/api/portraits/women/4.jpg",
      address: {
        line1: "321 Plaza Mayor",
        city: "Madrid",
        state: "Madrid",
        country: "Spain",
        pincode: "28013",
      },
      config: { hasCompletedProfile: true },
      cart: [],
    },
    {
      userName: "rajPatel",
      name: "Raj Patel",
      email: "raj.patel@example.com",
      phone: "+91-22-5550105",
      password: "$2b$10$YourHashedPasswordHere",
      userType: "donor",
      description: "Entrepreneur supporting clean water initiatives",
      profilePicture: "https://randomuser.me/api/portraits/men/5.jpg",
      address: {
        line1: "567 MG Road",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        pincode: "400020",
      },
      config: { hasCompletedProfile: true },
      cart: [],
    },
  ];

  const createdUsers = await User.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
};

// Seed Clubs
const seedClubs = async () => {
  console.log("🏛️  Seeding clubs...");
  
  // Map club data to User schema format to ensure they appear in frontend
  const clubUsers = clubsData.map(club => ({
    userType: "club",
    userName: club.userName,
    name: club.name,
    email: club.email,
    password: club.password,
    description: club.description,
    profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(club.name)}&background=random`,
    address: {
      line1: club.address,
      city: club.city,
      state: club.state,
      country: club.country,
      pincode: club.pincode
    },
    config: { hasCompletedProfile: true },
    cart: []
  }));

  // Insert into User collection so they appear in /clubs and /display/clubs endpoints
  const createdClubs = await User.insertMany(clubUsers);
  
  // Also insert into Club collection for legacy support
  await Club.insertMany(clubsData);

  console.log(`✅ Created ${createdClubs.length} clubs (as Users)`);
  return createdClubs;
};

// Seed Events
const seedEvents = async () => {
  console.log("📅 Seeding events...");
  const createdEvents = await Event.insertMany(eventsData);
  console.log(`✅ Created ${createdEvents.length} events`);
  return createdEvents;
};

// Seed Products
const seedProducts = async () => {
  console.log("🛍️  Seeding products...");
  const createdProducts = await Product.insertMany(productsData);
  console.log(`✅ Created ${createdProducts.length} products`);
  return createdProducts;
};

// Seed Campaigns
const seedCampaigns = async (clubs) => {
  console.log("📢 Seeding campaigns...");
  
  const campaigns = [
    {
      title: "Plant 1 Million Trees by 2026",
      slug: "plant-1-million-trees-2026",
      description: "Join us in our ambitious goal to plant 1 million trees across deforested areas in India. Every tree planted helps combat climate change, provides habitat for wildlife, and improves air quality for communities.",
      clubId: clubs[0]._id,
      clubName: clubs[0].name,
      category: "Environment",
      images: [
        { url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09", caption: "Reforestation efforts" },
        { url: "https://images.unsplash.com/photo-1466611653911-95081537e5b7", caption: "Young saplings growing" },
      ],
      goal: { amount: 40000000, currency: "INR" },
      raised: { amount: 19000000, donorCount: 1250 },
      startDate: new Date("2025-01-01"),
      endDate: new Date("2026-12-31"),
      status: "active",
      milestones: [
        { title: "250,000 trees", targetAmount: 10000000, achieved: true, achievedAt: new Date("2025-06-15") },
        { title: "500,000 trees", targetAmount: 20000000, achieved: false },
        { title: "1,000,000 trees", targetAmount: 40000000, achieved: false },
      ],
      beneficiaries: "Communities in Madhya Pradesh, Karnataka, and Maharashtra",
      impact: {
        description: "Each tree absorbs 22 kg of CO2 per year and provides shelter for countless species.",
        metrics: [
          { label: "Trees Planted", value: "427,000" },
          { label: "CO2 Absorbed", value: "9.4M kg/year" },
          { label: "Acres Restored", value: "850" },
        ],
      },
      isVerified: true,
      isFeatured: true,
      tags: ["environment", "climate", "reforestation"],
    },
    {
      title: "Build Schools in Rural India",
      slug: "build-schools-rural-india",
      description: "Help us construct 10 new schools in remote Indian villages where children currently walk 5+ km to attend classes. Modern facilities with clean water, electricity, and digital resources.",
      clubId: clubs[1]._id,
      clubName: clubs[1].name,
      category: "Education",
      images: [
        { url: "https://images.unsplash.com/photo-1497486751825-1233686d5d80", caption: "School construction site" },
      ],
      goal: { amount: 64000000, currency: "INR" },
      raised: { amount: 35600000, donorCount: 892 },
      startDate: new Date("2024-09-01"),
      endDate: new Date("2025-12-31"),
      status: "active",
      milestones: [
        { title: "First 3 schools", targetAmount: 19200000, achieved: true, achievedAt: new Date("2025-03-20") },
        { title: "Next 4 schools", targetAmount: 38400000, achieved: false },
        { title: "Final 3 schools", targetAmount: 64000000, achieved: false },
      ],
      beneficiaries: "5,000+ children in Bihar, Odisha, and Jharkhand",
      impact: {
        description: "Providing quality education to children who previously had no access.",
        metrics: [
          { label: "Schools Completed", value: "4" },
          { label: "Students Enrolled", value: "2,180" },
          { label: "Teachers Trained", value: "38" },
        ],
      },
      isVerified: true,
      isFeatured: true,
      tags: ["education", "india", "children"],
    },
    {
      title: "Mobile Health Clinics for Remote Areas",
      slug: "mobile-health-clinics",
      description: "Equip 5 mobile medical units to provide healthcare to communities without access to hospitals. Each unit includes diagnostic equipment, medications, and trained medical staff.",
      clubId: clubs[2]._id,
      clubName: clubs[2].name,
      category: "Healthcare",
      images: [
        { url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d", caption: "Mobile clinic in action" },
      ],
      goal: { amount: 28000000, currency: "INR" },
      raised: { amount: 15120000, donorCount: 634 },
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-11-30"),
      status: "active",
      milestones: [
        { title: "First 2 clinics", targetAmount: 11200000, achieved: true, achievedAt: new Date("2025-05-10") },
        { title: "Next 2 clinics", targetAmount: 22400000, achieved: false },
        { title: "Final clinic", targetAmount: 28000000, achieved: false },
      ],
      beneficiaries: "Rural communities in India, serving 50,000+ people annually",
      impact: {
        description: "Bringing essential healthcare to those who need it most.",
        metrics: [
          { label: "Clinics Operating", value: "2" },
          { label: "Patients Treated", value: "8,420" },
          { label: "Villages Covered", value: "47" },
        ],
      },
      isVerified: true,
      isFeatured: false,
      tags: ["healthcare", "india", "rural"],
    },
    {
      title: "Tech Training for 1000 Youth",
      slug: "tech-training-youth",
      description: "Provide free coding bootcamps, computer literacy, and job placement assistance to underprivileged youth. Breaking the cycle of poverty through technology education.",
      clubId: clubs[3]._id,
      clubName: clubs[3].name,
      category: "Education",
      images: [
        { url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b", caption: "Students learning to code" },
      ],
      goal: { amount: 16000000, currency: "INR" },
      raised: { amount: 12480000, donorCount: 523 },
      startDate: new Date("2025-01-15"),
      endDate: new Date("2025-12-15"),
      status: "active",
      milestones: [
        { title: "500 students trained", targetAmount: 8000000, achieved: true, achievedAt: new Date("2025-07-01") },
        { title: "1000 students trained", targetAmount: 16000000, achieved: false },
      ],
      beneficiaries: "Youth ages 18-25 from low-income backgrounds",
      impact: {
        description: "Empowering youth with 21st-century skills for better career opportunities.",
        metrics: [
          { label: "Students Trained", value: "687" },
          { label: "Job Placements", value: "412" },
          { label: "Average Salary Increase", value: "150%" },
        ],
      },
      isVerified: true,
      isFeatured: true,
      tags: ["technology", "education", "youth"],
    },
    {
      title: "Save Endangered Wildlife",
      slug: "save-endangered-wildlife",
      description: "Protect endangered species through habitat preservation, anti-poaching patrols, and breeding programs. Focus on tigers, rhinos, and elephants.",
      clubId: clubs[4]._id,
      clubName: clubs[4].name,
      category: "Animal Welfare",
      images: [
        { url: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44", caption: "Rhino conservation" },
      ],
      goal: { amount: 36000000, currency: "INR" },
      raised: { amount: 24960000, donorCount: 1045 },
      startDate: new Date("2024-11-01"),
      endDate: new Date("2025-10-31"),
      status: "active",
      milestones: [
        { title: "Secure 10,000 acres", targetAmount: 12000000, achieved: true, achievedAt: new Date("2025-02-28") },
        { title: "30 anti-poaching rangers", targetAmount: 24000000, achieved: true, achievedAt: new Date("2025-08-15") },
        { title: "Breeding program", targetAmount: 36000000, achieved: false },
      ],
      beneficiaries: "Endangered species in Indian wildlife reserves",
      impact: {
        description: "Preventing extinction and restoring wildlife populations.",
        metrics: [
          { label: "Animals Protected", value: "2,400+" },
          { label: "Poaching Incidents", value: "-73%" },
          { label: "Successful Births", value: "34" },
        ],
      },
      isVerified: true,
      isFeatured: true,
      tags: ["wildlife", "conservation", "india"],
    },
    {
      title: "Clean Water for 100 Villages",
      slug: "clean-water-100-villages",
      description: "Install water wells, filtration systems, and teach maintenance to communities lacking access to clean drinking water. Preventing waterborne diseases and saving lives.",
      clubId: clubs[5]._id,
      clubName: clubs[5].name,
      category: "Community Development",
      images: [
        { url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19", caption: "New water well" },
      ],
      goal: { amount: 48000000, currency: "INR" },
      raised: { amount: 33840000, donorCount: 1567 },
      startDate: new Date("2025-03-01"),
      endDate: new Date("2026-02-28"),
      status: "active",
      milestones: [
        { title: "25 villages", targetAmount: 12000000, achieved: true, achievedAt: new Date("2025-06-30") },
        { title: "50 villages", targetAmount: 24000000, achieved: true, achievedAt: new Date("2025-09-15") },
        { title: "100 villages", targetAmount: 48000000, achieved: false },
      ],
      beneficiaries: "200,000+ people in Rajasthan, Gujarat, and Maharashtra",
      impact: {
        description: "Providing the most basic human need - clean drinking water.",
        metrics: [
          { label: "Villages Served", value: "58" },
          { label: "People with Access", value: "127,000" },
          { label: "Disease Reduction", value: "82%" },
        ],
      },
      isVerified: true,
      isFeatured: false,
      tags: ["water", "health", "india"],
    },
  ];

  const createdCampaigns = await Campaign.insertMany(campaigns);
  console.log(`✅ Created ${createdCampaigns.length} campaigns`);
  return createdCampaigns;
};

// Seed Donations with blockchain structure
const seedDonations = async (users, clubs, campaigns) => {
  console.log("💰 Seeding donations with blockchain structure...");
  
  let donations = [];
  let previousHash = "0000000000000000000000000000000000000000000000000000000000000000"; // Genesis block
  
  const categories = ["Education", "Healthcare", "Environment", "Animal Welfare", "Community Development"];
  
  for (let i = 0; i < 50; i++) {
    const donor = randomElement(users);
    const recipient = randomElement(clubs);
    const campaign = Math.random() > 0.3 ? randomElement(campaigns) : null;
    const amount = randomNum(10, 5000);
    const timestamp = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Random date within last 90 days
    
    const transactionData = {
      blockNumber: i + 1,
      donorId: donor._id,
      donorName: donor.name,
      recipientId: recipient._id,
      recipientName: recipient.name,
      amount: amount,
      timestamp: timestamp,
      previousHash: previousHash,
    };
    
    const transactionHash = createHash(transactionData);
    
    const donation = {
      transactionHash: transactionHash,
      donorId: donor._id,
      donorName: donor.name,
      recipientId: recipient._id,
      recipientName: recipient.name,
      amount: amount,
      currency: "INR",
      purpose: campaign ? campaign.title : `Support for ${recipient.name}`,
      category: randomElement(categories),
      status: i < 45 ? "completed" : (i < 48 ? "confirmed" : "pending"),
      blockNumber: i + 1,
      previousHash: previousHash,
      timestamp: timestamp,
      verified: i < 45,
      verifiedAt: i < 45 ? new Date(timestamp.getTime() + 3600000) : null,
      metadata: {
        ipAddress: `192.168.${randomNum(1, 255)}.${randomNum(1, 255)}`,
        isAnonymous: Math.random() > 0.8,
        paymentMethod: randomElement(["Credit Card", "Bank Transfer", "UPI", "Crypto"]),
      },
      utilization: i < 30 ? {
        used: Math.floor(amount * (Math.random() * 0.7 + 0.3)), // 30-100% used
        description: randomElement([
          "Purchased educational materials",
          "Medical supplies and equipment",
          "Infrastructure development",
          "Community program funding",
          "Staff training and development",
        ]),
        proofUrls: ["https://example.com/receipt1.pdf"],
        updatedAt: new Date(timestamp.getTime() + 30 * 24 * 60 * 60 * 1000),
      } : { used: 0 },
    };
    
    donations.push(donation);
    previousHash = transactionHash;
  }
  
  const createdDonations = await Donation.insertMany(donations);
  console.log(`✅ Created ${createdDonations.length} donations with blockchain structure`);
  return createdDonations;
};

// Seed Trending items
const seedTrending = async (clubs, events, products, campaigns) => {
  console.log("🔥 Seeding trending items...");
  
  const trending = [];
  
  // Add trending clubs
  const clubImages = [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80", // Harit Bharat
    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80", // Asha Bal Vikas
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80", // Swasthya Seva Sangh
  ];

  for (let i = 0; i < 3; i++) {
    const club = clubs[i];
    trending.push({
      itemType: "Clubs",
      itemId: club._id,
      title: club.name,
      description: club.description || "A verified NGO making a difference.",
      imageUrl:
        clubImages[i] ||
        `https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80`,
      metrics: {
        views: randomNum(5000, 50000),
        likes: randomNum(500, 5000),
        shares: randomNum(100, 1000),
        donations: randomNum(50, 500),
        donationAmount: randomNum(10000, 100000),
        engagementScore: randomNum(8000, 15000),
      },
      tags: ["featured", "verified"],
      category: randomElement(["Environment", "Education", "Healthcare"]),
      isFeatured: true,
      trendingStartDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      isActive: true,
    });
  }
  
  // Add trending events
  for (let i = 0; i < 4; i++) {
    const event = events[i];
    trending.push({
      itemType: "Event",
      itemId: event._id,
      title: event.name,
      description: event.description.substring(0, 150),
      imageUrl: event.coverImage,
      metrics: {
        views: randomNum(2000, 20000),
        likes: randomNum(200, 2000),
        shares: randomNum(50, 500),
        engagementScore: randomNum(3000, 8000),
      },
      tags: [event.mode.toLowerCase()],
      category: "Events",
      isFeatured: i < 2,
      trendingStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    });
  }
  
  // Add trending products
  for (let i = 0; i < 3; i++) {
    const product = products[i];
    trending.push({
      itemType: "Products",
      itemId: product._id,
      title: product.productName,
      description: product.productDescription,
      imageUrl: product.productImage,
      metrics: {
        views: randomNum(1000, 10000),
        likes: randomNum(100, 1000),
        shares: randomNum(20, 200),
        engagementScore: randomNum(1500, 5000),
      },
      tags: [product.productType.toLowerCase()],
      category: "Shop",
      isFeatured: i === 0,
      trendingStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      isActive: true,
    });
  }
  
  // Add trending campaigns
  for (let i = 0; i < 4; i++) {
    const campaign = campaigns[i];
    trending.push({
      itemType: "Campaign",
      itemId: campaign._id,
      title: campaign.title,
      description: campaign.description.substring(0, 150),
      imageUrl: campaign.images[0]?.url,
      metrics: {
        views: randomNum(3000, 30000),
        likes: randomNum(300, 3000),
        shares: randomNum(100, 1000),
        donations: campaign.raised.donorCount,
        donationAmount: campaign.raised.amount,
        engagementScore: randomNum(5000, 12000),
      },
      tags: campaign.tags,
      category: campaign.category,
      isFeatured: campaign.isFeatured,
      trendingStartDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      isActive: true,
    });
  }
  
  const createdTrending = await Trending.insertMany(trending);
  console.log(`✅ Created ${createdTrending.length} trending items`);
  return createdTrending;
};

// Seed sample chat history
const seedChatHistory = async (users, clubs, events) => {
  console.log("💬 Seeding chat history...");
  
  const chatSessions = [
    {
      userId: users[0]._id,
      sessionId: crypto.randomBytes(16).toString("hex"),
      messages: [
        {
          role: "user",
          content: "I want to donate to environmental causes",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          metadata: { intent: "donation_inquiry", entities: ["environmental"] },
        },
        {
          role: "assistant",
          content: "That's wonderful! I can help you find environmental causes. We have several verified NGOs working on climate change, reforestation, and wildlife conservation. Would you like to see campaigns related to tree planting, river cleanup, or wildlife protection?",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 3000),
          metadata: { intent: "donation_guidance" },
        },
        {
          role: "user",
          content: "Tell me about tree planting",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000),
          metadata: { intent: "campaign_search", entities: ["tree planting"] },
        },
        {
          role: "assistant",
          content: "Great choice! Harit Bharat Foundation has an active campaign 'Plant 1 Million Trees by 2026'. They've already planted 427,000 trees and raised ₹1,90,00,000 out of their ₹4,00,00,000 goal. Each tree costs about ₹400 and absorbs 22 kg of CO2 per year. Would you like to donate to this campaign?",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 35000),
          metadata: { intent: "campaign_info", confidence: 0.95 },
        },
      ],
      context: {
        currentIntent: "donation_guidance",
        relatedClubId: clubs[0]._id,
        userPreferences: {
          interests: ["environment", "trees"],
          donationBudget: 5000,
        },
      },
      isActive: false,
      rating: { score: 5, feedback: "Very helpful!" },
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000 + 40000),
    },
    {
      userId: users[1]._id,
      sessionId: crypto.randomBytes(16).toString("hex"),
      messages: [
        {
          role: "user",
          content: "Are there any upcoming events in Mumbai?",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          metadata: { intent: "event_search", entities: ["Mumbai"] },
        },
        {
          role: "assistant",
          content: "Yes! I found events in Mumbai. Swasthya Seva Sangh is hosting a 'Community Health Mela' on April 10, 2025 from 8:00 AM to 5:00 PM. It's an offline event at Shivaji Park, featuring free health screenings and consultations. Would you like more details or to register?",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 4000),
          metadata: { intent: "event_info" },
        },
      ],
      context: {
        currentIntent: "event_search",
        relatedEventId: events[2]._id,
        userPreferences: {
          location: "Mumbai",
          interests: ["health"],
        },
      },
      isActive: false,
      rating: { score: 4 },
      lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000 + 10000),
    },
  ];
  
  const createdChats = await ChatHistory.insertMany(chatSessions);
  console.log(`✅ Created ${createdChats.length} chat history sessions`);
  return createdChats;
};

// Main seeding function
const seedDatabase = async (options = {}) => {
  try {
    await connectDB();
    
    if (options.clear) {
      await clearDatabase();
    }
    
    console.log("\n🌱 Starting database seeding...\n");
    
    // Seed in order due to dependencies
    const users = await seedUsers();
    const clubs = await seedClubs();
    const events = await seedEvents();
    const products = await seedProducts();
    const campaigns = await seedCampaigns(clubs);
    const donations = await seedDonations(users, clubs, campaigns);
    const trending = await seedTrending(clubs, events, products, campaigns);
    const chatHistory = await seedChatHistory(users, clubs, events);
    
    console.log("\n✨ Database seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - ${users.length} users`);
    console.log(`   - ${clubs.length} clubs`);
    console.log(`   - ${events.length} events`);
    console.log(`   - ${products.length} products`);
    console.log(`   - ${campaigns.length} campaigns`);
    console.log(`   - ${donations.length} donations (blockchain)`);
    console.log(`   - ${trending.length} trending items`);
    console.log(`   - ${chatHistory.length} chat sessions\n`);
    
    // Verify blockchain integrity
    console.log("🔗 Verifying blockchain integrity...");
    const allDonations = await Donation.find().sort({ blockNumber: 1 });
    let isValid = true;
    for (let i = 1; i < allDonations.length; i++) {
      if (allDonations[i].previousHash !== allDonations[i - 1].transactionHash) {
        console.log(`❌ Chain broken at block ${allDonations[i].blockNumber}`);
        isValid = false;
        break;
      }
    }
    if (isValid) {
      console.log("✅ Blockchain integrity verified - all donations properly chained\n");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

// Run seeding
// Pass { clear: true } to clear existing data first
const args = process.argv.slice(2);
const shouldClear = args.includes("--clear");

seedDatabase({ clear: shouldClear });
