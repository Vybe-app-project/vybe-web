import '@testing-library/jest-dom/vitest';

const values = new Map();
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    clear: () => values.clear(),
    getItem: key => values.get(String(key)) ?? null,
    key: index => [...values.keys()][index] ?? null,
    removeItem: key => values.delete(String(key)),
    setItem: (key, value) => values.set(String(key), String(value)),
    get length() {
      return values.size;
    },
  },
});

const sessionValues = new Map();
Object.defineProperty(window, 'sessionStorage', {
  configurable: true,
  value: {
    clear: () => sessionValues.clear(),
    getItem: key => sessionValues.get(String(key)) ?? null,
    key: index => [...sessionValues.keys()][index] ?? null,
    removeItem: key => sessionValues.delete(String(key)),
    setItem: (key, value) => sessionValues.set(String(key), String(value)),
    get length() {
      return sessionValues.size;
    },
  },
});
