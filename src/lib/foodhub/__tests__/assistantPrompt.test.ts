import { buildAssistantSystemPrompt } from '../assistantPrompt';
import type { IFarmerContext, WeatherContext } from '../assistantPrompt';

const baseFarmer: IFarmerContext = {
  firstName: 'John',
  lastName: 'Kamau',
  county: 'Kiambu',
  farmerData: {
    cropsGrown: ['maize', 'beans'],
    livestockKept: ['dairy cattle'],
    primaryLanguage: 'English',
  },
};

const weatherContext: WeatherContext = {
  county: 'Kiambu',
  forecast: 'Monday: light rain, 16–22°C, 60% rain chance\nTuesday: cloudy, 15–20°C, 30% rain chance',
};

describe('buildAssistantSystemPrompt', () => {
  it('includes farmer name and county in the prompt', () => {
    const prompt = buildAssistantSystemPrompt(baseFarmer, null);
    expect(prompt).toContain('John Kamau');
    expect(prompt).toContain('Kiambu');
  });

  it('includes crops grown in farmer context', () => {
    const prompt = buildAssistantSystemPrompt(baseFarmer, null);
    expect(prompt).toContain('maize');
    expect(prompt).toContain('beans');
  });

  it('includes livestock in farmer context', () => {
    const prompt = buildAssistantSystemPrompt(baseFarmer, null);
    expect(prompt).toContain('dairy cattle');
  });

  it('includes weather context when provided', () => {
    const prompt = buildAssistantSystemPrompt(baseFarmer, weatherContext);
    expect(prompt).toContain('CURRENT WEATHER');
    expect(prompt).toContain('light rain');
    expect(prompt).toContain('60% rain chance');
  });

  it('excludes weather section when weather is null', () => {
    const prompt = buildAssistantSystemPrompt(baseFarmer, null);
    expect(prompt).not.toContain('CURRENT WEATHER');
    expect(prompt).not.toContain('light rain');
  });

  it('prompt remains valid (non-empty) when weather is null', () => {
    const prompt = buildAssistantSystemPrompt(baseFarmer, null);
    expect(prompt.trim().length).toBeGreaterThan(200);
  });

  it('includes KEBS, PCPB, KEPHIS regulatory references', () => {
    const prompt = buildAssistantSystemPrompt(baseFarmer, null);
    expect(prompt).toContain('KEBS');
    expect(prompt).toContain('PCPB');
    expect(prompt).toContain('KEPHIS');
  });

  it('includes Kenya market references', () => {
    const prompt = buildAssistantSystemPrompt(baseFarmer, null);
    expect(prompt).toContain('Wakulima Market');
    expect(prompt).toContain('Kongowea Market');
  });

  it('specifies no commercial brand names rule', () => {
    const prompt = buildAssistantSystemPrompt(baseFarmer, null);
    expect(prompt).toContain('Never recommend specific commercial brand names');
  });

  it('handles farmer with no crops gracefully', () => {
    const farmer: IFarmerContext = {
      ...baseFarmer,
      farmerData: { cropsGrown: [], livestockKept: [] },
    };
    const prompt = buildAssistantSystemPrompt(farmer, null);
    expect(prompt).toContain('not specified');
    expect(prompt).toContain('none');
  });

  it('handles farmer with no primary language gracefully', () => {
    const farmer: IFarmerContext = {
      ...baseFarmer,
      farmerData: { cropsGrown: ['maize'], livestockKept: [] },
    };
    const prompt = buildAssistantSystemPrompt(farmer, null);
    expect(prompt).toContain('English'); // fallback
  });

  it('includes weather county in weather section', () => {
    const prompt = buildAssistantSystemPrompt(baseFarmer, weatherContext);
    expect(prompt).toContain('CURRENT WEATHER — Kiambu');
  });
});
