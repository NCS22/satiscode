(function (root, factory) {
  const integration = factory();
  if (typeof module === 'object' && module.exports) module.exports = integration;
  if (root) root.CodebaseIndexerEditor = integration;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const supportedLanguages = new Set(['html', 'css', 'javascript', 'python']);

  function completionRange(monaco, position, word) {
    return new monaco.Range(
      position.lineNumber,
      word.startColumn,
      position.lineNumber,
      position.column
    );
  }

  function registerInlineCompletionProviders(monaco, editor, api) {
    return Array.from(supportedLanguages, (language) =>
      monaco.languages.registerInlineCompletionsProvider(language, {
        provideInlineCompletions(model, position) {
          if (model !== editor.getModel() || !supportedLanguages.has(model.getLanguageId())) {
            return { items: [] };
          }

          const word = model.getWordUntilPosition(position);
          const prefix = word?.word || '';
          if (!prefix) return { items: [] };

          const ghostTail = api.queryCodebaseGhostText(prefix);
          if (!ghostTail) return { items: [] };

          return {
            items: [{
              insertText: prefix + ghostTail,
              range: completionRange(monaco, position, word)
            }]
          };
        },
        disposeInlineCompletions() {},
        freeInlineCompletions() {}
      })
    );
  }

  return { supportedLanguages, completionRange, registerInlineCompletionProviders };
});
