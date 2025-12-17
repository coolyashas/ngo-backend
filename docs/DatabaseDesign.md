# OpenGiv Database Design Documentation

## Overview
This document outlines the comprehensive database architecture for OpenGiv, designed for scalability, performance, and transparency in NGO operations.

## Database Architecture

### Core Collections

#### 1. **Users Collection**
- **Purpose**: Store user accounts (donors, volunteers, admin)
- **Key Features**: 
  - Profile customization
  - Cart functionality for shop
  - Address management
- **Relationships**: 
  - One-to-Many with Donations (as donor)
  - One-to-Many with ChatHistory
  - Many-to-Many with Events (attendees)

#### 2. **Clubs Collection** (NGOs/Organizations)
- **Purpose**: Store NGO/club information
- **Key Features**:
  - Authentication credentials
  - Location details
  - Website and iframe integration
- **Relationships**:
  - One-to-Many with Events (host)
  - One-to-Many with Campaigns
  - One-to-Many with Donations (recipient)

#### 3. **Events Collection**
- **Purpose**: Store event information (online/offline)
- **Key Features**:
  - Temporal data (start/end dates and times)
  - Location-based (for offline events)
  - Platform integration (for online events)
  - Unique UID for tracking
- **Relationships**:
  - Many-to-One with Clubs (host)
  - Referenced by Trending items

#### 4. **Products Collection** (Shop)
- **Purpose**: Store merchandise and products
- **Key Features**:
  - Inventory management (quantity)
  - Pricing
  - Product categorization
  - Unique slugs for SEO
- **Relationships**:
  - Referenced in User cart
  - Referenced by Trending items

### Enhanced Collections

#### 5. **Donations Collection** (Blockchain-Inspired)
- **Purpose**: Transparent donation tracking with blockchain concepts
- **Key Features**:
  - **Transaction Hash**: Unique identifier (SHA-256)
  - **Block Number**: Sequential numbering for chain integrity
  - **Previous Hash**: Links to previous transaction (blockchain concept)
  - **Verification**: Multi-step verification process
  - **Utilization Tracking**: Track how donations are used
  - **Anonymity Option**: Privacy-preserving donations
- **Blockchain Features**:
  - Immutable transaction records
  - Public ledger accessibility
  - Chain verification
  - Transparent fund utilization
- **Relationships**:
  - Many-to-One with Users (donor)
  - Many-to-One with Clubs (recipient)
  - May reference Campaigns

#### 6. **Campaigns Collection**
- **Purpose**: Fundraising campaigns with goals and milestones
- **Key Features**:
  - Goal tracking (amount, progress)
  - Milestone management
  - Campaign updates and transparency
  - Impact metrics
  - Verification status
- **Relationships**:
  - Many-to-One with Clubs (organizer)
  - One-to-Many with Donations
  - Referenced by Trending items

#### 7. **Trending Collection**
- **Purpose**: Highlight popular content across the platform
- **Key Features**:
  - Multi-type support (clubs, events, products, campaigns)
  - Engagement metrics (views, likes, shares)
  - Dynamic scoring algorithm
  - Featured items support
- **Relationships**:
  - Polymorphic references (can point to any collection)
  - Used for homepage and discovery features

#### 8. **ChatHistory Collection** (AI Chatbot)
- **Purpose**: Store AI chatbot conversations
- **Key Features**:
  - Session management
  - Context preservation
  - Intent recognition
  - Multi-message threads
  - Rating and feedback system
- **Chatbot Capabilities**:
  - Donation guidance and recommendations
  - Event discovery and filtering
  - Club information lookup
  - Product browsing assistance
  - FAQ and general help
- **Relationships**:
  - Many-to-One with Users
  - Can reference Clubs, Events, Products in context

## Scalability Features

### 1. **Indexing Strategy**
```javascript
// Performance-critical indexes
Donations: transactionHash, blockNumber, donorId, recipientId, timestamp
Trending: engagementScore, itemType, trendingStartDate
Events: startDate, hostUsername, uid
ChatHistory: sessionId, userId, lastActivity
Campaigns: clubId, status, category, endDate
```

### 2. **Data Partitioning**
- **Time-based**: Donations and ChatHistory can be partitioned by date
- **Geographic**: Clubs and Events can be sharded by location
- **Type-based**: Trending items separated by itemType

### 3. **Caching Strategy**
- Trending items: Cache for 5 minutes
- Popular clubs/events: Cache for 15 minutes
- Donation ledger: Cache recent transactions
- Chatbot context: Session-based caching

### 4. **Optimization Techniques**
- **Aggregation Pipeline**: For trending calculations and statistics
- **Lean Queries**: Return plain JavaScript objects for read-heavy operations
- **Population Limits**: Selective field population to reduce payload
- **Pagination**: Cursor-based pagination for large datasets

## Blockchain Donation System

### How It Works

#### 1. **Transaction Creation**
```javascript
// When a donation is made:
1. Generate unique transaction hash (SHA-256)
2. Assign next block number
3. Link to previous transaction's hash
4. Store donor and recipient details
5. Mark as "pending"
```

#### 2. **Verification Process**
```javascript
// Multi-step verification:
1. Payment gateway confirmation
2. Hash verification
3. Chain integrity check (previous hash matches)
4. Mark as "confirmed"
5. Timestamp verification
```

#### 3. **Public Ledger**
- All confirmed donations are publicly viewable
- Anonymous donations hide donor identity but show transaction
- Real-time updates on fund utilization
- Transparent impact reporting

#### 4. **Chain Integrity**
```javascript
// Verification algorithm:
function verifyChain(donations) {
  for (let i = 1; i < donations.length; i++) {
    if (donations[i].previousHash !== donations[i-1].transactionHash) {
      return false; // Chain broken
    }
  }
  return true; // Chain valid
}
```

## AI Chatbot Integration

### Purpose and Use Cases

#### 1. **Donation Guidance**
- Recommend causes based on user preferences
- Suggest donation amounts based on campaign needs
- Explain tax benefits and receipts
- Track donation history

#### 2. **Event Discovery**
- Filter events by location, date, category
- Recommend events based on interests
- Provide event details and registration help
- Send reminders

#### 3. **Club Information**
- Answer questions about NGOs
- Provide verification status
- Show impact metrics and testimonials
- Explain club missions

#### 4. **Product Assistance**
- Help find products
- Answer product questions
- Track orders
- Manage cart

#### 5. **General Support**
- FAQ handling
- Platform navigation
- Account management
- Report issues

### Technical Implementation
- **Context Management**: Maintains conversation context
- **Intent Recognition**: Identifies user goals
- **Entity Extraction**: Extracts relevant data (dates, amounts, locations)
- **Multi-turn Conversations**: Handles complex queries
- **Data Access**: Real-time access to all collections

## API Endpoints Structure

### Donations (Blockchain)
- `POST /api/donations` - Create donation
- `GET /api/donations/public-ledger` - View all donations
- `GET /api/donations/verify/:hash` - Verify transaction
- `GET /api/donations/chain-status` - Check chain integrity
- `GET /api/donations/club/:clubId` - Club-specific donations
- `PATCH /api/donations/:id/utilization` - Update fund usage

### Chatbot
- `POST /api/chatbot/message` - Send message
- `GET /api/chatbot/session/:sessionId` - Get conversation
- `POST /api/chatbot/session/new` - Start new session
- `POST /api/chatbot/session/:sessionId/rate` - Rate conversation

### Trending
- `GET /api/trending` - Get trending items
- `GET /api/trending/:type` - Get by type
- `POST /api/trending/:id/interact` - Record interaction

### Campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns` - List campaigns
- `GET /api/campaigns/:slug` - Get campaign details
- `PATCH /api/campaigns/:id/update` - Post update
- `GET /api/campaigns/:id/donations` - Campaign donations

## Security Considerations

1. **Donation Integrity**
   - Hash verification prevents tampering
   - Sequential block numbers prevent insertion
   - Chain verification ensures no gaps

2. **User Privacy**
   - Anonymous donation option
   - Encrypted sensitive data
   - GDPR-compliant data handling

3. **Chatbot Security**
   - Rate limiting to prevent abuse
   - Session timeout after inactivity
   - No sensitive data in chat logs

4. **API Security**
   - JWT authentication
   - Role-based access control
   - Input validation and sanitization

## Performance Metrics

### Target Performance
- Donation creation: < 200ms
- Trending query: < 100ms (cached)
- Chatbot response: < 2s
- Chain verification: < 500ms for last 1000 transactions

### Monitoring
- Track query performance
- Monitor index usage
- Alert on chain integrity issues
- Log chatbot intent accuracy

## Future Enhancements

1. **Blockchain**
   - Smart contracts for automated fund distribution
   - Multi-signature approvals for large donations
   - Cryptocurrency integration

2. **AI Chatbot**
   - Voice interface
   - Multi-language support
   - Predictive recommendations
   - Sentiment analysis

3. **Analytics**
   - Real-time dashboard
   - Donation impact visualization
   - User behavior analytics
   - Campaign performance metrics

## Conclusion

This database design provides:
- **Scalability**: Indexed and partitionable collections
- **Transparency**: Blockchain-inspired donation tracking
- **Intelligence**: AI-powered user assistance
- **Performance**: Optimized queries and caching
- **Flexibility**: Extensible schema design
- **Security**: Multi-layered protection

The architecture supports current needs while allowing for future growth and feature additions.
