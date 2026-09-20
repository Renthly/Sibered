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
  const urlLabel = document.getElementById('targetUrlLabel');
  if (!tabs.length) return;

  const targetId = localStorage.getItem('sibered_target_id');
  const targetUrl = localStorage.getItem('sibered_target_url');
  const token = localStorage.getItem('sibered_target_token');

  if (urlLabel && targetUrl) urlLabel.textContent = targetUrl;

  let currentMethod = 'meta_tag';

  function snippetFor(method) {
    if (method === 'meta_tag') return `<meta name="sibered-verify" content="${token}">`;
    if (method === 'html_file') return `/sibered-verify-${token}.html`;
    if (method === 'dns') return `_sibered-verify TXT "${token}"`;
  }

  if (codeText && token) codeText.textContent = snippetFor(currentMethod);

  const methodMap = { meta: 'meta_tag', html: 'html_file', dns: 'dns' };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentMethod = methodMap[tab.dataset.method];
      codeText.textContent = snippetFor(currentMethod);
    });
  });

  const verifyBtn = document.getElementById('verifyBtn');
  if (verifyBtn) {
    verifyBtn.addEventListener('click', async () => {
      if (!targetId) {
        alert('No website found — please add a website first.');
        window.location.href = 'add-website.html';
        return;
      }

      verifyBtn.textContent = 'Checking...';
      verifyBtn.disabled = true;

      await sb.from('targets').update({ verification_method: currentMethod }).eq('id', targetId);

      const { data, error } = await sb.functions.invoke('verify-target', {
        body: { target_id: targetId },
      });

      if (error || !data?.verified) {
        verifyBtn.textContent = 'Not found — try again';
        verifyBtn.disabled = false;
        return;
      }

      window.location.href = 'scan.html';
    });
  }
}

// Add website form validation
function initAddWebsite() {
  const form = document.getElementById('addWebsiteForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('urlInput').value.trim();
    const agreed = document.getElementById('agreeCheckbox').checked;
    const errorText = document.getElementById('errorText');
    const submitBtn = form.querySelector('button[type="submit"]');

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

    errorText.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    const token = 'vs_' + crypto.randomUUID().replace(/-/g, '').slice(0, 24);

    const { data, error } = await sb
      .from('targets')
      .insert({ url, verification_token: token })
      .select()
      .single();

    if (error) {
      errorText.textContent = 'Something went wrong: ' + error.message;
      errorText.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Continue to verification →';
      return;
    }

    localStorage.setItem('sibered_target_id', data.id);
    localStorage.setItem('sibered_target_url', data.url);
    localStorage.setItem('sibered_target_token', data.verification_token);
    window.location.href = 'verify.html';
  });
}
// Scan depth selection
function initScanConfig() {
  const startBtn = document.getElementById('startScanBtn');
  const configView = document.getElementById('configView');
  const progressView = document.getElementById('progressView');
  if (!startBtn) return;

  startBtn.addEventListener('click', async () => {
    const targetId = localStorage.getItem('sibered_target_id');
    if (!targetId) {
      alert('No website found — please add a website first.');
      window.location.href = 'add-website.html';
      return;
    }

    startBtn.disabled = true;
    startBtn.textContent = 'Starting...';

    const { data, error } = await sb.functions.invoke('start-scan', {
      body: { target_id: targetId },
    });

    if (error || !data?.scan_job_id) {
      alert('Could not start scan: ' + (data?.error || error?.message || 'unknown error'));
      startBtn.disabled = false;
      startBtn.textContent = 'Start scan';
      return;
    }

    configView.style.display = 'none';
    progressView.style.display = 'block';
    pollScanStatus(data.scan_job_id);
  });
}

function pollScanStatus(scanJobId) {
  const steps = document.querySelectorAll('.step-circle');
  const labels = document.querySelectorAll('.step-label');
  const fill = document.getElementById('progressFill');

  // Move to "verified" + "scanning" stage visually right away
  steps[0].classList.add('done'); steps[0].textContent = '✓';
  labels[0].classList.add('on');
  steps[1].classList.add('done'); steps[1].textContent = '✓';
  labels[1].classList.add('on');
  steps[2].classList.add('active');
  labels[2].classList.add('on');
  fill.style.width = '60%';

  const interval = setInterval(async () => {
    const { data: job, error } = await sb
      .from('scan_jobs')
      .select('*')
      .eq('id', scanJobId)
      .single();

    if (error || !job) return;

    if (job.status === 'completed') {
      clearInterval(interval);
      steps[2].classList.remove('active'); steps[2].classList.add('done'); steps[2].textContent = '✓';
      steps[3].classList.add('active');
      labels[3].classList.add('on');
      fill.style.width = '100%';

      localStorage.setItem('sibered_scan_results', JSON.stringify(job.results || []));
      setTimeout(() => { window.location.href = 'report.html'; }, 900);
    } else if (job.status === 'failed') {
      clearInterval(interval);
      alert('Scan failed. Please try again.');
      window.location.href = 'websites.html';
    }
    // agar 'queued' ya 'running' hai, toh dobara check karega 4 second baad
  }, 4000);
}


document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initVerification();
  initAddWebsite();
  initScanConfig();
});
