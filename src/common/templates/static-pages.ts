type HealthStatus = 'OK' | 'DEGRADED';

interface HealthPageData {
  status: HealthStatus;
  uptime: number;
  timestamp: string;
}

function shell(title: string, body: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #121826;
        --soft-ink: #334155;
        --muted: #687386;
        --line: rgba(18, 24, 38, 0.12);
        --panel: rgba(255, 255, 255, 0.84);
        --panel-solid: #ffffff;
        --teal: #0f766e;
        --blue: #2563eb;
        --rose: #e11d48;
        --amber: #f59e0b;
        --green: #16a34a;
        --violet: #7c3aed;
        --shadow: 0 24px 70px rgba(18, 24, 38, 0.14);
      }

      * {
        box-sizing: border-box;
      }

      html {
        min-height: 100%;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at 18% 16%, rgba(37, 99, 235, 0.18), transparent 24%),
          radial-gradient(circle at 82% 10%, rgba(225, 29, 72, 0.16), transparent 22%),
          radial-gradient(circle at 72% 84%, rgba(15, 118, 110, 0.18), transparent 24%),
          linear-gradient(135deg, #f8fafc 0%, #eef6ff 42%, #fff7ed 100%);
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      .page {
        width: min(1180px, calc(100% - 32px));
        margin: 0 auto;
        padding: 24px 0 46px;
      }

      .nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 42px;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-weight: 900;
      }

      .mark {
        display: grid;
        width: 44px;
        height: 44px;
        place-items: center;
        border-radius: 8px;
        color: #ffffff;
        background: linear-gradient(135deg, var(--blue), var(--teal));
        box-shadow: var(--shadow);
      }

      .links {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.64);
        backdrop-filter: blur(18px);
        color: var(--soft-ink);
        font-size: 14px;
        font-weight: 800;
      }

      .links a {
        min-height: 36px;
        display: inline-flex;
        align-items: center;
        padding: 0 12px;
        border-radius: 7px;
      }

      .links a:hover {
        background: #ffffff;
        color: var(--ink);
        box-shadow: 0 8px 22px rgba(18, 24, 38, 0.08);
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(340px, 0.95fr);
        gap: 28px;
        align-items: center;
      }

      .copy {
        padding: 28px 0;
      }

      .eyebrow {
        display: inline-flex;
        margin: 0 0 16px;
        padding: 7px 10px;
        border: 1px solid rgba(37, 99, 235, 0.16);
        border-radius: 999px;
        color: var(--blue);
        background: rgba(37, 99, 235, 0.08);
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        max-width: 780px;
        font-size: clamp(44px, 7vw, 82px);
        line-height: 0.98;
        letter-spacing: 0;
      }

      .gradient-text {
        color: transparent;
        background: linear-gradient(135deg, var(--blue), var(--teal), var(--rose));
        background-clip: text;
        -webkit-background-clip: text;
      }

      .lead {
        max-width: 650px;
        margin: 22px 0 0;
        color: var(--muted);
        font-size: 18px;
        line-height: 1.72;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 30px;
      }

      .button {
        display: inline-flex;
        min-height: 46px;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 18px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.82);
        color: var(--ink);
        font-weight: 900;
        box-shadow: 0 10px 28px rgba(18, 24, 38, 0.08);
      }

      .button.primary {
        border-color: transparent;
        background: linear-gradient(135deg, var(--blue), var(--teal));
        color: #ffffff;
      }

      .button.rose {
        border-color: rgba(225, 29, 72, 0.2);
        color: #9f1239;
      }

      .surface {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
        box-shadow: var(--shadow);
        overflow: hidden;
        backdrop-filter: blur(20px);
      }

      .dashboard {
        min-height: 460px;
      }

      .bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
        border-bottom: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.72);
        color: var(--muted);
        font-size: 13px;
        font-weight: 900;
      }

      .dots {
        display: flex;
        gap: 6px;
      }

      .dots span {
        width: 10px;
        height: 10px;
        border-radius: 999px;
      }

      .dots span:nth-child(1) {
        background: var(--rose);
      }

      .dots span:nth-child(2) {
        background: var(--amber);
      }

      .dots span:nth-child(3) {
        background: var(--green);
      }

      .dashboard-body {
        padding: 18px;
      }

      .status-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .mini {
        min-height: 96px;
        padding: 16px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel-solid);
      }

      .mini span,
      .metric span {
        display: block;
        color: var(--muted);
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .mini strong,
      .metric strong {
        display: block;
        margin-top: 8px;
        font-size: 24px;
      }

      .rail {
        display: grid;
        gap: 12px;
        margin-top: 14px;
      }

      .rail-item {
        display: grid;
        grid-template-columns: 42px 1fr auto;
        gap: 12px;
        align-items: center;
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.76);
      }

      .icon {
        display: grid;
        width: 42px;
        height: 42px;
        place-items: center;
        border-radius: 8px;
        color: #ffffff;
        font-weight: 900;
      }

      .icon.blue {
        background: var(--blue);
      }

      .icon.teal {
        background: var(--teal);
      }

      .icon.violet {
        background: var(--violet);
      }

      .rail-item p {
        margin: 3px 0 0;
        color: var(--muted);
        font-size: 13px;
      }

      .tag {
        padding: 6px 9px;
        border-radius: 999px;
        background: rgba(22, 163, 74, 0.1);
        color: var(--green);
        font-size: 12px;
        font-weight: 900;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-top: 32px;
      }

      .metric {
        padding: 18px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.8);
        box-shadow: 0 14px 32px rgba(18, 24, 38, 0.07);
      }

      .status {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        border: 1px solid rgba(22, 163, 74, 0.22);
        border-radius: 999px;
        background: rgba(22, 163, 74, 0.1);
        color: var(--green);
        font-weight: 900;
      }

      .pulse {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: currentColor;
        box-shadow: 0 0 0 6px rgba(22, 163, 74, 0.12);
      }

      .health-panel {
        max-width: 920px;
        margin: 0 auto;
      }

      .health-panel .surface {
        margin-top: 26px;
      }

      @media (max-width: 880px) {
        .page {
          width: min(100% - 24px, 720px);
          padding-top: 18px;
        }

        .nav {
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .links {
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .hero,
        .grid,
        .status-strip {
          grid-template-columns: 1fr;
        }

        .copy {
          padding: 14px 0 8px;
        }

        .dashboard {
          min-height: auto;
        }
      }

      @media (max-width: 540px) {
        .nav {
          display: grid;
        }

        .links {
          justify-content: flex-start;
        }

        .rail-item {
          grid-template-columns: 42px 1fr;
        }

        .tag {
          grid-column: 2;
          width: fit-content;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">${body}</main>
  </body>
</html>`;
}

export function renderHomePage() {
  return shell(
    'Backend Template',
    `<nav class="nav">
      <a class="brand" href="/">
        <span class="mark">BT</span>
        <span>Backend Template</span>
      </a>
      <div class="links">
        <a href="/health">Health</a>
        <a href="/api/v1/docs">Swagger</a>
        <a href="/api/v1/health">JSON</a>
      </div>
    </nav>

    <section class="hero">
      <div class="copy">
        <p class="eyebrow">NestJS 11 + Prisma 7 API foundation</p>
        <h1>Build APIs from a <span class="gradient-text">clean backend system.</span></h1>
        <p class="lead">
          A polished starter with validation, global response formatting, Prisma database access,
          secure middleware, static status surfaces, and Swagger documentation ready on day one.
        </p>
        <div class="actions">
          <a class="button primary" href="/api/v1/docs">Open Swagger</a>
          <a class="button" href="/health">View Health</a>
          <a class="button rose" href="/api/v1/health">API JSON</a>
        </div>
      </div>

      <section class="surface dashboard" aria-label="Backend capabilities">
        <div class="bar">
          <span>template-control-center</span>
          <div class="dots"><span></span><span></span><span></span></div>
        </div>
        <div class="dashboard-body">
          <div class="status-strip">
            <div class="mini">
              <span>Runtime</span>
              <strong style="color: #8F4242">Node 20</strong>
            </div>
            <div class="mini">
              <span>Docs</span>
              <strong style="color: #404A94">Swagger</strong>
            </div>
            <div class="mini">
              <span>Health</span>
              <strong style="color:#28a745;">Live</strong>
            </div>
          </div>

          <div class="rail">
            <div class="rail-item">
              <span class="icon blue">A</span>
              <div>
                <strong>API routes</strong>
                <p>Versioned endpoints under /api/v1.</p>
              </div>
              <span class="tag">Ready</span>
            </div>
            <div class="rail-item">
              <span class="icon teal">D</span>
              <div>
                <strong>Database layer</strong>
                <p>Prisma 7 generated client with adapter support.</p>
              </div>
              <span class="tag">Ready</span>
            </div>
            <div class="rail-item">
              <span class="icon violet">S</span>
              <div>
                <strong>Security defaults</strong>
                <p>Helmet, CORS, validation, cookies, and compression.</p>
              </div>
              <span class="tag">Ready</span>
            </div>
          </div>
        </div>
      </section>
    </section>

    <section class="grid" aria-label="Template highlights">
      <div class="metric">
        <span>Framework</span>
        <strong style="color:#28a745;">NestJS</strong>
      </div>
      <div class="metric">
        <span>ORM</span>
        <strong style="color:#28a745;">Prisma 7</strong>
      </div>
      <div class="metric">
        <span>Docs</span>
        <strong style="color:#28a745;">OpenAPI</strong>
      </div>
      <div class="metric">
        <span>Status</span>
        <strong style="color:#28a745;">Healthy</strong>
      </div>
    </section>`,
  );
}

export function renderHealthPage(data: HealthPageData) {
  const uptime = `${Math.floor(data.uptime)}s`;
  const checkedAt = new Date(data.timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  return shell(
    'Health Check',
    `<nav class="nav">
      <a class="brand" href="/">
        <span class="mark">BT</span>
        <span>Backend Template</span>
      </a>
      <div class="links">
        <a href="/">Home</a>
        <a href="/api/v1/docs">Swagger</a>
        <a href="/api/v1/health">JSON</a>
      </div>
    </nav>

    <section class="health-panel">
      <span class="status"><span class="pulse"></span>${data.status.toUpperCase()}</span>
      <div class="copy">
        <p class="eyebrow">Health monitor</p>
        <h1>Everything is <span class="gradient-text">running smoothly.</span></h1>
        <p class="lead">
          The server is online, the health route is responding, and the API surface is ready
          for development, testing, and integration.
        </p>
      </div>

      <section class="surface">
        <div class="bar">
          <span>Runtime Snapshot</span>
          <span>${checkedAt}</span>
        </div>
        <div class="grid" style="margin: 0; padding: 18px;">
          <div class="metric">
            <span>Status</span>
            <strong style="color:#28a745">${data.status}</strong>
          </div>
          <div class="metric">
            <span>Uptime</span>
            <strong style="color:#42538F">${uptime}</strong>
          </div>
          <div class="metric">
            <span>Docs</span>
            <strong style="color:#28a745;">Swagger</strong>
          </div>
          <div class="metric">
            <span>Endpoint</span>
            <strong style="color:#28a745;">/api/v1</strong>
          </div>
        </div>
      </section>
    </section>`,
  );
}
