const { Configuration, OpenAIApi } = require('openai');
const config = require('../config/config');

class AIService {
    constructor() {
        if (config.enableAIFeatures && config.openai.apiKey) {
            const configuration = new Configuration({
                apiKey: config.openai.apiKey,
            });
            this.openai = new OpenAIApi(configuration);
        } else {
            this.openai = null;
        }
    }

    // Categorize a transaction
    async categorizeTransaction(description) {
        if (!this.openai) return 'Other';
        
        try {
            const response = await this.openai.createCompletion({
                model: "text-davinci-003",
                prompt: `Categorize this transaction description into one of these categories: Food, Transportation, Housing, Utilities, Entertainment, Shopping, Healthcare, Education, Travel, Other. Description: "${description}"`,
                max_tokens: 10,
                temperature: 0.3,
            });

            return response.data.choices[0].text.trim();
        } catch (error) {
            console.error('Error categorizing transaction:', error);
            return 'Other';
        }
    }

    // Generate spending insights
    async generateSpendingInsights(transactions) {
        if (!this.openai) return {
            insights: "AI features are disabled. Enable them in your settings to get personalized insights.",
            timestamp: new Date().toISOString()
        };

        try {
            // Prepare transaction data for analysis
            const transactionData = transactions.map(t => ({
                amount: t.amount,
                category: t.category,
                date: t.date
            }));

            const response = await this.openai.createCompletion({
                model: "text-davinci-003",
                prompt: `Analyze these transactions and provide insights about spending patterns, trends, and recommendations. Transactions: ${JSON.stringify(transactionData)}`,
                max_tokens: 500,
                temperature: 0.7,
            });

            return {
                insights: response.data.choices[0].text.trim(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error generating spending insights:', error);
            return {
                insights: "Unable to generate insights at this time.",
                timestamp: new Date().toISOString()
            };
        }
    }

    // Generate budget recommendations
    async generateBudgetRecommendations(budgets) {
        if (!this.openai) return {
            recommendations: "AI features are disabled. Enable them in your settings to get personalized recommendations.",
            timestamp: new Date().toISOString()
        };

        try {
            const response = await this.openai.createCompletion({
                model: "text-davinci-003",
                prompt: `Analyze these budgets and provide recommendations for optimization. Budgets: ${JSON.stringify(budgets)}`,
                max_tokens: 500,
                temperature: 0.7,
            });

            return {
                recommendations: response.data.choices[0].text.trim(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error generating budget recommendations:', error);
            return {
                recommendations: "Unable to generate recommendations at this time.",
                timestamp: new Date().toISOString()
            };
        }
    }

    // Generate goal recommendations
    async generateGoalRecommendations(goals) {
        if (!this.openai) return {
            recommendations: "AI features are disabled. Enable them in your settings to get personalized recommendations.",
            timestamp: new Date().toISOString()
        };

        try {
            const response = await this.openai.createCompletion({
                model: "text-davinci-003",
                prompt: `Analyze these financial goals and provide recommendations for achievement. Goals: ${JSON.stringify(goals)}`,
                max_tokens: 500,
                temperature: 0.7,
            });

            return {
                recommendations: response.data.choices[0].text.trim(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error generating goal recommendations:', error);
            return {
                recommendations: "Unable to generate recommendations at this time.",
                timestamp: new Date().toISOString()
            };
        }
    }

    // Analyze transactions
    async analyzeTransactions(transactions) {
        if (!this.openai) return {
            analysis: "AI features are disabled. Enable them in your settings to get transaction analysis.",
            timestamp: new Date().toISOString()
        };

        try {
            const response = await this.openai.createCompletion({
                model: "text-davinci-003",
                prompt: `Analyze these transactions and provide a detailed analysis of spending patterns and trends. Transactions: ${JSON.stringify(transactions)}`,
                max_tokens: 500,
                temperature: 0.7,
            });

            return {
                analysis: response.data.choices[0].text.trim(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error analyzing transactions:', error);
            return {
                analysis: "Unable to analyze transactions at this time.",
                timestamp: new Date().toISOString()
            };
        }
    }

    // Generate personalized advice
    async generatePersonalizedAdvice({ transactions, budgets, goals }) {
        if (!this.openai) return {
            advice: "AI features are disabled. Enable them in your settings to get personalized advice.",
            timestamp: new Date().toISOString()
        };

        try {
            const response = await this.openai.createCompletion({
                model: "text-davinci-003",
                prompt: `Based on these financial details, provide personalized advice for improvement. Transactions: ${JSON.stringify(transactions)}, Budgets: ${JSON.stringify(budgets)}, Goals: ${JSON.stringify(goals)}`,
                max_tokens: 500,
                temperature: 0.7,
            });

            return {
                advice: response.data.choices[0].text.trim(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error generating personalized advice:', error);
            return {
                advice: "Unable to generate personalized advice at this time.",
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = new AIService(); 