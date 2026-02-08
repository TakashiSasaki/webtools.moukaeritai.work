class AppLayout extends HTMLElement {
    constructor() {
        super();
        this.menuItems = [
            { name: 'Home', path: '/', icon: 'fa-home' },
            { name: 'Loopback Addr', path: '/tools/loopback-addresses/', icon: 'fa-network-wired' },
            { name: 'Private Ports', path: '/tools/private-ports/', icon: 'fa-server' },
            { name: 'UUID v4', path: '/tools/uuid-v4-generator/', icon: 'fa-random' },
            { name: 'UUID v3/v5', path: '/tools/uuid-v3-v5-generator/', icon: 'fa-fingerprint' },
            { name: 'Drop Tester', path: '/tools/drop-event-tester/', icon: 'fa-box-open' },
            { name: 'Clipboard API', path: '/tools/clipboard/', icon: 'fa-clipboard' },
            { name: 'App Link', path: '/tools/android-app-link/', icon: 'fa-link' },
            { name: 'Web NFC', path: '/tools/web-nfc-tester/', icon: 'fa-rss' },
            { name: 'MicroPython', path: '/tools/micropython/', icon: 'fa-python' },
            { name: 'Pyodide', path: '/tools/pyodide/', icon: 'fa-cubes' }
        ];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.highlightCurrentLink();

        // Start observing for children that are added after the component connects
        // (This happens when the browser parser hasn't reached the internal content yet)
        this.relocateChildren();
        this.observer = new MutationObserver(() => this.relocateChildren());
        this.observer.observe(this, { childList: true });
    }

    disconnectedCallback() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    relocateChildren() {
        const shell = this.querySelector('.app-layout-shell');
        const slot = this.querySelector('#main-slot');
        if (!shell || !slot) return;

        // Move any child that is NOT the layout shell itself into the slot
        Array.from(this.childNodes).forEach(node => {
            if (node !== shell) {
                slot.appendChild(node);
            }
        });
    }

    render() {
        // Prevent double rendering
        if (this.querySelector('.app-layout-shell')) {
            return;
        }

        // Ensure the component itself is block-level
        this.style.display = 'block';

        const navLinks = this.menuItems.map(item => `
            <a href="${item.path}" class="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors rounded-lg mb-1 group">
                <i class="fas ${item.icon} w-5 text-center group-hover:text-emerald-400 transition-colors"></i>
                <span class="font-medium text-sm">${item.name}</span>
            </a>
        `).join('');

        // Create the layout shell
        const layoutShell = document.createElement('div');
        layoutShell.className = 'app-layout-shell flex min-h-screen bg-slate-50';
        layoutShell.innerHTML = `
            <!-- Mobile Backdrop -->
            <div id="backdrop" class="fixed inset-0 bg-black/50 z-40 hidden lg:hidden transition-opacity"></div>

            <!-- Sidebar -->
            <aside id="sidebar" class="fixed lg:sticky top-0 left-0 z-50 w-64 h-screen bg-slate-900 text-slate-300 transform -translate-x-full lg:translate-x-0 transition-transform duration-300 flex flex-col shadow-2xl">
                <!-- Brand -->
                <div class="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 font-bold shrink-0">W</div>
                    <span class="text-white font-bold tracking-wide text-lg">WebTools</span>
                    <button id="close-sidebar" class="lg:hidden ml-auto text-slate-400 hover:text-white p-2">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- Nav -->
                <nav class="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    ${navLinks}
                </nav>

                <!-- Footer -->
                <div class="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                    <div>&copy; 2026 moukaeritai.work</div>
                    <div class="mt-1 text-[10px]">v1.0.2</div>
                </div>
            </aside>

            <!-- Main Content Wrapper -->
            <div class="flex-1 flex flex-col min-w-0 transition-all duration-300">
                <!-- Mobile Header -->
                <header class="bg-white border-b border-slate-200 p-4 flex items-center gap-4 lg:hidden sticky top-0 z-30 shadow-sm">
                    <button id="open-sidebar" class="text-slate-600 hover:text-slate-900 p-2 -ml-2 rounded-lg hover:bg-slate-100">
                        <i class="fas fa-bars text-xl"></i>
                    </button>
                    <span class="font-bold text-slate-800 text-lg">WebTools</span>
                </header>

                <!-- Content Slot -->
                <main id="main-slot" class="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                </main>
            </div>
        `;

        // Append the layout shell to the custom element
        this.appendChild(layoutShell);
    }

    setupEventListeners() {
        // Need to find elements within this, not just layoutShell since it's already appended
        const sidebar = this.querySelector('#sidebar');
        const backdrop = this.querySelector('#backdrop');
        const openBtn = this.querySelector('#open-sidebar');
        const closeBtn = this.querySelector('#close-sidebar');

        const toggleMenu = (show) => {
            if (show) {
                sidebar.classList.remove('-translate-x-full');
                backdrop.classList.remove('hidden');
            } else {
                sidebar.classList.add('-translate-x-full');
                backdrop.classList.add('hidden');
            }
        };

        openBtn?.addEventListener('click', () => toggleMenu(true));
        closeBtn?.addEventListener('click', () => toggleMenu(false));
        backdrop?.addEventListener('click', () => toggleMenu(false));
    }

    highlightCurrentLink() {
        const currentPath = window.location.pathname;
        const normalizedPath = currentPath.endsWith('/') ? currentPath : currentPath + '/';
        const links = this.querySelectorAll('aside nav a');

        links.forEach(link => {
            const href = link.getAttribute('href');
            // Exact match or active section
            if (href === normalizedPath || (href !== '/' && normalizedPath.startsWith(href))) {
                link.classList.add('bg-slate-800', 'text-white');
                link.querySelector('i').classList.add('text-emerald-400');
            }
        });
    }
}

customElements.define('app-layout', AppLayout);
