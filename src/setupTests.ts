import '@testing-library/jest-dom';

declare global {
  var jest: any;
  var global: any;
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: global.jest?.fn().mockImplementation((query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: global.jest?.fn(), // deprecated
    removeListener: global.jest?.fn(), // deprecated
    addEventListener: global.jest?.fn(),
    removeEventListener: global.jest?.fn(),
    dispatchEvent: global.jest?.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock Leaflet
global.jest?.mock('leaflet', () => ({
  map: global.jest?.fn(() => ({
    setView: global.jest?.fn(),
    addLayer: global.jest?.fn(),
    removeLayer: global.jest?.fn(),
    on: global.jest?.fn(),
    off: global.jest?.fn(),
  })),
  tileLayer: global.jest?.fn(() => ({
    addTo: global.jest?.fn(),
  })),
  marker: global.jest?.fn(() => ({
    addTo: global.jest?.fn(),
    bindPopup: global.jest?.fn(),
  })),
  icon: global.jest?.fn(),
}));

// Mock React Router
global.jest?.mock('react-router-dom', () => ({
  ...global.jest?.requireActual('react-router-dom'),
  useNavigate: () => global.jest?.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

// Mock Redux
global.jest?.mock('react-redux', () => ({
  ...global.jest?.requireActual('react-redux'),
  useSelector: global.jest?.fn(),
  useDispatch: () => global.jest?.fn(),
}));
