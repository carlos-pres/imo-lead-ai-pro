const ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '.replit.dev',
  '.replit.app',
  'imolead.pt',
  'imoleadai.pt',
  'imolead-ai.pt',
  'imoleadaipro.com',
  '.imoleadaipro.com',
];

function isAllowedDomain(hostname: string): boolean {
  return ALLOWED_DOMAINS.some(domain => {
    if (domain.startsWith('.')) {
      return hostname.endsWith(domain) || hostname === domain.slice(1);
    }
    return hostname === domain;
  });
}

export function initAntiCloneProtection(): void {
  if (typeof window === 'undefined') return;

  const hostname = window.location.hostname;

  if (!isAllowedDomain(hostname)) {
    console.error('[Security] Unauthorized domain detected:', hostname);
    if (import.meta.env.PROD) {
      document.body.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-family: system-ui, -apple-system, sans-serif;
          background: linear-gradient(135deg, #1e3a5f 0%, #0f1f33 100%);
          color: white;
          text-align: center;
          padding: 20px;
        ">
          <div style="font-size: 48px; margin-bottom: 20px;">Warning</div>
          <h1 style="margin: 0 0 16px 0; font-size: 28px;">Acesso Não Autorizado</h1>
          <p style="margin: 0 0 24px 0; opacity: 0.8; max-width: 400px;">
            Este site só pode ser acedido através do domínio oficial.
          </p>
          <a href="https://imolead.pt" style="
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
          ">
            Ir para ImoLead AI Pro
          </a>
        </div>
      `;
      throw new Error('Unauthorized domain');
    }
  }

  if (window.top !== window.self && import.meta.env.PROD) {
    const isReplitWebview = window.location.hostname.includes('replit.dev') || 
                            window.location.hostname.includes('replit.app');
    
    if (!isReplitWebview) {
      console.error('[Security] Site loaded in iframe - potential clickjacking');
      try {
        if (window.top) {
          window.top.location.href = window.location.href;
        }
      } catch (e) {
        const container = document.createElement('div');
        container.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:system-ui,-apple-system,sans-serif;background:#1e3a5f;color:white;text-align:center;';
        
        const heading = document.createElement('h1');
        heading.textContent = 'Este site nao pode ser carregado num iframe.';
        
        const link = document.createElement('a');
        link.href = window.location.href;
        link.target = '_top';
        link.style.color = '#60a5fa';
        link.textContent = 'Abrir em janela propria';
        
        container.appendChild(heading);
        container.appendChild(link);
        document.body.innerHTML = '';
        document.body.appendChild(container);
      }
    }
  }

  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    
    if (url.startsWith('/api/') || url.includes(window.location.origin)) {
      return originalFetch.call(this, input, init);
    }
    
    return originalFetch.call(this, input, init);
  };

  if (import.meta.env.PROD) {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.log = () => {};
    console.warn = () => {};
    console.error = (...args) => {
      if (args[0]?.includes?.('[Security]')) {
        originalError.apply(console, args);
      }
    };
  }

  window.addEventListener('contextmenu', (e) => {
    if (import.meta.env.PROD) {
      e.preventDefault();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (import.meta.env.PROD) {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U') ||
        e.key === 'F12'
      ) {
        e.preventDefault();
      }
    }
  });
}

export function addWatermark(): void {
  if (typeof window === 'undefined' || !import.meta.env.PROD) return;

  const style = document.createElement('style');
  style.textContent = `
    body::after {
      content: '';
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 120px;
      height: 40px;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><text x="10" y="25" fill="%23666" font-family="system-ui" font-size="10" opacity="0.3">ImoLead AI Pro</text></svg>') no-repeat;
      pointer-events: none;
      z-index: 9999;
    }
  `;
  document.head.appendChild(style);
}
