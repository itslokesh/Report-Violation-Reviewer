import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Chip } from '@mui/material';

const ReportDetailPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Report Details
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Violation Information
            </Typography>
            <Typography variant="body1">
              Report ID: #12345678
            </Typography>
            <Typography variant="body1">
              Violation Type: Speeding
            </Typography>
            <Typography variant="body1">
              Vehicle Number: MH12AB1234
            </Typography>
            <Typography variant="body1">
              Status: Pending
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Chip label="Approve" color="success" sx={{ mr: 1, mb: 1 }} />
              <Chip label="Reject" color="error" sx={{ mr: 1, mb: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportDetailPage;
