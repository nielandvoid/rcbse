document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const asideToggle = document.getElementById('asideToggle');
  const sidebar = document.getElementById('sidebar');
  const menuLink = document.getElementById('menuLink');
  const sidenav = document.getElementById('sidenav');

  const SUN_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="1.75" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>';
  const MOON_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="1.75" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }

  function renderTheme(theme) {
    if (!themeToggle) return;
    themeToggle.innerHTML = theme === 'light' ? MOON_ICON : SUN_ICON;
    themeToggle.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`);
  }

  renderTheme(getTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = getTheme() === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('cbse-theme', next); } catch (e) {}
      renderTheme(next);
    });
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    try {
      if (!localStorage.getItem('cbse-theme')) {
        const next = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        renderTheme(next);
      }
    } catch (err) {}
  });

  function setAside(open) {
    document.body.classList.toggle('aside-open', open);
    if (asideToggle) {
      asideToggle.classList.toggle('active', open);
      asideToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  }

  try {
    const saved = localStorage.getItem('cbse-aside');
    setAside(saved === 'open' || (saved === null && window.innerWidth >= 1200));
  } catch (e) {
    if (window.innerWidth >= 1200) setAside(true);
  }

  if (asideToggle) {
    asideToggle.addEventListener('click', () => {
      const next = !document.body.classList.contains('aside-open');
      setAside(next);
      try { localStorage.setItem('cbse-aside', next ? 'open' : 'closed'); } catch (e) {}
    });
  }

  if (menuLink && sidebar) {
    menuLink.addEventListener('click', () => {
      const open = sidebar.classList.toggle('open');
      menuLink.textContent = open ? '[close]' : '[menu]';
      menuLink.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
    });
  }

  if (sidenav && sidebar) {
    sidenav.addEventListener('click', (e) => {
      if (e.target.closest('a') && window.innerWidth <= 880) {
        sidebar.classList.remove('open');
        if (menuLink) {
          menuLink.textContent = '[menu]';
          menuLink.setAttribute('aria-expanded', 'false');
        }
        document.body.classList.remove('menu-open');
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      if (menuLink) {
        menuLink.textContent = '[menu]';
        menuLink.setAttribute('aria-expanded', 'false');
      }
      document.body.classList.remove('menu-open');
    }
  });

  const links = Array.from(document.querySelectorAll('#sidenav a[href^="#"]'));
  const allDetails = Array.from(document.querySelectorAll('#sidenav details'));
  const targets = links.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);

  let activeId = null;

  function setActive(id) {
    if (!id || id === activeId) return;
    activeId = id;

    let active = null;
    links.forEach((a) => {
      const on = a.getAttribute('href') === `#${id}`;
      a.classList.toggle('active', on);
      if (on) active = a;
    });

    const parent = active ? active.closest('details') : null;
    allDetails.forEach((d) => {
      d.open = d === parent;
    });
  }

  function scrollCheck() {
    const topOffset = 80;
    let curr = targets[0];

    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 30) {
      curr = targets[targets.length - 1];
    } else {
      for (let i = 0; i < targets.length; i++) {
        if (targets[i].getBoundingClientRect().top <= topOffset) {
          curr = targets[i];
        } else {
          break;
        }
      }
    }

    if (curr) setActive(curr.id);
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        scrollCheck();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', scrollCheck);
  scrollCheck();

  function formatSnippetHeading(heading) {
    if (!heading) return '';
    const numEl = heading.querySelector('.num');
    if (numEl) {
      const num = numEl.textContent.trim();
      const rest = Array.from(heading.childNodes)
        .filter((n) => n !== numEl && (!n.classList || !n.classList.contains('anchor')))
        .map((n) => n.textContent)
        .join('')
        .replace(/^[\s:-]+/, '')
        .trim();
      return `${num}: ${rest}`;
    }
    const raw = Array.from(heading.childNodes)
      .filter((n) => !n.classList || !n.classList.contains('anchor'))
      .map((n) => n.textContent)
      .join('')
      .trim();
    return raw.replace(/^Rule\s+(\d+)\s*[-:]\s*/i, 'Rule $1: ');
  }

  function extractQuotedLines(container) {
    const lines = [];
    container.childNodes.forEach((node) => {
      if (node.nodeType !== 1) return;
      const tag = node.tagName.toLowerCase();
      if (['h2', 'h3', 'header', 'footer', 'article'].includes(tag)) return;

      if (lines.length) lines.push('>');

      if (tag === 'p' || tag === 'blockquote') {
        const text = node.textContent.trim().replace(/\s+/g, ' ');
        if (text) lines.push(`> ${text}`);
      } else if (tag === 'ol') {
        Array.from(node.querySelectorAll(':scope > li')).forEach((li, i) => {
          lines.push(`> ${i + 1}. ${li.textContent.trim().replace(/\s+/g, ' ')}`);
        });
      } else if (tag === 'ul') {
        Array.from(node.querySelectorAll(':scope > li')).forEach((li) => {
          lines.push(`> - ${li.textContent.trim().replace(/\s+/g, ' ')}`);
        });
      }
    });
    return lines;
  }

  function getRuleSnippet(el) {
    const heading = el.querySelector(':scope > h2, :scope > h3');
    const title = formatSnippetHeading(heading);

    const baseUrl = (window.location.origin && window.location.origin !== 'null')
      ? `${window.location.origin}${window.location.pathname}`
      : window.location.href.split('#')[0];
    const url = `${baseUrl}#${el.id}`;

    const articles = Array.from(el.querySelectorAll(':scope > article'));

    if (articles.length > 0) {
      const parts = [];
      if (title) parts.push(title);

      const directLines = extractQuotedLines(el);
      if (directLines.length) parts.push(directLines.join('\n'));

      const subBlocks = articles.map((art) => {
        const artHeading = art.querySelector(':scope > h3');
        const artTitle = formatSnippetHeading(artHeading);
        const artLines = extractQuotedLines(art);
        const seg = [];
        if (artTitle) seg.push(artTitle);
        if (artLines.length) seg.push(artLines.join('\n'));
        return seg.join('\n');
      }).filter(Boolean);

      if (subBlocks.length) parts.push(subBlocks.join('\n\n'));
      parts.push(`source: ${url}`);
      return parts.join('\n\n');
    }

    const lines = extractQuotedLines(el);
    const parts = [];
    if (title) parts.push(title);
    if (lines.length) parts.push(lines.join('\n'));
    parts.push(`source: ${url}`);

    return parts.join('\n');
  }

  document.querySelectorAll('.content section[id], .content article[id]').forEach((el) => {
    const heading = el.querySelector('h2, h3');
    if (!heading) return;
    const a = document.createElement('a');
    a.className = 'anchor';
    a.href = `#${el.id}`;
    a.setAttribute('aria-label', 'Copy rule and link');
    a.textContent = '#';
    a.addEventListener('click', () => {
      const snippet = getRuleSnippet(el);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(snippet).then(() => {
          a.textContent = '[copied]';
          a.classList.add('copied');
          setTimeout(() => {
            a.textContent = '#';
            a.classList.remove('copied');
          }, 1100);
        }).catch(() => {});
      }
    });
    heading.appendChild(a);
  });

  const contentEl = document.querySelector('.content');

  function clearHighlights(root) {
    if (!root) return;
    const marks = Array.from(root.querySelectorAll('mark'));
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
      }
    });
    root.normalize();
  }

  function applyHighlights(root, rawQuery) {
    clearHighlights(root);
    const q = rawQuery ? rawQuery.trim() : '';
    if (!q || !root) return;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const testRegex = new RegExp(escaped, 'i');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || parent.closest('.anchor') || ['SCRIPT', 'STYLE'].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return testRegex.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);

    const matchRegex = new RegExp(escaped, 'gi');
    nodes.forEach((node) => {
      const text = node.nodeValue;
      const parent = node.parentNode;
      if (!parent) return;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      matchRegex.lastIndex = 0;
      let match;
      while ((match = matchRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        const mark = document.createElement('mark');
        mark.textContent = match[0];
        fragment.appendChild(mark);
        lastIndex = matchRegex.lastIndex;
      }
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      parent.replaceChild(fragment, node);
    });
  }

  const rulesSearch = document.getElementById('rulesSearch');
  if (rulesSearch) {
    const allLinks = Array.from(document.querySelectorAll('#sidenav a[href^="#"]'));
    const linkItems = allLinks.map((a) => {
      const target = document.getElementById(a.getAttribute('href').slice(1));
      return {
        link: a,
        details: a.closest('details'),
        text: (a.textContent + ' ' + (target ? target.textContent : '')).toLowerCase()
      };
    });

    rulesSearch.addEventListener('input', (e) => {
      const raw = e.target.value.trim();
      const q = raw.toLowerCase();
      if (!q) {
        linkItems.forEach((item) => {
          item.link.style.display = '';
          if (item.details) item.details.style.display = '';
        });
        clearHighlights(contentEl);
        scrollCheck();
        return;
      }

      const activeDetails = new Set();
      linkItems.forEach((item) => {
        const matches = item.text.includes(q);
        item.link.style.display = matches ? '' : 'none';
        if (matches && item.details) activeDetails.add(item.details);
      });

      allDetails.forEach((d) => {
        if (activeDetails.has(d)) {
          d.style.display = '';
          d.open = true;
        } else {
          d.style.display = 'none';
        }
      });

      applyHighlights(contentEl, raw);
    });

    rulesSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        rulesSearch.value = '';
        rulesSearch.dispatchEvent(new Event('input'));
        rulesSearch.blur();
      }
    });

    window.addEventListener('keydown', (e) => {
      const isCtrlF = (e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F');
      const isSlash = e.key === '/' && document.activeElement !== rulesSearch && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
      if (isCtrlF || isSlash) {
        e.preventDefault();
        if (sidebar && !sidebar.classList.contains('open') && window.innerWidth <= 880) {
          sidebar.classList.add('open');
          if (menuLink) {
            menuLink.textContent = '[close]';
            menuLink.setAttribute('aria-expanded', 'true');
          }
          document.body.classList.add('menu-open');
        }
        rulesSearch.focus();
        rulesSearch.select();
      }
    });
  }

  function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return n.toString();
  }

  const redditStat = document.getElementById('redditStat');
  if (redditStat) {
    fetch('https://www.reddit.com/r/CBSE/about.json')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        const subs = data && data.data && data.data.subscribers;
        if (subs) redditStat.textContent = formatNum(subs);
      })
      .catch(() => {});
  }

  const discordStat = document.getElementById('discordStat');
  if (discordStat) {
    fetch('https://discord.com/api/v9/invites/zkphtqqSdG?with_counts=true')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        const total = data && data.approximate_member_count;
        const online = data && data.approximate_presence_count;
        if (total && online) {
          discordStat.textContent = `${formatNum(total)} / ${online} online`;
        } else if (total) {
          discordStat.textContent = formatNum(total);
        }
      })
      .catch(() => {});
  }
});
