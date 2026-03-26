/* ===== Searchable Select Widget =====
 * Usage: makeSearchable('selectElementId')
 *        makeSearchable(selectElement)
 * 
 * The native <select> is kept in the DOM and stays in sync,
 * so all existing form validation and submission code works unchanged.
 */

(function () {

    // Inject CSS once
    function injectStyles() {
        if (document.getElementById('searchable-select-styles')) return;
        const style = document.createElement('style');
        style.id = 'searchable-select-styles';
        style.textContent = `
            .ss-wrapper {
                position: relative;
                display: block;
            }
            .ss-wrapper .ss-hidden-select {
                display: none !important;
            }
            .ss-control {
                display: flex;
                align-items: center;
                width: 100%;
                padding: 0.65rem 2.4rem 0.65rem 0.85rem;
                border: 1px solid var(--gray-300, #d1d5db);
                border-radius: var(--radius, 6px);
                background: var(--white, #fff);
                font-size: 0.9rem;
                color: var(--gray-700, #374151);
                cursor: pointer;
                user-select: none;
                box-sizing: border-box;
                transition: border-color 0.2s;
                outline: none;
            }
            .ss-control:focus-within,
            .ss-control.open {
                border-color: var(--primary-color, #16a34a);
                box-shadow: 0 0 0 3px rgba(22,163,74,0.12);
            }
            .ss-control .ss-placeholder {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                color: var(--gray-400, #9ca3af);
            }
            .ss-control .ss-selected {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                color: var(--gray-700, #374151);
            }
            .ss-control .ss-arrow {
                position: absolute;
                right: 0.75rem;
                top: 50%;
                transform: translateY(-50%);
                color: var(--gray-400, #9ca3af);
                pointer-events: none;
                font-size: 0.75rem;
                transition: transform 0.2s;
            }
            .ss-control.open .ss-arrow {
                transform: translateY(-50%) rotate(180deg);
            }
            .ss-dropdown {
                position: absolute;
                top: calc(100% + 4px);
                left: 0;
                right: 0;
                background: var(--white, #fff);
                border: 1px solid var(--gray-200, #e5e7eb);
                border-radius: var(--radius, 6px);
                box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                z-index: 9999;
                display: none;
                flex-direction: column;
                max-height: 300px;
                overflow: hidden;
            }
            .ss-dropdown.open {
                display: flex;
            }
            .ss-search-wrap {
                padding: 0.5rem;
                border-bottom: 1px solid var(--gray-100, #f3f4f6);
                flex-shrink: 0;
            }
            .ss-search-input {
                width: 100%;
                padding: 0.45rem 0.75rem;
                border: 1px solid var(--gray-300, #d1d5db);
                border-radius: var(--radius, 6px);
                font-size: 0.85rem;
                outline: none;
                box-sizing: border-box;
                color: var(--gray-700, #374151);
            }
            .ss-search-input:focus {
                border-color: var(--primary-color, #16a34a);
            }
            .ss-options {
                overflow-y: auto;
                flex: 1;
            }
            .ss-option {
                padding: 0.55rem 0.85rem;
                cursor: pointer;
                font-size: 0.88rem;
                color: var(--gray-700, #374151);
            }
            .ss-option:hover,
            .ss-option.highlighted {
                background: var(--gray-50, #f9fafb);
                color: var(--primary-color, #16a34a);
            }
            .ss-option.selected {
                font-weight: 600;
                color: var(--primary-color, #16a34a);
            }
            .ss-group-label {
                padding: 0.35rem 0.85rem;
                font-size: 0.72rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.07em;
                color: var(--gray-400, #9ca3af);
                background: var(--gray-50, #f9fafb);
            }
            .ss-no-results {
                padding: 0.75rem 0.85rem;
                font-size: 0.85rem;
                color: var(--gray-400, #9ca3af);
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Wrap a <select> element with a searchable widget.
     * @param {string|HTMLSelectElement} target  - Select element or its ID
     */
    window.makeSearchable = function (target) {
        injectStyles();

        const select = typeof target === 'string'
            ? document.getElementById(target)
            : target;

        if (!select || select.tagName !== 'SELECT') return;
        if (select.closest('.ss-wrapper')) return; // already wrapped

        // Build all options / optgroups snapshot
        function getOptions() {
            const items = [];
            for (const child of select.children) {
                if (child.tagName === 'OPTGROUP') {
                    items.push({ type: 'group', label: child.label });
                    for (const opt of child.children) {
                        items.push({ type: 'option', value: opt.value, text: opt.textContent.trim(), el: opt });
                    }
                } else if (child.tagName === 'OPTION') {
                    items.push({ type: 'option', value: child.value, text: child.textContent.trim(), el: child });
                }
            }
            return items;
        }

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'ss-wrapper';
        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);
        select.classList.add('ss-hidden-select');

        // Control (the visible "input-like" box)
        const control = document.createElement('div');
        control.className = 'ss-control';
        control.setAttribute('tabindex', '0');
        control.innerHTML = `<span class="ss-placeholder">Select an option</span><i class="fas fa-chevron-down ss-arrow"></i>`;
        wrapper.appendChild(control);

        // Dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'ss-dropdown';
        dropdown.innerHTML = `
            <div class="ss-search-wrap">
                <input class="ss-search-input" type="text" placeholder="🔍 Type to search...">
            </div>
            <div class="ss-options"></div>
        `;
        wrapper.appendChild(dropdown);

        const searchInput = dropdown.querySelector('.ss-search-input');
        const optionsContainer = dropdown.querySelector('.ss-options');

        let allItems = [];

        function renderOptions(query) {
            const q = (query || '').toLowerCase().trim();
            optionsContainer.innerHTML = '';
            let visible = 0;
            let lastGroupEl = null;

            allItems.forEach(item => {
                if (item.type === 'group') {
                    lastGroupEl = document.createElement('div');
                    lastGroupEl.className = 'ss-group-label';
                    lastGroupEl.textContent = item.label;
                    lastGroupEl.style.display = 'none'; // hide until a child is visible
                    optionsContainer.appendChild(lastGroupEl);
                } else {
                    if (q && !item.text.toLowerCase().includes(q) && !item.value.toLowerCase().includes(q)) return;
                    // Show the most recent group header
                    if (lastGroupEl && lastGroupEl.style.display === 'none') {
                        lastGroupEl.style.display = '';
                    }
                    const div = document.createElement('div');
                    div.className = 'ss-option' + (select.value === item.value ? ' selected' : '');
                    div.textContent = item.text;
                    div.dataset.value = item.value;
                    div.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        selectValue(item.value, item.text);
                    });
                    optionsContainer.appendChild(div);
                    visible++;
                }
            });

            if (visible === 0) {
                const no = document.createElement('div');
                no.className = 'ss-no-results';
                no.textContent = 'No results found';
                optionsContainer.appendChild(no);
            }
        }

        function updateLabel(text) {
            if (text) {
                control.innerHTML = `<span class="ss-selected">${text}</span><i class="fas fa-chevron-down ss-arrow"></i>`;
            } else {
                control.innerHTML = `<span class="ss-placeholder">${select.options[0]?.textContent || 'Select an option'}</span><i class="fas fa-chevron-down ss-arrow"></i>`;
            }
        }

        function selectValue(value, text) {
            select.value = value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            updateLabel(value ? text : '');
            closeDropdown();
        }

        function openDropdown() {
            allItems = getOptions();
            renderOptions('');
            searchInput.value = '';
            control.classList.add('open');
            dropdown.classList.add('open');
            searchInput.focus();
        }

        function closeDropdown() {
            control.classList.remove('open');
            dropdown.classList.remove('open');
        }

        // Sync label when native select changes externally
        function syncFromSelect() {
            const sel = select.options[select.selectedIndex];
            updateLabel(sel && sel.value ? sel.textContent.trim() : '');
            allItems = getOptions();
        }

        control.addEventListener('click', () => {
            if (dropdown.classList.contains('open')) {
                closeDropdown();
            } else {
                openDropdown();
            }
        });

        control.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') openDropdown();
            if (e.key === 'Escape') closeDropdown();
        });

        searchInput.addEventListener('input', () => {
            renderOptions(searchInput.value);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeDropdown();
        });

        // Close on outside click
        document.addEventListener('mousedown', (e) => {
            if (!wrapper.contains(e.target)) closeDropdown();
        });

        // Watch for external changes (e.g., loadColleges populates options)
        const observer = new MutationObserver(() => {
            allItems = getOptions();
            syncFromSelect();
        });
        observer.observe(select, { childList: true, subtree: true });

        // Initial sync
        syncFromSelect();

        // Store ref for manual refresh
        select._ssRefresh = () => {
            allItems = getOptions();
            syncFromSelect();
        };

        return wrapper;
    };

    /**
     * Apply makeSearchable to all selects with data-searchable attribute automatically.
     */
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('select[data-searchable]').forEach(sel => {
            makeSearchable(sel);
        });
    });

})();
