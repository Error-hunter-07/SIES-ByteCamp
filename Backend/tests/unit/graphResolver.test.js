import { describe, test, expect } from '@jest/globals';
import { extractFilenameFromMessage } from '../../src/utils/graphResolver.js';

describe('extractFilenameFromMessage', () => {
  test('returns null for null/undefined/non-string input', () => {
    expect(extractFilenameFromMessage(null)).toBeNull();
    expect(extractFilenameFromMessage(undefined)).toBeNull();
    expect(extractFilenameFromMessage(123)).toBeNull();
    expect(extractFilenameFromMessage('')).toBeNull();
  });

  test('extracts .js filename from backticks', () => {
    const result = extractFilenameFromMessage('What does `src/index.js` do?');
    expect(result).toBe('src/index.js');
  });

  test('extracts .ts filename from backticks', () => {
    const result = extractFilenameFromMessage('Analyze `components/App.tsx`');
    expect(result).toBe('components/App.tsx');
  });

  test('extracts .py filename', () => {
    const result = extractFilenameFromMessage('Check utils/helpers.py');
    expect(result).toBe('utils/helpers.py');
  });

  test('extracts .go filename', () => {
    const result = extractFilenameFromMessage('Look at main.go');
    expect(result).toBe('main.go');
  });

  test('extracts filename with single quotes', () => {
    const result = extractFilenameFromMessage("What is in 'lib/utils.js'?");
    expect(result).toBe('lib/utils.js');
  });

  test('extracts filename with double quotes', () => {
    const result = extractFilenameFromMessage('Tell me about "services/auth.service.ts"');
    expect(result).toBe('services/auth.service.ts');
  });

  test('returns first match when multiple filenames present', () => {
    const result = extractFilenameFromMessage('Compare `a.js` with `b.js`');
    expect(result).toBe('a.js');
  });

  test('extracts filename from keyword pattern "file ..."', () => {
    const result = extractFilenameFromMessage('file app.js is broken');
    expect(result).toBe('app.js');
  });

  test('extracts filename from keyword pattern "module ..."', () => {
    const result = extractFilenameFromMessage('module auth.service.ts has issues');
    expect(result).toBe('auth.service.ts');
  });

  test('extracts filename from keyword pattern "component ..."', () => {
    const result = extractFilenameFromMessage('component Header.vue needs update');
    expect(result).toBe('Header.vue');
  });

  test('returns null for message with no recognizable filename', () => {
    const result = extractFilenameFromMessage('How do I fix the bug?');
    expect(result).toBeNull();
  });

  test('handles deeply nested paths', () => {
    const result = extractFilenameFromMessage('Check `src/components/forms/Login.tsx`');
    expect(result).toBe('src/components/forms/Login.tsx');
  });

  test('handles Windows-style paths', () => {
    const result = extractFilenameFromMessage('Look at src\\utils\\helper.js');
    expect(result).toBe('src\\utils\\helper.js');
  });

  test('extracts .rs filename', () => {
    const result = extractFilenameFromMessage('Check main.rs');
    expect(result).toBe('main.rs');
  });

  test('extracts .kt filename', () => {
    const result = extractFilenameFromMessage('Analyze App.kt');
    expect(result).toBe('App.kt');
  });
});
