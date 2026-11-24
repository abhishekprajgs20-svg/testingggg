export const pages = {
  notes: c => import('./notes.js').then(m => m.page(c)),
  vault: c => import('./vault.js').then(m => m.page(c)),
  teach: c => import('./teach.js').then(m => m.page(c)),
  roadmap: c => import('./roadmap.js').then(m => m.page(c)),
  debate: c => import('./debate.js').then(m => m.page(c)),
  studio: c => import('./content.js').then(m => m.page(c)),
};
