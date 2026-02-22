import { articleSchema } from '../knowledgeSchema';

describe('articleSchema', () => {
  const validContent = 'x'.repeat(100);
  const validSummary = 'This article covers essential practices for verifying fertilizer quality as recommended by KEBS standards.';

  const valid = {
    title: 'How to Verify Fertilizer Quality in Kenya',
    category: 'FERTILIZER_VERIFICATION' as const,
    sourceInstitution: 'KEBS',
    summary: validSummary,
    content: validContent,
    isPublished: false,
  };

  it('accepts a valid article', () => {
    expect(articleSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts all valid categories', () => {
    const categories = [
      'FERTILIZER_VERIFICATION',
      'SEED_VERIFICATION',
      'ANIMAL_HEALTH',
      'PEST_DISEASE',
      'SEASONAL_CALENDAR',
      'POST_HARVEST',
      'MARKET_DYNAMICS',
      'NEW_METHODS',
    ] as const;
    for (const category of categories) {
      expect(articleSchema.safeParse({ ...valid, category }).success).toBe(true);
    }
  });

  it('rejects title shorter than 5 characters', () => {
    expect(articleSchema.safeParse({ ...valid, title: 'Hi' }).success).toBe(false);
  });

  it('rejects title longer than 200 characters', () => {
    expect(
      articleSchema.safeParse({ ...valid, title: 'x'.repeat(201) }).success
    ).toBe(false);
  });

  it('rejects invalid category', () => {
    expect(
      articleSchema.safeParse({ ...valid, category: 'WEATHER_FORECAST' }).success
    ).toBe(false);
  });

  it('rejects empty sourceInstitution', () => {
    expect(
      articleSchema.safeParse({ ...valid, sourceInstitution: '' }).success
    ).toBe(false);
  });

  it('rejects summary shorter than 20 characters', () => {
    expect(
      articleSchema.safeParse({ ...valid, summary: 'Too short' }).success
    ).toBe(false);
  });

  it('rejects summary longer than 500 characters', () => {
    expect(
      articleSchema.safeParse({ ...valid, summary: 'x'.repeat(501) }).success
    ).toBe(false);
  });

  it('rejects content shorter than 100 characters', () => {
    expect(
      articleSchema.safeParse({ ...valid, content: 'Too short content' }).success
    ).toBe(false);
  });

  it('accepts a valid sourceUrl', () => {
    expect(
      articleSchema.safeParse({ ...valid, sourceUrl: 'https://www.kebs.org/article' }).success
    ).toBe(true);
  });

  it('rejects an invalid sourceUrl', () => {
    expect(
      articleSchema.safeParse({ ...valid, sourceUrl: 'not-a-url' }).success
    ).toBe(false);
  });

  it('accepts optional fields when omitted', () => {
    const result = articleSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sourceUrl).toBeUndefined();
      expect(result.data.author).toBeUndefined();
    }
  });

  it('accepts cropTags array', () => {
    expect(
      articleSchema.safeParse({
        ...valid,
        cropTags: ['maize', 'beans', 'fertilizer'],
      }).success
    ).toBe(true);
  });

  it('defaults isPublished to false when not provided', () => {
    const { isPublished: _, ...noPublished } = valid;
    const result = articleSchema.safeParse(noPublished);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublished).toBe(false);
    }
  });

  it('accepts isPublished true', () => {
    expect(
      articleSchema.safeParse({ ...valid, isPublished: true }).success
    ).toBe(true);
  });

  it('rejects missing required title', () => {
    const { title: _, ...noTitle } = valid;
    expect(articleSchema.safeParse(noTitle).success).toBe(false);
  });

  it('rejects missing required content', () => {
    const { content: _, ...noContent } = valid;
    expect(articleSchema.safeParse(noContent).success).toBe(false);
  });
});
