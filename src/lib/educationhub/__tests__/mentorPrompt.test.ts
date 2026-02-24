/**
 * Unit tests for mentorPrompt.ts
 * Spec: PHASE_IMPLEMENTATION_MASTER.md Phase 5 §D
 */

import { buildMentorSystemPrompt } from '../mentorPrompt';

describe('buildMentorSystemPrompt', () => {
  const baseEngagement = {
    studentId: 'student-123',
    track: 'AI_BRIEF',
    tier: 'BEGINNER',
    brief: {
      projectTitle: 'M-Pesa SACCO Manager',
      clientPersona: {
        name: 'Grace Wanjiku',
        businessType: 'SACCO',
        county: 'Kiambu',
        technicalLiteracy: 'low',
        context: 'Grace runs a local SACCO with 120 members in Limuru.',
      },
      problemStatement: 'Members cannot track their savings digitally.',
      kenyanConstraints: ['Must work on 2G connections', 'M-Pesa only'],
      outOfScope: ['Web dashboard', 'Card payments'],
    },
  };

  test('contains HARD RULES section', () => {
    const prompt = buildMentorSystemPrompt(baseEngagement);
    expect(prompt).toContain('HARD RULES');
    expect(prompt).toContain('NEVER write complete code');
  });

  test('contains student ID', () => {
    const prompt = buildMentorSystemPrompt(baseEngagement);
    expect(prompt).toContain('student-123');
  });

  test('contains brief constraints', () => {
    const prompt = buildMentorSystemPrompt(baseEngagement);
    expect(prompt).toContain('Must work on 2G connections');
    expect(prompt).toContain('M-Pesa only');
  });

  test('contains project title', () => {
    const prompt = buildMentorSystemPrompt(baseEngagement);
    expect(prompt).toContain('M-Pesa SACCO Manager');
  });

  test('contains auto-log notice', () => {
    const prompt = buildMentorSystemPrompt(baseEngagement);
    expect(prompt).toContain('AI Usage Log');
  });

  test('contains SOCRATIC MODE reference', () => {
    const prompt = buildMentorSystemPrompt(baseEngagement);
    expect(prompt).toContain('SOCRATIC');
  });

  test('contains out of scope items', () => {
    const prompt = buildMentorSystemPrompt(baseEngagement);
    expect(prompt).toContain('Web dashboard');
  });

  test('works without a brief (OPEN_SOURCE track)', () => {
    const engagement = {
      studentId: 'student-456',
      track: 'OPEN_SOURCE',
      tier: 'INTERMEDIATE',
      githubRepoName: 'org/my-repo',
    };
    const prompt = buildMentorSystemPrompt(engagement);
    expect(prompt).toContain('HARD RULES');
    expect(prompt).toContain('student-456');
    expect(prompt).toContain('org/my-repo');
  });

  test('does not exceed a reasonable length (no prompt bloat)', () => {
    const prompt = buildMentorSystemPrompt(baseEngagement);
    // Prompt should be less than 3000 chars to keep context efficient
    expect(prompt.length).toBeLessThan(3000);
  });

  test('contains student tier', () => {
    const prompt = buildMentorSystemPrompt(baseEngagement);
    expect(prompt).toContain('BEGINNER');
  });
});
