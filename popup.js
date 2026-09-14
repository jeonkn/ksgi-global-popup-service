(function () {
  if (window.__GLOBAL_NOTICE_INITIALIZED__) return;
  window.__GLOBAL_NOTICE_INITIALIZED__ = true;

  const CONFIG_URL = 'https://ksgi-global-popup-service.pages.dev/notice.json?_t=' + Date.now();

  fetch(CONFIG_URL)
    .then((res) => {
      if (!res.ok) throw new Error('Network error');
      return res.json();
    })
    .then((data) => {
      if (!data || !data.enabled) return;

      const now = new Date().getTime();
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();

      if (!isNaN(start) && now < start) return;
      if (!isNaN(end) && now > end) return;

      if (Array.isArray(data.targets) && !data.targets.includes('all')) {
        const currentHost = window.location.hostname;
        const isTarget = data.targets.some((target) => currentHost.includes(target));
        if (!isTarget) return;
      }

      const storageKey = 'hide_notice_' + (data.noticeId || 'default');
      const hideUntil = localStorage.getItem(storageKey);
      if (hideUntil && now < parseInt(hideUntil, 10)) return;

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => renderModal(data, storageKey));
      } else {
        renderModal(data, storageKey);
      }
    })
    .catch((err) => {
      console.warn('[Global Notice] Load error:', err.message);
    });

  function renderModal(data, storageKey) {
    const host = document.createElement('div');
    host.id = 'global-notice-host';
    host.style.all = 'initial';

    const shadow = host.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
      <style>
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Apple SD Gothic Neo", "Segoe UI", Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .dim-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2147483647;
          padding: 16px;
          opacity: 0;
          animation: fadeIn 0.25s ease-out forwards;
        }

        .modal-card {
          background: #ffffff;
          width: 100%;
          max-width: 420px;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          position: relative;
          transform: scale(0.95) translateY(8px);
          animation: popUp 0.25s ease-out forwards;
        }

        .modal-content-area {
          padding: 32px 24px 20px;
          text-align: center;
        }

        /* 아이콘 중앙 상단 배치 */
        .illus-badge {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          border-radius: 50%;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
          word-break: keep-all;
        }

        .modal-text {
          font-size: 14px;
          line-height: 1.65;
          color: #475569;
          word-break: keep-all; /* 단어 단위 줄바꿈 유지 */
          text-align: center;
        }

        /* 점검 일시 박스 가독성 개선 */
        .schedule-box {
          background-color: #f1f5f9;
          border-radius: 8px;
          padding: 12px 14px;
          margin: 14px 0;
          font-size: 13.5px;
          color: #1e293b;
          line-height: 1.5;
          display: block;
        }

        .schedule-box strong {
          color: #2563eb;
          font-size: 14px;
        }

        .btn-action {
          width: 100%;
          background-color: #2563eb;
          color: #ffffff;
          border: none;
          outline: none;
          padding: 13px 20px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 20px;
          transition: background-color 0.15s ease;
        }

        .btn-action:active {
          background-color: #1d4ed8;
        }

        .modal-footer-bar {
          background-color: #f8fafc;
          border-top: 1px solid #f1f5f9;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .btn-link-option {
          background: none;
          border: none;
          outline: none;
          font-size: 13px;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
        }

        @keyframes fadeIn {
          to { opacity: 1; }
        }

        @keyframes popUp {
          to { transform: scale(1) translateY(0); }
        }
      </style>

      <div class="dim-overlay" id="dimOverlay">
        <div class="modal-card" role="dialog" aria-modal="true">
          <div class="modal-content-area">
            <!-- 상단 중앙 일러스트 -->
            <div class="illus-badge">
              <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 11L18 8L22 9L23 12M24 16A8 8 0 1 0 24 32A8 8 0 1 0 24 16Z" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="27" cy="27" r="14" fill="#FFFFFF" stroke="#2563EB" stroke-width="3"/>
                <path d="M27 18V27L32 29.5" stroke="#1D4ED8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M37 13C36 10 33 8 30 8C29 8 28.5 8.2 28 8.5C31 10.5 32 14.5 30.5 17.5C33.5 17.5 36.5 15.5 37 13Z" fill="#F59E0B"/>
              </svg>
            </div>

            <!-- 제목 -->
            <h2 class="modal-title">${escapeHtml(data.title || '[시스템 점검 안내]')}</h2>

            <!-- 본문 -->
            <div class="modal-text">
              ${data.content || ''}
            </div>

            <button type="button" class="btn-action" id="btnConfirm">닫기</button>
          </div>

          <!-- 하단 기능 바 -->
          <div class="modal-footer-bar">
            <button type="button" class="btn-link-option" id="btnNeverToday">오늘 하루 열지 않기</button>
            <button type="button" class="btn-link-option" id="btnFooterClose">닫기</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(host);

    const btnConfirm = shadow.getElementById('btnConfirm');
    const btnFooterClose = shadow.getElementById('btnFooterClose');
    const btnNeverToday = shadow.getElementById('btnNeverToday');

    const handleClose = () => host.remove();
    const handleNeverToday = () => {
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);
      localStorage.setItem(storageKey, midnight.getTime().toString());
      host.remove();
    };

    btnConfirm.addEventListener('click', handleClose);
    btnFooterClose.addEventListener('click', handleClose);
    btnNeverToday.addEventListener('click', handleNeverToday);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
