import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// State interface
interface UIState {
  sidebar: {
    isOpen: boolean;
    width: number;
  };
  notifications: {
    isOpen: boolean;
    unreadCount: number;
  };
  theme: {
    mode: 'light' | 'dark';
    primaryColor: string;
  };
  modals: {
    [key: string]: {
      isOpen: boolean;
      data?: any;
    };
  };
  loading: {
    [key: string]: boolean;
  };
  errors: {
    [key: string]: string | null;
  };
  breadcrumbs: Array<{
    label: string;
    path?: string;
  }>;
  filters: {
    [key: string]: any;
  };
  selectedItems: {
    [key: string]: string[] | number[];
  };
}

// Initial state
const initialState: UIState = {
  sidebar: {
    isOpen: true,
    width: 280,
  },
  notifications: {
    isOpen: false,
    unreadCount: 0,
  },
  theme: {
    mode: 'light',
    primaryColor: '#1976d2',
  },
  modals: {},
  loading: {},
  errors: {},
  breadcrumbs: [],
  filters: {},
  selectedItems: {},
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebar.isOpen = !state.sidebar.isOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebar.isOpen = action.payload;
    },
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.sidebar.width = action.payload;
    },

    // Notifications actions
    toggleNotifications: (state) => {
      state.notifications.isOpen = !state.notifications.isOpen;
    },
    setNotificationsOpen: (state, action: PayloadAction<boolean>) => {
      state.notifications.isOpen = action.payload;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.notifications.unreadCount = action.payload;
    },
    incrementUnreadCount: (state) => {
      state.notifications.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      if (state.notifications.unreadCount > 0) {
        state.notifications.unreadCount -= 1;
      }
    },
    clearUnreadCount: (state) => {
      state.notifications.unreadCount = 0;
    },

    // Theme actions
    toggleTheme: (state) => {
      state.theme.mode = state.theme.mode === 'light' ? 'dark' : 'light';
    },
    setThemeMode: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme.mode = action.payload;
    },
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.theme.primaryColor = action.payload;
    },

    // Modal actions
    openModal: (state, action: PayloadAction<{ key: string; data?: any }>) => {
      const { key, data } = action.payload;
      state.modals[key] = { isOpen: true, data };
    },
    closeModal: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      if (state.modals[key]) {
        state.modals[key].isOpen = false;
        state.modals[key].data = undefined;
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key] = { isOpen: false, data: undefined };
      });
    },

    // Loading actions
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload;
      state.loading[key] = loading;
    },
    clearLoading: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      delete state.loading[key];
    },
    clearAllLoading: (state) => {
      state.loading = {};
    },

    // Error actions
    setError: (state, action: PayloadAction<{ key: string; error: string | null }>) => {
      const { key, error } = action.payload;
      state.errors[key] = error;
    },
    clearError: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      delete state.errors[key];
    },
    clearAllErrors: (state) => {
      state.errors = {};
    },

    // Breadcrumbs actions
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path?: string }>>) => {
      state.breadcrumbs = action.payload;
    },
    addBreadcrumb: (state, action: PayloadAction<{ label: string; path?: string }>) => {
      state.breadcrumbs.push(action.payload);
    },
    removeBreadcrumb: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index >= 0 && index < state.breadcrumbs.length) {
        state.breadcrumbs.splice(index, 1);
      }
    },
    clearBreadcrumbs: (state) => {
      state.breadcrumbs = [];
    },

    // Filters actions
    setFilter: (state, action: PayloadAction<{ key: string; value: any }>) => {
      const { key, value } = action.payload;
      state.filters[key] = value;
    },
    clearFilter: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      delete state.filters[key];
    },
    clearAllFilters: (state) => {
      state.filters = {};
    },

    // Selected items actions
    setSelectedItems: (state, action: PayloadAction<{ key: string; items: string[] | number[] }>) => {
      const { key, items } = action.payload;
      state.selectedItems[key] = items;
    },
    addSelectedItem: (state, action: PayloadAction<{ key: string; item: string | number }>) => {
      const { key, item } = action.payload;
      if (!state.selectedItems[key]) {
        state.selectedItems[key] = [];
      }
      if (!state.selectedItems[key].includes(item)) {
        state.selectedItems[key].push(item);
      }
    },
    removeSelectedItem: (state, action: PayloadAction<{ key: string; item: string | number }>) => {
      const { key, item } = action.payload;
      if (state.selectedItems[key]) {
        state.selectedItems[key] = state.selectedItems[key].filter(i => i !== item);
      }
    },
    clearSelectedItems: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      delete state.selectedItems[key];
    },
    clearAllSelectedItems: (state) => {
      state.selectedItems = {};
    },

    // Reset UI state
    resetUI: (state) => {
      state.sidebar = initialState.sidebar;
      state.notifications = initialState.notifications;
      state.modals = {};
      state.loading = {};
      state.errors = {};
      state.breadcrumbs = [];
      state.filters = {};
      state.selectedItems = {};
    },
  },
});

// Export actions
export const {
  // Sidebar
  toggleSidebar,
  setSidebarOpen,
  setSidebarWidth,
  
  // Notifications
  toggleNotifications,
  setNotificationsOpen,
  setUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
  clearUnreadCount,
  
  // Theme
  toggleTheme,
  setThemeMode,
  setPrimaryColor,
  
  // Modals
  openModal,
  closeModal,
  closeAllModals,
  
  // Loading
  setLoading,
  clearLoading,
  clearAllLoading,
  
  // Errors
  setError,
  clearError,
  clearAllErrors,
  
  // Breadcrumbs
  setBreadcrumbs,
  addBreadcrumb,
  removeBreadcrumb,
  clearBreadcrumbs,
  
  // Filters
  setFilter,
  clearFilter,
  clearAllFilters,
  
  // Selected items
  setSelectedItems,
  addSelectedItem,
  removeSelectedItem,
  clearSelectedItems,
  clearAllSelectedItems,
  
  // Reset
  resetUI,
} = uiSlice.actions;

// Export selectors
export const selectSidebar = (state: { ui: UIState }) => state.ui.sidebar;
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebar.isOpen;
export const selectSidebarWidth = (state: { ui: UIState }) => state.ui.sidebar.width;

export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectNotificationsOpen = (state: { ui: UIState }) => state.ui.notifications.isOpen;
export const selectUnreadCount = (state: { ui: UIState }) => state.ui.notifications.unreadCount;

export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectThemeMode = (state: { ui: UIState }) => state.ui.theme.mode;
export const selectPrimaryColor = (state: { ui: UIState }) => state.ui.theme.primaryColor;

export const selectModals = (state: { ui: UIState }) => state.ui.modals;
export const selectModalOpen = (state: { ui: UIState }, key: string) => 
  state.ui.modals[key]?.isOpen || false;
export const selectModalData = (state: { ui: UIState }, key: string) => 
  state.ui.modals[key]?.data;

export const selectLoading = (state: { ui: UIState }) => state.ui.loading;
export const selectIsLoading = (state: { ui: UIState }, key: string) => 
  state.ui.loading[key] || false;

export const selectErrors = (state: { ui: UIState }) => state.ui.errors;
export const selectError = (state: { ui: UIState }, key: string) => 
  state.ui.errors[key] || null;

export const selectBreadcrumbs = (state: { ui: UIState }) => state.ui.breadcrumbs;

export const selectFilters = (state: { ui: UIState }) => state.ui.filters;
export const selectFilter = (state: { ui: UIState }, key: string) => 
  state.ui.filters[key];

export const selectSelectedItems = (state: { ui: UIState }) => state.ui.selectedItems;
export const selectSelectedItemsForKey = (state: { ui: UIState }, key: string) => 
  state.ui.selectedItems[key] || [];

// Export reducer
export default uiSlice.reducer;
