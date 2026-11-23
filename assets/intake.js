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

  const bar = document.getElementById('quickIntake');
  const fields = bar.querySelectorAll('[data-field]');
  function syncBar() {
    for (const field of fields) {
      const source = form.elements[field.dataset.field];
      if (field.type === 'checkbox') field.checked = source.checked;
      else field.value = source.value;
    }
  }
  for (const field of fields) {
    const target = form.elements[field.dataset.field];
    field.addEventListener('input', () => {
      if (field.type === 'checkbox') target.checked = field.checked;
      else target.value = field.value;
    });
  }
  form.addEventListener('input', syncBar);
  bar.hidden = false;
  const spacer = document.createElement('div');
  bar.after(spacer);
  function reserveSpace() { spacer.style.height = bar.offsetHeight + 'px'; }
  reserveSpace();
  new ResizeObserver(reserveSpace).observe(bar);

  function openModal(event) {
    if (event) event.preventDefault();
    previousFocus = document.activeElement;
    const kind = event?.currentTarget?.dataset.intakeKind;
    document.getElementById('intakeTitle').textContent = kind ? `${kind} 법률상담` : '상담 문의';
    if (kind) form.elements.matterType.value = kind === '부동산' ? '부동산' : '기타';
    form.elements.startedAt.value = new Date().toISOString();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    syncBar();
    const focusField = bar.contains(previousFocus) && form.elements.name.value && form.elements.phone.value
      ? summary : form.elements.name;
    setTimeout(() => focusField.focus(), 80);
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

  const emailLink = document.getElementById('intakeEmail');
  emailLink.addEventListener('click', event => {
    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }
    const values = form.elements;
    const body = [
      '성함: ' + values.name.value,
      '연락처: ' + values.phone.value,
      '사건 분야: ' + values.matterType.value,
      '', values.summary.value,
      '', '개인정보 수집·이용 안내 및 상담 전 안내 사항을 확인했습니다.'
    ].join('\r\n');
    emailLink.href = 'mailto:desk@hyunan.kr?subject=' + encodeURIComponent('현안 홈페이지 상담 문의') + '&body=' + encodeURIComponent(body);
    setTimeout(() => emailLink.href = 'mailto:desk@hyunan.kr', 0);
  });

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
      if (!response.ok || result.ok !== true || !result.reference) throw new Error(result.error || '접수번호를 확인하지 못했습니다.');
      form.reset();
      syncBar();
      count.textContent = '0/1000';
      status.className = 'intake-status success';
      status.textContent = `상담 문의가 접수되었습니다. 확인 후 연락드리겠습니다. 접수번호 ${result.reference || ''}`;
      submit.textContent = '접수 완료';
    } catch (error) {
      status.className = 'intake-status error';
      status.textContent = error instanceof TypeError
        ? '접수 서버와 연결되지 않아 접수 여부를 확인할 수 없습니다. 위의 이메일 작성 또는 전화로 문의해 주세요.'
        : `${error.message} 위의 이메일 작성 또는 전화로도 문의하실 수 있습니다.`;
      submit.disabled = false;
      submit.textContent = '다시 접수하기';
    }
  });
})();
