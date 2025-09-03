import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { tnPoliceLogo } from '../../assets/images';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{
        backgroundColor: 'background.default',
      }}
    >
      {/* Logo */}
      <Box sx={{ mb: 3 }}>
        <img 
          src={tnPoliceLogo} 
          alt="Tamil Nadu Police Logo" 
          style={{ width: '80px', height: '80px' }}
        />
      </Box>
      
      {/* Department Name */}
      <Typography
        variant="h5"
        color="primary.main"
        sx={{ mb: 3, fontWeight: 'bold' }}
      >
        Coimbatore City Traffic Police
      </Typography>
      
      <CircularProgress size={60} thickness={4} />
      <Typography
        variant="h6"
        color="text.secondary"
        sx={{ mt: 2 }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
