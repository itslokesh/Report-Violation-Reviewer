import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (global as any).jest?.fn().mockImplementation((query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: (global as any).jest?.fn(), // deprecated
    removeListener: (global as any).jest?.fn(), // deprecated
    addEventListener: (global as any).jest?.fn(),
    removeEventListener: (global as any).jest?.fn(),
    dispatchEvent: (global as any).jest?.fn(),
  })),
});

// Mock IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
(global as any).ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock Leaflet
(global as any).jest?.mock('leaflet', () => ({
  map: (global as any).jest?.fn(() => ({
    setView: (global as any).jest?.fn(),
    addLayer: (global as any).jest?.fn(),
    removeLayer: (global as any).jest?.fn(),
    on: (global as any).jest?.fn(),
    off: (global as any).jest?.fn(),
  })),
  tileLayer: (global as any).jest?.fn(() => ({
    addTo: (global as any).jest?.fn(),
  })),
  marker: (global as any).jest?.fn(() => ({
    addTo: (global as any).jest?.fn(),
    bindPopup: (global as any).jest?.fn(),
  })),
  icon: (global as any).jest?.fn(),
}));

// Mock React Router
(global as any).jest?.mock('react-router-dom', () => ({
  ...(global as any).jest?.requireActual('react-router-dom'),
  useNavigate: () => (global as any).jest?.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

// Mock Redux
(global as any).jest?.mock('react-redux', () => ({
  ...(global as any).jest?.requireActual('react-redux'),
  useSelector: (global as any).jest?.fn(),
  useDispatch: () => (global as any).jest?.fn(),
}));
