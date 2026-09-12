// Sidebar collapse/expand, persists across pages via localStorage
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const btn = document.getElementById('collapseBtn');
  if (!sidebar || !btn) return;

  if (localStorage.getItem('sibered_collapsed') === 'true') {
    sidebar.classList.add('collapsed');
  }

  btn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sibered_collapsed', sidebar.classList.contains('collapsed'));
  });
}

// Verification page: tabs + simulated check
function initVerification() {
  const tabs = document.querySelectorAll('.tab');
  const codeText = document.getElementById('codeText');
  if (!tabs.length) return;

  const snippets = {
    meta: '<meta name="sibered-verify" content="vs_8f2a...c91">',
    html: '/sibered-verify-8f2ac91.html',
    dns: '_sibered-verify.acmeshop.com TXT "vs_8f2a...c91"',
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      codeText.textContent = snippets[tab.dataset.method];
    });
  });

  const verifyBtn = document.getElementById('verifyBtn');
  if (verifyBtn) {
    verifyBtn.addEventListener('click', () => {
      verifyBtn.textContent = 'Checking...';
      verifyBtn.disabled = true;
      setTimeout(() => {
        window.location.href = 'scan.html';
      }, 1400);
    });
  }
}

// Add website form validation
function initAddWebsite() {
  const form = document.getElementById('addWebsiteForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('urlInput').value.trim();
    const agreed = document.getElementById('agreeCheckbox').checked;
    const errorText = document.getElementById('errorText');

    if (!url) {
      errorText.textContent = 'Enter a website URL first';
      errorText.style.display = 'block';
      return;
    }
    if (!agreed) {
      errorText.textContent = 'Please confirm you are authorized to test this site';
      errorText.style.display = 'block';
      return;
    }
    window.location.href = 'verify.html';
  });
}

// Scan depth selection
function initScanConfig() {
  const depthBtns = document.querySelectorAll('.depth-btn:not(.locked)');
  depthBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      depthBtns.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  const startBtn = document.getElementById('startScanBtn');
  const configView = document.getElementById('configView');
  const progressView = document.getElementById('progressView');
  if (!startBtn) return;

  startBtn.addEventListener('click', () => {
    configView.style.display = 'none';
    progressView.style.display = 'block';
    runScanAnimation();
  });
}

function runScanAnimation() {
  const steps = document.querySelectorAll('.step-circle');
  const labels = document.querySelectorAll('.step-label');
  const fill = document.getElementById('progressFill');
  let current = 0;

  function advance() {
    if (current > 0) {
      steps[current - 1].classList.remove('active');
      steps[current - 1].classList.add('done');
      steps[current - 1].textContent = '✓';
    }
    if (current < steps.length) {
      steps[current].classList.add('active');
      labels[current].classList.add('on');
      fill.style.width = ((current + 1) / steps.length) * 100 + '%';
      current++;
      if (current < steps.length) {
        setTimeout(advance, 900);
      } else {
        setTimeout(() => { window.location.href = 'report.html'; }, 900);
      }
    }
  }
  advance();
}

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initVerification();
  initAddWebsite();
  initScanConfig();
});
