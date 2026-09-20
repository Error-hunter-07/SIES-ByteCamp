import { describe, test, expect } from '@jest/globals';
import {
  createScanId,
  getRepoIdFromCloneDir,
  assertValidRepoId,
  extractRepoFullName,
  normalizeParserEdge,
  buildSeedPayloadFromParser,
} from '../../src/services/scan-workspace.service.js';

describe('createScanId', () => {
  test('returns a string starting with scan-', () => {
    const scanId = createScanId();
    expect(typeof scanId).toBe('string');
    expect(scanId).toMatch(/^scan-/);
  });

  test('generates unique IDs', () => {
    const id1 = createScanId();
    const id2 = createScanId();
    expect(id1).not.toBe(id2);
  });
});

describe('getRepoIdFromCloneDir', () => {
  test('returns basename of path', () => {
    expect(getRepoIdFromCloneDir('/some/path/my-repo')).toBe('my-repo');
  });

  test('returns last segment on Windows-style path', () => {
    expect(getRepoIdFromCloneDir('C:\\repos\\test-project')).toBe('test-project');
  });
});

describe('assertValidRepoId', () => {
  test('accepts valid alphanumeric repoId', () => {
    expect(() => assertValidRepoId('my-repo_123')).not.toThrow();
  });

  test('throws for null/undefined', () => {
    expect(() => assertValidRepoId(null)).toThrow('Invalid repoId format');
    expect(() => assertValidRepoId(undefined)).toThrow('Invalid repoId format');
    expect(() => assertValidRepoId('')).toThrow('Invalid repoId format');
  });

  test('throws for repoId with special characters', () => {
    expect(() => assertValidRepoId('repo with spaces')).toThrow('Invalid repoId format');
    expect(() => assertValidRepoId('repo@name')).toThrow('Invalid repoId format');
    expect(() => assertValidRepoId('repo/slash')).toThrow('Invalid repoId format');
  });
});

describe('extractRepoFullName', () => {
  test('extracts owner/repo from valid GitHub URL', () => {
    expect(extractRepoFullName('https://github.com/user/repo')).toBe('user/repo');
  });

  test('extracts from URL with .git suffix', () => {
    expect(extractRepoFullName('https://github.com/user/repo.git')).toBe('user/repo');
  });

  test('extracts from URL with trailing slash', () => {
    expect(extractRepoFullName('https://github.com/user/repo/')).toBe('user/repo');
  });

  test('returns null for non-GitHub URL', () => {
    expect(extractRepoFullName('https://gitlab.com/user/repo')).toBeNull();
  });

  test('returns null for invalid URL', () => {
    expect(extractRepoFullName('not-a-url')).toBeNull();
  });

  test('returns null for GitHub URL with only owner (no repo)', () => {
    expect(extractRepoFullName('https://github.com/user')).toBeNull();
  });

  test('handles deeply nested GitHub URLs', () => {
    expect(extractRepoFullName('https://github.com/org/sub/repo')).toBe('org/sub');
  });
});

describe('normalizeParserEdge', () => {
  test('normalizes edge with source/target', () => {
    const edge = { source: 'a', target: 'b', type: 'IMPORTS', id: 'e1' };
    const result = normalizeParserEdge(edge, 0);
    expect(result).toEqual({ id: 'e1', source: 'a', target: 'b', type: 'IMPORTS' });
  });

  test('normalizes edge with from/to instead of source/target', () => {
    const edge = { from: 'x', to: 'y', type: 'CALLS' };
    const result = normalizeParserEdge(edge, 5);
    expect(result).toEqual({ id: 'edge-5', source: 'x', target: 'y', type: 'CALLS' });
  });

  test('generates default id from index when missing', () => {
    const edge = { source: 'a', target: 'b' };
    const result = normalizeParserEdge(edge, 42);
    expect(result.id).toBe('edge-42');
  });

  test('defaults type to UNKNOWN when missing', () => {
    const edge = { source: 'a', target: 'b' };
    const result = normalizeParserEdge(edge);
    expect(result.type).toBe('UNKNOWN');
  });

  test('handles null edge gracefully', () => {
    const result = normalizeParserEdge(null, 0);
    expect(result).toEqual({ id: 'edge-0', source: null, target: null, type: 'UNKNOWN' });
  });
});

describe('buildSeedPayloadFromParser', () => {
  test('builds payload from parser result with files and functions', () => {
    const parserResult = {
      nodes: [
        { id: 'file:src/index.js', type: 'FILE', name: 'src/index.js', language: 'JavaScript' },
        { id: 'fn:main', type: 'FUNCTION', name: 'main', file: 'src/index.js', line: 1 },
      ],
      edges: [
        { from: 'file:src/index.js', to: 'file:src/utils.js', type: 'IMPORTS' },
      ],
      summary: { languages: ['JavaScript'] },
    };
    const result = buildSeedPayloadFromParser('test-repo', parserResult, 'scan-123');

    expect(result.scanNode.id).toBe('scan-123');
    expect(result.scanNode.status).toBe('COMPLETE');
    expect(result.serviceNode.scanId).toBe('scan-123');
    expect(result.serviceNode.name).toBe('test-repo');
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe('src/index.js');
    expect(result.functions).toHaveLength(1);
    expect(result.functions[0].name).toBe('main');
    expect(result.containsEdges.length).toBeGreaterThanOrEqual(2);
  });

  test('handles empty parser result', () => {
    const result = buildSeedPayloadFromParser('repo', {}, 'scan-empty');
    expect(result.files).toHaveLength(0);
    expect(result.functions).toHaveLength(0);
    expect(result.scanNode.fileCount).toBe(0);
  });

  test('filters out non-FILE and non-FUNCTION nodes', () => {
    const parserResult = {
      nodes: [
        { id: 'file:a.js', type: 'FILE', name: 'a.js' },
        { id: 'unknown-node', type: 'UNKNOWN', name: 'x' },
      ],
      edges: [],
    };
    const result = buildSeedPayloadFromParser('repo', parserResult, 'scan-1');
    expect(result.files).toHaveLength(1);
  });

  test('only includes IMPORTS and CALLS edges as dependency edges', () => {
    const parserResult = {
      nodes: [
        { id: 'file:a.js', type: 'FILE', name: 'a.js' },
        { id: 'file:b.js', type: 'FILE', name: 'b.js' },
      ],
      edges: [
        { from: 'file:a.js', to: 'file:b.js', type: 'IMPORTS' },
        { from: 'file:a.js', to: 'file:b.js', type: 'CALLS' },
        { from: 'file:a.js', to: 'file:b.js', type: 'CONTAINS' },
      ],
    };
    const result = buildSeedPayloadFromParser('repo', parserResult, 'scan-2');
    expect(result.dependencyEdges).toHaveLength(2);
  });
});
