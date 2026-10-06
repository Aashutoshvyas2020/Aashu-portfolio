const views = [...document.querySelectorAll('.view')];
const navLinks = [...document.querySelectorAll('.nav a[data-view]')];
const order = ['index', ...navLinks.map(link => link.dataset.view)];
let cursor = 0;
const siteNav = document.getElementById('siteNav');
const navToggle = document.getElementById('navToggle');
const projectView = document.querySelector('.view--project');
const projects = [...(projectView?.querySelectorAll('.project') ?? [])];
let returnTo = 'index';
let projectOpener = null;

function restoreProjectFocus() {
  const openerVisible = projectOpener?.isConnected
    && projectOpener.getClientRects().length > 0
    && !projectOpener.closest('[hidden]');
  const focusTarget = openerVisible
    ? projectOpener
    : mobileNav.matches
      ? navToggle
      : navLinks.find(link => link.dataset.view === returnTo);
  focusTarget?.focus({ preventScroll: true });
  projectOpener = null;
}

function currentView() {
  return document.querySelector('.view.is-active')?.dataset.view;
}

function show(name) {
  views.forEach(view => view.classList.toggle('is-active', view.dataset.view === name));
  navLinks.forEach(link => {
    const active = link.dataset.view === name || (name === 'project' && link.dataset.view === returnTo);
    link.classList.toggle('is-current', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const index = order.indexOf(name);
  if (index !== -1) cursor = index;
  if (name !== 'project' && location.hash) history.replaceState(null, '', location.pathname + location.search);
}

function route() {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); }
  catch { id = ''; }
  const project = projects.find(item => item.dataset.project === id);
  if (project) {
    projectOpener = [...document.querySelectorAll('.details-link')]
      .find(link => link.getAttribute('href') === `#${project.dataset.project}`) || null;
    projects.forEach(item => { item.hidden = item !== project; });
    returnTo = project.dataset.section;
    show('project');
    projectView.scrollTop = 0;
    projectView.querySelector('.project__back').focus({ preventScroll: true });
  } else if (currentView() === 'project') {
    show(returnTo);
    restoreProjectFocus();
  }
}

function closeProject() {
  if (history.state?.project) history.back();
  else {
    show(returnTo);
    restoreProjectFocus();
  }
}


if (projectView) {
  document.querySelectorAll('.details-link').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    history.pushState({ project: true }, '', link.getAttribute('href'));
    route();
  }));
  window.addEventListener('popstate', route);
  window.addEventListener('hashchange', route);
  projectView.querySelector('.project__back').addEventListener('click', event => {
    event.preventDefault();
    closeProject();
  });
  route();
}

const portfolio = document.querySelector('.view[data-view="portfolio"]');
if (portfolio) {
  const panel = portfolio.querySelector('.work-panel');
  const layers = [...(panel?.querySelectorAll('.work-panel__img') ?? [])];
  const works = [...portfolio.querySelectorAll('.work')];
  if (panel && layers.length === 2) {
    let active = 0;
    const preview = work => {
      if (!work.dataset.preview) return;
      panel.classList.add('is-visible');
      panel.classList.toggle('is-portrait', work.dataset.previewFormat === 'portrait');
      const current = layers[active];
      if (current.getAttribute('src') === work.dataset.preview) return;
      const next = layers[active ^ 1];
      next.src = work.dataset.preview;
      next.alt = work.dataset.previewAlt || '';
      next.style.zIndex = '1';
      current.style.zIndex = '0';
      next.classList.add('is-shown');
      current.classList.remove('is-shown');
      active ^= 1;
    };
    works.forEach(work => {
      if (work.dataset.preview) new Image().src = work.dataset.preview;
      work.addEventListener('mouseenter', () => preview(work));
      work.addEventListener('focusin', () => preview(work));
    });
    portfolio.addEventListener('mouseleave', () => {
      panel.classList.remove('is-visible');
      layers.forEach(layer => layer.classList.remove('is-shown'));
    });
    portfolio.addEventListener('focusout', event => {
      if (!portfolio.contains(event.relatedTarget)) {
        panel.classList.remove('is-visible');
        layers.forEach(layer => layer.classList.remove('is-shown'));
      }
    });
  }

  const pageLists = [...portfolio.querySelectorAll('.entries[data-page]')];
  const pageLinks = [...portfolio.querySelectorAll('.pagination__link')];
  let pageAnimation;
  pageLinks.forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    const target = pageLists.find(list => list.dataset.page === link.dataset.page);
    if (!target || target.classList.contains('is-active')) return;
    pageAnimation?.cancel();
    pageLists.forEach(list => list.classList.remove('is-active', 'is-entering', 'is-leaving'));
    target.classList.add('is-active');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    pageAnimation = target.animate(
      reducedMotion
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [
            { opacity: 0, transform: 'translateY(6px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
      { duration: reducedMotion ? 100 : 200, easing: 'ease' }
    );
    pageLinks.forEach(item => {
      const active = item === link;
      item.classList.toggle('is-current', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    if (panel) {
      panel.classList.remove('is-visible');
      layers.forEach(layer => layer.classList.remove('is-shown'));
    }
  }));
}

document.querySelectorAll('[data-view][href="#"]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  show(link.dataset.view);
  closeMenu();
}));

const indexView = document.querySelector('.view--index');
if (indexView) {
  indexView.addEventListener('click', () => show(order[1]));
  indexView.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      show(order[1]);
    }
  });
}


function step(direction) {
  if (currentView() === 'project' || siteNav.classList.contains('is-open')) return;
  const next = cursor + direction;
  if (next >= 0 && next < order.length) show(order[next]);
}

let lastWheel = -Infinity;
window.addEventListener('wheel', event => {
  if (event.ctrlKey || event.deltaY === 0 || currentView() === 'project'
      || siteNav.classList.contains('is-open')) return;
  event.preventDefault();
  const now = Date.now();
  const newGesture = now - lastWheel > 70;
  lastWheel = now;
  // One page per burst; magnitude and direction changes never release the lock.
  // ponytail: wheel has no gesture-end event; 70ms of silence approximates release.
  if (!newGesture) return;
  step(Math.sign(event.deltaY));
}, { passive: false });

let touchStart = null;
window.addEventListener('touchstart', event => {
  touchStart = event.touches.length === 1
    ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
    : null;
}, { passive: true });
window.addEventListener('touchmove', event => {
  if (!touchStart || event.touches.length !== 1 || currentView() === 'project'
      || siteNav.classList.contains('is-open')) return;
  const deltaY = touchStart.y - event.touches[0].clientY;
  const deltaX = touchStart.x - event.touches[0].clientX;
  if (Math.abs(deltaY) > Math.abs(deltaX)) event.preventDefault();
}, { passive: false });
window.addEventListener('touchend', event => {
  if (!touchStart) return;
  const deltaY = touchStart.y - event.changedTouches[0].clientY;
  const deltaX = touchStart.x - event.changedTouches[0].clientX;
  touchStart = null;
  if (Math.abs(deltaY) > Math.abs(deltaX)) step(Math.sign(deltaY));
}, { passive: true });

const mobileNav = matchMedia('(max-width: 720px)');

function closeMenu(returnFocus = false) {
  navToggle.classList.remove('is-open');
  siteNav.classList.remove('is-open');
  siteNav.inert = mobileNav.matches;
  navToggle.setAttribute('aria-expanded', 'false');
  if (returnFocus) navToggle.focus();
}

mobileNav.addEventListener('change', () => {
  const focusWasInMenu = siteNav.contains(document.activeElement) || document.activeElement === navToggle;
  closeMenu();
  if (!focusWasInMenu) return;
  const focusTarget = mobileNav.matches
    ? navToggle
    : navLinks.find(link => link.classList.contains('is-current')) || navLinks[0];
  focusTarget.focus({ preventScroll: true });
});

navToggle.addEventListener('click', () => {
  const open = !siteNav.classList.contains('is-open');
  navToggle.classList.toggle('is-open', open);
  siteNav.classList.toggle('is-open', open);
  siteNav.inert = !open;
  navToggle.setAttribute('aria-expanded', String(open));
});

document.addEventListener('click', event => {
  if (siteNav.classList.contains('is-open') && !siteNav.contains(event.target) && !navToggle.contains(event.target)) closeMenu();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && siteNav.classList.contains('is-open')) closeMenu(true);
  else if (event.key === 'Escape' && currentView() === 'project') closeProject();
  else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey
        || event.target.isContentEditable || event.target.closest?.('input, textarea, select')
        || currentView() === 'project' || siteNav.classList.contains('is-open')) return;
    event.preventDefault();
    if (!event.repeat) step(event.key === 'ArrowDown' ? 1 : -1);
  }
});

closeMenu();
