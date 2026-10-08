import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '../css/main.css';

import { initNav } from './nav.js';
import { initHero } from './hero.js';
import { initReveal } from './reveal.js';

const onHeroProgress = initNav();
initHero(onHeroProgress);
initReveal();
