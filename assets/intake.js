(() => {
  const modal = document.getElementById('intakeModal');
  const form = document.getElementById('intakeForm');
  if (!modal || !form) return;

  const endpoint = 'https://hpuyngfqysjguiogvywi.supabase.co/functions/v1/website-intake';
  const status = document.getElementById('intakeStatus');
  const submit = form.querySelector('.intake-submit');
  const summary = form.elements.summary;
  const count = document.getElementById('summaryCount');
  let previousFocus;

  function openModal(event) {
    if (event) event.preventDefault();
    previousFocus = document.activeElement;
    form.elements.startedAt.value = new Date().toISOString();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => form.elements.name.focus(), 80);
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (previousFocus) previousFocus.focus();
  }

  document.querySelectorAll('[data-intake-open]').forEach(button => button.addEventListener('click', openModal));
  modal.querySelectorAll('[data-intake-close]').forEach(button => button.addEventListener('click', closeModal));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
  summary.addEventListener('input', () => { count.textContent = `${summary.value.length}/1000`; });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    submit.disabled = true;
    submit.textContent = '접수 중…';
    status.className = 'intake-status';
    status.textContent = '';

    const data = Object.fromEntries(new FormData(form).entries());
    data.pageUrl = location.href;
    data.privacy = form.elements.privacy.checked;
    data.notice = form.elements.notice.checked;

    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || '접수하지 못했습니다.');
      form.reset();
      count.textContent = '0/1000';
      status.className = 'intake-status success';
      status.textContent = `접수되었습니다. 확인 후 연락드리겠습니다. 접수번호 ${result.reference || ''}`;
      submit.textContent = '접수 완료';
    } catch (error) {
      status.className = 'intake-status error';
      status.textContent = `${error.message} 긴급한 경우 031-706-6544로 연락해 주세요.`;
      submit.disabled = false;
      submit.textContent = '다시 접수하기';
    }
  });
})();
