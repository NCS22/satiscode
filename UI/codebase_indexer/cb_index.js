/*
* This file contains an experomental codebase indexer API. This is not implamented yet.
* NOTE THE FOLLOWING:
* 
* This api was partially vibecoded.
*/

const { EventEmitter } = require('events');

class CodebaseIndexer extends EventEmitter {
  constructor() {
    super();
    this.wordMap = new Map();
    this.symbols = new Set();
    this.currentDocId = null;
    this.debounceTimer = null;
  }

  /**
   * Process and index text from an open document.
   * Debounced to prevent thrashing performance while typing.
   */
  updateActiveDocument(docId, text, delayMs = 150) {
    this.currentDocId = docId;
    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      this._index(text);
      // Notify UI listeners that the index for this document refreshed
      this.emit('index:updated', { docId: this.currentDocId, symbolCount: this.symbols.size });
    }, delayMs);
  }

  /**
   * Internal parser loop
   */
  _index(text) {
    this.wordMap.clear();
    this.symbols.clear();

    if (!text) return;

    // Match valid code identifiers (min 2 chars)
    const matches = text.match(/\b[a-zA-Z_]\w*\b/g);
    if (!matches) return;

    for (let i = 0; i < matches.length; i++) {
      const word = matches[i];
      if (word.length < 2) continue;

      this.symbols.add(word);
      this.wordMap.set(word, (this.wordMap.get(word) || 0) + 1);
    }
  }

  /**
   * Request ghost text recommendation for current typed prefix.
   * Emits a ghost:suggested event for UI listeners.
   */
  queryGhostText(prefix) {
    if (!prefix || prefix.length === 0) {
      this.emit('ghost:cleared');
      return '';
    }

    let topMatch = null;
    let maxFreq = -1;

    for (const word of this.symbols) {
      if (word.startsWith(prefix) && word !== prefix) {
        const freq = this.wordMap.get(word) || 0;
        if (freq > maxFreq) {
          maxFreq = freq;
          topMatch = word;
        }
      }
    }

    const ghostTail = topMatch ? topMatch.slice(prefix.length) : '';

    if (ghostTail) {
      this.emit('ghost:suggested', { prefix, ghostTail, fullWord: topMatch });
    } else {
      this.emit('ghost:cleared');
    }

    return ghostTail;
  }

  /**
   * Clean up timer on view close/tab change
   */
  destroy() {
    clearTimeout(this.debounceTimer);
    this.removeAllListeners();
  }
}

// Export singleton instance for UI usage
const indexer = new CodebaseIndexer();

module.exports = { CodebaseIndexer, indexer };
