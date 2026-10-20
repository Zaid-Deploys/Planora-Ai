import '@testing-library/jest-dom';

// Polyfill window & DOM APIs missing in jsdom
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  // Polyfill window.print
  window.print = () => {};

  // Polyfill URL.createObjectURL and revokeObjectURL
  if (typeof URL.createObjectURL !== 'function') {
    URL.createObjectURL = () => 'blob:mock-url';
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    URL.revokeObjectURL = () => {};
  }
}
