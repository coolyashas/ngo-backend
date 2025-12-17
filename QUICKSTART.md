# Quick Start Guide - New Features

## 🚀 Getting Started in 5 Minutes

### Step 1: Ensure Server is Running
Your server should already be running from the previous setup. If not:
```powershell
npm start
```

### Step 2: Seed the Database
Populate your database with sample data:
```powershell
node seedDatabase.js --clear
```

This will create:
- 5 users
- 8 NGO clubs
- 10 events
- 12 products
- 6 fundraising campaigns
- 50 blockchain donations
- 14 trending items
- 2 sample chat conversations

### Step 3: Test the Features

#### Test Blockchain Donations

**View Public Ledger:**
```powershell
# Using curl (if available) or open in browser
curl http://localhost:5000/api/donations/public-ledger
# Or visit: http://localhost:5000/api/donations/public-ledger
```

**Check Blockchain Integrity:**
```powershell
curl http://localhost:5000/api/donations/chain-status
# Or visit: http://localhost:5000/api/donations/chain-status
```

**Get Donation Statistics:**
```powershell
curl http://localhost:5000/api/donations/stats/overview
# Or visit: http://localhost:5000/api/donations/stats/overview
```

#### Test AI Chatbot

**Create a Chat Session:**
```powershell
# Using Invoke-RestMethod (PowerShell)
$body = @{} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/chatbot/session/new" -Method POST -ContentType "application/json" -Body $body
```

Save the `sessionId` from the response, then send a message:

**Send a Message:**
```powershell
$body = @{
    sessionId = "your_session_id_here"
    message = "I want to donate to environmental causes"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/chatbot/message" -Method POST -ContentType "application/json" -Body $body
```

#### Test Campaigns

**View Active Campaigns:**
```powershell
curl http://localhost:5000/api/campaigns?status=active
# Or visit: http://localhost:5000/api/campaigns?status=active
```

**View Featured Campaigns:**
```powershell
curl http://localhost:5000/api/campaigns?featured=true
# Or visit: http://localhost:5000/api/campaigns?featured=true
```

#### Test Trending Items

**View All Trending:**
```powershell
curl http://localhost:5000/api/trending
# Or visit: http://localhost:5000/api/trending
```

**View Trending by Type:**
```powershell
# Trending campaigns
curl http://localhost:5000/api/trending/campaign

# Trending events
curl http://localhost:5000/api/trending/event

# Trending clubs
curl http://localhost:5000/api/trending/club
```

### Step 4: Use Postman (Recommended)

For easier testing, use Postman:

1. Download Postman: https://www.postman.com/downloads/
2. Create a new collection called "OpenGiv"
3. Import these endpoints:

**Blockchain Donations:**
- GET `http://localhost:5000/api/donations/public-ledger`
- GET `http://localhost:5000/api/donations/chain-status`
- GET `http://localhost:5000/api/donations/stats/overview`
- POST `http://localhost:5000/api/donations` (create donation)

**Chatbot:**
- POST `http://localhost:5000/api/chatbot/session/new`
- POST `http://localhost:5000/api/chatbot/message`
- GET `http://localhost:5000/api/chatbot/session/:sessionId`

**Campaigns:**
- GET `http://localhost:5000/api/campaigns`
- GET `http://localhost:5000/api/campaigns/:slug`
- POST `http://localhost:5000/api/campaigns` (create)

**Trending:**
- GET `http://localhost:5000/api/trending`
- GET `http://localhost:5000/api/trending/:type`
- POST `http://localhost:5000/api/trending/:id/interact`

## 📝 Example API Calls

### Create a Donation

**PowerShell:**
```powershell
# First, get a user ID and club ID from the seeded data
$users = Invoke-RestMethod -Uri "http://localhost:5000/user" -Method GET
$clubs = Invoke-RestMethod -Uri "http://localhost:5000/clubs" -Method GET

# Create donation
$donation = @{
    donorId = $users[0]._id
    recipientId = $clubs[0]._id
    amount = 100
    purpose = "Supporting environmental initiatives"
    category = "Environment"
    isAnonymous = $false
    paymentMethod = "Credit Card"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/donations" -Method POST -ContentType "application/json" -Body $donation
```

### Chat with the Bot

**PowerShell:**
```powershell
# Create session
$session = Invoke-RestMethod -Uri "http://localhost:5000/api/chatbot/session/new" -Method POST -ContentType "application/json" -Body "{}"

# Send message
$message = @{
    sessionId = $session.sessionId
    message = "What events are happening soon?"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/chatbot/message" -Method POST -ContentType "application/json" -Body $message

Write-Host "Bot Response: $($response.response)"
```

## 🎯 Key Features to Showcase

### 1. Transparent Donations
- Every donation has a unique blockchain-style hash
- Public ledger shows all verified donations
- Chain integrity can be verified in real-time
- Fund utilization tracking shows where money goes

### 2. Intelligent Chatbot
- Understands user intent automatically
- Provides personalized recommendations
- Access to all platform data (clubs, events, campaigns)
- Context-aware conversations
- Can be upgraded to use GPT-4 or other AI

### 3. Campaign Management
- Create fundraising campaigns with goals
- Track progress with milestones
- Post updates with images
- Show impact metrics
- Link donations to campaigns

### 4. Trending System
- Tracks engagement across all content types
- Dynamic scoring based on views, likes, shares, donations
- Featured items for homepage
- Metrics for analytics

## 📊 Database Overview

Your database now has:
- **Users**: Donor and volunteer accounts
- **Clubs**: NGO organizations
- **Events**: Online and offline events
- **Products**: Charitable merchandise
- **Campaigns**: Fundraising initiatives
- **Donations**: Blockchain-structured transactions
- **Trending**: Featured content
- **ChatHistory**: Conversation logs

## 🔍 What Makes This Impressive

### Blockchain Aspect
✅ **Transparent**: Every donation is publicly verifiable
✅ **Immutable**: Transaction history cannot be altered
✅ **Traceable**: Complete audit trail
✅ **Secure**: SHA-256 hashing
✅ **Chain Integrity**: Real-time verification

### AI Chatbot
✅ **Intelligent**: Intent recognition and entity extraction
✅ **Helpful**: Provides personalized recommendations
✅ **Accessible**: Easy natural language interaction
✅ **Extensible**: Can integrate with GPT-4, Dialogflow, etc.
✅ **Data-Driven**: Access to entire platform database

### Scalable Design
✅ **Indexed**: Optimized queries
✅ **Paginated**: Large dataset support
✅ **Modular**: Easy to extend
✅ **Well-Documented**: Complete API documentation
✅ **Production-Ready**: Error handling and validation

## 🎓 Learning Resources

- **Database Design**: `docs/DatabaseDesign.md`
- **Complete Guide**: `docs/EnhancedFeaturesGuide.md`
- **Setup Instructions**: `docs/BackendSetup.md`

## 🔧 Troubleshooting

**Server won't start:**
```powershell
# Check if port 5000 is already in use
netstat -ano | findstr :5000
# If in use, kill the process or change PORT in .env
```

**Seeding fails:**
```powershell
# Ensure MongoDB is connected
# Check MONGO_URI in .env file
node -e "require('dotenv').config(); console.log(process.env.MONGO_URI)"
```

**API returns errors:**
- Ensure you've run the seed script
- Check server console for error messages
- Verify MongoDB connection

## ✨ Next Steps

1. ✅ Test all endpoints with Postman
2. ✅ Explore the public ledger
3. ✅ Try the chatbot with different queries
4. ✅ View campaign progress
5. ✅ Check trending items

**For production deployment:**
- Add JWT authentication
- Integrate real payment gateway
- Connect to OpenAI for advanced AI
- Add rate limiting
- Set up SSL/HTTPS
- Configure production MongoDB

---

**Congratulations! Your NGO platform now has:**
- 🔗 Blockchain transparency
- 🤖 AI assistance
- 📊 Comprehensive data
- 🚀 Scalable architecture

All ready to make a real impact! 🌟
