import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Le DOM est partagé entre les tests d'un même fichier : sans ce nettoyage,
// un composant monté dans un test reste interrogeable dans le suivant.
afterEach(() => {
  cleanup();
});
