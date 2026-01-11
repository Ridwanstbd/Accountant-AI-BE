const axios = require("axios");

class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = "https://openrouter.ai/api/v1/chat/completions";
    this.siteUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    this.siteName = process.env.SITE_NAME || "AI Recommendation System";

    this.defaultModel =
      process.env.OPENROUTER_MODEL || "google/gemini-3-flash-preview";
    this.defaultTemperature = 0.7;
    this.defaultMaxTokens = 1000;
  }

  async generateRecommendation(financialSummary, options = {}) {
    try {
      const {
        model = this.defaultModel,
        temperature = this.defaultTemperature,
        maxTokens = this.defaultMaxTokens,
        systemPrompt = null,
      } = options;

      const messages = [];

      if (systemPrompt) {
        messages.push({
          role: "system",
          content: systemPrompt,
        });
      } else {
        messages.push({
          role: "system",
          content: `You are an expert AI financial consultant specialized in providing business recommendations. 
                    Provide specific, practical, and actionable recommendations based on the financial data provided.
                    Focus on cost savings, revenue optimization, and cash flow management.
                    Please answer in Indonesian language with a structured and easy-to-understand format.`,
        });
      }

      messages.push({
        role: "user",
        content: financialSummary,
      });

      const response = await axios.post(
        this.baseUrl,
        {
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "HTTP-Referer": this.siteUrl,
            "X-Title": this.siteName,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from OpenRouter API");
      }

      const generatedText = data.choices[0].message.content;

      return generatedText;
    } catch (error) {
      console.error("OpenRouter AI Service Error:", error);
      // ... (error handling tetap sama)
      if (error.response) {
        const errorMessage =
          error.response.data?.error?.message || error.response.statusText;
        throw new Error(
          `OpenRouter API error: ${error.response.status} - ${errorMessage}`
        );
      } else {
        throw new Error(
          `Failed to generate AI recommendation: ${error.message}`
        );
      }
    }
  }

  async generateCustomRecommendation(prompt, context = {}, options = {}) {
    try {
      const {
        includeFinancialContext = false,
        recommendationType = "general",
        language = "id",
      } = context;

      let systemPrompt = this.buildSystemPrompt(recommendationType, language);

      let userPrompt = prompt;
      if (includeFinancialContext && context.financialData) {
        userPrompt = `Based on the following financial data: \n${context.financialData}\n\nQuestion: ${prompt}\n\nPlease answer in Indonesian language.`;
      }

      return await this.generateRecommendation(userPrompt, {
        ...options,
        systemPrompt,
      });
    } catch (error) {
      throw new Error(
        `Failed to generate custom recommendation: ${error.message}`
      );
    }
  }

  async analyzeFinancialData(financialData) {
    try {
      const {
        totalRevenue = 0,
        totalExpense = 0,
        netProfit = 0,
        roi = 0,
        bep = 0,
        transactionCount = 0,
      } = financialData;

      // Prompt menggunakan Bahasa Inggris untuk instruksi yang lebih presisi
      const analysisPrompt = `
        As a professional financial consultant, analyze the following business metrics:
        
        - Total Revenue: Rp${totalRevenue.toLocaleString("id-ID")}
        - Total Expense: Rp${totalExpense.toLocaleString("id-ID")}
        - Net Profit/Loss: Rp${netProfit.toLocaleString("id-ID")}
        - ROI (Return on Investment): ${roi}%
        - BEP (Break Even Point): Rp${bep.toLocaleString("id-ID")}
        - Transaction Count: ${transactionCount}
        
        Task:
        1. Evaluate the business health based on the relationship between Net Profit, ROI, and BEP.
        2. Categorize the most urgent recommendation type from these options: 
           - CostSaving (if expenses are disproportionately high)
           - RevenueOptimization (if revenue is stagnant or low profit margins)
           - CashFlow (if ROI is low or liquidity is at risk)
           - General (if the business is stable but needs routine maintenance)
        
        Constraint:
        - You MUST return the response strictly in JSON format.
        - You MUST write the values for "reasoning" and "keyInsights" in Indonesian language (Bahasa Indonesia).
        
        Required JSON Structure:
        {
          "recommendedType": "chosen_category",
          "reasoning": "explanation_in_indonesian",
          "priority": "high/medium/low",
          "keyInsights": ["insight_1_in_indonesian", "insight_2_in_indonesian", "insight_3_in_indonesian"]
        }
      `;

      const response = await this.generateRecommendation(analysisPrompt, {
        temperature: 0.2, // Temperature rendah agar output JSON lebih konsisten/stabil
        maxTokens: 800,
      });

      try {
        // Membersihkan karakter non-JSON seperti backticks ```json ... ```
        const cleanedResponse = response.replace(/```json|```/g, "").trim();
        const analysis = JSON.parse(cleanedResponse);

        return analysis;
      } catch (parseError) {
        console.error("Failed to parse AI JSON response:", parseError);
        return {
          recommendedType: "General",
          reasoning:
            "Gagal memproses analisis otomatis secara teknis, namun data Anda tetap aman.",
          priority: "medium",
          keyInsights: [
            "Silakan periksa laporan laba rugi secara manual untuk sementara waktu.",
          ],
        };
      }
    } catch (error) {
      throw new Error(`AI Analysis Error: ${error.message}`);
    }
  }

  async testConnection(testModel = null) {
    try {
      const model = testModel || this.defaultModel;

      const testResponse = await this.generateRecommendation(
        "API connection test. Please provide a very brief response in Indonesian confirming that the system is working properly.",
        {
          model,
          temperature: 0.1,
          maxTokens: 50,
        }
      );

      return {
        success: true,
        model: model,
        response: testResponse,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Helper Methods
  buildSystemPrompt(recommendationType, language = "id") {
    const prompts = {
      CostSaving: `You are a cost-efficiency consultant expert in identifying saving opportunities. Focus on reducing operational costs, process optimization, and eliminating waste.`,
      RevenueOptimization: `You are a business growth consultant expert in revenue increase strategies. Focus on sales growth, market expansion, and pricing optimization.`,
      CashFlow: `You are a financial management consultant expert in cash flow handling. Focus on managing accounts receivable, accounts payable, and liquidity.`,
      General: `You are a general financial consultant providing holistic recommendations for business financial health.`,
    };

    const basePrompt = prompts[recommendationType] || prompts["General"];

    // Tetap memberikan instruksi bahasa Indonesia meskipun prompt sistemnya bahasa Inggris
    if (language === "id") {
      return `${basePrompt} Please answer in Indonesian language with a structured and easy-to-understand format.`;
    }

    return basePrompt;
  }

  buildVariationSystemPrompt(variationIndex) {
    const approaches = [
      "Focus on short-term solutions that can be implemented immediately",
      "Focus on medium-term strategies with in-depth analysis",
      "Focus on long-term vision with innovative approaches",
    ];

    return `You are a financial consultant. ${
      approaches[variationIndex] || approaches[0]
    }. 
            Please answer in Indonesian language using a different perspective from previous recommendations.`;
  }

  getVariationApproach(index) {
    const approaches = ["Jangka Pendek", "Jangka Menengah", "Jangka Panjang"];
    return approaches[index] || "Pendekatan Umum";
  }
}

module.exports = AIService;
