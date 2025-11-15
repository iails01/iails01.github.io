(function () {
  function getSelectedFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var selected = params.get('selected');
    if (!selected) {
      return [];
    }
    return selected.split(',').map(function (tag) {
      return decodeURIComponent(tag.trim());
    }).filter(function (tag) { return tag.length > 0; });
  }

  function getPageFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var page = parseInt(params.get('page') || '1', 10);
    if (!page || page < 1) return 1;
    return page;
  }

  function updateUrl(selected, page) {
    var params = new URLSearchParams(window.location.search);
    if (selected.length) {
      params.set('selected', selected.join(','));
    } else {
      params.delete('selected');
    }
    if (page && page > 1) {
      params.set('page', String(page));
    } else {
      params.delete('page');
    }
    var newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
    history.replaceState(null, '', newUrl);
  }

  function syncSummary(summaryElement, selected) {
    if (!summaryElement) return;
    var list = summaryElement.querySelector('.selected-tags');
    if (!list) return;
    list.innerHTML = '';
    selected.forEach(function (tag) {
      var item = document.createElement('li');
      item.textContent = tag;
      list.appendChild(item);
    });
    summaryElement.hidden = selected.length === 0;
  }

  function handleFilter(container) {
    if (!container) return;
    var PAGE_SIZE = 15;
    var checkboxes = Array.prototype.slice.call(container.querySelectorAll('.tags-filter input[type="checkbox"]'));
    var postCards = Array.prototype.slice.call(container.querySelectorAll('.tag-filter-card'));
    var emptyState = container.querySelector('.tag-filter-empty');
    var summary = container.querySelector('.tag-selected-summary');
    var pagination = container.querySelector('.tags-page-nav');
    var currentPage = getPageFromUrl();

    function renderPagination(totalPages) {
      if (!pagination) return;
      pagination.innerHTML = '';
      if (totalPages <= 1) {
        return;
      }

      function createLink(label, page, className, disabled) {
        var link = document.createElement(disabled ? 'span' : 'a');
        link.textContent = label;
        if (className) {
          link.className = className;
        }
        if (!disabled) {
          link.href = '#';
          link.addEventListener('click', function (e) {
            e.preventDefault();
            if (page === currentPage) return;
            currentPage = page;
            applySelection(readSelection(), false);
          });
        }
        return link;
      }

      var prevDisabled = currentPage <= 1;
      var nextDisabled = currentPage >= totalPages;

      pagination.appendChild(createLink('\u00ab \u4e0a\u4e00\u9875', currentPage - 1, 'prev', prevDisabled));

      for (var i = 1; i <= totalPages; i++) {
        var isCurrent = i === currentPage;
        var pageLink = createLink(String(i), i, 'page-number' + (isCurrent ? ' current' : ''), isCurrent);
        pagination.appendChild(pageLink);
      }

      pagination.appendChild(createLink('\u4e0b\u4e00\u9875 \u00bb', currentPage + 1, 'next', nextDisabled));
    }

    function syncCheckboxState() {
      checkboxes.forEach(function (checkbox) {
        var item = checkbox.closest('li');
        if (item) {
          item.setAttribute('data-selected', checkbox.checked ? 'true' : 'false');
        }
      });
    }

    function applySelection(selected, resetPage) {
      var filtered = [];
      postCards.forEach(function (card) {
        var tags = card.getAttribute('data-tags');
        var tagList = tags ? tags.split('|') : [];
        var shouldDisplay = selected.every(function (tag) {
          return tagList.indexOf(tag) !== -1;
        });
        if (shouldDisplay) {
          filtered.push(card);
        }
      });

      var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      if (resetPage) {
        currentPage = 1;
      }

      var start = (currentPage - 1) * PAGE_SIZE;
      var end = start + PAGE_SIZE;
      var visibleCount = 0;

      postCards.forEach(function (card) {
        card.setAttribute('hidden', 'hidden');
      });

      filtered.forEach(function (card, index) {
        if (index >= start && index < end) {
          card.removeAttribute('hidden');
          visibleCount += 1;
        }
      });
      if (emptyState) {
        emptyState.hidden = filtered.length !== 0;
      }
      syncSummary(summary, selected);
      renderPagination(totalPages);
      updateUrl(selected, currentPage);
      syncCheckboxState();
    }

    function readSelection() {
      return checkboxes.filter(function (checkbox) {
        return checkbox.checked;
      }).map(function (checkbox) {
        return checkbox.value;
      });
    }

    checkboxes.forEach(function (checkbox) {
      checkbox.addEventListener('change', function () {
        applySelection(readSelection(), true);
      });
    });

    var initialSelected = getSelectedFromUrl();
    if (initialSelected.length) {
      var matched = 0;
      checkboxes.forEach(function (checkbox) {
        if (initialSelected.indexOf(checkbox.value) !== -1) {
          checkbox.checked = true;
          matched += 1;
        }
      });
      if (matched !== initialSelected.length) {
        // Some tags from URL not found, fallback to matched ones only
        initialSelected = readSelection();
      }
    }
    syncCheckboxState();
    applySelection(initialSelected, false);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var container = document.querySelector('.tags-page');
    if (container) {
      handleFilter(container);
    }
  });
})();
