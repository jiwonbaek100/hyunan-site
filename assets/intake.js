(() => {
  const modal = document.getElementById('intakeModal');
  const form = document.getElementById('intakeForm');
  if (!modal || !form) return;

  const fieldFor = key => document.getElementById('intake-' + key);
  const summary = fieldFor('summary');
  const count = document.getElementById('summaryCount');
  let previousFocus;

  const bar = document.getElementById('quickIntake');
  const fields = bar.querySelectorAll('[data-field]');
  function syncBar() {
    for (const field of fields) {
      const source = fieldFor(field.dataset.field);
      if (field.type === 'checkbox') field.checked = source.checked;
      else field.value = source.value;
    }
  }
  for (const field of fields) {
    const target = fieldFor(field.dataset.field);
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
    if (kind) fieldFor('matterType').value = kind === '부동산' ? '부동산' : '기타';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    syncBar();
    const focusField = bar.contains(previousFocus) && fieldFor('name').value && fieldFor('phone').value
      ? summary : fieldFor('name');
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

})();
