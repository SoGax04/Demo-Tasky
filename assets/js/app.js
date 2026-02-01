// Default Data
const DEFAULT_BOOKMARKS = {
    id: 'root',
    name: 'Root',
    type: 'folder',
    children: []
};

let fileSystem = { ...DEFAULT_BOOKMARKS };

// State
let currentPath = [fileSystem];
let currentFolder = fileSystem;
let selectedItem = null;

// Quick Access State
let quickAccessItems = [];

// Context Menu State
let contextMenuTargetItem = null;
let contextMenuTargetQuickAccess = null;

// File System Access API
let directoryHandle = null;
let bookmarksFileHandle = null;
let quickAccessFileHandle = null;

// Sort items recursively (folders first, then by name)
function sortItems(items) {
    if (!Array.isArray(items)) return items;
    return items
        .map(item => {
            if (item.children) {
                return { ...item, children: sortItems(item.children) };
            }
            return item;
        })
        .sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
}

// Select data folder
async function selectDataFolder() {
    try {
        directoryHandle = await window.showDirectoryPicker({
            mode: 'readwrite'
        });
        await loadDataFromFolder();
        updateFolderStatus();
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Failed to select folder:', err);
            alert('Failed to select folder: ' + err.message);
        }
    }
}

// Update folder status display
function updateFolderStatus() {
    const statusEl = document.getElementById('folder-status');
    const btnEl = document.getElementById('folder-btn');
    if (directoryHandle) {
        statusEl.textContent = directoryHandle.name;
        btnEl.textContent = 'Change';
        btnEl.classList.add('connected');
    } else {
        statusEl.textContent = '';
        btnEl.textContent = 'Select Folder';
        btnEl.classList.remove('connected');
    }
}

// Load data from selected folder
async function loadDataFromFolder() {
    if (!directoryHandle) return;

    // Load bookmarks.json
    try {
        bookmarksFileHandle = await directoryHandle.getFileHandle('bookmarks.json');
        const file = await bookmarksFileHandle.getFile();
        const text = await file.text();
        fileSystem = JSON.parse(text);
        currentPath = [fileSystem];
        currentFolder = fileSystem;
    } catch (err) {
        if (err.name === 'NotFoundError') {
            // Create new file with default data
            bookmarksFileHandle = await directoryHandle.getFileHandle('bookmarks.json', { create: true });
            fileSystem = { ...DEFAULT_BOOKMARKS };
            currentPath = [fileSystem];
            currentFolder = fileSystem;
            await saveBookmarks();
        } else {
            console.error('Failed to load bookmarks:', err);
        }
    }

    // Load quickaccess.json
    try {
        quickAccessFileHandle = await directoryHandle.getFileHandle('quickaccess.json');
        const file = await quickAccessFileHandle.getFile();
        const text = await file.text();
        quickAccessItems = JSON.parse(text);
    } catch (err) {
        if (err.name === 'NotFoundError') {
            // Create new file with default data
            quickAccessFileHandle = await directoryHandle.getFileHandle('quickaccess.json', { create: true });
            quickAccessItems = [];
            await saveQuickAccess();
        } else {
            console.error('Failed to load quick access:', err);
        }
    }

    render();
}

// Save bookmarks to file
async function saveBookmarks() {
    if (!bookmarksFileHandle) {
        console.warn('No folder selected, data not saved');
        return;
    }
    try {
        // Sort before saving
        if (fileSystem.children) {
            fileSystem.children = sortItems(fileSystem.children);
        }
        const writable = await bookmarksFileHandle.createWritable();
        await writable.write(JSON.stringify(fileSystem, null, 2));
        await writable.close();
    } catch (err) {
        console.error('Failed to save bookmarks:', err);
    }
}

// Save quick access to file
async function saveQuickAccess() {
    if (!quickAccessFileHandle) {
        console.warn('No folder selected, data not saved');
        return;
    }
    try {
        const writable = await quickAccessFileHandle.createWritable();
        await writable.write(JSON.stringify(quickAccessItems, null, 2));
        await writable.close();
    } catch (err) {
        console.error('Failed to save quick access:', err);
    }
}

// DOM Elements
const breadcrumbEl = document.getElementById('breadcrumb');
const backBtn = document.getElementById('back-btn');
const fileGridEl = document.getElementById('file-grid');
const inputDirectory = document.getElementById('input-directory');
const inputName = document.getElementById('input-name');
const inputUrl = document.getElementById('input-url');
const sidebarListEl = document.getElementById('sidebar-list');
const sidebarContextMenu = document.getElementById('sidebar-context-menu');
const mainContextMenu = document.getElementById('main-context-menu');

// Icons
const ICONS = {
    folder: '📁',
    link: '🔗'
};

function render() {
    // 1. Update Breadcrumb (clickable)
    breadcrumbEl.innerHTML = '';
    currentPath.forEach((folder, index) => {
        const span = document.createElement('span');
        span.className = 'breadcrumb-item';
        span.textContent = folder.name;
        span.onclick = () => navigateToPathIndex(index);
        breadcrumbEl.appendChild(span);

        // Add separator
        const sep = document.createElement('span');
        sep.className = 'breadcrumb-separator';
        sep.textContent = ' / ';
        breadcrumbEl.appendChild(sep);
    });

    // 2. Update Back Button state
    backBtn.disabled = currentPath.length <= 1;

    // 3. Update Directory Input
    inputDirectory.value = currentPath.map(f => f.name).join(' / ') + ' /';

    // 4. Render Grid
    fileGridEl.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'file-table';

    // Header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Name</th>
            <th>URL</th>
            <th style="width: 80px;"></th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    if (currentFolder.children && currentFolder.children.length > 0) {
        // Sort: Folders first, then Name
        const sortedChildren = [...currentFolder.children].sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });

        sortedChildren.forEach(item => {
            const tr = document.createElement('tr');
            if (selectedItem && selectedItem.id === item.id) {
                tr.className = 'selected';
            }
            tr.onclick = () => fillControlPanel(item);

            // Right-click context menu for main view items
            tr.oncontextmenu = (e) => {
                e.preventDefault();
                contextMenuTargetItem = item;
                showContextMenu(mainContextMenu, e.clientX, e.clientY);
            };

            // Name
            const tdName = document.createElement('td');
            const nameContainer = document.createElement('div');
            nameContainer.className = 'col-name';
            nameContainer.innerHTML = `<span>${item.name}</span>`;
            tdName.appendChild(nameContainer);

            // URL
            const tdUrl = document.createElement('td');
            tdUrl.style.fontFamily = 'monospace';
            tdUrl.style.color = '#888';
            tdUrl.textContent = item.url || '-';

            // Open Button
            const tdAction = document.createElement('td');
            const openBtn = document.createElement('button');
            openBtn.className = 'open-btn';
            openBtn.textContent = 'OPEN';
            openBtn.onclick = (e) => {
                e.stopPropagation();
                handleItemClick(item);
            };
            tdAction.appendChild(openBtn);

            tr.appendChild(tdName);
            tr.appendChild(tdUrl);
            tr.appendChild(tdAction);
            tbody.appendChild(tr);
        });
    } else {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="3" style="text-align:center; padding: 20px; color: #aaa;">Empty</td>';
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    fileGridEl.appendChild(table);

    // 5. Render Quick Access Sidebar
    renderQuickAccess();
}

// Render Quick Access Sidebar
function renderQuickAccess() {
    sidebarListEl.innerHTML = '';

    quickAccessItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'sidebar-item';
        li.textContent = item.name;
        li.draggable = true;
        li.dataset.index = index;

        // Click to open/navigate
        li.onclick = () => handleQuickAccessClick(item);

        // Right-click context menu
        li.oncontextmenu = (e) => {
            e.preventDefault();
            contextMenuTargetQuickAccess = index;
            showContextMenu(sidebarContextMenu, e.clientX, e.clientY);
        };

        // Drag and Drop Events
        li.ondragstart = (e) => {
            li.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
        };

        li.ondragend = () => {
            li.classList.remove('dragging');
            document.querySelectorAll('.sidebar-item').forEach(el => {
                el.classList.remove('drag-over');
            });
        };

        li.ondragover = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const draggingItem = document.querySelector('.sidebar-item.dragging');
            if (draggingItem !== li) {
                li.classList.add('drag-over');
            }
        };

        li.ondragleave = () => {
            li.classList.remove('drag-over');
        };

        li.ondrop = async (e) => {
            e.preventDefault();
            li.classList.remove('drag-over');
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = index;

            if (fromIndex !== toIndex) {
                // Reorder array
                const [movedItem] = quickAccessItems.splice(fromIndex, 1);
                quickAccessItems.splice(toIndex, 0, movedItem);
                await saveQuickAccess();
                renderQuickAccess();
            }
        };

        sidebarListEl.appendChild(li);
    });
}

// Handle Quick Access item click
function handleQuickAccessClick(item) {
    if (item.type === 'link' && item.url) {
        window.open(item.url, '_blank');
    } else if (item.type === 'folder' && item.path) {
        // Navigate to the folder path
        navigateToFolderById(item.targetId);
    }
}

// Navigate to a folder by ID
function navigateToFolderById(folderId) {
    const path = findPathToFolder(fileSystem, folderId);
    if (path) {
        currentPath = path;
        currentFolder = path[path.length - 1];
        selectedItem = null;
        inputName.value = '';
        inputUrl.value = '';
        render();
    }
}

// Find path to a folder by ID
function findPathToFolder(folder, targetId, path = []) {
    const currentPathArr = [...path, folder];
    if (folder.id === targetId) {
        return currentPathArr;
    }
    if (folder.children) {
        for (const child of folder.children) {
            if (child.type === 'folder') {
                const result = findPathToFolder(child, targetId, currentPathArr);
                if (result) return result;
            }
        }
    }
    return null;
}

// Show Context Menu
function showContextMenu(menu, x, y) {
    hideAllContextMenus();
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('show');
}

// Hide All Context Menus
function hideAllContextMenus() {
    sidebarContextMenu.classList.remove('show');
    mainContextMenu.classList.remove('show');
}

// Delete Quick Access Item
async function deleteQuickAccessItem() {
    if (contextMenuTargetQuickAccess !== null) {
        quickAccessItems.splice(contextMenuTargetQuickAccess, 1);
        contextMenuTargetQuickAccess = null;
        hideAllContextMenus();
        await saveQuickAccess();
        renderQuickAccess();
    }
}

// Add to Quick Access
async function addToQuickAccess() {
    if (contextMenuTargetItem) {
        const newQuickAccessItem = {
            id: 'qa_' + Date.now(),
            name: contextMenuTargetItem.name,
            type: contextMenuTargetItem.type,
            url: contextMenuTargetItem.url || null,
            targetId: contextMenuTargetItem.type === 'folder' ? contextMenuTargetItem.id : null
        };
        quickAccessItems.push(newQuickAccessItem);
        contextMenuTargetItem = null;
        hideAllContextMenus();
        await saveQuickAccess();
        renderQuickAccess();
    }
}

// Click anywhere to close context menus
document.addEventListener('click', () => {
    hideAllContextMenus();
});

function handleItemClick(item) {
    if (item.type === 'folder') {
        currentFolder = item;
        currentPath.push(item);
        selectedItem = null;
        inputName.value = '';
        inputUrl.value = '';
        render();
    } else if (item.type === 'link') {
        window.open(item.url, '_blank');
    }
}

function fillControlPanel(item) {
    selectedItem = item;
    inputName.value = item.name;
    inputUrl.value = item.url || '';
    render();
}

function goBack() {
    if (currentPath.length > 1) {
        currentPath.pop();
        currentFolder = currentPath[currentPath.length - 1];
        selectedItem = null;
        inputName.value = '';
        inputUrl.value = '';
        render();
    }
}

function navigateToPathIndex(index) {
    if (index < currentPath.length - 1) {
        currentPath = currentPath.slice(0, index + 1);
        currentFolder = currentPath[currentPath.length - 1];
        selectedItem = null;
        inputName.value = '';
        inputUrl.value = '';
        render();
    }
}

async function addNewItem() {
    const name = inputName.value.trim();
    const url = inputUrl.value.trim();

    if (!name) {
        alert("Please enter a name.");
        return;
    }

    // Determine type based on URL presence
    const type = url ? 'link' : 'folder';

    const newItem = {
        id: Date.now().toString(),
        name: name,
        type: type,
        url: url || null,
        children: type === 'folder' ? [] : undefined
    };

    if (!currentFolder.children) {
        currentFolder.children = [];
    }

    currentFolder.children.push(newItem);

    // Clear inputs
    inputName.value = '';
    inputUrl.value = '';

    await saveBookmarks();
    render();
}

async function deleteSelected() {
    if (!selectedItem) {
        alert("No item selected.");
        return;
    }

    if (confirm(`Are you sure you want to delete "${selectedItem.name}"?`)) {
        currentFolder.children = currentFolder.children.filter(item => item.id !== selectedItem.id);
        selectedItem = null;
        inputName.value = '';
        inputUrl.value = '';
        await saveBookmarks();
        render();
    }
}

// Initialize App
function initApp() {
    updateFolderStatus();
    render();
}

initApp();
