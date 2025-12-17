# OpenGiv Enhanced Features Guide

## 🎉 New Features Overview

This guide covers the three major enhancements added to OpenGiv Backend:

1. **🔗 Blockchain-Inspired Donation System** - Transparent, verifiable donation tracking
2. **🤖 AI Chatbot** - Intelligent assistant for user guidance
3. **📊 Comprehensive Database** - Scalable schema with trending, campaigns, and more

---

## 🔗 Blockchain Donation System

### Overview
A transparent donation tracking system inspired by blockchain technology, ensuring every donation is traceable, verifiable, and publicly auditable.

### Key Features

#### 1. Blockchain Structure
- Each donation is a "block" with a unique transaction hash
- Sequential block numbers ensure chronological ordering
- Previous hash linking creates an immutable chain
- SHA-256 hashing for security

#### 2. Transparency
- **Public Ledger**: All verified donations are publicly viewable
- **Anonymous Option**: Donors can choose to remain anonymous
- **Fund Utilization**: Track how donations are used
- **Chain Verification**: Real-time integrity checking

#### 3. Verification Process
```
Donation Created → Pending → Payment Confirmed → Verified → Completed
```

### API Endpoints

#### Create Donation
```http
POST /api/donations
Content-Type: application/json

{
  "donorId": "user_id",
  "recipientId": "club_id",
  "amount": 100,
  "purpose": "Education for children",
  "category": "Education",
  "isAnonymous": false,
  "paymentMethod": "Credit Card"
}
```

#### View Public Ledger
```http
GET /api/donations/public-ledger?page=1&limit=50&status=completed
```

#### Verify Transaction
```http
GET /api/donations/verify/:transactionHash
```

#### Check Chain Integrity
```http
GET /api/donations/chain-status
```

#### Club Donations
```http
GET /api/donations/club/:clubId
```

#### User Donation History
```http
GET /api/donations/user/:userId
```

#### Update Fund Utilization
```http
PATCH /api/donations/:id/utilization
Content-Type: application/json

{
  "used": 75,
  "description": "Purchased educational materials",
  "proofUrls": ["https://example.com/receipt.pdf"]
}
```

#### Get Statistics
```http
GET /api/donations/stats/overview
```

### How Blockchain Works

1. **Transaction Creation**
   - Generate unique hash from transaction data
   - Assign next block number
   - Link to previous block's hash
   - Store all details immutably

2. **Chain Verification**
   ```javascript
   // Each block links to the previous one
   Block 1: hash_1, previousHash: 0000...
   Block 2: hash_2, previousHash: hash_1
   Block 3: hash_3, previousHash: hash_2
   ```

3. **Integrity Check**
   - Verify each block's hash is correct
   - Ensure previous hash matches actual previous block
   - Detect any tampering or missing blocks

---

## 🤖 AI Chatbot System

### Overview
An intelligent chatbot that helps users discover causes, find events, learn about NGOs, and get personalized recommendations.

### Chatbot Capabilities

#### 1. Donation Guidance
- Recommend campaigns based on interests
- Suggest donation amounts
- Explain impact and benefits
- Track donation history

#### 2. Event Discovery
- Filter by location, date, category
- Get event details
- Register for events
- Set reminders

#### 3. Club Information
- Answer questions about NGOs
- Show verification status
- Display impact metrics
- Explain missions

#### 4. Product Assistance
- Help find products
- Answer product questions
- Track orders
- Manage cart

#### 5. General Support
- FAQ handling
- Platform navigation
- Account help
- Report issues

### API Endpoints

#### Create Chat Session
```http
POST /api/chatbot/session/new
Content-Type: application/json

{
  "userId": "user_id_optional"
}
```

Response:
```json
{
  "success": true,
  "sessionId": "a1b2c3d4...",
  "message": "Chat session created successfully"
}
```

#### Send Message
```http
POST /api/chatbot/message
Content-Type: application/json

{
  "sessionId": "session_id",
  "message": "I want to donate to environmental causes",
  "userId": "user_id_optional"
}
```

Response:
```json
{
  "success": true,
  "response": "That's wonderful! I can help you find environmental causes...",
  "intent": "donation_inquiry",
  "sessionId": "session_id"
}
```

#### Get Conversation History
```http
GET /api/chatbot/session/:sessionId
```

#### Rate Conversation
```http
POST /api/chatbot/session/:sessionId/rate
Content-Type: application/json

{
  "score": 5,
  "feedback": "Very helpful!"
}
```

#### End Session
```http
DELETE /api/chatbot/session/:sessionId
```

### Intent Recognition

The chatbot automatically detects user intent:
- `donation_inquiry` - User wants to donate
- `event_search` - Looking for events
- `club_info` - Questions about NGOs
- `product_search` - Shopping queries
- `campaign_search` - Finding campaigns
- `general_help` - General questions

### Example Conversations

**Donation Inquiry:**
```
User: I want to donate to environmental causes
Bot: That's wonderful! Here are popular active campaigns:
     1. Plant 1 Million Trees by 2026
        - Category: Environment
        - Progress: $237,500 of $500,000 (47%)
     Would you like to know more?
```

**Event Search:**
```
User: Are there any upcoming events in London?
Bot: Yes! Hope for Children is hosting a 'Global Education Webinar'
     on June 15, 2025 from 2:00 PM to 4:30 PM via Microsoft Teams.
     Would you like more details or to register?
```

### Upgrading to Advanced AI

To integrate with OpenAI GPT or other AI services:

1. Install OpenAI SDK:
```bash
npm install openai
```

2. Update `routes/chatbot/Chatbot.js`:
```javascript
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// In generateResponse function:
const completion = await openai.createChatCompletion({
  model: "gpt-4",
  messages: [
    { role: "system", content: "You are a helpful NGO assistant..." },
    { role: "user", content: message }
  ],
});

return completion.data.choices[0].message.content;
```

---

## 📊 Database Schema

### Collections

#### 1. Users
- User accounts (donors, volunteers)
- Profile information
- Cart functionality

#### 2. Clubs (NGOs)
- Organization details
- Location and contact
- Authentication

#### 3. Events
- Online/offline events
- Date and location
- Host information

#### 4. Products
- Shop merchandise
- Inventory management
- Pricing

#### 5. Campaigns ✨ NEW
- Fundraising campaigns
- Goals and milestones
- Progress tracking
- Updates and impact

#### 6. Donations ✨ NEW (Blockchain)
- Transaction records
- Blockchain structure
- Verification status
- Fund utilization

#### 7. Trending ✨ NEW
- Featured content
- Engagement metrics
- Multi-type support

#### 8. ChatHistory ✨ NEW
- Conversation logs
- Context management
- Session tracking
- Rating system

### Trending System

#### API Endpoints

**Get All Trending:**
```http
GET /api/trending?type=campaign&featured=true&limit=20
```

**Get by Type:**
```http
GET /api/trending/:type  (club, event, product, campaign)
```

**Record Interaction:**
```http
POST /api/trending/:id/interact
Content-Type: application/json

{
  "action": "like"  // view, like, share, donate
}
```

**Create Trending Item:**
```http
POST /api/trending
Content-Type: application/json

{
  "itemType": "campaign",
  "itemId": "campaign_id",
  "title": "Campaign Title",
  "description": "Description",
  "category": "Education",
  "isFeatured": true
}
```

### Campaign System

#### API Endpoints

**Get Campaigns:**
```http
GET /api/campaigns?status=active&category=Education&featured=true
```

**Get Campaign Details:**
```http
GET /api/campaigns/:slug
```

**Create Campaign:**
```http
POST /api/campaigns
Content-Type: application/json

{
  "title": "Build Schools in Rural Areas",
  "slug": "build-schools-rural",
  "description": "Help us build 10 new schools...",
  "clubId": "club_id",
  "category": "Education",
  "goalAmount": 500000,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "beneficiaries": "5,000 children"
}
```

**Post Campaign Update:**
```http
POST /api/campaigns/:id/update
Content-Type: application/json

{
  "title": "First School Completed!",
  "content": "We're excited to announce...",
  "images": ["url1", "url2"]
}
```

**Get Campaign Donations:**
```http
GET /api/campaigns/:id/donations
```

---

## 🌱 Database Seeding

### Running the Seed Script

The seed script populates your database with realistic sample data.

#### Install and Run:
```bash
# Seed database (keeps existing data)
node seedDatabase.js

# Clear database and seed fresh
node seedDatabase.js --clear
```

#### What Gets Seeded:
- ✅ 5 Users (donors and volunteers)
- ✅ 8 Clubs (NGOs from various countries)
- ✅ 10 Events (online and offline)
- ✅ 12 Products (eco-friendly merchandise)
- ✅ 6 Campaigns (with goals and progress)
- ✅ 50 Donations (blockchain-structured)
- ✅ 14 Trending Items (clubs, events, products, campaigns)
- ✅ 2 Chat Sessions (sample conversations)

#### Output Example:
```
✅ Connected to MongoDB
🌱 Starting database seeding...

👥 Seeding users...
✅ Created 5 users
🏛️  Seeding clubs...
✅ Created 8 clubs
📅 Seeding events...
✅ Created 10 events
🛍️  Seeding products...
✅ Created 12 products
📢 Seeding campaigns...
✅ Created 6 campaigns
💰 Seeding donations with blockchain structure...
✅ Created 50 donations (blockchain)
🔥 Seeding trending items...
✅ Created 14 trending items
💬 Seeding chat history...
✅ Created 2 chat sessions

✨ Database seeding completed successfully!

📊 Summary:
   - 5 users
   - 8 clubs
   - 10 events
   - 12 products
   - 6 campaigns
   - 50 donations (blockchain)
   - 14 trending items
   - 2 chat sessions

🔗 Verifying blockchain integrity...
✅ Blockchain integrity verified - all donations properly chained
```

---

## 🔒 Security Features

### Donation Security
1. **Hash Verification** - Prevents tampering
2. **Chain Integrity** - Detects missing/altered blocks
3. **Anonymous Donations** - Privacy protection
4. **IP Logging** - Fraud detection

### Chatbot Security
1. **Rate Limiting** - Prevents abuse
2. **Session Timeout** - Auto-cleanup
3. **Data Sanitization** - SQL/XSS protection
4. **No Sensitive Data** - PII not logged

### API Security
1. **JWT Authentication** (to be implemented)
2. **Role-Based Access** (to be implemented)
3. **Input Validation** - All endpoints
4. **CORS Configuration** - Controlled origins

---

## 📈 Performance Optimization

### Indexes
Optimized queries with strategic indexes:
- Donation: `transactionHash`, `blockNumber`, `timestamp`
- Trending: `engagementScore`, `itemType`
- ChatHistory: `sessionId`, `lastActivity`
- Campaign: `slug`, `status`, `category`

### Caching Strategy
- Trending items: 5 minutes
- Popular content: 15 minutes
- Blockchain ledger: Recent transactions cached

### Pagination
All list endpoints support pagination:
```http
GET /api/endpoint?page=1&limit=20
```

---

## 🚀 Next Steps

### 1. Integrate Real AI
Replace simple intent detection with:
- OpenAI GPT-4
- Google Dialogflow
- Microsoft LUIS
- Amazon Lex

### 2. Add Authentication
Implement JWT-based auth:
```javascript
const jwt = require("jsonwebtoken");
// Add auth middleware to protected routes
```

### 3. Payment Gateway
Integrate real payment processing:
- Stripe
- PayPal
- Cryptocurrency (for true blockchain)

### 4. WebSocket Support
Real-time updates for:
- Live donation feed
- Chatbot responses
- Campaign progress

### 5. Analytics Dashboard
Build admin dashboard showing:
- Donation trends
- Campaign performance
- User engagement
- Chatbot effectiveness

---

## 📚 Documentation

Comprehensive documentation available:
- `docs/DatabaseDesign.md` - Full database architecture
- `docs/BackendSetup.md` - Setup instructions
- `README.md` - Project overview

---

## 🐛 Troubleshooting

### Seeding Issues
```bash
# If seeding fails, check MongoDB connection
node -e "console.log(require('dotenv').config()); console.log(process.env.MONGO_URI)"

# Clear and reseed
node seedDatabase.js --clear
```

### Blockchain Verification Failed
```bash
# Check chain integrity
curl http://localhost:5000/api/donations/chain-status

# If chain is broken, reseed donations
node seedDatabase.js --clear
```

### Chatbot Not Responding
- Check if routes are registered in `index.js`
- Verify session exists before sending messages
- Check console for errors

---

## 💡 Tips

1. **Test with Postman**: Import API endpoints for easy testing
2. **Monitor Performance**: Use MongoDB Atlas performance insights
3. **Start Simple**: Use basic chatbot, then upgrade to AI
4. **Secure First**: Add authentication before deploying
5. **Scale Gradually**: Start with one server, add load balancing later

---

## 🎯 Feature Summary

### ✅ Completed
- ✅ Blockchain donation system with verification
- ✅ AI chatbot with intent recognition
- ✅ Campaign management system
- ✅ Trending items with engagement tracking
- ✅ Comprehensive database schemas
- ✅ Realistic seed data
- ✅ Public donation ledger
- ✅ Fund utilization tracking
- ✅ Chat history and rating
- ✅ Multi-type trending support

### 🔄 Future Enhancements
- 🔄 OpenAI GPT integration
- 🔄 Real payment processing
- 🔄 Smart contracts (true blockchain)
- 🔄 Multi-language support
- 🔄 Voice interface
- 🔄 Mobile app APIs
- 🔄 Real-time notifications
- 🔄 Advanced analytics

---

## 📞 Support

For questions or issues:
1. Check `docs/DatabaseDesign.md` for architecture details
2. Review API endpoint examples in this guide
3. Test with seed data first
4. Check server logs for errors

---

**Built with ❤️ for transparent, impactful charitable work**
