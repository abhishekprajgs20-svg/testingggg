// Lazy page router for the UPSC Preparation Centre. Each page is its own chunk.
export const pages = {
  upsc: c => import('./overview.js').then(m => m.page(c)),
  syllabus: c => import('./syllabus.js').then(m => m.page(c)),
  memlab: c => import('./memlab.js').then(m => m.page(c)),
  flash: c => import('./flash.js').then(m => m.page(c)),
  planner: c => import('./planner.js').then(m => m.page(c)),
  ca: c => import('./ca.js').then(m => m.page(c)),
  doubt: c => import('./doubt.js').then(m => m.page(c)),
};
