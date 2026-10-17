import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Only active when the site is shown inside the local blog admin (an iframe at 127.0.0.1:4317).
// Tells the admin which page is open and which text blocks it has, and adds an "edit" button
// on hover. It only ever sends to the admin's origin, and only sends what's already on the page.
const ADMIN_ORIGINS = ['http://127.0.0.1:4317', 'http://localhost:4317'];

export default function AdminBridge() {
    const router = useRouter();

    useEffect(() => {
        if (window.parent === window) return;
        let adminOrigin = null;

        const describePage = () => {
            const registry = window.__siteBlocks || {};
            const blocks = [...document.querySelectorAll('[data-block]')].map(el => ({
                id: el.dataset.block,
                label: el.dataset.blockLabel || el.dataset.block,
                md: registry[el.dataset.block]?.md ?? ''
            }));
            window.parent.postMessage({ type: 'site:page', path: window.location.pathname, blocks }, adminOrigin);
        };

        const onMessage = event => {
            if (!ADMIN_ORIGINS.includes(event.origin) || event.data?.type !== 'admin:hello') return;
            adminOrigin = event.origin;
            document.documentElement.classList.add('admin-preview');
            addUploadIcons();
            describePage();
        };

        // tiny upload icon next to links the admin can replace, like the resume
        const addUploadIcons = () => {
            document.querySelectorAll('[data-admin-upload]').forEach(link => {
                if (link.nextElementSibling?.classList.contains('admin-upload-button')) return;
                const button = document.createElement('button');
                button.className = 'admin-upload-button';
                button.type = 'button';
                button.title = `Upload a new ${link.dataset.adminUpload}`;
                button.setAttribute('aria-label', button.title);
                button.dataset.upload = link.dataset.adminUpload;
                button.textContent = '⤒';
                link.after(button);
            });
        };

        const onClick = event => {
            const upload = event.target.closest('.admin-upload-button');
            if (adminOrigin && upload) {
                event.preventDefault();
                window.parent.postMessage({ type: 'site:upload', kind: upload.dataset.upload }, adminOrigin);
                return;
            }
            const button = event.target.closest('.admin-edit-button');
            if (!adminOrigin || !button) return;
            event.preventDefault();
            window.parent.postMessage({ type: 'site:edit-block', id: button.parentElement.dataset.block }, adminOrigin);
        };

        // hover "edit" buttons, added only in admin preview
        const onOver = event => {
            const block = adminOrigin && event.target.closest('[data-block]');
            if (!block || block.querySelector(':scope > .admin-edit-button')) return;
            const button = document.createElement('button');
            button.className = 'admin-edit-button';
            button.type = 'button';
            button.textContent = '✎ edit';
            block.appendChild(button);
        };

        const onRoute = () => adminOrigin && setTimeout(() => { addUploadIcons(); describePage(); }, 50);

        window.addEventListener('message', onMessage);
        document.addEventListener('click', onClick, true);
        document.addEventListener('mouseover', onOver);
        router.events.on('routeChangeComplete', onRoute);
        return () => {
            window.removeEventListener('message', onMessage);
            document.removeEventListener('click', onClick, true);
            document.removeEventListener('mouseover', onOver);
            router.events.off('routeChangeComplete', onRoute);
        };
    }, [router]);

    return null;
}
