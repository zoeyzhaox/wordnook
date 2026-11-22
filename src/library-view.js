import { deckWords, wordsFor, phraseWordIndex, spellingPrompt } from './core.js';

const pageSize = 50;
const decks = [['all', '全部词汇'], ['toefl', '托福 · 基础选词'], ['ielts', '雅思 · 基础选词'], ['custom', '我的导入']];

export function createLibraryView({btn, esc, head, dt, icon}) {
  let query = '', topic = '全部', favoritesOnly = false, page = 0;
  let batch = null, viewingBatch = false;

  function availableWords(state) {
    if (viewingBatch && batch) return state.customWords.filter(w => batch.ids.has(w.id));
    return deckWords(state);
  }

  function clearFilters() {
    query = '';
    topic = '全部';
    favoritesOnly = false;
    page = 0;
  }

  function rows(state) {
    const words = availableWords(state);
    const favorites = new Set(state.favorites);
    const text = query.trim().toLowerCase();
    const matches = words.filter(w =>
      (topic === '全部' || w.topic === topic) &&
      (!favoritesOnly || favorites.has(w.id)) &&
      (!text || [w.word, w.meaning, w.phrase].some(v => v.toLowerCase().includes(text)))
    );
    const count = matches.length;
    const pages = Math.ceil(count / pageSize);
    page = Math.max(0, Math.min(page, pages - 1));
    const start = page * pageSize;
    const visible = matches.slice(start, start + pageSize);
    let empty = '';
    if (!count) {
      if (!words.length && state.settings.deck === 'custom' && !viewingBatch) {
        empty = '还没有导入词表。' + btn('import', '导入第一份词表', 'button subtle');
      } else if (favoritesOnly && !words.some(w => favorites.has(w.id))) {
        empty = '当前范围还没有收藏的词。打开任一词条详情，点击星标即可收藏。' + btn('clearLibraryFilters', '查看全部词', 'button subtle');
      } else {
        empty = '没有符合当前条件的词。' + btn('clearLibraryFilters', '清除筛选', 'button subtle');
      }
    }
    return `<div class="word-table"><div class="table-heading"><span>单词 / ${count}</span><span>释义与搭配</span><span>下次复习</span></div>${visible.map(w => {
      const due = state.cards[w.id]?.due;
      return `<button class="word-row" data-action="detail:${esc(w.id)}"><strong>${esc(w.word)}<small>${esc(w.pos)}</small></strong><span>${esc(w.meaning)}<small>${esc(w.phrase)}</small></span><span>${due ? dt(Math.max(0, +new Date(due) - Date.now())) : '还未学习'} ${favorites.has(w.id) ? '★' : ''}</span></button>`;
    }).join('') || `<div class="empty small library-empty">${empty}</div>`}</div>${pages > 1 ? `<nav class="library-pagination" aria-label="词库分页">${btn('libraryPage:-1', '上一页', 'button subtle', page === 0 ? 'disabled' : '')}<span aria-live="polite">第 ${page + 1} / ${pages} 页 · ${start + 1}–${start + visible.length} / ${count} 词</span>${btn('libraryPage:1', '下一页', 'button subtle', page + 1 >= pages ? 'disabled' : '')}</nav>` : ''}`;
  }

  function clozePreview(state) {
    if (!batch?.ids.size) return '';
    const examples = [];
    for (const word of state.customWords) {
      if (!batch.ids.has(word.id)) continue;
      const index = phraseWordIndex(word.phrase, word.word);
      if (index < 0) continue;
      const mask = spellingPrompt(word.word, 2).mask;
      examples.push('<li><b>' + esc(word.word) + '</b> → ' + esc(word.phrase.slice(0, index) + mask + word.phrase.slice(index + word.word.length)) + '</li>');
      if (examples.length === 3) break;
    }
    if (!examples.length) return '';
    return '<details class="import-cloze" open><summary>拼写题预览 · 独立回忆</summary><ul>' + examples.join('') + '</ul></details>';
  }

  function view(state) {
    const all = wordsFor(state);
    const topics = [...new Set(availableWords(state).map(w => w.topic))];
    if (!topics.includes(topic)) topic = '全部';
    const counts = {all: all.length, custom: state.customWords.length};
    for (const id of ['toefl', 'ielts']) counts[id] = all.filter(w => w.decks?.includes(id)).length;
    return `${head('', '词库', '', btn('import', '导入词表', 'button subtle'))}
      <div class="deck-selector"><label for="deck">当前学习词库</label><select id="deck">${decks.map(([id, name]) => `<option value="${id}" ${state.settings.deck === id ? 'selected' : ''}>${name}（${counts[id]}）</option>`).join('')}</select><p>切换后，单词卡、小游戏和小窗使用所选词库。共同词汇共享学习进度。</p></div>
      ${batch ? `<div class="library-batch"><span role="status">已导入 ${batch.ids.size} 个新词，跳过重复 ${batch.skipped} 条。</span>${batch.ids.size && !viewingBatch ? btn('showImportBatch', `查看刚导入的 ${batch.ids.size} 个词`, 'button subtle') : ''}${viewingBatch ? btn('closeImportBatch', '返回当前词库', 'button subtle') : ''}</div>` : ''}
      ${clozePreview(state)}
      ${viewingBatch ? '<h2 class="library-batch-title">本批新增词</h2>' : ''}
      <div class="library-tools"><input id="search" type="search" aria-label="搜索词库" placeholder="搜索单词、意思或搭配…" value="${esc(query)}"><select id="topic" aria-label="词库主题">${['全部', ...topics].map(t => `<option ${topic === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>${btn('favorites', icon('star') + ' 只看收藏', 'button subtle' + (favoritesOnly ? ' selected' : ''), `aria-pressed="${favoritesOnly}"`)}</div>
      <div id="library-results">${rows(state)}</div><p class="footnote">内置词库为原创基础选词，并非官方必备清单或完整考试词库。可导入自己的 CSV / JSON 词表。</p>`;
  }

  return {
    view, rows, clearFilters,
    search(value) { query = value; page = 0; },
    setTopic(value) { topic = value; page = 0; },
    toggleFavorites() { favoritesOnly = !favoritesOnly; page = 0; },
    movePage(direction) { page += direction; },
    switchDeck() { viewingBatch = false; topic = '全部'; page = 0; },
    recordBatch({importedIds, skipped}) { batch = {ids: new Set(importedIds), skipped}; viewingBatch = false; },
    showBatch(show) { viewingBatch = show; clearFilters(); },
    reset() { batch = null; viewingBatch = false; clearFilters(); }
  };
}
