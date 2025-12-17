# Frontend Implementation Prompt

Use the following prompt with your frontend LLM (like GitHub Copilot, ChatGPT, or Claude) to implement the UI for the new features.

---

**Prompt:**

I have updated my backend with new features: a **Blockchain Donation Ledger** and an **AI Chatbot**. I need you to create the frontend components to interact with these new API endpoints.

### Backend Context
- **Base URL:** `http://localhost:5000`
- **Tech Stack:** React (assuming based on typical MERN stack), Axios for API calls.

### 1. Blockchain Donation Ledger
**Endpoint:** `GET /api/donations/chain`
**Response Format:**
```json
[
  {
    "index": 1,
    "timestamp": "2023-10-27T10:00:00.000Z",
    "data": { "donor": "John Doe", "amount": 50, "campaign": "Clean Water" },
    "previousHash": "0000...",
    "hash": "a1b2c3...",
    "nonce": 12345
  },
  ...
]
```
**Task:**
- Create a `BlockchainViewer` component.
- Fetch the chain data on mount.
- Display the blocks in a visual chain (e.g., cards connected by arrows).
- Show the `hash`, `previousHash`, and `data` for each block.
- Add a "Verify Integrity" badge that checks if `currentBlock.previousHash === prevBlock.hash`.

### 2. AI Chatbot
**Endpoint:** `POST /api/chatbot/chat`
**Request Body:** `{ "message": "Hello, how can I donate?" }`
**Response Body:** `{ "response": "You can donate by...", "intent": "donation_inquiry" }`

**Task:**
- Create a `Chatbot` floating widget (bottom-right corner).
- It should open/close on click.
- Maintain a list of messages (User vs. Bot).
- Send user input to the API and display the response.
- Add a "typing" indicator while waiting for the response.

### 3. Campaigns Page
**Endpoint:** `GET /api/campaigns`
**Task:**
- Create a `CampaignList` page.
- Display campaigns (title, description, raised amount, goal).
- Add a "Donate" button (mock functionality for now).

### 4. Integration
- Add these new pages to the main `App.js` router (e.g., `/blockchain`, `/campaigns`).
- Add the Chatbot widget to the global layout so it appears on all pages.

---
