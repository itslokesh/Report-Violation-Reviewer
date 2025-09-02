import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert
} from '@mui/material';
import {
  MoreVert,
  PictureAsPdf,
  Download,
  TableChart
} from '@mui/icons-material';
import { ExportService, ExportData, ChartExportOptions } from '../../shared/utils/export';

interface ExportMenuProps {
  onExport: (format: 'pdf' | 'png' | 'csv') => Promise<void>;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ExportMenu: React.FC<ExportMenuProps> = ({ 
  onExport, 
  disabled = false,
  size = 'small'
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = async (format: 'pdf' | 'png' | 'csv') => {
    try {
      await onExport(format);
      setSnackbar({
        open: true,
        message: `Successfully exported as ${format.toUpperCase()}`,
        severity: 'success'
      });
    } catch (error) {
      console.error(`Export failed:`, error);
      setSnackbar({
        open: true,
        message: `Failed to export as ${format.toUpperCase()}`,
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <IconButton 
        size={size} 
        onClick={handleMenuOpen}
        disabled={disabled}
        aria-label="export options"
      >
        <MoreVert />
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleExport('pdf')}>
          <ListItemIcon>
            <PictureAsPdf fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('png')}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as PNG</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv')}>
          <ListItemIcon>
            <TableChart fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as CSV</ListItemText>
        </MenuItem>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ExportMenu;
