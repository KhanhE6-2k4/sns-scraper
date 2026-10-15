document.addEventListener('DOMContentLoaded', () => {
    // Update copyright year
    document.querySelectorAll('[data-current-year]').forEach(element => {
        element.textContent = new Date().getFullYear();
    });
    // Mobile navigation
    document.querySelectorAll('.menu-toggle').forEach(button => {
        const navId = button.getAttribute('aria-controls');
        const nav = navId ? document.getElementById(navId) : null;
        if (!nav) return;
        button.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('is-open');
            button.setAttribute('aria-expanded', String(isOpen));
        });
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('is-open');
                button.setAttribute('aria-expanded', 'false');
            });
        });
        document.addEventListener('click', event => {
            if (!nav.contains(event.target) && !button.contains(event.target)) {
                nav.classList.remove('is-open');
                button.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Platform dropdown
    initPlatformDropdown();
});

function initPlatformDropdown() {
    const dropdown = document.querySelector(
        '.platform-dropdown, .platform-switcher'
    );

    if (!dropdown) return;

    const toggle = dropdown.querySelector('#platformToggle');
    const menu = dropdown.querySelector('#platformMenu');

    if (!toggle || !menu) return;

    const isToolPage = dropdown.classList.contains('platform-switcher');

    function closeMenu() {
        menu.classList.add('hidden');
        toggle.setAttribute('aria-expanded', 'false');
    }

    // Chỉ áp dụng hành vi chuyển tab trên các trang công cụ
    if (isToolPage) {
        const currentPath = window.location.pathname.replace(/\/+$/, '');
        const currentPlatform = currentPath.split('/').pop();

        menu.querySelectorAll('a[data-platform]').forEach(link => {
            const isCurrent = link.dataset.platform === currentPlatform;

            if (isCurrent) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            }

            link.addEventListener('click', event => {
                if (isCurrent) {
                    event.preventDefault();
                }

                closeMenu();
            });
        });
    }

    // Mở/đóng menu
    toggle.addEventListener('click', event => {
        event.stopPropagation();

        const isOpen = toggle.getAttribute('aria-expanded') === 'true';

        toggle.setAttribute('aria-expanded', String(!isOpen));
        menu.classList.toggle('hidden', isOpen);
    });

    // Đóng khi click bên ngoài
    document.addEventListener('click', event => {
        if (!dropdown.contains(event.target)) {
            closeMenu();
        }
    });

    // Đóng bằng Escape
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeMenu();
            toggle.focus();
        }
    });
}
