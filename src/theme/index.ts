import { createTheme, ThemeOptions } from '@mui/material/styles';
import { APP_CONFIG } from '../../shared/constants/app';

// Color palette for police admin platform
const colors = {
  primary: {
    main: '#1976d2', // Professional blue
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#dc004e', // Alert/action red
    light: '#ff5983',
    dark: '#9a0036',
    contrastText: '#ffffff',
  },
  success: {
    main: '#2e7d32', // Green for approved/positive actions
    light: '#4caf50',
    dark: '#1b5e20',
  },
  warning: {
    main: '#ed6c02', // Orange for warnings
    light: '#ff9800',
    dark: '#e65100',
  },
  error: {
    main: '#d32f2f', // Red for errors/rejections
    light: '#ef5350',
    dark: '#c62828',
  },
  info: {
    main: '#0288d1', // Blue for information
    light: '#03a9f4',
    dark: '#01579b',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: '#212121',
    secondary: '#757575',
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
const components = {
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
      contained: {
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
