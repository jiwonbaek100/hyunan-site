(() => {
  const modal = document.getElementById('intakeModal');
  const frame = document.getElementById('intakeGoogleForm');
  if (!modal || !frame) return;
  let opener;
  const close = modal.querySelector('.intake-close');
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    opener?.focus();
  }
  document.querySelectorAll('[data-intake-open]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      opener = button;
      if (!frame.hasAttribute('src')) frame.src = frame.dataset.src;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      close.focus();
    });
  });
  modal.querySelectorAll('[data-intake-close]').forEach(button => button.addEventListener('click', closeModal));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
  const bar = document.getElementById('quickIntake');
  if (bar) {
    const spacer = document.createElement('div');
    bar.after(spacer);
    const reserveSpace = () => { spacer.style.height = bar.offsetHeight + 'px'; };
    reserveSpace();
    new ResizeObserver(reserveSpace).observe(bar);
  }
})();
