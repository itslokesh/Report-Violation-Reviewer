import { Theme } from '@mui/material/styles';

// Centralized chart colors and helpers for a professional police dashboard look
// Focus: deep blues, slate neutrals, and restrained accents for clarity

export const getSeriesColors = (theme: Theme): string[] => [
  theme.palette.primary.dark,       // Deep blue
  theme.palette.info.main,          // Cyan/Info
  theme.palette.success.main,       // Green
  theme.palette.warning.main,       // Amber
  theme.palette.secondary.main,     // Magenta/Accent
  theme.palette.error.main,         // Red
  theme.palette.primary.main,       // Primary blue
  theme.palette.grey[700],          // Slate
  theme.palette.grey[500],          // Neutral
  theme.palette.grey[900],          // Near-black for contrast
];

export const getGridColor = (theme: Theme): string => theme.palette.grey[200];
export const getAxisTickColor = (theme: Theme): string => theme.palette.grey[600];

export const getStatusColorMap = (theme: Theme): Record<string, string> => ({
  pending: theme.palette.warning.main,
  'under review': theme.palette.primary.main,
  approved: theme.palette.success.main,
  rejected: theme.palette.error.main,
  duplicate: theme.palette.grey[600],
  resolved: theme.palette.success.dark,
});

// Utility to pick a color by index for arbitrary series
export const getSeriesColorByIndex = (theme: Theme, index: number): string => {
  const colors = getSeriesColors(theme);
  return colors[index % colors.length];
};


