/*
Warning: This file has been AI vibecoded
*/

export class TabManager {
  constructor(containerEl, onTabChange) {
    this.containerEl = containerEl;
    this.tabs = [];
    this.activeTabId = null;
    this.onTabChange = onTabChange; // Callback when active tab swaps
    this.onNewTabRequest = null;    // Callback when '+' button is clicked

    this.initEventListeners();
  }

  initEventListeners() {
    this.containerEl.addEventListener('click', (e) => {
      // Check if '+' button was clicked
      if (e.target.id === 'add-tab-btn' || e.target.closest('#add-tab-btn')) {
        if (this.onNewTabRequest) this.onNewTabRequest();
        return;
      }

      const tabEl = e.target.closest('[data-tab-id]');
      if (!tabEl) return;
      
      const id = tabEl.dataset.tabId;
      if (e.target.classList.contains('close-btn')) {
        e.stopPropagation();
        this.closeTab(id);
      } else {
        this.setActive(id);
      }
    });

    this.containerEl.addEventListener('auxclick', (e) => {
      if (e.button === 1) { // Middle click to close
        const tabEl = e.target.closest('[data-tab-id]');
        if (tabEl) this.closeTab(tabEl.dataset.tabId);
      }
    });
  }

  openTab(filePath, model, title) {
    let existing = this.tabs.find(t => t.filePath && t.filePath === filePath);
    if (existing) {
      this.setActive(existing.id);
      return;
    }

    const newTab = {
      id: 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      filePath: filePath || null,
      title: title || (filePath ? filePath.split(/[\\/]/).pop() : 'Untitled'),
      model: model,
      isDirty: false
    };

    this.tabs.push(newTab);
    this.setActive(newTab.id);
  }

  setActive(id) {
    this.activeTabId = id;
    const tab = this.tabs.find(t => t.id === id);
    this.render();
    if (this.onTabChange) this.onTabChange(tab || null);
  }

  closeTab(id) {
    const index = this.tabs.findIndex(t => t.id === id);
    if (index === -1) return;
    
    const tab = this.tabs[index];
    if (tab.isDirty && !confirm(`Save changes to ${tab.title}?`)) return;

    if (tab.model && typeof tab.model.dispose === 'function') {
      tab.model.dispose();
    }
    this.tabs.splice(index, 1);

    if (this.activeTabId === id) {
      const nextTab = this.tabs[index] || this.tabs[index - 1];
      this.activeTabId = nextTab ? nextTab.id : null;
      if (nextTab) {
        this.setActive(nextTab.id);
      } else {
        this.render();
        if (this.onTabChange) this.onTabChange(null);
      }
    } else {
      this.render();
    }
  }

  getActiveTab() {
    return this.tabs.find(t => t.id === this.activeTabId) || null;
  }

  render() {
    if (!this.containerEl) return;
    
    const tabsHtml = this.tabs.map(tab => `
      <div class="tab ${tab.id === this.activeTabId ? 'active' : ''}" data-tab-id="${tab.id}">
        <span class="tab-title">${escapeHtml(tab.title)}${tab.isDirty ? ' •' : ''}</span>
        <span class="close-btn">&times;</span>
      </div>
    `).join('');

    // Append the add tab button at the end
    this.containerEl.innerHTML = tabsHtml + `
      <button id="add-tab-btn" class="add-tab-btn" title="New File">+</button>
    `;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}