// Mock Data Structure
const fileSystem = {
    id: 'root',
    name: 'Root',
    type: 'folder',
    children: [
        {
            id: '1',
            name: 'Daily Work',
            type: 'folder',
            children: [
                { id: '11', name: 'Gmail', type: 'link', url: 'https://gmail.com' },
                { id: '12', name: 'Calendar', type: 'link', url: 'https://calendar.google.com' },
                { id: '13', name: 'Slack', type: 'link', url: 'https://slack.com' }
            ]
        },
        {
            id: '2',
            name: 'Dev Resources',
            type: 'folder',
            children: [
                { id: '21', name: 'GitHub', type: 'link', url: 'https://github.com' },
                { id: '22', name: 'StackOverflow', type: 'link', url: 'https://stackoverflow.com' },
                { id: '23', name: 'MDN Web Docs', type: 'link', url: 'https://developer.mozilla.org' },
                {
                    id: '24',
                    name: 'Design Tools',
                    type: 'folder',
                    children: [
                        { id: '241', name: 'Figma', type: 'link', url: 'https://figma.com' },
                        { id: '242', name: 'Coolors', type: 'link', url: 'https://coolors.co' }
                    ]
                }
            ]
        },
        { id: '3', name: 'News', type: 'link', url: 'https://news.ycombinator.com' },
        { id: '4', name: 'Music', type: 'link', url: 'https://spotify.com' },
        {
            id: '5',
            name: 'Shopping',
            type: 'folder',
            children: [
                 { id: '51', name: 'Amazon', type: 'link', url: 'https://amazon.com' }
            ]
        }
    ]
};

// State
let currentPath = [fileSystem];
let currentFolder = fileSystem;

// DOM Elements
const breadcrumbEl = document.getElementById('breadcrumb');
const fileGridEl = document.getElementById('file-grid');
const backBtn = document.getElementById('back-btn');

// Icons (using Emoji for "hand-drawn" cute vibe simplicity, or could use SVG)
const ICONS = {
    folder: '📁',
    link: '🔗'
};

function render() {
    // Update Breadcrumb
    breadcrumbEl.textContent = currentPath.map(f => f.name).join(' / ') || '/';

    // Update Back Button
    backBtn.disabled = currentPath.length <= 1;
    backBtn.style.opacity = currentPath.length <= 1 ? '0.5' : '1';
    backBtn.style.cursor = currentPath.length <= 1 ? 'default' : 'pointer';

    // Clear Grid
    fileGridEl.innerHTML = '';

    // Render Items
    if (currentFolder.children) {
        currentFolder.children.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = `item ${item.type}`;
            itemEl.onclick = () => handleItemClick(item);

            const iconEl = document.createElement('div');
            iconEl.className = 'icon';
            iconEl.textContent = item.type === 'folder' ? ICONS.folder : ICONS.link;

            const labelEl = document.createElement('div');
            labelEl.className = 'label';
            labelEl.textContent = item.name;

            itemEl.appendChild(iconEl);
            itemEl.appendChild(labelEl);
            fileGridEl.appendChild(itemEl);
        });
    } else {
        fileGridEl.innerHTML = '<div style="width:100%; text-align:center;">Empty Folder</div>';
    }
}

function handleItemClick(item) {
    if (item.type === 'folder') {
        currentFolder = item;
        currentPath.push(item);
        render();
    } else if (item.type === 'link') {
        window.open(item.url, '_blank');
    }
}

function goBack() {
    if (currentPath.length > 1) {
        currentPath.pop();
        currentFolder = currentPath[currentPath.length - 1];
        render();
    }
}

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    // Render initial view
    render();

    // Attach event listeners
    backBtn.addEventListener('click', goBack);
});
