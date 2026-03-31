/**
 * =============================================================================
 * Novada Auth System - Dashboard Page Logic
 * =============================================================================
 * Verifies session via backend, displays account info, handles logout.
 */

(function() {
    'use strict';

    const DashboardPage = {
        async init() {
            const content = document.getElementById('dashboardContent');
            const errorBox = document.getElementById('dashboardError');
            const statusBadge = document.getElementById('statusBadge');

            try {
                const result = await AuthAPI.verifyAuth();
                const user = result.data?.user;

                document.getElementById('userUid').textContent = user?.username || '-';
                document.getElementById('userEmail').textContent = user?.email || '-';
                document.getElementById('userId').textContent = user?.id || '-';

                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', async () => {
                        try {
                            await AuthAPI.logout();
                        } finally {
                            window.location.href = '/auth/login.html';
                        }
                    });
                }

                statusBadge.textContent = 'Authenticated';
                content.hidden = false;

            } catch (error) {
                console.error('Dashboard auth verification failed:', error);
                statusBadge.textContent = 'Session expired';
                statusBadge.style.background = '#fef2f2';
                statusBadge.style.color = '#b91c1c';
                errorBox.hidden = false;

                setTimeout(() => {
                    window.location.href = '/auth/login.html';
                }, 1500);
            }
        },
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => DashboardPage.init());
    } else {
        DashboardPage.init();
    }
})();
