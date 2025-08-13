import { defineStore } from 'pinia';
import { GenerationResult, GenerationRule } from '../types';
import { JsonGenerator } from '../core/generators/JsonGenerator';

export const useGenerationStore = defineStore('generation', {
  state: () => ({
    generationResult: null as GenerationResult | null,
    isGenerating: false,
    error: null as string | null
  }),
  
  actions: {
    async generateData(rule: GenerationRule) {
      this.isGenerating = true;
      this.error = null;
      
      try {
        const generator = new JsonGenerator();
        const result = await generator.generate(rule);
        this.generationResult = result;
        return result;
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error);
        throw error;
      } finally {
        this.isGenerating = false;
      }
    },
    
    clearResult() {
      this.generationResult = null;
      this.error = null;
    }
  }
});