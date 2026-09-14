(function () {
  if (window.__GLOBAL_NOTICE_INITIALIZED__) return;
  window.__GLOBAL_NOTICE_INITIALIZED__ = true;

  // 1. 공통 설정 파일 경로 (Nginx URL & 캐시 방지 쿼리스트링)
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

      // 노출 기간 검증
      if (!isNaN(start) && now < start) return;
      if (!isNaN(end) && now > end) return;

      // 사이트 타겟팅 검증
      if (Array.isArray(data.targets) && !data.targets.includes('all')) {
        const currentHost = window.location.hostname;
        const isTarget = data.targets.some((target) => currentHost.includes(target));
        if (!isTarget) return;
      }

      // '오늘 하루 열지 않기' 만료 시간 확인
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
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2147483647; /* 최상단 레이어 보장 */
          padding: 20px;
          opacity: 0;
          animation: fadeIn 0.25s ease-out forwards;
        }

        .modal-card {
          background: #ffffff;
          width: 100%;
          max-width: 480px;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          position: relative;
          transform: scale(0.95) translateY(8px);
          animation: popUp 0.25s ease-out forwards;
        }

        .modal-content-area {
          padding: 36px 32px 24px;
          text-align: center;
        }

        .modal-title {
          font-size: 21px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 24px;
        }

        .modal-body-container {
          position: relative;
          min-height: 90px;
          margin-bottom: 24px;
        }

        /* 우측 일러스트 아이콘 (점검 시계 & 톱니바퀴) */
        .illus-badge {
          float: right;
          width: 76px;
          height: 76px;
          margin: 0 0 10px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          border-radius: 50%;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
          flex-shrink: 0;
        }

        .modal-text {
          font-size: 14.5px;
          line-height: 1.7;
          color: #334155;
          word-break: keep-all;
          text-align: center;
        }

        .modal-text strong {
          color: #0f172a;
          font-weight: 700;
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-block;
          margin: 6px 0;
        }

        /* 파란색 메인 닫기 버튼 */
        .btn-action {
          width: 100%;
          background-color: #0070f3;
          color: #ffffff;
          border: none;
          outline: none;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.18s ease, transform 0.1s ease;
          box-shadow: 0 4px 12px rgba(0, 112, 243, 0.25);
        }

        .btn-action:hover {
          background-color: #0060d0;
        }

        .btn-action:active {
          transform: scale(0.985);
        }

        /* 하단 바 (오늘 하루 열지 않기 영역) */
        .modal-footer-bar {
          background-color: #f8fafc;
          border-top: 1px solid #f1f5f9;
          padding: 10px 20px;
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
          padding: 4px 6px;
          border-radius: 4px;
          transition: color 0.15s ease, background-color 0.15s ease;
        }

        .btn-link-option:hover {
          color: #0f172a;
          background-color: #e2e8f0;
        }

        @keyframes fadeIn {
          to { opacity: 1; }
        }

        @keyframes popUp {
          to {
            transform: scale(1) translateY(0);
          }
        }
      </style>

      <div class="dim-overlay" id="dimOverlay">
        <div class="modal-card" role="dialog" aria-modal="true">
          <div class="modal-content-area">
            <!-- 제목 -->
            <h2 class="modal-title">${escapeHtml(data.title || '[시스템 점검 안내]')}</h2>

            <!-- 본문 및 점검 일러스트 -->
            <div class="modal-body-container">
              <div class="illus-badge">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 11L18 8L22 9L23 12M24 16A8 8 0 1 0 24 32A8 8 0 1 0 24 16Z" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round"/>
                  <circle cx="27" cy="27" r="14" fill="#FFFFFF" stroke="#2563EB" stroke-width="3"/>
                  <path d="M27 18V27L32 29.5" stroke="#1D4ED8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M37 13C36 10 33 8 30 8C29 8 28.5 8.2 28 8.5C31 10.5 32 14.5 30.5 17.5C33.5 17.5 36.5 15.5 37 13Z" fill="#F59E0B"/>
                </svg>
              </div>
              <div class="modal-text">
                ${data.content || ''}
              </div>
              <div style="clear: both;"></div>
            </div>

            <!-- 메인 닫기 버튼 -->
            <button type="button" class="btn-action" id="btnConfirm">닫기</button>
          </div>

          <!-- 하단 기능 바: 오늘 하루 열지 않기 -->
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

    // 일반 닫기 (새로고침하면 다시 뜸)
    const handleClose = () => {
      host.remove();
    };

    // 오늘 하루 열지 않기 (당일 23:59:59까지 노출 차단)
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
