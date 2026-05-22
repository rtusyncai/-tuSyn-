import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const handleGeminiError = (error: any, fallbackData: any) => {
  const isRateLimit = error?.message?.includes('429') || error?.status === 429 || JSON.stringify(error).includes('429');
  
  if (isRateLimit) {
    console.warn("Gemini Rate Limit Reached. Using structured fallback.");
    return {
      ...fallbackData,
      _isFallback: true,
      _errorContext: "RESOURCE_EXHAUSTED"
    };
  }
  
  console.error("Gemini API Error:", error);
  return fallbackData;
};

export const geminiService = {
  async generateDoshaRecommendations(dosha: string, persona: string, season: string, goals?: string, patientData?: any, locationContext?: any) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `As an Integrative Health Expert, provide "Perfect" recommendations for a ${persona} with a dominant ${dosha} dosha during the ${season} season. 
        
        INTEGRATION GUIDELINES:
        1. Blended Wisdom: Provide lifestyle, dietary, and rejuvenation advice that flawlessly blends Ayurvedic principles (Dosha, Dhatu, Agni) with Modern Nutritional and Clinical Science (Metabolism, Hormones, Circadian Rhythm).
        2. Regional Intelligence: Based on the location ${JSON.stringify(locationContext || "Unknown")}, incorporate regional medical knowledge (Local herbs, climate-specific practices).
        3. Tailored Focus: ${goals ? `Specifically address health goals or challenges: "${goals}".` : ''}
        
        PATIENT CONTEXT:
        ${JSON.stringify(patientData || {})}
        
        If the user is in a specialized phase like Pregnancy/Prenatal care, provide strictly safe and optimized guidance for mother and child.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lifestyle: { type: Type.ARRAY, items: { type: Type.STRING } },
              dietary: { type: Type.ARRAY, items: { type: Type.STRING } },
              rasayana: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Ayurvedic Rejuvenation or Modern specialized supplements." },
              modernPerspective: { type: Type.STRING, description: "A brief modern clinical/scientific explanation of the recommendations." },
              regionalPerspectives: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Relevant regional medical knowledge." },
              summary: { type: Type.STRING },
              fulfillmentActions: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["kitchen", "marketplace"], description: "Intelligently sensed fulfillment path based on location/context." },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Items to order or link to." },
                  rationale: { type: Type.STRING, description: "Why this specifically fits the sensed context." }
                },
                required: ["type", "title", "description", "items", "rationale"]
              }
            },
            required: ["lifestyle", "dietary", "rasayana", "summary", "modernPerspective", "fulfillmentActions"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return handleGeminiError(e, { 
        lifestyle: ["Maintain routine", "Standard hydration"], 
        dietary: ["Seasonal vegetables", "Whole grains"], 
        rasayana: ["Standard multivitamin"], 
        summary: "Neural recommendations are refreshing. Please check back in a moment.", 
        modernPerspective: "System is optimizing performance.",
        fulfillmentActions: { type: "marketplace", title: "General Wellness", description: "Standard alignment tools.", items: ["Herbal Tea"], rationale: "General balancing." }
      });
    }
  },

  async analyzeMeal(base64Image: string, patientData?: any, locationContext?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          { text: `Analyze this meal or collection of ingredients as a "Perfect" Integrated Nutritionist. 
          Identify the food or raw materials, its properties (Gunas, Macros, Micros), and suggest balancing additions.
          
          INTEGRATION REQUIREMENTS:
          - Raw Materials: If ingredients are shown, explain how they should be combined or cooked.
          - Ayurvedic Analysis: Dosha impact (Vata, Pitta, Kapha), Agni interaction.
          - Modern Medical Analysis: Glycemic index, Hormonal impact, Nutritional density.
          - Regional Context: ${JSON.stringify(locationContext || "Unknown")}. Incorporate regional food knowledge or local alternatives.
          
          PATIENT CONTEXT:
          ${JSON.stringify(patientData || {})}
          
          If the patient is in a phase like Pregnancy/Prenatal care, provide specific safety checks and nutritional optimization advice.
          Also, if raw ingredients are identified, suggest 2 suitable recipes.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING },
            properties: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Integrated properties (Gunas + Modern Nutrition)" },
            vataAdvice: { type: Type.STRING },
            pittaAdvice: { type: Type.STRING },
            kaphaAdvice: { type: Type.STRING },
            modernNutritionalInsight: { type: Type.STRING },
            regionalRecommendation: { type: Type.STRING },
            suggestedRecipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  reason: { type: Type.STRING, description: "Why this recipe fits the identified ingredients and dosha." }
                },
                required: ["title", "reason"]
              }
            },
            fulfillmentActions: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["kitchen", "marketplace"], description: "Intelligently sensed fulfillment path based on location/context." },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Items to order or link to." },
                rationale: { type: Type.STRING, description: "Why this specifically fits the sensed context." }
              },
              required: ["type", "title", "description", "items", "rationale"]
            }
          },
          required: ["foodName", "properties", "vataAdvice", "pittaAdvice", "kaphaAdvice", "modernNutritionalInsight", "fulfillmentActions"]
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse meal analysis:", e);
      return { foodName: "Unknown", properties: [], vataAdvice: "", pittaAdvice: "", kaphaAdvice: "", modernNutritionalInsight: "" };
    }
  },

  async findRecipes(dosha: string, patientData?: any, locationContext?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 3 "Perfect" recipes that integrate Ayurvedic Dosha balancing with Modern Clinical Nutrition.
      Target Dosha: ${dosha}.
      
      PATIENT CONTEXT:
      ${JSON.stringify(patientData || {})}
      
      LOCATION CONTEXT:
      ${JSON.stringify(locationContext || "Unknown")}
      
      REQUIREMENTS:
      - Blend ancient Ayurvedic recipes with modern superfoods and scientific nutritional principles.
      - If user is in Pregnancy/Prenatal care phase, provide pregnancy-safe recipes rich in necessary nutrients (Folate, Iron, etc.).
      - Use regional ingredients based on location context if possible.
      - Provide detailed nutritional info (Macros and Micros).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              integratedBenefits: { type: Type.STRING, description: "Description of how this recipe blends Ayurveda and Modern science." },
              regionalSignificance: { type: Type.STRING },
              seasonalReason: { type: Type.STRING, description: "Why this recipe is ideal for the current season in the user's location." },
              nutritionalInfo: {
                type: Type.OBJECT,
                properties: {
                  macros: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.STRING },
                      protein: { type: Type.STRING },
                      carbs: { type: Type.STRING },
                      fats: { type: Type.STRING }
                    },
                    required: ["calories", "protein", "carbs", "fats"]
                  },
                  micros: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key vitamins and minerals." }
                },
                required: ["macros", "micros"]
              },
              fulfillmentActions: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["kitchen", "marketplace"], description: "Intelligently sensed fulfillment path based on location/context." },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Items to order or link to." },
                  rationale: { type: Type.STRING, description: "Why this specifically fits the sensed context." }
                },
                required: ["type", "title", "description", "items", "rationale"]
              }
            },
            required: ["title", "description", "ingredients", "instructions", "integratedBenefits", "nutritionalInfo", "fulfillmentActions"]
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse recipes:", e);
      return [];
    }
  },

  async findNearbyHarvestRecipes(location: string, dosha: string, season: string, patientData?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an Integrated Nutritionist and Foraging/Farming Expert, find 3 recipes specifically using "Nearby Harvest" ingredients available in ${location} during the ${season} season. 
      Target Dosha: ${dosha}.
      
      INTEGRATION REQUIREMENTS:
      1. Seasonal & Local: Prioritize ingredients that are native or in-season for ${location}.
      2. Integrated Wisdom: Blend Ayurvedic culinary rules for ${dosha} with modern science on seasonal nutrient density.
      3. Practicality: Ensure ingredients are realistically obtainable in a local market or home garden.
      4. Ecological and Health Benefits: Provide explicit explanations of the ecological benefits (supporting local farmers, lower food miles, eco-system preservation) and the biochemical health benefits (Dosha balance, seasonal nutrient density) of enjoying these ingredients.
      
      PATIENT CONTEXT:
      ${JSON.stringify(patientData || {})}
      
      Provide detailed nutritional info and explain the "Nearby Harvest" significance, including ecological and health benefits.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              nearbyIngredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Locally available seasonal ingredients." },
              instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              integratedBenefit: { type: Type.STRING },
              seasonalSignificance: { type: Type.STRING },
              ecologicalBenefits: { type: Type.STRING, description: "Brief explanation of ecological benefits such as reduced carbon footprint and local sourcing." },
              healthBenefits: { type: Type.STRING, description: "Brief explanation of health benefits balancing the target dosha and providing season-specific nutrients." },
              nutritionalInfo: {
                type: Type.OBJECT,
                properties: {
                  macros: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.STRING },
                      protein: { type: Type.STRING }
                    },
                    required: ["calories", "protein"]
                  }
                },
                required: ["macros"]
              },
              fulfillmentActions: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["kitchen", "marketplace"], description: "Intelligently sensed fulfillment path based on location/context." },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Items to order or link to." },
                  rationale: { type: Type.STRING, description: "Why this specifically fits the sensed context." }
                },
                required: ["type", "title", "description", "items", "rationale"]
              }
            },
            required: ["title", "description", "nearbyIngredients", "instructions", "integratedBenefit", "seasonalSignificance", "ecologicalBenefits", "healthBenefits", "nutritionalInfo", "fulfillmentActions"]
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse nearby harvest recipes:", e);
      return [];
    }
  },

  async getPlantingRecommendations(dosha: string, location: string, patientData?: any, refinementGoals?: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an Integrated Ethnobotanist and Farming Consultant, recommend a "Dosha-Aligned Garden Plan" for a user with dominant ${dosha} in ${location}.
      
      INTEGRATION REQUIREMENTS:
      1. Dosha-Based Motivation: Explain why specific plants are needed to balance ${dosha} (e.g., cooling herbs for Pitta).
      2. Medicinal and Kitchen Utility: Recommend 4 items to plant (herbs/vegetables/medicinal plants).
      3. Organic Farming Motivation: Provide advice on organic methods tailored to the region.
      4. Marketplace Potential: Suggest which plants could be sold as kitchen produce or processed goods in a marketplace.
      5. Actionable Wisdom: For each plant, provides a concise "Planting Tip" (e.g., specific soil preference, sun exposure, or companion planting advice).
      
      ${refinementGoals ? `REFINEMENT REQUEST: The user has requested to refine the plan with these specific goals: "${refinementGoals}". Adjust the plan and plant selection to prioritize these goals while maintaining Dosha balance.` : ''}

      PATIENT CONTEXT:
      ${JSON.stringify(patientData || {})}
      
      Return as structured JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            motivatorText: { type: Type.STRING, description: "A powerful, poetic, and scientific motivator to start planting." },
            plants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["Herb", "Vegetable", "Medicinal", "Fruit"] },
                  doshaBenefit: { type: Type.STRING },
                  modernClinicalValue: { type: Type.STRING },
                  marketplaceValue: { type: Type.STRING, description: "Why this is good to sell." },
                  plantingTip: { type: Type.STRING }
                },
                required: ["name", "type", "doshaBenefit", "modernClinicalValue", "marketplaceValue", "plantingTip"]
              }
            },
            farmingWisdom: { type: Type.STRING },
            regionalCycle: { type: Type.STRING, description: "When to plant based on local climate/season." }
          },
          required: ["title", "motivatorText", "plants", "farmingWisdom", "regionalCycle"]
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse planting recommendations:", e);
      return null;
    }
  },

  async generateSonicComposition(input: string, context: 'disease' | 'emotion' | 'ambience', patientData?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a "Perfect" therapeutic sonic composition profile for the following context: "${input}".
      Context Category: ${context}.
      
      INTEGRATION REQUIREMENTS:
      - Blend Ayurvedic Sound Healing (Bija Mantras, specialized ragas, specific instrument energetic impacts) with Modern Psychoacoustics and Music Therapy (Binaural beats, Solfeggio frequencies, specific BPMs for heart rate entrainment).
      - If input is a specific disease, research and apply frequencies or rhythmic patterns known in research or tradition to assist in the healing of that specific condition.
      
      PATIENT CONTEXT:
      ${JSON.stringify(patientData || {})}
      
      Provide:
      1. A poetic name and clinical description.
      2. BPM (Beats per Minute).
      3. Key frequencies (e.g., 432Hz, 528Hz).
      4. Dominant instruments/textures (e.g., Woodwinds for Vata, Stringed for Pitta, Percussion for Kapha).
      5. A structural progression (3 phases: Intro, Core, Outro).
      6. A "Sonic Prescription": A brief explanation of how this specific audio profile interacts with the user's biology and Dosha.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            bpm: { type: Type.NUMBER },
            frequencies: { type: Type.ARRAY, items: { type: Type.STRING } },
            instruments: { type: Type.ARRAY, items: { type: Type.STRING } },
            progression: {
              type: Type.OBJECT,
              properties: {
                intro: { type: Type.STRING },
                core: { type: Type.STRING },
                outro: { type: Type.STRING }
              },
              required: ["intro", "core", "outro"]
            },
            sonicPrescription: { type: Type.STRING }
          },
          required: ["title", "description", "bpm", "frequencies", "instruments", "progression", "sonicPrescription"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async generateMeditation(feeling: string, patientData?: any, duration?: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a guided breathing session for someone feeling ${feeling}${duration ? ` for a duration of ${duration} minutes` : ''}.
      
      INTEGRATION REQUIREMENTS:
      - Blend Ayurvedic Pranayama techniques with Modern Neuroscience (Vagus Nerve stimulation, Cortisol reduction).
      - If user is in Pregnancy/Prenatal care phase, provide safe, grounding prenatal meditation techniques.
      
      PATIENT CONTEXT:
      ${JSON.stringify(patientData || {})}
      
      Include a title, description, and a script for two speakers.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            integratedWisdom: { type: Type.STRING, description: "Explaining the blend of Pranayama and Neuroscience." },
            script: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["speaker", "text"]
              }
            },
            suggestedAromas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  benefit: { type: Type.STRING },
                  ayurvedicProperty: { type: Type.STRING }
                },
                required: ["name", "benefit", "ayurvedicProperty"]
              }
            },
            fulfillmentActions: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["kitchen", "marketplace"], description: "Intelligently sensed fulfillment path based on location/context." },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Items to order or link to." },
                rationale: { type: Type.STRING, description: "Why this specifically fits the sensed context." }
              },
              required: ["type", "title", "description", "items", "rationale"]
            }
          },
          required: ["title", "description", "script", "integratedWisdom", "suggestedAromas", "fulfillmentActions"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async refineHabitatPlan(existingPlan: any, refinementInput: string, patientData?: any, location?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Refine the following habitat plan based on the user's specific adjustments/goals: "${refinementInput}".
      
      EXISTING PLAN:
      ${JSON.stringify(existingPlan)}
      
      INTEGRATION REQUIREMENTS:
      - Maintain the core Ayurvedic and Vaastu principles while strictly addressing the user's new requirements.
      - Vata Balancing: If not already prioritized, focus on Vata-balancing practices (warmth, grounding, moisture, oily textures, soft lighting).
      - Sustainable & Sacred: Ensure decor elements are sustainable, eco-friendly, and align with Ayurvedic naturalism.
      - Biophilic Integration: Incorporate specific plant recommendations suitable for the user's location (${JSON.stringify(location || "Unknown")}).
      
      PATIENT CONTEXT:
      ${JSON.stringify(patientData || {})}
      
      Provide the refined version of:
      1. A title for the plan.
      2. A color palette (3 colors).
      3. Decor elements (3 items) - must be sustainable.
      4. Plants (3 recommendations) - specific to location.
      5. Sensory experience suggestions (3 items).
      6. Integrated Environment Wisdom: Updated advice reflecting the refinement.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
            decor: { type: Type.ARRAY, items: { type: Type.STRING } },
            plants: { type: Type.ARRAY, items: { type: Type.STRING } },
            sensory: { type: Type.ARRAY, items: { type: Type.STRING } },
            integratedWisdom: { type: Type.STRING },
            fulfillmentActions: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["kitchen", "marketplace"], description: "Intelligently sensed fulfillment path based on location/context." },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Items to order or link to." },
                rationale: { type: Type.STRING, description: "Why this specifically fits the sensed context." }
              },
              required: ["type", "title", "description", "items", "rationale"]
            }
          },
          required: ["title", "colors", "decor", "plants", "sensory", "integratedWisdom", "fulfillmentActions"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async suggestAromas(mood: string, meditationType?: string, patientData?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Recommend 3 essential oil aromas for a user who is feeling ${mood} ${meditationType ? `and is doing a ${meditationType} meditation` : ''}.
      
      INTEGRATION REQUIREMENTS:
      - Blend Ayurvedic Aromatherapy (Pradhana, Guna impact on Doshas) with Modern Olfactory Neuroscience (Impact on limbic system and emotional regulation).
      
      PATIENT CONTEXT:
      ${JSON.stringify(patientData || {})}
      
      Return as a structured JSON array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              benefit: { type: Type.STRING },
              ayurvedicProperty: { type: Type.STRING, description: "e.g., Pitta-pacifying, Vata-grounding" },
              limbicImpact: { type: Type.STRING, description: "Modern scientific impact on the brain." }
            },
            required: ["name", "benefit", "ayurvedicProperty", "limbicImpact"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  },

  async searchHypermarketInventory(query: string, region: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `As a Hypermarket Inventory Agent, map the user query "${query}" to available bulk items from major hypermarkets in the "${region}" region.
        
        REQUIREMENTS:
        1. Identify 4 items typically sold in hypermarkets (Walmart, Costco, Big Bazaar, etc. equivalents).
        2. Provide "Dropship Feasibility": A score from 0-100 based on weight, fragile status, and margin.
        3. Logistics Insight: Suggest the best local hypermarket node for fulfillment in ${region}.
        4. Alignment: Explain how these standard hypermarket items can be "Sacred-Aligned" (e.g., specific brands that are known for quality or raw materials).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                brand: { type: Type.STRING },
                estimatedPrice: { type: Type.STRING },
                dropshipFeasibility: { type: Type.NUMBER },
                fulfillmentNode: { type: Type.STRING },
                sacredAlignment: { type: Type.STRING },
                category: { type: Type.STRING }
              },
              required: ["name", "brand", "estimatedPrice", "dropshipFeasibility", "fulfillmentNode", "sacredAlignment"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return handleGeminiError(e, []);
    }
  },

  async optimizeDropshipLogistics(items: any[], destination: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Optimize dropshipping logistics for these items: ${JSON.stringify(items)} to be delivered to ${destination}.
        
        LOGISTICS REQUIREMENTS:
        1. Consolidate: Group items into the minimum number of shipments.
        2. Routing: Suggest the "Neural Efficiency Path" (fastest + lowest carbon footprint).
        3. Carbon Impact: Estimate total CO2 offset required.
        4. Impact Fee: Suggest a small donation amount (e.g., 1-2% of total) to be diverted to the user's active charity.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              consolidationStrategy: { type: Type.STRING },
              neuralPath: { type: Type.STRING },
              carbonOffsetEstimate: { type: Type.STRING },
              impactFeeSuggestion: { type: Type.NUMBER },
              estimatedDeliveryDays: { type: Type.NUMBER }
            },
            required: ["consolidationStrategy", "neuralPath", "carbonOffsetEstimate", "impactFeeSuggestion", "estimatedDeliveryDays"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return handleGeminiError(e, {
        consolidationStrategy: "Single node processing",
        neuralPath: "Direct regional route",
        carbonOffsetEstimate: "0.5kg CO2",
        impactFeeSuggestion: 1.50,
        estimatedDeliveryDays: 3
      });
    }
  },

  async analyzeJournal(content: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this journal entry: "${content}". Provide a gentle summary and identify key emotions.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              emotions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "emotions"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return handleGeminiError(e, {
        summary: "Reflection archived for later analysis. The Wisdom Index is currently recalibrating.",
        emotions: ["Pensive", "Reflecting"]
      });
    }
  },

  async analyzeMedicalDocument(base64Image: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
            { text: `Analyze this medical document (e.g., lab report, prescription, health record) as an "Integrated AI Clinician". 
            Extract and structure critical health data for the user's bio-profile.
            
            EXTRACT WITH HIGH PRECISION:
            1. Diagnoses / Medical Conditions: Formally identified clinical conditions.
            2. Medications: Current prescribed drugs or supplements mentioned, including dosages if available.
            3. Allergies & Sensitivities: Specific drug, food, or environmental allergies.
            4. Clinically Significant Findings: Key metrics or observations (e.g., "Elevated Cholestrol", "BP: 140/90").
            5. Document Context: Date of report, facility type, and a concise clinical summary.
            
            INTEGRATED PERSPECTIVE (Optional but Preferred):
            - If possible, briefly mention how these findings might translate into an Ayurvedic context (e.g., "Inflammation related to Pitta elevation").
            
            Return ONLY structured JSON.` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diagnoses: { type: Type.ARRAY, items: { type: Type.STRING } },
              allergies: { type: Type.ARRAY, items: { type: Type.STRING } },
              medications: { type: Type.ARRAY, items: { type: Type.STRING } },
              clinicalFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING },
              ayurvedicInsight: { type: Type.STRING }
            },
            required: ["diagnoses", "allergies", "medications", "summary"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return handleGeminiError(e, {
        diagnoses: [],
        allergies: [],
        medications: [],
        clinicalFindings: [],
        summary: "Neural OCR engine is recalibrating. Please try again or manually input data.",
        ayurvedicInsight: ""
      });
    }
  },

  async generateHabitatPlan(room: string, intention: string, patientData?: any, location?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a "Perfect" integrated habitat plan for a room described as "${room}" with the intention of "${intention}".
      
      INTEGRATION REQUIREMENTS:
      - Blend Vaastu Shastra and Ayurvedic environmental principles with Modern Environmental Science (Air quality, Biophilic design, Ergonomics).
      - Vata Balancing: Prioritize grounding and warming elements.
      - Sustainable Decor: Recommend eco-friendly, non-toxic materials.
      - Sacred Flora: Include 3 plants specifically recommended for the user's location (${JSON.stringify(location || "Unknown")}) and their Dosha/Intention.
      - If user is in Pregnancy/Prenatal care phase, focus on creating a supportive, toxic-free, and nurturing nursery or restful space.
      
      PATIENT CONTEXT:
      ${JSON.stringify(patientData || {})}
      
      Provide:
      1. A title for the plan.
      2. A color palette (3 colors) based on color psychology and Dosha.
      3. Decor elements (3 sustainable items).
      4. Plants (3 items tailored to location).
      5. Sensory experience suggestions (3 items).
      6. Integrated Environment Wisdom: A piece of advice blending Vaastu and Modern Environmental health.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
            decor: { type: Type.ARRAY, items: { type: Type.STRING } },
            plants: { type: Type.ARRAY, items: { type: Type.STRING } },
            sensory: { type: Type.ARRAY, items: { type: Type.STRING } },
            integratedWisdom: { type: Type.STRING },
            fulfillmentActions: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["kitchen", "marketplace"], description: "Intelligently sensed fulfillment path based on location/context." },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Items to order or link to." },
                rationale: { type: Type.STRING, description: "Why this specifically fits the sensed context." }
              },
              required: ["type", "title", "description", "items", "rationale"]
            }
          },
          required: ["title", "colors", "decor", "plants", "sensory", "integratedWisdom", "fulfillmentActions"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async generateYogaFlow(dosha: string, mood: 'Energizing' | 'Restorative' | 'Focus', patientData?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a personalized Ayurvedic Yoga Flow (Asana Sequence).
      Target Dosha: ${dosha}.
      Intended Mood: ${mood}.
      
      INTEGRATION REQUIREMENTS:
      1. Ayurvedic Sequencing: Sequence asanas to balance ${dosha} based on the chosen mood. 
         (e.g., Pitta needs cooling/stable, Vata needs grounding/warming, Kapha needs stimulating/light).
      2. Modern Biomechanics: Ensure transitions are safe and beneficial for mobility and joint health.
      3. Integrated Wisdom: Explain how the sequence specifically balances the ${dosha} sub-doshas or gunas.
      
      PATIENT CONTEXT:
      ${JSON.stringify(patientData || {})}
      
      Provide:
      1. A poetic name and clinical description of the flow.
      2. 5 asanas in sequence with specific benefits.
      3. A "Breathe & Focus" instruction for each asana.
      4. A "Sub-Dosha Impact" explanation.
      5. A "Video Search Query" to find a relevant video for this specific flow.
      6. An "Animation Manifest": A short list of 1-word pose keys (e.g. "mountain", "plank", "cobra", "downward-dog", "warrior", "tree", "childs-pose") that correspond to this flow for a digital animation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            integratedWisdom: { type: Type.STRING },
            asanas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  benefit: { type: Type.STRING },
                  breathing: { type: Type.STRING },
                  spiritualFocus: { type: Type.STRING }
                },
                required: ["name", "benefit", "breathing"]
              }
            },
            subDoshaImpact: { type: Type.STRING },
            videoSearchQuery: { type: Type.STRING },
            animationManifest: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "description", "asanas", "integratedWisdom", "subDoshaImpact", "videoSearchQuery", "animationManifest"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async generateAyurWearDesign(category: 'ornament' | 'clothing', dosha: string, intention: string, patientData?: any, base64Image?: string, refinement?: string) {
    const parts: any[] = [
      { text: `Design a sacred "Perfect" Integrated ${category === 'ornament' ? 'Ornament' : 'Clothing/Apparel'} for a user with a ${dosha} profile and the intention of "${intention}". 
      
      ${refinement ? `REFINEMENT / SPECIFIC REQUEST: "${refinement}". Prioritize these specific aesthetic or functional details in the design.` : ""}

      INTEGRATION REQUIREMENTS:
      - Ayurvedic Base: Materials (metals, gems, herbs, or fabrics) that balance the ${dosha} dosha.
      - Modern Functional Perspective: How the ${category} interacts with modern physiology (e.g., circulation, skin-contact benefits, or psychological grounding).
      - Specialized Care: If in Pregnancy/Prenatal care phase, ensure materials are hypoallergenic and strictly safe for pregnancy.
      
      ${category === 'clothing' ? `
      CLOTHING SPECIFIC FEATURES:
      - Design unique styles inspired by traditional motifs but with modern utility.
      - Patterns: Include "Birthstar Plant Chemistry Abstracts" (visualizing the chemical signature or molecular structure of the plant associated with the user's birthstar/Nakshatra).
      - Hardware/Accents: Suggest unique functional elements like "Sandalwood Buttons", copper-infused thread, or medicinal dyed fabrics.
      - Botany Tags: For every material or pattern, explain the botany/phytochemistry or other curious clinical features (e.g., how the aroma of sandalwood buttons interacts with the olfactory system to reduce Pitta).
      ` : ""}

      ${base64Image ? "- Visual Context: Use the provided image as aesthetic or symbolic inspiration for the design, while maintaining the Ayurvedic principles." : ""}
      
      PATIENT CONTEXT:
      ${JSON.stringify(patientData || {})}
      
      Include a name, description, materials, and symbolism.` }
    ];

    if (base64Image) {
      parts.unshift({
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg"
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            modernPerspective: { type: Type.STRING },
            materials: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  name: { type: Type.STRING },
                  property: { type: Type.STRING },
                  modernBenefit: { type: Type.STRING },
                  botanyTag: { type: Type.STRING, description: "Detailed explanation of the botany, phytochemistry, or curious clinical features of this material/element." }
                },
                required: ["type", "name", "property", "modernBenefit"]
              }
            },
            symbolism: { type: Type.STRING }
          },
          required: ["name", "description", "materials", "symbolism", "modernPerspective"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async generatePrescription(input: string, patientData?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an Integrative Medical Doctor and Subject Specialist, generate a professional, structured prescription based on the following consultation session.
      Transcript/Input: ${input}
      Patient Context: ${JSON.stringify(patientData || {})}
      
      REQUIREMENTS:
      - Use standard diagnostic principles and procedures.
      - The prescription must include Patient Info, Diagnostic Summary (Integrated), Medications (with dosage, time, and instructions), Lifestyle/Dietary rules, and Follow-up plan.
      - Blend Ayurvedic (Prakriti, Vikriti) with Modern Clinical details.
      - Provide relevant ICD-10 Codes for the identified conditions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prescriptionId: { type: Type.STRING },
            date: { type: Type.STRING },
            diagnosticSummary: { type: Type.STRING },
            icdCodes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Relevant ICD-10 clinical codes." },
            medications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  instructions: { type: Type.STRING }
                },
                required: ["name", "dosage", "frequency", "instructions"]
              }
            },
            lifestyleDietary: { type: Type.ARRAY, items: { type: Type.STRING } },
            advice: { type: Type.STRING },
            followUp: { type: Type.STRING }
          },
          required: ["prescriptionId", "diagnosticSummary", "medications", "lifestyleDietary", "advice", "followUp", "icdCodes"]
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse prescription:", e);
      return null;
    }
  },

  async generateLocationPlan(location: string, latLng: { lat: number, lng: number }, dosha: string, patientData?: any) {
    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (latLng) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: latLng.lat,
            longitude: latLng.lng
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an Integrated Wellness Guide, create a "Sacred Terrain Manifest" for the user currently in or near ${location}.
      Target Dosha: ${dosha}.
      
      REQUIREMENTS:
      1. Location Intelligence: Use Google Maps grounded search to find real, relevant wellness spots:
         - Ayurvedic Centers or Spas.
         - Yoga Studios with specific alignments.
         - Organic Markets or Health Food stores.
         - Parks or Biophilic spaces for grounding.
      2. Integrated Reasoning: For each spot, explain how it balances ${dosha} and its modern health benefits.
      3. Precise Actions: Suggest 3 specific "Sacred Actions" to take in this location today (e.g., 'Grounding walk in [Park Name]', 'Vata-soothing tea at [Cafe Name]').
      
      Return as a structured guide formatted with Markdown.`,
      config
    });

    return {
      text: response.text || "",
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  },

  async generateTreatmentSuggestions(input: string, patientData?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an Ayurvedic and Modern Medicine Subject Specialist, act with a dynamic, human-like brain to analyze the following input and suggest a comprehensive treatment plan following advanced clinical principles.
      Input: ${input}
      Patient Context: ${JSON.stringify(patientData || {})}
      
      Provide specialist-grade analysis:
      1. Diagnostic impression (Integrated Ayurvedic & Modern Clinical perspectives).
      2. Relevant ICD-10 Classification codes.
      3. Lifestyle and Dietary advice based on clinical procedures.
      4. Precisely tailored Ayurvedic and Modern medical suggestions.
      5. Necessary Diagnostic Tests (Pathology, Imaging, or Ancient Nadi/Rog Pariksha).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            diagnosticImpression: { type: Type.STRING },
            icd10Classification: { type: Type.ARRAY, items: { type: Type.STRING } },
            lifestyle: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  confidenceScore: { type: Type.NUMBER }
                },
                required: ["text", "confidenceScore"]
              } 
            },
            dietary: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  confidenceScore: { type: Type.NUMBER }
                },
                required: ["text", "confidenceScore"]
              } 
            },
            suggestedMedicines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  confidenceScore: { type: Type.NUMBER }
                },
                required: ["name", "reason", "dosage", "confidenceScore"]
              }
            },
            suggestedTherapies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  confidenceScore: { type: Type.NUMBER }
                },
                required: ["name", "reason", "confidenceScore"]
              }
            },
            suggestedTests: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  confidenceScore: { type: Type.NUMBER }
                },
                required: ["name", "reason", "confidenceScore"]
              }
            }
          },
          required: ["summary", "diagnosticImpression", "lifestyle", "dietary", "suggestedMedicines", "suggestedTherapies", "suggestedTests"]
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse treatment suggestions:", e);
      return { summary: "", diagnosticImpression: "", lifestyle: [], dietary: [], suggestedMedicines: [], suggestedTherapies: [], suggestedTests: [] };
    }
  },

  async getConsultationGuidance(transcript: string, patientData?: any, locationContext?: any, catalog?: { products: any[], services: any[] }) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the current consultation transcript, patient data, and their live location, suggest the next relevant questions to ask the patient following advanced Ayurvedic (Trividha Pariksha, Dashavidha Pariksha, Nadi Pariksha) and Modern clinical diagnostic principles (Symptom Checkers, ICD-10 Pathways).
      
      Transcript: ${transcript}
      Patient Context: ${JSON.stringify(patientData || {})}
      Location Context: ${JSON.stringify(locationContext || "Unknown")}
      Marketplace Catalog: ${JSON.stringify(catalog || { products: [], services: [] })}
      
      Act as a dynamic Subject Specialist:
      1. Use precise clinical procedures and diagnostic methodologies.
      2. Suggest the next logical clinical questions to narrow down a differential diagnosis.
      3. Recommend immediate physical examinations or observations.
      4. Prioritize regional medicine observations based on "${JSON.stringify(locationContext || "Global")}".
      5. Explicitly link findings to relevant marketplace services (Retreats, Hospitals, Therapists) or products.
      
      Return a list of suggested questions, suggested immediate observations/tests, and relevant marketplace items.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  pathway: { type: Type.STRING, enum: ["Ayurvedic", "Modern", "Integrated"] }
                },
                required: ["question", "rationale", "pathway"]
              }
            },
            suggestedObservations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  observation: { type: Type.STRING },
                  rationale: { type: Type.STRING }
                },
                required: ["observation", "rationale"]
              }
            },
            marketplaceSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["product", "service"] },
                  reason: { type: Type.STRING }
                },
                required: ["id", "name", "type", "reason"]
              }
            }
          },
          required: ["suggestedQuestions", "suggestedObservations", "marketplaceSuggestions"]
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse consultation guidance:", e);
      return { suggestedQuestions: [], suggestedObservations: [], marketplaceSuggestions: [] };
    }
  },

  async interpretTestResults(testResultText: string, patientData?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Interpret the following diagnostic test results in the context of the patient's data. Provide both a modern clinical interpretation and an Ayurvedic perspective (e.g., how it relates to Dhatus, Doshas, or Agni).
      Test Results: ${testResultText}
      Patient Context: ${JSON.stringify(patientData || {})}
      
      Return a summary interpretation and specific findings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            modernInterpretation: { type: Type.STRING },
            ayurvedicInterpretation: { type: Type.STRING },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  parameter: { type: Type.STRING },
                  value: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["Normal", "Abnormal", "Critical"] },
                  note: { type: Type.STRING }
                },
                required: ["parameter", "value", "status", "note"]
              }
            }
          },
          required: ["summary", "modernInterpretation", "ayurvedicInterpretation", "findings"]
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse test results:", e);
      return { summary: "Error interpreting results.", modernInterpretation: "", ayurvedicInterpretation: "", findings: [] };
    }
  },

  async getLibraryResources(patientData: any, locationContext?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an "Integrated Librarian" for ṚtuSyn, generate 4 dynamic, customized articles selected from:
      1. Classic Ayurvedic Samhitas (Charaka Samhita, Sushruta Samhita, Ashtanga Hridaya).
      2. Modern Institutional Wisdom (Certified medical modules and doctoral foundations).
      3. Clinical Evidence (Ayurvedic pharmacology, biometric sync, circadian medicine studies).

      CUSTOMIZATION GUIDELINES:
      - Align articles with the patient's data: ${JSON.stringify(patientData || {})}.
      - Consider their location/climate: ${JSON.stringify(locationContext || "Global")}.
      - If they have a health goal, prioritize research or texts related to that goal.

      Each article must have:
      - Title
      - Category (Heritage, Institutional, or Clinical)
      - A descriptive sub-title/summary
      - Full content (written as a readable, educational article with a 'Blended Wisdom' approach: quoting ancient texts and then citing modern science).
      - An icon name (from lucide: Leaf, Sun, Moon, Wind, Book, Flask, Activity).

      Return the articles as a JSON array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              category: { type: Type.STRING },
              content: { type: Type.STRING, description: "Detailed, readable article content using markdown." },
              source: { type: Type.STRING, description: "Specific text, paper title, or syllabus module." },
              iconName: { type: Type.STRING },
              color: { type: Type.STRING, description: "Tailwind bg color, e.g., 'bg-emerald-50'" }
            },
            required: ["title", "subtitle", "category", "content", "source", "iconName", "color"]
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse library resources:", e);
      return [];
    }
  },

  async recommendMarketplaceProducts(patientData: any, products: any[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the patient's data, recommend the top 3 most suitable products from the provided catalog.
      
      PATIENT DATA:
      ${JSON.stringify(patientData)}
      
      CATALOG:
      ${JSON.stringify(products)}
      
      Return a list of product IDs and a brief personalized reason for each recommendation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              productId: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["productId", "reason"]
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse marketplace recommendations:", e);
      return [];
    }
  },

  async curateCustomPackage(goal: string, patientData: any, durationDays: number = 7) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Curate a unique "ṚtuSyn Custom Wellness Package" for a user with goal: "${goal}" over ${durationDays} days.
      Patient Data: ${JSON.stringify(patientData || {})}
      
      The package MUST incorporate:
      1. Neural Chrono-Sync: Scheduling treatments based on biometric data.
      2. AIveda Sonic Entrainment: Specific therapeutic audio profiles.
      3. Ayurvedic procedures (Abhyanga, Swedana, Shirodhara, etc.) adapted with modern science.
      4. Targeted diet based on Agni and Dosha.
      
      Return a structured plan with phases and specific ṚtuSyn unique features.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            packageName: { type: Type.STRING },
            concept: { type: Type.STRING },
            duration: { type: Type.STRING },
            phases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayRange: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  treatments: { type: Type.ARRAY, items: { type: Type.STRING } },
                  sonicFrequency: { type: Type.STRING }
                },
                required: ["dayRange", "focus", "treatments"]
              }
            },
            rtuSynFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
            clinicalBenefits: { type: Type.STRING }
          },
          required: ["packageName", "concept", "duration", "phases", "rtuSynFeatures"]
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse custom package curation:", e);
      return null;
    }
  },

  async recommendMarketplaceServices(patientData: any, services: any[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the patient's data, recommend the top 3 most suitable wellness services (Therapists, Retreats, Hospitals) from the provided catalog.
      
      PRIORITY: If the user needs deep rejuvenation, weight loss management, or stress relief, prioritize the "Neural Chrono-Sync Rejuvenation" (s7) package.
      
      PATIENT DATA:
      ${JSON.stringify(patientData)}
      
      CATALOG:
      ${JSON.stringify(services)}
      
      Return a list of service IDs and a brief personalized reason for each recommendation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              serviceId: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["serviceId", "reason"]
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse service recommendations:", e);
      return [];
    }
  },

  async aivedaDoctorChat(message: string, history: any[], patientData?: any, locationContext?: any, biometrics?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(h => ({
          role: h.role,
          parts: [{ text: h.content }]
        })),
        { role: "user", parts: [{ text: message }] }
      ],
      // @ts-ignore
      tools: [{ googleSearch: {} }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            iotActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  device: { type: Type.STRING, enum: ["diffuser", "shower", "air_purifier", "lighting"] },
                  action: { type: Type.STRING },
                  value: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["device", "action", "value", "reason"]
              }
            }
          },
          required: ["text"]
        },
        systemInstruction: `SYSTEM_INSTRUCTIONS:
        1. Contextual Intelligence: You ARE a professional doctor. Actively remember and reference specific details from the conversation history (e.g., "Earlier you mentioned discomfort in your joints..."). 
        2. Proactive Clarification: Do not wait for the user to give all information. If a symptom is vague, ask targeted clarifying questions (e.g., "Is the pain sharp or dull? Does it get worse in the evening?").
        3. Dinacharya Integration: Proactively suggest age-old yet scientifically validated Dinacharya (daily rituals) based on the user's Dosha and current time/location (e.g., "Since it's early morning and you're Pitta-dominant, I recommend starting with...").
        4. Integrated Diagnostic Perspective: For every health concern, apply clinical principles from both systems. For instance, link an Ayurvedic "Pitta Imbalance" to a Modern Clinical "Inflammatory Pathway" (CRP, Cytokines) and provide relevant ICD-10 diagnostic codes.
        5. Fulfillment Awareness: If you recommend a specific remedy or tool, intelligently sense whether it should be a "kitchen auto-order" (for raw ingredients/herbs) or a "marketplace linkage" (for specialized products).
        6. Digital Empathy: Your tone is compassionate yet rigorous. Your logic is specialist-grade.
        
        PATIENT & LOCATION CONTEXT:
        - Patient Data (includes Dosha, Medical History): ${JSON.stringify(patientData || {})}
        - Current Location Context: ${JSON.stringify(locationContext || {})}
        
        BIOMETRIC TELEMETRY (LIVE):
        ${JSON.stringify(biometrics || {})}
        - Use these live signals (Heart Rate, Stress/Prana Load, Temp) to influence your diagnosis or immediate recommendations.
        - If stress is high, prioritize calming advice.
        
        PERSONALIZATION GUIDELINES:
        1. Dosha Focus: Every piece of advice MUST be filtered through the user's Dosha (e.g., Vata, Pitta, Kapha). If the Dosha is unknown, prioritize determining it via follow-up questions or encourage taking the 'Dosha Quiz'.
        2. Location Contextualization: Use the location (coordinates or regional name) to suggest remedies based on local climate (e.g., 'It's currently humid in your area, which might aggravate Kapha...'), regional herbs, or nearby wellness facilities.
        3. Real-time Adaptation: If the user provides sensory feedback, correlate it with their Dosha and environment.
        
        Fulfillment Response Schema:
        Include "fulfillmentActions" if you recommend items.
        {
          "type": "kitchen" | "marketplace",
          "title": string,
          "description": string,
          "items": string[],
          "rationale": string
        }
        
        NEURO-SYNCHRONOUS COMMUNICATION PROTOCOL:
        If the patient's data indicates a specialized Neuro-Synchronous preference:
        - "Simplified": Use short, direct sentences. Focus on one clear action at a time.
        - "Sensory-Friendly": Use calm, grounding language. 
        - "High-Contrast": Structure information with very clear headings and bullet points.
        
        If the patient has specific allergies, medical history, or health goals, ensure your diagnostic checks and treatment recommendations are strictly aligned, safe, and specialist-grade.
        
        IoT INTEGRATION PROTOCOL:
        - You have control over the user's "diffuser".
        - If the user selects a mood, expresses a strong emotion, or if you recommend a meditative practice, you MUST proactively include an "iotActions" entry for the "diffuser".
        - The "value" should be a specific essential oil or aroma.
        - The "reason" should explain the clinical choice.

        Return your response in the specified JSON format.
        {
          "text": string, // Markdown supported
          "iotActions": Array<{device, action, value, reason}>,
          "fulfillmentActions": {type, title, description, items, rationale} // Optional
        }`
      }
    });
    try {
      return JSON.parse(response.text || '{"text": "I encountered an error processing your request."}');
    } catch (e) {
      console.error("Failed to parse AIveda chat response:", e);
      return { text: response.text || "I encountered an error processing your request." };
    }
  },

  async getRestaurantRecommendations(location: string, context: 'home' | 'office' | 'travel', patientData?: any, latLng?: { latitude: number, longitude: number }) {
    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (latLng) {
      config.toolConfig = {
        retrievalConfig: {
          latLng
        }
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for high-quality restaurants in or near ${location}.
      Context: User is ${context}.
      Patient Context: ${JSON.stringify(patientData || {})}
      
      Requirements:
      1. Use Google Maps to find real, highly-rated dining options.
      2. Analyze their menus for Ayurvedic compatibility (Dosha balancing, seasonal ingredients, Guna/Rasa).
      3. For ${context === 'office' ? 'Office' : context === 'travel' ? 'Travel' : 'Home'} context, provide specific recommendations.
      
      Your response MUST be a Markdown guide with specific restaurant names.
      For EACH restaurant found, include:
      - Name and Type of Cuisine
      - Recommended Menu Items (with specific Ayurvedic/Scientific benefits)
      - Personalized Clinical Reasoning (Blending ancient and modern perspectives)
      - A 'Context Hack' (e.g., 'Order the hot ginger tea to counter Vata aggravation from travel').
      
      You MUST provide the Google Maps name accurately so grounding can link them.`,
      config
    });

    return {
      text: response.text || "",
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  },

  async recommendMarketplaceMeals(marketplaceMeals: any[], patientData: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As AIveda, identify the most clinically appropriate ready-made meals from our marketplace for this traveler.
      
      PATIENT DATA:
      ${JSON.stringify(patientData || {})}
      
      MARKETPLACE MEALS:
      ${JSON.stringify(marketplaceMeals)}
      
      Return top 3 most compatible meals with medical reasoning.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              mealId: { type: Type.STRING },
              reason: { type: Type.STRING },
              clinicalPriority: { type: Type.NUMBER, description: "1-10 priority scale" }
            },
            required: ["mealId", "reason", "clinicalPriority"]
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error("Failed to parse marketplace meal recommendations:", e);
      return [];
    }
  },

  async selectWeeklyCharity() {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As the "Ethical Neural Engine" of ṚtuSyn, select a global or hyper-local charity for this week's automated marketplace contributions.
      
      CRITERIA:
      1. Regenerative Impact: Focus on ecological healing, sustainable food systems, or indigenous wisdom preservation.
      2. Neural Alignment: Support neuro-diversity or cognitive health research.
      3. Community Spirit: Address current global crises or specific local needs (e.g., cloud home kitchen support for the disabled).
      
      Return ONE specific charity with its mission and the logic for its selection.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            mission: { type: Type.STRING },
            selectionLogic: { type: Type.STRING },
            suggestedDonationPercentage: { type: Type.NUMBER, description: "e.g., 2" }
          },
          required: ["name", "mission", "selectionLogic", "suggestedDonationPercentage"]
        }
      }
    });
    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Failed to select weekly charity:", e);
      return { 
        name: "World Central Kitchen", 
        mission: "Providing meals in response to humanitarian, climate, and community crises.",
        selectionLogic: "Fallback selection due to engine sync delay.",
        suggestedDonationPercentage: 2
      };
    }
  },

  async analyzeDocument(base64Data: string, mimeType: string, patientData?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: `Analyze this medical document or report. 
          1. Provide a professional summary of the findings.
          2. Identify any specific medical conditions, allergies, or medications mentioned.
          3. Suggest how this relates to the patient's Ayurvedic profile (Dosha, Agni, etc.).
          4. Extract structured data that could be used to update the patient's profile.
          
          PATIENT CONTEXT:
          ${JSON.stringify(patientData || {})}
          
          Return the analysis in a structured format.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
            ayurvedicPerspective: { type: Type.STRING },
            profileUpdates: {
              type: Type.OBJECT,
              properties: {
                medicalHistory: { type: Type.STRING },
                allergies: { type: Type.STRING },
                medications: { type: Type.STRING }
              }
            }
          },
          required: ["summary", "keyFindings", "ayurvedicPerspective", "profileUpdates"]
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse document analysis:", e);
      return { summary: "Error analyzing document.", keyFindings: [], ayurvedicPerspective: "", profileUpdates: { medicalHistory: "", allergies: "", medications: "" } };
    }
  },

  async generateAivedaWelcome(mood: string, patientData?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As AIveda, a professional Ayurvedic doctor, generate a personalized clinical welcome message for a user who is feeling "${mood}". 
      Include:
      1. A professional greeting.
      2. A brief clinical observation based on their mood and profile.
      3. A supportive statement about their wellness journey.
      
      IoT INTEGRATION:
      - You have control over the user's integrated IoT devices: "diffuser", "shower", "air_purifier", "lighting".
      - Based on the user's current mood, suggest immediate IoT actions to balance their state.
      
      PATIENT CONTEXT:
      ${JSON.stringify(patientData || {})}

      Keep it professional, empathetic, and concise.
      Return your response in a structured JSON format with "text" and "iotActions" (array of {device, action, value, reason}).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            iotActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  device: { type: Type.STRING, enum: ["diffuser", "shower", "air_purifier", "lighting"] },
                  action: { type: Type.STRING },
                  value: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["device", "action", "value", "reason"]
              }
            }
          },
          required: ["text"]
        },
        systemInstruction: "You are AIveda, a professional and intuitive Ayurvedic doctor. Your tone is clinical, empathetic, and expert."
      }
    });
    try {
      return JSON.parse(response.text || '{"text": "Welcome to AIveda Consultation."}');
    } catch (e) {
      console.error("Failed to parse AIveda welcome response:", e);
      return { text: response.text || "Welcome to AIveda Consultation." };
    }
  },

  async generateDinacharyaInsights(dosha: string, timeContext?: string, patientData?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As AIveda, provide a "Proactive Dinacharya" (daily ritual) insight for a ${dosha}-dominant user.
      Time Context: ${timeContext || "Current time"}.
      
      REQUIREMENTS:
      1. Ritual: Suggest one specific ritual suitable for the current time of day that balances ${dosha}.
      2. Modern Science: Explain why it's beneficial from a modern physiological or chronobiological perspective.
      3. Actionable Tip: Provide a small, concrete action the user can take right now.
      
      PATIENT CONTEXT:
      ${JSON.stringify(patientData || {})}
      
      Return as structured JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            ritual: { type: Type.STRING },
            modernBenefit: { type: Type.STRING },
            actionableTip: { type: Type.STRING },
            category: { type: Type.STRING, enum: ["Morning", "Afternoon", "Evening", "Night"] }
          },
          required: ["title", "ritual", "modernBenefit", "actionableTip", "category"]
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse Dinacharya insights:", e);
      return null;
    }
  },

  async generateVeoWellnessPrompt(patientData: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a high-fidelity, professional prompt for Veo (Google's video generation model) to create a wellness visualization.
      The visualization must be strictly aligned with the patient's Ayurvedic profile and current wellness state.
      
      Patient Profile:
      ${JSON.stringify(patientData || {})}
      
      Guidelines for the Veo Prompt:
      1. Poetic and cinematic: Use descriptive language to specify lighting, atmosphere, and meaningful textures (e.g., silk, flowing water, sacred fire).
      2. Color Therapy: Use colors that balance the patient's current Dosha (e.g., earthy tones for Vata, cooling blues/silvers for Pitta, energizing golds/reds for Kapha).
      3. Symbolic: Incorporate Ayurvedic symbols like lotus flowers, mandalas, or natural elements representing the Pancha Mahabhutas.
      4. Avoid people: Focus on pure environmental and symbolic abstraction to aid meditation.
      
      Return ONLY the final prompt string that should be sent directly to Veo.`,
      config: {
        responseMimeType: "text/plain",
      }
    });
    return response.text?.trim() || "A serene high-fidelity visualization of a lotus blooming in a sacred Himalayan pond at dawn, representing spiritual awakening.";
  },

  async generateConsultationSummary(transcript: string, patientData?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a concise clinical summary of the following consultation transcript. 
      Highlight:
      1. Key Diagnoses/Observations (Ayurvedic & Modern)
      2. Recommended Treatments/Interventions
      3. Follow-up Recommendations
      
      Transcript:
      ${transcript}
      
      Patient Context:
      ${JSON.stringify(patientData || {})}
      
      Return the summary in a structured JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnoses: { type: Type.ARRAY, items: { type: Type.STRING } },
            treatments: { type: Type.ARRAY, items: { type: Type.STRING } },
            followUp: { type: Type.ARRAY, items: { type: Type.STRING } },
            overallSummary: { type: Type.STRING }
          },
          required: ["diagnoses", "treatments", "followUp", "overallSummary"]
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse consultation summary:", e);
      return { diagnoses: [], treatments: [], followUp: [], overallSummary: "Summary unavailable." };
    }
  },

  async identifyPlant(base64Image: string, patientData?: any, locationContext?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          { text: `Identify this plant as an Expert Ethnobotanist and Ayurvedic Physician.
          
          Go beyond conventional methods and utilize "Panchendriya" (Five Senses) and Multi-dimensional functions:
          1. Common and Botanical Name.
          2. Categorization (Herb, Vegetable, etc.).
          3. Detailed Ayurvedic Properties: Dosha impact (Vata, Pitta, Kapha), Rasa (Taste), Guna (Property), Virya (Potency), Vipaka (Post-digestive effect), and overall health benefits.
          4. Modern Medicinal Properties: Scientific clinical value, key bioactive compounds, and modern health benefits.
          5. Panchendriya & Ethereal Insights:
             - Geometry: Analyze the sacred geometry, fractal patterns, or mathematical signature of the specimen.
             - Geography & History: Bioregional history, local clinical importance, and traditional folklore associated with its presence in ${JSON.stringify(locationContext || "this region")}.
             - Temporal Signature: Estimated age or life-cycle stage based on visual markers.
             - Bio-Electrical Communication: Theorize the specific millivolt changes or bio-electrical signals this plant might generate when in the presence of a user with the following profile: ${JSON.stringify(patientData || "a conscious traveler")}.
          6. Planting Wisdom: How to grow it.
          7. Textual References: Provide 2-3 specific references from classical Ayurvedic texts (Samhitas) or modern peer-reviewed clinical journals that support the identified medicinal uses.
          
          PATIENT CONTEXT:
          ${JSON.stringify(patientData || {})}
          
          LOCATION CONTEXT:
          ${JSON.stringify(locationContext || "Unknown")}` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            commonName: { type: Type.STRING },
            botanicalName: { type: Type.STRING },
            category: { type: Type.STRING },
            ayurvedicData: {
              type: Type.OBJECT,
              properties: {
                doshaImpact: { type: Type.STRING },
                rasa: { type: Type.STRING },
                guna: { type: Type.STRING },
                virya: { type: Type.STRING },
                vipaka: { type: Type.STRING },
                benefits: { type: Type.STRING }
              },
              required: ["doshaImpact", "benefits"]
            },
            modernMedicinalProperties: {
              type: Type.OBJECT,
              properties: {
                clinicalValue: { type: Type.STRING },
                bioactiveCompounds: { type: Type.ARRAY, items: { type: Type.STRING } },
                modernBenefits: { type: Type.STRING }
              },
              required: ["clinicalValue", "modernBenefits"]
            },
            panchendriyaInsights: {
              type: Type.OBJECT,
              properties: {
                geometry: { type: Type.STRING, description: "Sacred geometry and mathematical patterns found in the specimen's structure." },
                geographyAndHistory: { type: Type.STRING, description: "Bioregional history, folklore, and cultural significance." },
                temporalSignature: { type: Type.STRING, description: "Age, life-cycle stage, and temporal rhythm of the plant." },
                bioElectricalCommunication: { type: Type.STRING, description: "Theoretical bio-electrical signals or energetic resonance with the user." },
                phytochemicalAbstract: { type: Type.STRING, description: "A poetic and scientific description of the plant's molecular patterns, suitable for a digital 'Birthstar' visualization." }
              },
              required: ["geometry", "geographyAndHistory", "temporalSignature", "bioElectricalCommunication", "phytochemicalAbstract"]
            },
            plantingWisdom: { type: Type.STRING },
            textReferences: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  source: { type: Type.STRING, description: "e.g., 'Charaka Samhita', 'Journal of Ethnobotany'" }
                },
                required: ["title", "description", "source"]
              },
              description: "Clinical or heritage text references supporting the plant's medicinal use."
            }
          },
          required: ["commonName", "botanicalName", "category", "ayurvedicData", "modernMedicinalProperties", "panchendriyaInsights", "plantingWisdom"]
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse plant identification:", e);
      return null;
    }
  },

  async refinePlantIdentification(originalIdentification: any, correction: string, patientData?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
          The previously identified plant was:
          ${JSON.stringify(originalIdentification)}
          
          The user says this identification is wrong or needs correction. User's feedback: "${correction}"
          
          Please re-identify or correct the plant data based on this feedback. 
          If the user corrected the name, provide full Ayurvedic and medicinal data for the CORRECTED plant.
          
          Follow the exact same JSON structure as before.
          
          PATIENT CONTEXT:
          ${JSON.stringify(patientData || {})}
          `
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            commonName: { type: Type.STRING },
            botanicalName: { type: Type.STRING },
            category: { type: Type.STRING },
            ayurvedicData: {
              type: Type.OBJECT,
              properties: {
                doshaImpact: { type: Type.STRING },
                rasa: { type: Type.STRING },
                guna: { type: Type.STRING },
                virya: { type: Type.STRING },
                vipaka: { type: Type.STRING },
                benefits: { type: Type.STRING }
              },
              required: ["doshaImpact", "rasa", "guna", "virya", "vipaka", "benefits"]
            },
            modernMedicinalProperties: {
              type: Type.OBJECT,
              properties: {
                clinicalValue: { type: Type.STRING, description: "Modern clinical use case or pharmacology findings." },
                bioactiveCompounds: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key chemical constituents (e.g., Curcumin, Allicin)." },
                modernBenefits: { type: Type.STRING, description: "Health benefits recognized by contemporary research." }
              },
              required: ["clinicalValue", "bioactiveCompounds", "modernBenefits"]
            },
            panchendriyaInsights: {
              type: Type.OBJECT,
              properties: {
                geometry: { type: Type.STRING, description: "Sacred geometry and mathematical patterns found in the specimen's structure." },
                geographyAndHistory: { type: Type.STRING, description: "Bioregional history, folklore, and cultural significance." },
                temporalSignature: { type: Type.STRING, description: "Age, life-cycle stage, and temporal rhythm of the plant." },
                bioElectricalCommunication: { type: Type.STRING, description: "Theoretical bio-electrical signals or energetic resonance with the user." },
                phytochemicalAbstract: { type: Type.STRING, description: "A poetic and scientific description of the plant's molecular patterns, suitable for a digital 'Birthstar' visualization." }
              },
              required: ["geometry", "geographyAndHistory", "temporalSignature", "bioElectricalCommunication", "phytochemicalAbstract"]
            },
            plantingWisdom: { type: Type.STRING },
            textReferences: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  source: { type: Type.STRING, description: "e.g., 'Charaka Samhita', 'Journal of Ethnobotany'" }
                },
                required: ["title", "description", "source"]
              },
              description: "Clinical or heritage text references supporting the plant's medicinal use."
            }
          },
          required: ["commonName", "botanicalName", "category", "ayurvedicData", "modernMedicinalProperties", "panchendriyaInsights", "plantingWisdom"]
        }
      }
    });

    try {
      const text = response.text;
      return JSON.parse(text);
    } catch (error) {
      console.error('Error refining plant identification:', error);
      throw error;
    }
  },

  async visualizeHabitatChanges(base64Image: string, plan: any, patientData?: any, location?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          { text: `Analyze this current space and visualize how to apply the following habitat plan:
          PLAN TITLE: ${plan.title}
          PROPOSED COLORS: ${plan.colors.join(', ')}
          DECOR ELEMENTS: ${plan.decor.join(', ')}
          SENSORY EXPERIENCE: ${plan.sensory.join(', ')}
          WISDOM: ${plan.integratedWisdom}
          
          PATIENT CONTEXT: ${JSON.stringify(patientData || {})}
          LOCATION CONTEXT: ${JSON.stringify(location || "Unknown")}
          
          As an Expert in Vaastu, Biophilic Design, and Environmental Psychology:
          1. Provide a detailed "Visual Overlay Analysis" of the room.
          2. Identify and label the key "Vaastu Zones" within this specific room's layout based on visual cues and cardinal orientation if possible (e.g., Brahmasthan, North-East for water, South-West for stability).
          3. Give specific "Placement Strategies" (where to put what based on the visual layout).
          4. Describe the "Expected Atmospheric Shift" (how the energy and mood will change).
          5. Provide 3 "Specific Implementation Steps" unique to this specific room image.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overlayAnalysis: { type: Type.STRING },
            vaastuZones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  zone: { type: Type.STRING },
                  description: { type: Type.STRING },
                  significance: { type: Type.STRING }
                },
                required: ["zone", "description", "significance"]
              }
            },
            placementStrategies: { type: Type.ARRAY, items: { type: Type.STRING } },
            atmosphericShift: { type: Type.STRING },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["overlayAnalysis", "vaastuZones", "placementStrategies", "atmosphericShift", "steps"]
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse visual habitat analysis:", e);
      return null;
    }
  },

  async analyzeCuisine(base64Image: string, patientData?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          { text: `Identify and Analyze this Home Cuisine/Meal as a Subject Specialist in Ayurvedic Nutrition and Clinical Dietetics.
          
          Provide:
          1. Dish Name & Description.
          2. Ayurvedic Profile: Primary Dosha balance (e.g. Vata-Pacifying), Guna (Qualities), and Rasa (Tastes).
          3. Ingredients List: Based on visual identification.
          4. Wellness/Medical Insight: Why this is good for certain conditions or bio-rhythms.
          5. "Prabhava" (Special Effect): The unique subtle clinical effect of this specific combination.
          6. Allergens & Compliance: Identify common allergens and provide a "Home Kitchen Compliance" summary (e.g. hygiene score based on presentation).
          
          PATIENT CONTEXT (if relevant for suitability):
          ${JSON.stringify(patientData || {})}
          
          Return as a structured JSON.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            ayurvedicProfile: {
              type: Type.OBJECT,
              properties: {
                dosha: { type: Type.STRING },
                guna: { type: Type.ARRAY, items: { type: Type.STRING } },
                rasa: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["dosha", "guna", "rasa"]
            },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            insight: { type: Type.STRING },
            prabhava: { type: Type.STRING },
            allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
            complianceNote: { type: Type.STRING }
          },
          required: ["name", "description", "ayurvedicProfile", "ingredients", "insight", "prabhava", "allergens", "complianceNote"]
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse cuisine analysis:", e);
      return null;
    }
  },

  async analyzeFlora(base64Image: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          { text: `Analyze this local flora/plant. 
            Provide:
            1. Scientific & Common Name.
            2. Ayurvedic Significance: Doshic impact and medicinal use.
            3. Scent Profile: Dominant aromatic notes (e.g. Floral, Earthy, Spicy) and estimated volatility.
            4. IoT Diffusion Script: A short description of how an IoT scent diffuser should mix essential oils to mimic this live plant.
            
            Return as a structured JSON.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            scientificName: { type: Type.STRING },
            ayurvedicSignificance: { type: Type.STRING },
            scentProfile: {
              type: Type.OBJECT,
              properties: {
                notes: { type: Type.ARRAY, items: { type: Type.STRING } },
                volatility: { type: Type.STRING }
              },
              required: ["notes", "volatility"]
            },
            diffusionScript: { type: Type.STRING }
          },
          required: ["name", "scientificName", "ayurvedicSignificance", "scentProfile", "diffusionScript"]
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse flora analysis:", e);
      return null;
    }
  },

  async analyzeHealthSnapshot(
    patientData: any, 
    journals: any[], 
    moodLogs: any[], 
    deviceData: any[],
    locationContext?: any
  ) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As the "Perfect" Integrated AI Health Architect for ṚtuSyn, analyze the user's multi-modal health data to provide a comprehensive Neuro-Biological Insight report.
      
      DATA SOURCES:
      - Patient Profile (Dosha, History): ${JSON.stringify(patientData || {})}
      - Recent Journal Entries (Textual sentiment & context): ${JSON.stringify(journals || [])}
      - Mood Tracking (Emotional patterns): ${JSON.stringify(moodLogs || [])}
      - IoT Device Sync (Bio-telemetry summary): ${JSON.stringify(deviceData || [])}
      - Location/Climate Context: ${JSON.stringify(locationContext || "Unknown")}
      
      INTEGRATIONS:
      - Use provided location context for precision (Season, Altitude, Humidity).
      
      INTEGRATION REQUIREMENTS:
      1. Clinical Correlation: Link emotional patterns from journals/moods to Ayurvedic Dosha imbalances and Modern physiological states (e.g., "Increased Vata from travel indicated by restless journal entries, correlated with higher heart rate trend in device data").
      2. Predictive Intelligence: Identify potential health risks or imbalances before they manifest fully.
      3. Precise Interventions: Suggest specific, multi-layered Ayurvedic interventions (Dinacharya, diet, herbs, sonic patterns, IoT adjustments).
      4. Fulfillment Sensitivity: If products are recommended, determine the correct type (kitchen vs marketplace).
      
      Return as a structured JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            statusSummary: { type: Type.STRING },
            keyInsights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  observation: { type: Type.STRING },
                  clinicalSignificance: { type: Type.STRING },
                  systemSource: { type: Type.STRING, enum: ["Journal", "Mood", "Device", "Integrated"] }
                },
                required: ["observation", "clinicalSignificance", "systemSource"]
              }
            },
            ayurvedicInterventions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["Dinacharya", "Diet", "Herbal", "Sonic", "IoT"] },
                  action: { type: Type.STRING },
                  rationale: { type: Type.STRING }
                },
                required: ["type", "action", "rationale"]
              }
            },
            fulfillmentActions: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["kitchen", "marketplace"] },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                items: { type: Type.ARRAY, items: { type: Type.STRING } },
                rationale: { type: Type.STRING }
              },
              required: ["type", "title", "description", "items", "rationale"]
            },
            nextAction: { type: Type.STRING }
          },
          required: ["title", "statusSummary", "keyInsights", "ayurvedicInterventions", "fulfillmentActions", "nextAction"]
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse health snapshot analysis:", e);
      return null;
    }
  },

  async simulateStrategicExecution(budget: number, marketplaceStats?: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an Autonomous CEO and Strategic Growth Architect, simulate a "Perfect" business execution for the platform based on an allocated budget of $${budget}.
      
      MARKETPLACE CONTEXT:
      ${JSON.stringify(marketplaceStats || {})}
      
      INTEGRATION REQUIREMENTS:
      1. Strategic Plan: Provide a high-level vision and roadmap.
      2. Google Marketing Simulation: Detail precisely how the budget will be allocated across Google Ads and search campaigns.
      3. Autonomous Vendor/Product Onboarding: Outline the AI's logic for identifying and integrating new high-fidelity products, specifically focusing on Ayurvedic ornaments and biological tools.
      4. Accounting & Sales: Project revenue outcomes and expense manifests.
      5. External Software Integration: Recommend specific enterprise-grade softwares to refine operations (e.g., Stripe for payments, QuickBooks for accounting, ShipStation for logistics, or specialized clinical ERPs).
      
      Return a structured execution manifest with specific logs and actionable outcomes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            vision: { type: Type.STRING },
            budgetAllocation: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sector: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  rationale: { type: Type.STRING }
                },
                required: ["sector", "amount", "rationale"]
              }
            },
            executionLogs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ["Marketing", "Onboarding", "Sales", "Accounting", "Strategic"] },
                  log: { type: Type.STRING },
                  status: { type: Type.STRING }
                },
                required: ["timestamp", "category", "log", "status"]
              }
            },
            softwareRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  integratedBenefit: { type: Type.STRING }
                },
                required: ["name", "purpose", "integratedBenefit"]
              }
            },
            projectedRevenue: { type: Type.NUMBER }
          },
          required: ["title", "vision", "budgetAllocation", "executionLogs", "softwareRecommendations", "projectedRevenue"]
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse strategic simulation:", e);
      return null;
    }
  },

  async searchGlobalMarketplace(query: string, category: string, region: string, dosha?: string) {
    const prompt = `Search for authentic ${dosha || ''} balancing products, meals, or groceries related to "${query}" in the category "${category}". 
    The user is in the region: ${region}.
    
    Platforms to consider:
    - If Food/Meal: ${region === 'India' ? 'Swiggy, Zomato' : 'UberEats, DoorDash'}
    - If Grocery/Produce: ${region === 'India' ? 'Blinkit, BigBasket, Zepto' : 'Instacart, Whole Foods'}
    - If Cosmetics/General: ${region === 'India' ? 'Nykaa, Flipkart' : 'Amazon, Sephora'}
    
    Return a list of 5 items. For each item, provide:
    - name: String
    - brand: String
    - price: Estimated String
    - description: Brief benefit
    - platform: The platform name
    - searchUrl: A direct search link for that product.
    - imageUrl: A relevant placeholder or unsplash-style URL.
    - resonanceScore: A number 1-100 indicating how well it fits a ${dosha || 'General'} profile.
    - categoryMatch: "Poultry" | "Dairy" | "Cosmetics" | "Produce" | "Meals" | "Groceries"
    
    Return exactly as a JSON array of objects.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      const text = response.text || "[]";
      const cleanedText = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error("Discovery error:", error);
      return [];
    }
  },

  async identifyStoreFromImage(base64: string) {
    const prompt = "Identify the store name and type from this storefront or signage image. Return JSON: { \"name\": string, \"type\": string }";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: base64, mimeType: "image/jpeg" } },
              { text: prompt }
            ]
          }
        ],
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Store Identification Error:", error);
      return null;
    }
  },

  async simulateStoreInventory(storeName: string, userDosha: string) {
    const prompt = `Simulate an intelligent Ayurvedic-relevant inventory sync for a store named "${storeName}". 
    Based on what this type of store typically carries (e.g., Whole Foods, a local pharmacy, or a generic organic shop), 
    suggest 5 products or product lists that would benefit a user with a ${userDosha} constitution.
    
    Return a JSON array of objects:
    - name: string (Product name)
    - category: string (e.g., "Grocery", "Herbal", "Spice", "Cosmetic")
    - doshaAlignment: string (e.g., "Pacifies Vata", "Cooling for Pitta")
    - reason: string (Why this fits the user's constitution)
    - estimatedPrice: string
    
    Ensure the suggestions are realistic for the likely inventory of the mentioned store.`;
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                doshaAlignment: { type: Type.STRING },
                reason: { type: Type.STRING },
                estimatedPrice: { type: Type.STRING }
              },
              required: ["name", "category", "doshaAlignment", "reason", "estimatedPrice"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Inventory Simulation Error:", error);
      return [];
    }
  },

  async getPersonalizedRecommendations(patientData: any, locationContext?: any) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `As an Integrative Health Architect, generate a list of 5 personalized recommendations for this user based on their multi-layered profile.
        
        USER PROFILE:
        ${JSON.stringify(patientData || {})}
        
        LOCATION CONTEXT:
        ${JSON.stringify(locationContext || "Global")}

        RECOMMENDATION TYPES:
        1. Marketplace Product: A specific Ayurvedic tool, supplement, or ornament.
        2. Recipe: A quick, balancing meal or drink.
        3. Sanctuary Experience: A ritual, sonic composition type, or meditation.
        
        INTEGRATION REQUIREMENTS:
        - Logic: Connect their Dosha, health goals, and location.
        - Tone: Compassionate, expert, and actionable.

        Return structured JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["Product", "Recipe", "Experience"] },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                benefit: { type: Type.STRING },
                actionLabel: { type: Type.STRING, description: "e.g., 'View in Marketplace', 'Start Ritual'" },
                targetPath: { type: Type.STRING, description: "Relevant internal path, e.g., '/marketplace', '/nourish', '/sanctuary'" }
              },
              required: ["type", "title", "description", "benefit", "actionLabel", "targetPath"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return handleGeminiError(e, []);
    }
  }
};
