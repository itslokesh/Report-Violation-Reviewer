import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';

const AnalyticsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics & Reports
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View detailed analytics and performance reports
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Export Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate and download various reports
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;
