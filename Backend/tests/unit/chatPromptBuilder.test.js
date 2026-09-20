import { describe, test, expect } from '@jest/globals';
import { buildChatSystemPrompt, buildFullGraphSummary } from '../../src/utils/chatPromptBuilder.js';

describe('buildChatSystemPrompt', () => {
  test('returns base prompt when no args provided', () => {
    const result = buildChatSystemPrompt({});
    expect(result).toContain('expert code dependency analyst assistant');
    expect(result).toContain('QUERY HANDLING RULES');
  });

  test('includes repoId when provided', () => {
    const result = buildChatSystemPrompt({ repoId: 'my-repo-123' });
    expect(result).toContain('Repository ID: my-repo-123');
  });

  test('includes graph summary when provided', () => {
    const summary = { nodes: 50, edges: 80, topFiles: ['index.js', 'app.ts'], languages: ['JavaScript', 'TypeScript'] };
    const result = buildChatSystemPrompt({ graphSummary: summary });
    expect(result).toContain('Total nodes: 50');
    expect(result).toContain('Total edges: 80');
    expect(result).toContain('Top files: index.js, app.ts');
    expect(result).toContain('Languages detected: JavaScript, TypeScript');
  });

  test('omits topFiles and languages when empty', () => {
    const summary = { nodes: 10, edges: 5, topFiles: [], languages: [] };
    const result = buildChatSystemPrompt({ graphSummary: summary });
    expect(result).toContain('Total nodes: 10');
    expect(result).not.toContain('Top files:');
    expect(result).not.toContain('Languages detected:');
  });

  test('includes file dependency context with forward and reverse deps', () => {
    const fileContext = {
      file: { path: 'src/utils.js', language: 'JavaScript' },
      forwardDeps: [{ path: 'src/helper.js', language: 'JavaScript' }],
      reverseDeps: [{ path: 'src/main.js', language: 'JavaScript' }],
      functions: [{ name: 'doStuff', lineStart: 10 }],
      transitive: [],
      source: 'neo4j',
    };
    const result = buildChatSystemPrompt({ fileContext, targetFile: 'src/utils.js' });
    expect(result).toContain('DEPENDENCY CONTEXT FOR: src/utils.js');
    expect(result).toContain('Matched file: src/utils.js (JavaScript)');
    expect(result).toContain('-> src/helper.js');
    expect(result).toContain('<- src/main.js');
    expect(result).toContain('- doStuff (line 10)');
  });

  test('shows no-imports message when forwardDeps is empty', () => {
    const fileContext = {
      file: { path: 'src/util.js', language: 'JS' },
      forwardDeps: [],
      reverseDeps: [],
      functions: [],
      transitive: [],
      source: 'stored-graph',
    };
    const result = buildChatSystemPrompt({ fileContext, targetFile: 'src/util.js' });
    expect(result).toContain('has no outgoing imports');
  });

  test('computes risk level correctly', () => {
    const fileContext = {
      file: { path: 'src/index.js' },
      forwardDeps: [],
      reverseDeps: [
        { path: 'a.js' }, { path: 'b.js' }, { path: 'c.js' }, { path: 'd.js' }, { path: 'e.js' }, { path: 'f.js' },
      ],
      functions: [],
      transitive: [],
      source: 'neo4j',
    };
    const result = buildChatSystemPrompt({ fileContext, targetFile: 'src/index.js' });
    expect(result).toContain('Risk level: HIGH');
    expect(result).toContain('wide blast radius');
  });

  test('MEDIUM risk for 2-4 reverse deps', () => {
    const fileContext = {
      file: { path: 'src/lib.js' },
      forwardDeps: [],
      reverseDeps: [{ path: 'a.js' }, { path: 'b.js' }],
      functions: [],
      transitive: [],
      source: 'neo4j',
    };
    const result = buildChatSystemPrompt({ fileContext, targetFile: 'src/lib.js' });
    expect(result).toContain('Risk level: MEDIUM');
  });

  test('includes transitive dependencies when provided', () => {
    const fileContext = {
      file: { path: 'src/a.js' },
      forwardDeps: [],
      reverseDeps: [],
      functions: [],
      transitive: [{ depth: 1, path: 'src/b.js' }, { depth: 2, path: 'src/c.js' }],
      source: 'neo4j',
    };
    const result = buildChatSystemPrompt({ fileContext, targetFile: 'src/a.js' });
    expect(result).toContain('TRANSITIVE DEPENDENCIES');
    expect(result).toContain('depth-1: src/b.js');
    expect(result).toContain('depth-2: src/c.js');
  });
});

describe('buildFullGraphSummary', () => {
  test('returns null for null/undefined input', () => {
    expect(buildFullGraphSummary(null)).toBeNull();
    expect(buildFullGraphSummary(undefined)).toBeNull();
  });

  test('computes summary from graph nodes and edges', () => {
    const graph = {
      nodes: [
        { id: '1', type: 'FILE', name: 'index.js', language: 'JavaScript' },
        { id: '2', type: 'FILE', name: 'app.ts', language: 'TypeScript' },
        { id: '3', type: 'FUNCTION', name: 'main' },
      ],
      edges: [{ id: 'e1', source: '1', target: '3', type: 'CONTAINS' }],
    };
    const result = buildFullGraphSummary(graph);
    expect(result.nodes).toBe(3);
    expect(result.edges).toBe(1);
    expect(result.fileCount).toBe(2);
    expect(result.languages).toEqual(['JavaScript', 'TypeScript']);
    expect(result.topFiles).toContain('index.js');
    expect(result.topFiles).toContain('app.ts');
  });

  test('handles empty graph', () => {
    const result = buildFullGraphSummary({ nodes: [], edges: [] });
    expect(result.nodes).toBe(0);
    expect(result.edges).toBe(0);
    expect(result.fileCount).toBe(0);
    expect(result.languages).toEqual([]);
    expect(result.topFiles).toEqual([]);
  });

  test('handles missing nodes/edges arrays', () => {
    const result = buildFullGraphSummary({});
    expect(result.nodes).toBe(0);
    expect(result.edges).toBe(0);
  });

  test('deduplicates languages', () => {
    const graph = {
      nodes: [
        { id: '1', type: 'FILE', language: 'JavaScript' },
        { id: '2', type: 'FILE', language: 'JavaScript' },
        { id: '3', type: 'FILE', language: 'TypeScript' },
      ],
      edges: [],
    };
    const result = buildFullGraphSummary(graph);
    expect(result.languages).toEqual(['JavaScript', 'TypeScript']);
  });

  test('limits topFiles to 10', () => {
    const nodes = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      type: 'FILE',
      name: `file${i}.js`,
    }));
    const result = buildFullGraphSummary({ nodes, edges: [] });
    expect(result.topFiles.length).toBeLessThanOrEqual(10);
  });
});
