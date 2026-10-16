import { describe, it, expect } from 'vitest';
import generateShortCode from './short-code-gen.js';

describe('generateShortCode', () => {
  it('should generate a 6-character string', () => {
    const code = generateShortCode();
    expect(code).toHaveLength(6);
  });

  it('should contain only alphanumeric characters', () => {
    const code = generateShortCode();
    expect(code).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('should generate unique codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateShortCode()));
    expect(codes.size).toBeGreaterThan(90);
  });
});
