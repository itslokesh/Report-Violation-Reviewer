import { createTheme, ThemeOptions } from '@mui/material/styles';

// Color palette for police admin platform
const colors = {
  primary: {
    main: '#0B3D91', // Deep police navy
    light: '#1E5BC6',
    dark: '#082C6C',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#B8860B', // Brass/gold accent
    light: '#D4A72C',
    dark: '#8A6508',
    contrastText: '#ffffff',
  },
  success: {
    main: '#1B5E20',
    light: '#43A047',
    dark: '#104116',
  },
  warning: {
    main: '#B26A00',
    light: '#D97706',
    dark: '#7C4A00',
  },
  error: {
    main: '#B71C1C',
    light: '#E53935',
    dark: '#7F1313',
  },
  info: {
    main: '#2A9FD6',
    light: '#48B2E1',
    dark: '#1D6F94',
  },
  grey: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1f2937',
    900: '#0f172a',
  },
  background: {
    default: '#f8fafc',
    paper: '#ffffff',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
  },
};

// Typography configuration
const typography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 500,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 500,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 500,
    lineHeight: 1.3,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.75,
    textTransform: 'none' as const,
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66,
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 2.66,
    textTransform: 'uppercase' as const,
  },
};

// Component overrides
const components: ThemeOptions['components'] = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: colors.background.default,
        color: colors.text.primary,
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: colors.primary.main,
        color: colors.primary.contrastText,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: colors.background.paper,
        borderRight: `1px solid ${colors.grey[200]}`,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundColor: colors.background.paper,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        textTransform: 'none',
        fontWeight: 500,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 6,
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        fontWeight: 500,
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: {
        backgroundColor: colors.grey[50],
        '& .MuiTableCell-head': {
          fontWeight: 600,
          color: colors.text.primary,
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: `1px solid ${colors.grey[200]}`,
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 6,
      },
    },
  },
  MuiSnackbar: {
    styleOverrides: {
      root: {
        '& .MuiAlert-root': {
          borderRadius: 6,
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
    },
  },
};

// Create theme options
const themeOptions: ThemeOptions = {
  palette: colors,
  typography,
  components,
  shape: {
    borderRadius: 6,
  },
  spacing: 8,
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
};

// Create and export theme
export const theme = createTheme(themeOptions);

// Export theme utilities
export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'success':
      return colors.success.main;
    case 'rejected':
    case 'error':
      return colors.error.main;
    case 'pending':
    case 'warning':
      return colors.warning.main;
    case 'under_review':
    case 'info':
      return colors.info.main;
    default:
      return colors.grey[500];
  }
};

export const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return colors.error.main;
    case 'major':
      return colors.warning.main;
    case 'minor':
      return colors.info.main;
    default:
      return colors.grey[500];
  }
};
