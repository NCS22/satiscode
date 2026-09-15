const assert = require('node:assert/strict');
const test = require('node:test');
const { supportedLanguages, completionRange, registerInlineCompletionProviders } = require('./editor_integration');

test('only the requested editor languages enable codebase suggestions', () => {
  for (const language of ['html', 'css', 'javascript', 'python']) assert.equal(supportedLanguages.has(language), true);
  for (const language of ['c', 'cpp', 'typescript', 'json', 'plaintext']) assert.equal(supportedLanguages.has(language), false);
});

test('completion range replaces only the typed prefix', () => {
  class Range {
    constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
      Object.assign(this, { startLineNumber, startColumn, endLineNumber, endColumn });
    }
  }
  const range = completionRange({ Range }, { lineNumber: 4, column: 9 }, { startColumn: 6 });
  assert.equal(range.startLineNumber, 4);
  assert.equal(range.startColumn, 6);
  assert.equal(range.endLineNumber, 4);
  assert.equal(range.endColumn, 9);
});

test('provider ignores inactive models and returns a prefix replacement', () => {
  const providers = new Map();
  const monaco = {
    Range: class Range {
      constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
        Object.assign(this, { startLineNumber, startColumn, endLineNumber, endColumn });
      }
    },
    languages: { registerInlineCompletionsProvider: (language, provider) => providers.set(language, provider) }
  };
  const activeModel = {
    getLanguageId: () => 'javascript',
    getWordUntilPosition: () => ({ word: 'ren', startColumn: 2 })
  };
  registerInlineCompletionProviders(monaco, { getModel: () => activeModel }, {
    queryCodebaseGhostText: () => 'der'
  });

  const position = { lineNumber: 1, column: 5 };
  assert.deepEqual(providers.get('javascript').provideInlineCompletions({}, position), { items: [] });
  const result = providers.get('javascript').provideInlineCompletions(activeModel, position);
  assert.equal(result.items[0].insertText, 'render');
  assert.equal(result.items[0].range.startColumn, 2);
  assert.equal(result.items[0].range.endColumn, 5);
  assert.equal(typeof providers.get('javascript').disposeInlineCompletions, 'function');
  assert.equal(typeof providers.get('javascript').freeInlineCompletions, 'function');
});
