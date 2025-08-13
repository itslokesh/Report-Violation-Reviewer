import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';

const ChallanDetailPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Challan Details
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Challan Information
            </Typography>
            <Typography variant="body1">
              Challan ID: #CH123456
            </Typography>
            <Typography variant="body1">
              Vehicle Number: MH12AB1234
            </Typography>
            <Typography variant="body1">
              Violation Type: Speeding
            </Typography>
            <Typography variant="body1">
              Fine Amount: ₹1000
            </Typography>
            <Typography variant="body1">
              Status: Issued
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View challan details and payment status
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChallanDetailPage;
