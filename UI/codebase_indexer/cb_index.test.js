const assert = require('node:assert/strict');
const test = require('node:test');
const { CodebaseIndexer } = require('./cb_index');

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

test('returns the tail of the most frequent matching identifier', async () => {
  const indexer = new CodebaseIndexer();
  indexer.updateActiveDocument('one', 'render render renderer rename', 0);
  await wait(5);
  assert.equal(indexer.queryGhostText('ren'), 'der');
  indexer.destroy();
});

test('returns no ghost text for empty and unmatched prefixes', async () => {
  const indexer = new CodebaseIndexer();
  indexer.updateActiveDocument('one', 'render', 0);
  await wait(5);
  assert.equal(indexer.queryGhostText(''), '');
  assert.equal(indexer.queryGhostText('missing'), '');
  indexer.destroy();
});

test('a pending update cannot replace a newer active document', async () => {
  const indexer = new CodebaseIndexer();
  indexer.updateActiveDocument('old', 'obsolete', 20);
  indexer.updateActiveDocument('new', 'current current', 0);
  await wait(30);
  assert.equal(indexer.currentDocId, 'new');
  assert.equal(indexer.queryGhostText('cur'), 'rent');
  assert.equal(indexer.queryGhostText('obs'), '');
  indexer.destroy();
});
