/**
 * Unit tests for briefGenerator.ts
 * Spec: PHASE_IMPLEMENTATION_MASTER.md Phase 5 §D
 */

import { buildBriefGenerationPrompt } from '../briefGenerator';

const testContext = {
  id: 'mpesa-001',
  industryName: 'Mobile Payments',
  description: 'M-Pesa ecosystem services for Kenyan SMEs',
  clientPersonaTemplate: {
    businessTypes: ['SACCO', 'Chama', 'Small business'],
    counties: ['Nairobi', 'Kiambu', 'Nakuru'],
    contexts: ['Limited internet access', 'Feature phone users'],
  },
  problemDomains: ['Payment reconciliation', 'Member management'],
  kenyanConstraints: ['M-Pesa only', '2G connectivity', 'Low-end Android devices'],
  exampleProjects: ['SACCO savings tracker', 'Group payment splitter'],
  targetTiers: ['BEGINNER', 'INTERMEDIATE'],
};

describe('buildBriefGenerationPrompt', () => {
  test('contains student tier', () => {
    const prompt = buildBriefGenerationPrompt('BEGINNER', 'mobile apps', ['React Native'], testContext);
    expect(prompt).toContain('BEGINNER');
  });

  test('contains Kenyan constraints requirement', () => {
    const prompt = buildBriefGenerationPrompt('INTERMEDIATE', 'web apps', ['React'], testContext);
    expect(prompt).toContain('KENYAN CONSTRAINTS');
    expect(prompt).toContain('Connectivity');
    expect(prompt).toContain('M-Pesa');
  });

  test('contains context JSON in prompt', () => {
    const prompt = buildBriefGenerationPrompt('BEGINNER', 'mobile', ['React Native'], testContext);
    expect(prompt).toContain('Mobile Payments');
    expect(prompt).toContain('mpesa-001');
  });

  test('student interest area is included', () => {
    const prompt = buildBriefGenerationPrompt('ADVANCED', 'agricultural data systems', ['Python', 'Django'], testContext);
    expect(prompt).toContain('agricultural data systems');
  });

  test('tech stack is included', () => {
    const prompt = buildBriefGenerationPrompt('BEGINNER', 'web', ['JavaScript', 'Node.js'], testContext);
    expect(prompt).toContain('JavaScript');
    expect(prompt).toContain('Node.js');
  });

  test('BEGINNER duration is 2 weeks', () => {
    const prompt = buildBriefGenerationPrompt('BEGINNER', 'web', ['React'], testContext);
    expect(prompt).toContain('"estimatedDurationWeeks": 2');
  });

  test('INTERMEDIATE duration is 4 weeks', () => {
    const prompt = buildBriefGenerationPrompt('INTERMEDIATE', 'web', ['React'], testContext);
    expect(prompt).toContain('"estimatedDurationWeeks": 4');
  });

  test('ADVANCED duration is 6 weeks', () => {
    const prompt = buildBriefGenerationPrompt('ADVANCED', 'web', ['React'], testContext);
    expect(prompt).toContain('"estimatedDurationWeeks": 6');
  });

  test('requires JSON-only output (no preamble)', () => {
    const prompt = buildBriefGenerationPrompt('BEGINNER', 'web', ['React'], testContext);
    expect(prompt).toContain('Return ONLY the JSON');
    expect(prompt).toContain('no preamble');
  });

  test('contains all required JSON fields in the template', () => {
    const prompt = buildBriefGenerationPrompt('BEGINNER', 'web', ['React'], testContext);
    const requiredFields = [
      'projectTitle',
      'clientPersona',
      'problemStatement',
      'coreRequirements',
      'technicalRequirements',
      'kenyanConstraints',
      'outOfScope',
      'successCriteria',
      'suggestedTechStack',
      'estimatedDurationWeeks',
      'industryContext',
    ];
    for (const field of requiredFields) {
      expect(prompt).toContain(field);
    }
  });
});
