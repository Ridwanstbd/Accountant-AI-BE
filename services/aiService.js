const axios = require("axios");

class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = "https://openrouter.ai/api/v1/chat/completions";
    this.siteUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    this.siteName = process.env.SITE_NAME || "AI Recommendation System";

    this.defaultModel =
      process.env.OPENROUTER_MODEL || "deepseek/deepseek-r1:free";
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
          content: `Anda adalah seorang konsultan keuangan AI yang ahli dalam memberikan rekomendasi bisnis. 
                   Berikan rekomendasi yang spesifik, praktis, dan dapat ditindaklanjuti berdasarkan data keuangan yang diberikan.
                   Fokuskan pada penghematan biaya, optimalisasi pendapatan, dan manajemen arus kas.
                   Jawab dalam bahasa Indonesia dengan format yang terstruktur dan mudah dipahami.`,
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

      if (error.response) {
        const errorMessage =
          error.response.data?.error?.message || error.response.statusText;
        throw new Error(
          `OpenRouter API error: ${error.response.status} - ${errorMessage}`
        );
      } else if (error.request) {
        throw new Error(`Network error: Unable to reach OpenRouter API`);
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
        userPrompt = `${context.financialData}\n\nBerdasarkan data keuangan di atas: ${prompt}`;
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

  async generateRecommendationVariations(
    financialSummary,
    variations = 3,
    options = {}
  ) {
    try {
      const promises = [];

      for (let i = 0; i < variations; i++) {
        const variationOptions = {
          ...options,
          temperature: 0.5 + i * 0.2,
          systemPrompt: this.buildVariationSystemPrompt(i),
        };

        promises.push(
          this.generateRecommendation(financialSummary, variationOptions)
        );
      }

      const results = await Promise.all(promises);

      return results.map((text, index) => ({
        variation: index + 1,
        text: text,
        approach: this.getVariationApproach(index),
      }));
    } catch (error) {
      throw new Error(
        `Failed to generate recommendation variations: ${error.message}`
      );
    }
  }

  async analyzeFinancialData(financialData) {
    try {
      const analysisPrompt = `
        Analisis data keuangan berikut dan berikan rekomendasi tipe analisis yang paling sesuai:
        
        Total Pendapatan: Rp${
          financialData.totalRevenue?.toLocaleString("id-ID") || 0
        }
        Total Beban: Rp${
          financialData.totalExpense?.toLocaleString("id-ID") || 0
        }
        Laba/Rugi: Rp${
          (
            financialData.totalRevenue - financialData.totalExpense
          )?.toLocaleString("id-ID") || 0
        }
        Jumlah Transaksi: ${financialData.transactionCount || 0}
        
        Berdasarkan data ini, kategori rekomendasi apa yang paling dibutuhkan?
        Pilih dari: CostSaving, RevenueOptimization, CashFlow, atau General
        
        Berikan jawaban dalam format JSON:
        {
          "recommendedType": "kategori_yang_dipilih",
          "reasoning": "alasan_pemilihan",
          "priority": "high/medium/low",
          "keyInsights": ["insight1", "insight2"]
        }
      `;

      const response = await this.generateRecommendation(analysisPrompt, {
        temperature: 0.3,
        maxTokens: 500,
      });

      try {
        const analysis = JSON.parse(response);
        return analysis;
      } catch (parseError) {
        return {
          recommendedType: "General",
          reasoning: "Analisis otomatis gagal, menggunakan kategori umum",
          priority: "medium",
          keyInsights: ["Diperlukan analisis manual lebih lanjut"],
        };
      }
    } catch (error) {
      throw new Error(`Failed to analyze financial data: ${error.message}`);
    }
  }

  async testConnection(testModel = null) {
    try {
      const model = testModel || this.defaultModel;

      const testResponse = await this.generateRecommendation(
        "Test koneksi API. Berikan respon singkat bahwa sistem berfungsi dengan baik.",
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

  async getAvailableModels() {
    try {
      return [
        {
          id: "nex-agi/deepseek-v3.1-nex-n1:free",
          name: "DeepSeek R1 (Free)",
          description: "Free tier model for general use",
        },
      ];
    } catch (error) {
      throw new Error(`Failed to get available models: ${error.message}`);
    }
  }

  isConfigured() {
    return !!(this.apiKey && this.baseUrl);
  }

  getConfig() {
    return {
      configured: this.isConfigured(),
      model: this.defaultModel,
      baseUrl: this.baseUrl,
      siteUrl: this.siteUrl,
      siteName: this.siteName,
      hasApiKey: !!this.apiKey,
    };
  }

  buildSystemPrompt(recommendationType, language = "id") {
    const prompts = {
      CostSaving: `Anda adalah konsultan efisiensi biaya yang ahli dalam mengidentifikasi peluang penghematan.
                     Fokuskan rekomendasi pada pengurangan biaya operasional, optimasi proses, dan eliminasi pembororan.`,

      RevenueOptimization: `Anda adalah konsultan pertumbuhan bisnis yang ahli dalam strategi peningkatan pendapatan.
                              Fokuskan rekomendasi pada peningkatan penjualan, ekspansi pasar, dan optimasi pricing.`,

      CashFlow: `Anda adalah konsultan manajemen keuangan yang ahli dalam pengelolaan arus kas.
                   Fokuskan rekomendasi pada pengelolaan piutang, hutang, dan likuiditas perusahaan.`,

      General: `Anda adalah konsultan keuangan umum yang memberikan rekomendasi holistik untuk kesehatan finansial bisnis.`,
    };

    const basePrompt = prompts[recommendationType] || prompts["General"];

    if (language === "id") {
      return `${basePrompt} Berikan rekomendasi dalam bahasa Indonesia dengan format yang terstruktur dan mudah dipahami.`;
    }

    return basePrompt;
  }

  buildVariationSystemPrompt(variationIndex) {
    const approaches = [
      "Fokus pada solusi jangka pendek yang dapat diimplementasikan segera",
      "Fokus pada strategi jangka menengah dengan analisis mendalam",
      "Fokus pada visi jangka panjang dengan pendekatan inovatif",
    ];

    return `Anda adalah konsultan keuangan. ${
      approaches[variationIndex] || approaches[0]
    }. 
            Berikan rekomendasi dalam bahasa Indonesia dengan pendekatan yang berbeda dari rekomendasi sebelumnya.`;
  }

  getVariationApproach(index) {
    const approaches = [
      "Jangka Pendek - Solusi Cepat",
      "Jangka Menengah - Analisis Mendalam",
      "Jangka Panjang - Visi Inovatif",
    ];

    return approaches[index] || "Pendekatan Umum";
  }
}

module.exports = AIService;
