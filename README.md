# AI Finance Tracker

A modern, AI-powered personal finance tracking application with offline support and real-time synchronization.

## Features

- **AI-Powered Insights**: Get personalized financial recommendations and insights
- **Transaction Management**: Track income and expenses with smart categorization
- **Budget Planning**: Create and monitor budgets with AI-assisted suggestions
- **Goal Tracking**: Set and track financial goals with progress visualization
- **Offline Support**: Work without internet connection with automatic sync
- **Real-time Updates**: Instant synchronization across devices
- **Push Notifications**: Stay informed about important financial events
- **Biometric Authentication**: Secure access with fingerprint/face recognition
- **Responsive Design**: Works seamlessly on all devices
- **PWA Support**: Install as a native app on your device

## Tech Stack

- **Frontend**:
  - HTML5
  - CSS3 (with CSS Variables)
  - JavaScript (ES6+)
  - Chart.js for visualizations
  - Service Workers for offline support
  - IndexedDB for local storage

- **Backend**:
  - Node.js
  - Express.js
  - SQLite database
  - JWT authentication
  - OpenAI API integration

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- SQLite3
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-finance.git
   cd ai-finance
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   PORT=3000
   JWT_SECRET=your_jwt_secret
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Initialize the database:
   ```bash
   npm run db:init
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

1. Build the frontend assets:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Project Structure

```
ai-finance/
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── main.js
│   │   ├── api.js
│   │   ├── sync.js
│   │   ├── ui.js
│   │   └── offline.js
│   ├── images/
│   ├── index.html
│   ├── offline.html
│   ├── manifest.json
│   └── sw.js
├── server/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── budgets.js
│   │   ├── goals.js
│   │   └── insights.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── budgets.js
│   │   ├── goals.js
│   │   ├── insights.js
│   │   └── sync.js
│   ├── services/
│   │   └── ai.js
│   └── utils/
│       └── validation.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Transactions

- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create a transaction
- `GET /api/transactions/:id` - Get a transaction
- `PUT /api/transactions/:id` - Update a transaction
- `DELETE /api/transactions/:id` - Delete a transaction

### Budgets

- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create a budget
- `GET /api/budgets/:id` - Get a budget
- `PUT /api/budgets/:id` - Update a budget
- `DELETE /api/budgets/:id` - Delete a budget

### Goals

- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create a goal
- `GET /api/goals/:id` - Get a goal
- `PUT /api/goals/:id` - Update a goal
- `DELETE /api/goals/:id` - Delete a goal

### Insights

- `GET /api/ai/insights` - Get stored financial insights for the user.
- `POST /api/ai/generate-insights` - Generate new financial insights based on user data (this is the primary endpoint that then stores and returns insights, though named GET in current server/routes/ai.js, it effectively generates and stores if triggered).
- `GET /api/ai/budget-recommendations` - Get AI-driven budget recommendations.
- `GET /api/ai/goal-recommendations` - Get AI-driven goal recommendations.
- `POST /api/ai/analyze-transactions` - Send specific transactions for AI analysis.
- `GET /api/ai/advice` - Get holistic personalized financial advice.

### Sync

- `POST /api/sync/transactions` - Sync offline transactions
- `GET /api/sync/status` - Get sync status
- `POST /api/sync/resolve-conflicts` - Resolve sync conflicts

## AI Integration Approach

This application incorporates a CAG model as its primary AI integration method to significantly enhance the user experience by providing personalized financial insights and advice.

### How It Works:

1.  **Data Collection:** When a user requests insights, or periodically, the system securely retrieves relevant financial data for the user. This primarily includes:
    *   Recent transactions (e.g., amounts, categories, types, dates) over a defined period (e.g., last 3-6 months).
    *   Current budget allocations and spending against those budgets.
    *   Defined financial goals, their targets, and current progress.

2.  **Prompt Engineering & AI Interaction:**
    *   The collected financial data is processed and formatted into a structured summary.
    *   This summary forms the core of a carefully constructed prompt sent to the OpenAI GPT-4o-mini model via its API.
    *   The prompt guides the AI to:
        *   Analyze spending patterns (e.g., identify high-spending categories, unusual expenses).
        *   Evaluate budget adherence and suggest adjustments.
        *   Assess progress towards financial goals and offer encouragement or strategies.
        *   Provide actionable tips for saving money or improving financial health.
        *   Generate concise, easy-to-understand textual insights tailored to the user's specific financial situation.

3.  **Insight Generation & Storage:**
    *   The OpenAI model processes the prompt and returns generated textual insights.
    *   These insights are then parsed and stored in the application's database, associated with the user's account and timestamped. This allows for a history of advice and avoids re-generating identical insights too frequently.

4.  **User Experience Enhancement:**
    *   The generated insights are displayed to the user on their dashboard and relevant sections (e.g., budget insights on the budget page, goal insights on the goals page).
    *   This transforms the application from a simple data tracker into a more interactive and intelligent financial companion. Instead of just seeing raw numbers, users receive personalized narratives and suggestions that help them make informed financial decisions.

### Significance of AI Integration:

The CAG approach through OpenAI GPT-4o-mini provides a substantial enhancement by:

*   **Personalization:** Delivering advice and observations specifically tailored to the user's unique financial activities, rather than generic tips.
*   **Actionability:** Offering concrete suggestions that users can act upon (e.g., "You've spent X on dining, consider Y," or "You are on track for Z goal, try X to accelerate").
*   **Engagement:** Making financial data more understandable and engaging by converting it into narrative insights.
*   **Proactive Assistance (Potential):** While currently user-triggered for generation, the framework allows for future enhancements where the system could proactively surface important insights.

This integration directly uses AI to generate new, valuable content based on user data, significantly elevating the application's core utility and user experience beyond that of a standard manual finance tracker.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for providing the AI capabilities
- Chart.js for the visualization library
- Font Awesome for the icons
- All contributors who have helped with the project 