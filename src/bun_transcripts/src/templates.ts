/**
 * HTML templates as TypeScript template literal functions
 */

import type { TodoItem } from "./types";

// CSS styles
export const CSS = `
:root { --bg-color: #f5f5f5; --card-bg: #ffffff; --user-bg: #e3f2fd; --user-border: #1976d2; --assistant-bg: #f5f5f5; --assistant-border: #9e9e9e; --thinking-bg: #fff8e1; --thinking-border: #ffc107; --thinking-text: #666; --tool-bg: #f3e5f5; --tool-border: #9c27b0; --tool-result-bg: #e8f5e9; --tool-error-bg: #ffebee; --text-color: #212121; --text-muted: #757575; --code-bg: #263238; --code-text: #aed581; }
* { box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg-color); color: var(--text-color); margin: 0; padding: 16px; line-height: 1.6; }
.container { max-width: 800px; margin: 0 auto; }
h1 { font-size: 1.5rem; margin-bottom: 24px; padding-bottom: 8px; border-bottom: 2px solid var(--user-border); }
.header-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: 2px solid var(--user-border); padding-bottom: 8px; margin-bottom: 24px; }
.header-row h1 { border-bottom: none; padding-bottom: 0; margin-bottom: 0; flex: 1; min-width: 200px; }
.message { margin-bottom: 16px; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.message.user { background: var(--user-bg); border-left: 4px solid var(--user-border); }
.message.assistant { background: var(--card-bg); border-left: 4px solid var(--assistant-border); }
.message.tool-reply { background: #fff8e1; border-left: 4px solid #ff9800; }
.tool-reply .role-label { color: #e65100; }
.tool-reply .tool-result { background: transparent; padding: 0; margin: 0; }
.tool-reply .tool-result .truncatable.truncated::after { background: linear-gradient(to bottom, transparent, #fff8e1); }
.message-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background: rgba(0,0,0,0.03); font-size: 0.85rem; }
.role-label { font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.user .role-label { color: var(--user-border); }
time { color: var(--text-muted); font-size: 0.8rem; }
.timestamp-link { color: inherit; text-decoration: none; }
.timestamp-link:hover { text-decoration: underline; }
.message:target { animation: highlight 2s ease-out; }
@keyframes highlight { 0% { background-color: rgba(25, 118, 210, 0.2); } 100% { background-color: transparent; } }
.message-content { padding: 16px; }
.message-content p { margin: 0 0 12px 0; }
.message-content p:last-child { margin-bottom: 0; }
.thinking { background: var(--thinking-bg); border: 1px solid var(--thinking-border); border-radius: 8px; padding: 12px; margin: 12px 0; font-size: 0.9rem; color: var(--thinking-text); }
.thinking-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #f57c00; margin-bottom: 8px; }
.thinking p { margin: 8px 0; }
.assistant-text { margin: 8px 0; }
.tool-use { background: var(--tool-bg); border: 1px solid var(--tool-border); border-radius: 8px; padding: 12px; margin: 12px 0; }
.tool-header { font-weight: 600; color: var(--tool-border); margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
.tool-icon { font-size: 1.1rem; }
.tool-description { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 8px; font-style: italic; }
.tool-result { background: var(--tool-result-bg); border-radius: 8px; padding: 12px; margin: 12px 0; }
.tool-result.tool-error { background: var(--tool-error-bg); }
.file-tool { border-radius: 8px; padding: 12px; margin: 12px 0; }
.write-tool { background: linear-gradient(135deg, #e3f2fd 0%, #e8f5e9 100%); border: 1px solid #4caf50; }
.edit-tool { background: linear-gradient(135deg, #fff3e0 0%, #fce4ec 100%); border: 1px solid #ff9800; }
.file-tool-header { font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; font-size: 0.95rem; }
.write-header { color: #2e7d32; }
.edit-header { color: #e65100; }
.file-tool-icon { font-size: 1rem; }
.file-tool-path { font-family: monospace; background: rgba(0,0,0,0.08); padding: 2px 8px; border-radius: 4px; }
.file-tool-fullpath { font-family: monospace; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px; word-break: break-all; }
.file-content { margin: 0; }
.edit-section { display: flex; margin: 4px 0; border-radius: 4px; overflow: hidden; }
.edit-label { padding: 8px 12px; font-weight: bold; font-family: monospace; display: flex; align-items: flex-start; }
.edit-old { background: #fce4ec; }
.edit-old .edit-label { color: #b71c1c; background: #f8bbd9; }
.edit-old .edit-content { color: #880e4f; }
.edit-new { background: #e8f5e9; }
.edit-new .edit-label { color: #1b5e20; background: #a5d6a7; }
.edit-new .edit-content { color: #1b5e20; }
.edit-content { margin: 0; flex: 1; background: transparent; font-size: 0.85rem; }
.edit-replace-all { font-size: 0.75rem; font-weight: normal; color: var(--text-muted); }
.write-tool .truncatable.truncated::after { background: linear-gradient(to bottom, transparent, #e6f4ea); }
.edit-tool .truncatable.truncated::after { background: linear-gradient(to bottom, transparent, #fff0e5); }
.todo-list { background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); border: 1px solid #81c784; border-radius: 8px; padding: 12px; margin: 12px 0; }
.todo-header { font-weight: 600; color: #2e7d32; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; font-size: 0.95rem; }
.todo-items { list-style: none; margin: 0; padding: 0; }
.todo-item { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.06); font-size: 0.9rem; }
.todo-item:last-child { border-bottom: none; }
.todo-icon { flex-shrink: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 50%; }
.todo-completed .todo-icon { color: #2e7d32; background: rgba(46, 125, 50, 0.15); }
.todo-completed .todo-content { color: #558b2f; text-decoration: line-through; }
.todo-in-progress .todo-icon { color: #f57c00; background: rgba(245, 124, 0, 0.15); }
.todo-in-progress .todo-content { color: #e65100; font-weight: 500; }
.todo-pending .todo-icon { color: #757575; background: rgba(0,0,0,0.05); }
.todo-pending .todo-content { color: #616161; }
pre { background: var(--code-bg); color: var(--code-text); padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 0.85rem; line-height: 1.5; margin: 8px 0; white-space: pre-wrap; word-wrap: break-word; }
pre.json { color: #e0e0e0; }
code { background: rgba(0,0,0,0.08); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
pre code { background: none; padding: 0; }
.user-content { margin: 0; }
.truncatable { position: relative; }
.truncatable.truncated .truncatable-content { max-height: 200px; overflow: hidden; }
.truncatable.truncated::after { content: ''; position: absolute; bottom: 32px; left: 0; right: 0; height: 60px; background: linear-gradient(to bottom, transparent, var(--card-bg)); pointer-events: none; }
.message.user .truncatable.truncated::after { background: linear-gradient(to bottom, transparent, var(--user-bg)); }
.message.tool-reply .truncatable.truncated::after { background: linear-gradient(to bottom, transparent, #fff8e1); }
.tool-use .truncatable.truncated::after { background: linear-gradient(to bottom, transparent, var(--tool-bg)); }
.tool-result .truncatable.truncated::after { background: linear-gradient(to bottom, transparent, var(--tool-result-bg)); }
.expand-btn { display: none; width: 100%; padding: 8px 16px; margin-top: 4px; background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.1); border-radius: 6px; cursor: pointer; font-size: 0.85rem; color: var(--text-muted); }
.expand-btn:hover { background: rgba(0,0,0,0.1); }
.truncatable.truncated .expand-btn, .truncatable.expanded .expand-btn { display: block; }
.pagination { display: flex; justify-content: center; gap: 8px; margin: 24px 0; flex-wrap: wrap; }
.pagination a, .pagination span { padding: 5px 10px; border-radius: 6px; text-decoration: none; font-size: 0.85rem; }
.pagination a { background: var(--card-bg); color: var(--user-border); border: 1px solid var(--user-border); }
.pagination a:hover { background: var(--user-bg); }
.pagination .current { background: var(--user-border); color: white; }
.pagination .disabled { color: var(--text-muted); border: 1px solid #ddd; }
.pagination .index-link { background: var(--user-border); color: white; }
details.continuation { margin-bottom: 16px; }
details.continuation summary { cursor: pointer; padding: 12px 16px; background: var(--user-bg); border-left: 4px solid var(--user-border); border-radius: 12px; font-weight: 500; color: var(--text-muted); }
details.continuation summary:hover { background: rgba(25, 118, 210, 0.15); }
details.continuation[open] summary { border-radius: 12px 12px 0 0; margin-bottom: 0; }
.index-item { margin-bottom: 16px; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); background: var(--user-bg); border-left: 4px solid var(--user-border); }
.index-item a { display: block; text-decoration: none; color: inherit; }
.index-item a:hover { background: rgba(25, 118, 210, 0.1); }
.index-item-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background: rgba(0,0,0,0.03); font-size: 0.85rem; }
.index-item-number { font-weight: 600; color: var(--user-border); }
.index-item-content { padding: 16px; }
.index-item-stats { padding: 8px 16px 12px 32px; font-size: 0.85rem; color: var(--text-muted); border-top: 1px solid rgba(0,0,0,0.06); }
.index-item-commit { margin-top: 6px; padding: 4px 8px; background: #fff3e0; border-radius: 4px; font-size: 0.85rem; color: #e65100; }
.index-item-commit code { background: rgba(0,0,0,0.08); padding: 1px 4px; border-radius: 3px; font-size: 0.8rem; margin-right: 6px; }
.commit-card { margin: 8px 0; padding: 10px 14px; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 6px; }
.commit-card a { text-decoration: none; color: #5d4037; display: block; }
.commit-card a:hover { color: #e65100; }
.commit-card-hash { font-family: monospace; color: #e65100; font-weight: 600; margin-right: 8px; }
.index-commit { margin-bottom: 12px; padding: 10px 16px; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.index-commit a { display: block; text-decoration: none; color: inherit; }
.index-commit a:hover { background: rgba(255, 152, 0, 0.1); margin: -10px -16px; padding: 10px 16px; border-radius: 8px; }
.index-commit-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; margin-bottom: 4px; }
.index-commit-hash { font-family: monospace; color: #e65100; font-weight: 600; }
.index-commit-msg { color: #5d4037; }
.index-item-long-text { margin-top: 8px; padding: 12px; background: var(--card-bg); border-radius: 8px; border-left: 3px solid var(--assistant-border); }
.index-item-long-text .truncatable.truncated::after { background: linear-gradient(to bottom, transparent, var(--card-bg)); }
.index-item-long-text-content { color: var(--text-color); }
#search-box { display: none; align-items: center; gap: 8px; }
#search-box input { padding: 6px 12px; border: 1px solid var(--assistant-border); border-radius: 6px; font-size: 16px; width: 180px; }
#search-box button, #modal-search-btn, #modal-close-btn { background: var(--user-border); color: white; border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
#search-box button:hover, #modal-search-btn:hover { background: #1565c0; }
#modal-close-btn { background: var(--text-muted); margin-left: 8px; }
#modal-close-btn:hover { background: #616161; }
#search-modal[open] { border: none; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.2); padding: 0; width: 90vw; max-width: 900px; height: 80vh; max-height: 80vh; display: flex; flex-direction: column; }
#search-modal::backdrop { background: rgba(0,0,0,0.5); }
.search-modal-header { display: flex; align-items: center; gap: 8px; padding: 16px; border-bottom: 1px solid var(--assistant-border); background: var(--bg-color); border-radius: 12px 12px 0 0; }
.search-modal-header input { flex: 1; padding: 8px 12px; border: 1px solid var(--assistant-border); border-radius: 6px; font-size: 16px; }
#search-status { padding: 8px 16px; font-size: 0.85rem; color: var(--text-muted); border-bottom: 1px solid rgba(0,0,0,0.06); }
#search-results { flex: 1; overflow-y: auto; padding: 16px; }
.search-result { margin-bottom: 16px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.search-result a { display: block; text-decoration: none; color: inherit; }
.search-result a:hover { background: rgba(25, 118, 210, 0.05); }
.search-result-page { padding: 6px 12px; background: rgba(0,0,0,0.03); font-size: 0.8rem; color: var(--text-muted); border-bottom: 1px solid rgba(0,0,0,0.06); }
.search-result-content { padding: 12px; }
.search-result mark { background: #fff59d; padding: 1px 2px; border-radius: 2px; }
@media (max-width: 600px) { body { padding: 8px; } .message, .index-item { border-radius: 8px; } .message-content, .index-item-content { padding: 12px; } pre { font-size: 0.8rem; padding: 8px; } #search-box input { width: 120px; } #search-modal[open] { width: 95vw; height: 90vh; } }
`;

// JavaScript for client-side functionality
export const JS = `
document.querySelectorAll('time[data-timestamp]').forEach(function(el) {
    const timestamp = el.getAttribute('data-timestamp');
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    if (isToday) { el.textContent = timeStr; }
    else { el.textContent = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + timeStr; }
});
document.querySelectorAll('pre.json').forEach(function(el) {
    let text = el.textContent;
    text = text.replace(/"([^"]+)":/g, '<span style="color: #ce93d8">"$1"</span>:');
    text = text.replace(/: "([^"]*)"/g, ': <span style="color: #81d4fa">"$1"</span>');
    text = text.replace(/: (\\d+)/g, ': <span style="color: #ffcc80">$1</span>');
    text = text.replace(/: (true|false|null)/g, ': <span style="color: #f48fb1">$1</span>');
    el.innerHTML = text;
});
document.querySelectorAll('.truncatable').forEach(function(wrapper) {
    const content = wrapper.querySelector('.truncatable-content');
    const btn = wrapper.querySelector('.expand-btn');
    if (content.scrollHeight > 250) {
        wrapper.classList.add('truncated');
        btn.addEventListener('click', function() {
            if (wrapper.classList.contains('truncated')) { wrapper.classList.remove('truncated'); wrapper.classList.add('expanded'); btn.textContent = 'Show less'; }
            else { wrapper.classList.remove('expanded'); wrapper.classList.add('truncated'); btn.textContent = 'Show more'; }
        });
    }
});
`;

// Search JavaScript
export function getSearchJs(totalPages: number): string {
  return `
(function() {
    var totalPages = ${totalPages};
    var searchBox = document.getElementById('search-box');
    var searchInput = document.getElementById('search-input');
    var searchBtn = document.getElementById('search-btn');
    var modal = document.getElementById('search-modal');
    var modalInput = document.getElementById('modal-search-input');
    var modalSearchBtn = document.getElementById('modal-search-btn');
    var modalCloseBtn = document.getElementById('modal-close-btn');
    var searchStatus = document.getElementById('search-status');
    var searchResults = document.getElementById('search-results');

    if (!searchBox || !modal) return;

    // Hide search on file:// protocol (doesn't work due to CORS restrictions)
    if (window.location.protocol === 'file:') return;

    // Show search box (progressive enhancement)
    searchBox.style.display = 'flex';

    // Gist preview support
    var hostname = window.location.hostname;
    var isGistPreview = hostname === 'gisthost.github.io' || hostname === 'gistpreview.github.io';
    var gistId = null;
    var gistOwner = null;
    var gistInfoLoaded = false;

    if (isGistPreview) {
        var queryMatch = window.location.search.match(/^\\?([a-f0-9]+)/i);
        if (queryMatch) {
            gistId = queryMatch[1];
        }
    }

    async function loadGistInfo() {
        if (!isGistPreview || !gistId || gistInfoLoaded) return;
        try {
            var response = await fetch('https://api.github.com/gists/' + gistId);
            if (response.ok) {
                var info = await response.json();
                gistOwner = info.owner.login;
                gistInfoLoaded = true;
            }
        } catch (e) {
            console.error('Failed to load gist info:', e);
        }
    }

    function getPageFetchUrl(pageFile) {
        if (isGistPreview && gistOwner && gistId) {
            return 'https://gist.githubusercontent.com/' + gistOwner + '/' + gistId + '/raw/' + pageFile;
        }
        return pageFile;
    }

    function getPageLinkUrl(pageFile) {
        if (isGistPreview && gistId) {
            return '?' + gistId + '/' + pageFile;
        }
        return pageFile;
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
    }

    function openModal(query) {
        modalInput.value = query || '';
        searchResults.innerHTML = '';
        searchStatus.textContent = '';
        modal.showModal();
        modalInput.focus();
        if (query) {
            performSearch(query);
        }
    }

    function closeModal() {
        modal.close();
        if (window.location.hash.startsWith('#search=')) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }

    function updateUrlHash(query) {
        if (query) {
            history.replaceState(null, '', window.location.pathname + window.location.search + '#search=' + encodeURIComponent(query));
        }
    }

    function highlightTextNodes(element, searchTerm) {
        var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        var nodesToReplace = [];

        while (walker.nextNode()) {
            var node = walker.currentNode;
            if (node.nodeValue.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                nodesToReplace.push(node);
            }
        }

        nodesToReplace.forEach(function(node) {
            var text = node.nodeValue;
            var regex = new RegExp('(' + escapeRegex(searchTerm) + ')', 'gi');
            var parts = text.split(regex);
            if (parts.length > 1) {
                var span = document.createElement('span');
                parts.forEach(function(part) {
                    if (part.toLowerCase() === searchTerm.toLowerCase()) {
                        var mark = document.createElement('mark');
                        mark.textContent = part;
                        span.appendChild(mark);
                    } else {
                        span.appendChild(document.createTextNode(part));
                    }
                });
                node.parentNode.replaceChild(span, node);
            }
        });
    }

    function fixInternalLinks(element, pageFile) {
        var links = element.querySelectorAll('a[href^="#"]');
        links.forEach(function(link) {
            var href = link.getAttribute('href');
            link.setAttribute('href', pageFile + href);
        });
    }

    function processPage(pageFile, html, query) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var resultsFromPage = 0;

        var messages = doc.querySelectorAll('.message');
        messages.forEach(function(msg) {
            var text = msg.textContent || '';
            if (text.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                resultsFromPage++;

                var msgId = msg.id || '';
                var pageLinkUrl = getPageLinkUrl(pageFile);
                var link = pageLinkUrl + (msgId ? '#' + msgId : '');

                var clone = msg.cloneNode(true);
                fixInternalLinks(clone, pageLinkUrl);
                highlightTextNodes(clone, query);

                var resultDiv = document.createElement('div');
                resultDiv.className = 'search-result';
                resultDiv.innerHTML = '<a href="' + link + '">' +
                    '<div class="search-result-page">' + escapeHtml(pageFile) + '</div>' +
                    '<div class="search-result-content">' + clone.innerHTML + '</div>' +
                    '</a>';
                searchResults.appendChild(resultDiv);
            }
        });

        return resultsFromPage;
    }

    async function performSearch(query) {
        if (!query.trim()) {
            searchStatus.textContent = 'Enter a search term';
            return;
        }

        updateUrlHash(query);
        searchResults.innerHTML = '';
        searchStatus.textContent = 'Searching...';

        if (isGistPreview && !gistInfoLoaded) {
            searchStatus.textContent = 'Loading gist info...';
            await loadGistInfo();
            if (!gistOwner) {
                searchStatus.textContent = 'Failed to load gist info. Search unavailable.';
                return;
            }
        }

        var resultsFound = 0;
        var pagesSearched = 0;

        var pagesToFetch = [];
        for (var i = 1; i <= totalPages; i++) {
            pagesToFetch.push('page-' + String(i).padStart(3, '0') + '.html');
        }

        searchStatus.textContent = 'Searching...';

        var batchSize = 3;
        for (var i = 0; i < pagesToFetch.length; i += batchSize) {
            var batch = pagesToFetch.slice(i, i + batchSize);

            var promises = batch.map(function(pageFile) {
                return fetch(getPageFetchUrl(pageFile))
                    .then(function(response) {
                        if (!response.ok) throw new Error('Failed to fetch');
                        return response.text();
                    })
                    .then(function(html) {
                        var count = processPage(pageFile, html, query);
                        resultsFound += count;
                        pagesSearched++;
                        searchStatus.textContent = 'Found ' + resultsFound + ' result(s) in ' + pagesSearched + '/' + totalPages + ' pages...';
                    })
                    .catch(function() {
                        pagesSearched++;
                        searchStatus.textContent = 'Found ' + resultsFound + ' result(s) in ' + pagesSearched + '/' + totalPages + ' pages...';
                    });
            });

            await Promise.all(promises);
        }

        searchStatus.textContent = 'Found ' + resultsFound + ' result(s) in ' + totalPages + ' pages';
    }

    searchBtn.addEventListener('click', function() {
        openModal(searchInput.value);
    });

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            openModal(searchInput.value);
        }
    });

    modalSearchBtn.addEventListener('click', function() {
        performSearch(modalInput.value);
    });

    modalInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            performSearch(modalInput.value);
        }
    });

    modalCloseBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    if (window.location.hash.startsWith('#search=')) {
        var query = decodeURIComponent(window.location.hash.substring(8));
        if (query) {
            searchInput.value = query;
            openModal(query);
        }
    }
})();
`;
}

// Gist preview JavaScript
export const GIST_PREVIEW_JS = `
(function() {
    var hostname = window.location.hostname;
    if (hostname !== 'gisthost.github.io' && hostname !== 'gistpreview.github.io') return;
    var match = window.location.search.match(/^\\?([^/]+)/);
    if (!match) return;
    var gistId = match[1];

    function rewriteLinks(root) {
        (root || document).querySelectorAll('a[href]').forEach(function(link) {
            var href = link.getAttribute('href');
            if (href.startsWith('?')) return;
            if (href.startsWith('http') || href.startsWith('#') || href.startsWith('//')) return;
            var parts = href.split('#');
            var filename = parts[0];
            var anchor = parts.length > 1 ? '#' + parts[1] : '';
            link.setAttribute('href', '?' + gistId + '/' + filename + anchor);
        });
    }

    rewriteLinks();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { rewriteLinks(); });
    }

    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    rewriteLinks(node);
                    if (node.tagName === 'A' && node.getAttribute('href')) {
                        var href = node.getAttribute('href');
                        if (!href.startsWith('?') && !href.startsWith('http') &&
                            !href.startsWith('#') && !href.startsWith('//')) {
                            var parts = href.split('#');
                            var filename = parts[0];
                            var anchor = parts.length > 1 ? '#' + parts[1] : '';
                            node.setAttribute('href', '?' + gistId + '/' + filename + anchor);
                        }
                    }
                }
            });
        });
    });

    function startObserving() {
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            setTimeout(startObserving, 10);
        }
    }
    startObserving();

    function scrollToFragment() {
        var hash = window.location.hash;
        if (!hash) return false;
        var targetId = hash.substring(1);
        var target = document.getElementById(targetId);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return true;
        }
        return false;
    }

    if (!scrollToFragment()) {
        var delays = [100, 300, 500, 1000, 2000];
        delays.forEach(function(delay) {
            setTimeout(scrollToFragment, delay);
        });
    }
})();
`;

// Helper function to escape HTML
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Template functions
export function basePage(
  title: string,
  content: string,
  css: string,
  js: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>${css}</style>
</head>
<body>
    <div class="container">
${content}
    </div>
    <script>${js}</script>
</body>
</html>`;
}

export function pagination(currentPage: number, totalPages: number): string {
  if (totalPages <= 1) {
    return '<div class="pagination"><a href="index.html" class="index-link">Index</a></div>';
  }

  let html = '<div class="pagination">\n<a href="index.html" class="index-link">Index</a>\n';

  if (currentPage > 1) {
    html += `<a href="page-${String(currentPage - 1).padStart(3, "0")}.html">&larr; Prev</a>\n`;
  } else {
    html += '<span class="disabled">&larr; Prev</span>\n';
  }

  for (let page = 1; page <= totalPages; page++) {
    if (page === currentPage) {
      html += `<span class="current">${page}</span>\n`;
    } else {
      html += `<a href="page-${String(page).padStart(3, "0")}.html">${page}</a>\n`;
    }
  }

  if (currentPage < totalPages) {
    html += `<a href="page-${String(currentPage + 1).padStart(3, "0")}.html">Next &rarr;</a>\n`;
  } else {
    html += '<span class="disabled">Next &rarr;</span>\n';
  }

  html += "</div>";
  return html;
}

export function indexPagination(totalPages: number): string {
  if (totalPages < 1) {
    return '<div class="pagination"><span class="current">Index</span></div>';
  }

  let html =
    '<div class="pagination">\n<span class="current">Index</span>\n<span class="disabled">&larr; Prev</span>\n';

  for (let page = 1; page <= totalPages; page++) {
    html += `<a href="page-${String(page).padStart(3, "0")}.html">${page}</a>\n`;
  }

  if (totalPages >= 1) {
    html += '<a href="page-001.html">Next &rarr;</a>\n';
  } else {
    html += '<span class="disabled">Next &rarr;</span>\n';
  }

  html += "</div>";
  return html;
}

export function todoList(todos: TodoItem[], toolId: string): string {
  if (!todos || todos.length === 0) {
    return "";
  }

  let html = `<div class="todo-list" data-tool-id="${escapeHtml(toolId)}"><div class="todo-header"><span class="todo-header-icon">☰</span> Task List</div><ul class="todo-items">`;

  for (const todo of todos) {
    const status = todo.status || "pending";
    const content = todo.content || "";
    let icon: string;
    let statusClass: string;

    if (status === "completed") {
      icon = "✓";
      statusClass = "todo-completed";
    } else if (status === "in_progress") {
      icon = "→";
      statusClass = "todo-in-progress";
    } else {
      icon = "○";
      statusClass = "todo-pending";
    }

    html += `<li class="todo-item ${statusClass}"><span class="todo-icon">${icon}</span><span class="todo-content">${escapeHtml(content)}</span></li>`;
  }

  html += "</ul></div>";
  return html;
}

export function writeTool(
  filePath: string,
  content: string,
  toolId: string
): string {
  const filename = filePath.includes("/")
    ? filePath.split("/").pop()!
    : filePath;
  return `<div class="file-tool write-tool" data-tool-id="${escapeHtml(toolId)}">
<div class="file-tool-header write-header"><span class="file-tool-icon">📝</span> Write <span class="file-tool-path">${escapeHtml(filename)}</span></div>
<div class="file-tool-fullpath">${escapeHtml(filePath)}</div>
<div class="truncatable"><div class="truncatable-content"><pre class="file-content">${escapeHtml(content)}</pre></div><button class="expand-btn">Show more</button></div>
</div>`;
}

export function editTool(
  filePath: string,
  oldString: string,
  newString: string,
  replaceAll: boolean,
  toolId: string
): string {
  const filename = filePath.includes("/")
    ? filePath.split("/").pop()!
    : filePath;
  const replaceAllText = replaceAll
    ? ' <span class="edit-replace-all">(replace all)</span>'
    : "";
  return `<div class="file-tool edit-tool" data-tool-id="${escapeHtml(toolId)}">
<div class="file-tool-header edit-header"><span class="file-tool-icon">✏️</span> Edit <span class="file-tool-path">${escapeHtml(filename)}</span>${replaceAllText}</div>
<div class="file-tool-fullpath">${escapeHtml(filePath)}</div>
<div class="truncatable"><div class="truncatable-content">
<div class="edit-section edit-old"><div class="edit-label">−</div><pre class="edit-content">${escapeHtml(oldString)}</pre></div>
<div class="edit-section edit-new"><div class="edit-label">+</div><pre class="edit-content">${escapeHtml(newString)}</pre></div>
</div><button class="expand-btn">Show more</button></div>
</div>`;
}

export function bashTool(
  command: string,
  description: string,
  toolId: string
): string {
  const descHtml = description
    ? `<div class="tool-description">${escapeHtml(description)}</div>`
    : "";
  return `<div class="tool-use bash-tool" data-tool-id="${escapeHtml(toolId)}">
<div class="tool-header"><span class="tool-icon">$</span> Bash</div>
${descHtml}<div class="truncatable"><div class="truncatable-content"><pre class="bash-command">${escapeHtml(command)}</pre></div><button class="expand-btn">Show more</button></div>
</div>`;
}

export function toolUse(
  toolName: string,
  description: string,
  inputJson: string,
  toolId: string
): string {
  const descHtml = description
    ? `<div class="tool-description">${escapeHtml(description)}</div>`
    : "";
  return `<div class="tool-use" data-tool-id="${escapeHtml(toolId)}"><div class="tool-header"><span class="tool-icon">⚙</span> ${escapeHtml(toolName)}</div>
${descHtml}<div class="truncatable"><div class="truncatable-content"><pre class="json">${escapeHtml(inputJson)}</pre></div><button class="expand-btn">Show more</button></div></div>`;
}

export function toolResult(
  contentHtml: string,
  isError: boolean,
  hasImages = false
): string {
  const errorClass = isError ? " tool-error" : "";
  if (hasImages) {
    return `<div class="tool-result${errorClass}">${contentHtml}</div>`;
  }
  return `<div class="tool-result${errorClass}"><div class="truncatable"><div class="truncatable-content">${contentHtml}</div><button class="expand-btn">Show more</button></div></div>`;
}

export function thinking(contentHtml: string): string {
  return `<div class="thinking"><div class="thinking-label">Thinking</div>${contentHtml}</div>`;
}

export function assistantText(contentHtml: string): string {
  return `<div class="assistant-text">${contentHtml}</div>`;
}

export function userContent(contentHtml: string): string {
  return `<div class="user-content">${contentHtml}</div>`;
}

export function imageBlock(mediaType: string, data: string): string {
  return `<div class="image-block"><img src="data:${escapeHtml(mediaType)};base64,${data}" style="max-width: 100%"></div>`;
}

export function commitCard(
  commitHash: string,
  commitMsg: string,
  githubRepo: string | null
): string {
  const shortHash = commitHash.slice(0, 7);
  if (githubRepo) {
    const githubLink = `https://github.com/${githubRepo}/commit/${commitHash}`;
    return `<div class="commit-card"><a href="${escapeHtml(githubLink)}"><span class="commit-card-hash">${escapeHtml(shortHash)}</span> ${escapeHtml(commitMsg)}</a></div>`;
  }
  return `<div class="commit-card"><span class="commit-card-hash">${escapeHtml(shortHash)}</span> ${escapeHtml(commitMsg)}</div>`;
}

export function message(
  roleClass: string,
  roleLabel: string,
  msgId: string,
  timestamp: string,
  contentHtml: string
): string {
  return `<div class="message ${roleClass}" id="${escapeHtml(msgId)}"><div class="message-header"><span class="role-label">${escapeHtml(roleLabel)}</span><a href="#${escapeHtml(msgId)}" class="timestamp-link"><time datetime="${escapeHtml(timestamp)}" data-timestamp="${escapeHtml(timestamp)}">${escapeHtml(timestamp)}</time></a></div><div class="message-content">${contentHtml}</div></div>`;
}

export function continuation(contentHtml: string): string {
  return `<details class="continuation"><summary>Session continuation summary</summary>${contentHtml}</details>`;
}

export function indexItem(
  promptNum: number,
  link: string,
  timestamp: string,
  renderedContent: string,
  statsHtml: string
): string {
  return `<div class="index-item"><a href="${escapeHtml(link)}"><div class="index-item-header"><span class="index-item-number">#${promptNum}</span><time datetime="${escapeHtml(timestamp)}" data-timestamp="${escapeHtml(timestamp)}">${escapeHtml(timestamp)}</time></div><div class="index-item-content">${renderedContent}</div></a>${statsHtml}</div>`;
}

export function indexCommit(
  commitHash: string,
  commitMsg: string,
  timestamp: string,
  githubRepo: string | null
): string {
  const shortHash = commitHash.slice(0, 7);
  if (githubRepo) {
    const githubLink = `https://github.com/${githubRepo}/commit/${commitHash}`;
    return `<div class="index-commit"><a href="${escapeHtml(githubLink)}"><div class="index-commit-header"><span class="index-commit-hash">${escapeHtml(shortHash)}</span><time datetime="${escapeHtml(timestamp)}" data-timestamp="${escapeHtml(timestamp)}">${escapeHtml(timestamp)}</time></div><div class="index-commit-msg">${escapeHtml(commitMsg)}</div></a></div>`;
  }
  return `<div class="index-commit"><div class="index-commit-header"><span class="index-commit-hash">${escapeHtml(shortHash)}</span><time datetime="${escapeHtml(timestamp)}" data-timestamp="${escapeHtml(timestamp)}">${escapeHtml(timestamp)}</time></div><div class="index-commit-msg">${escapeHtml(commitMsg)}</div></div>`;
}

export function indexStats(
  toolStatsStr: string,
  longTextsHtml: string
): string {
  if (!toolStatsStr && !longTextsHtml) {
    return "";
  }
  const statsSpan = toolStatsStr ? `<span>${escapeHtml(toolStatsStr)}</span>` : "";
  return `<div class="index-item-stats">${statsSpan}${longTextsHtml}</div>`;
}

export function indexLongText(renderedContent: string): string {
  return `<div class="index-item-long-text"><div class="truncatable"><div class="truncatable-content"><div class="index-item-long-text-content">${renderedContent}</div></div><button class="expand-btn">Show more</button></div></div>`;
}

export function pageTemplate(
  pageNum: number,
  totalPages: number,
  paginationHtml: string,
  messagesHtml: string
): string {
  const content = `        <h1><a href="index.html" style="color: inherit; text-decoration: none;">Claude Code transcript</a> - page ${pageNum}/${totalPages}</h1>
        ${paginationHtml}
        ${messagesHtml}
        ${paginationHtml}`;
  return basePage(
    `Claude Code transcript - page ${pageNum}`,
    content,
    CSS,
    JS
  );
}

export function indexTemplate(
  paginationHtml: string,
  promptNum: number,
  totalMessages: number,
  totalToolCalls: number,
  totalCommits: number,
  totalPages: number,
  indexItemsHtml: string,
  searchJs: string
): string {
  const content = `        <div class="header-row">
            <h1>Claude Code transcript</h1>
            <div id="search-box">
                <input type="text" id="search-input" placeholder="Search..." aria-label="Search transcripts">
                <button id="search-btn" type="button" aria-label="Search">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                </button>
            </div>
        </div>
        ${paginationHtml}
        <p style="color: var(--text-muted); margin-bottom: 24px;">${promptNum} prompts · ${totalMessages} messages · ${totalToolCalls} tool calls · ${totalCommits} commits · ${totalPages} pages</p>
        ${indexItemsHtml}
        ${paginationHtml}

        <dialog id="search-modal">
            <div class="search-modal-header">
                <input type="text" id="modal-search-input" placeholder="Search..." aria-label="Search transcripts">
                <button id="modal-search-btn" type="button" aria-label="Search">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                </button>
                <button id="modal-close-btn" type="button" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                </button>
            </div>
            <div id="search-status"></div>
            <div id="search-results"></div>
        </dialog>
        <script>
${searchJs}
        </script>`;
  return basePage("Claude Code transcript - Index", content, CSS, JS);
}

export function projectIndexTemplate(
  projectName: string,
  sessions: Array<{
    name: string;
    summary: string;
    date: string;
    sizeKb: number;
  }>
): string {
  let sessionsHtml = "";
  for (const session of sessions) {
    const truncatedSummary =
      session.summary.length > 100
        ? session.summary.slice(0, 100) + "..."
        : session.summary;
    sessionsHtml += `
        <div class="index-item">
            <a href="${escapeHtml(session.name)}/index.html">
                <div class="index-item-header">
                    <span class="index-item-number">${escapeHtml(session.date)}</span>
                    <span style="color: var(--text-muted);">${Math.round(session.sizeKb)} KB</span>
                </div>
                <div class="index-item-content">
                    <p style="margin: 0;">${escapeHtml(truncatedSummary)}</p>
                </div>
            </a>
        </div>`;
  }

  const content = `        <h1><a href="../index.html" style="color: inherit; text-decoration: none;">Claude Code Archive</a> / ${escapeHtml(projectName)}</h1>
        <p style="color: var(--text-muted); margin-bottom: 24px;">${sessions.length} session${sessions.length !== 1 ? "s" : ""}</p>

        ${sessionsHtml}

        <div style="margin-top: 24px;">
            <a href="../index.html" class="pagination" style="display: inline-block; padding: 8px 16px; background: var(--user-border); color: white; text-decoration: none; border-radius: 6px;">Back to Archive</a>
        </div>`;
  return basePage(`${projectName} - Claude Code Archive`, content, CSS, JS);
}

export function masterIndexTemplate(
  projects: Array<{ name: string; sessionCount: number; recentDate: string }>,
  totalSessions: number
): string {
  let projectsHtml = "";
  for (const project of projects) {
    projectsHtml += `
        <div class="index-item">
            <a href="${escapeHtml(project.name)}/index.html">
                <div class="index-item-header">
                    <span class="index-item-number">${escapeHtml(project.name)}</span>
                    <time>${escapeHtml(project.recentDate)}</time>
                </div>
                <div class="index-item-content">
                    <p style="margin: 0;">${project.sessionCount} session${project.sessionCount !== 1 ? "s" : ""}</p>
                </div>
            </a>
        </div>`;
  }

  const content = `        <h1>Claude Code Archive</h1>
        <p style="color: var(--text-muted); margin-bottom: 24px;">${projects.length} projects · ${totalSessions} sessions</p>

        ${projectsHtml}`;
  return basePage("Claude Code Archive", content, CSS, JS);
}
