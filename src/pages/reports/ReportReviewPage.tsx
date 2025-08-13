import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Button } from '@mui/material';

const ReportReviewPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Review Report
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Report Information
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
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Review Actions
              </Typography>
              <Button variant="contained" color="success" fullWidth sx={{ mb: 2 }}>
                Approve Report
              </Button>
              <Button variant="contained" color="error" fullWidth sx={{ mb: 2 }}>
                Reject Report
              </Button>
              <Button variant="outlined" fullWidth>
                Mark as Duplicate
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportReviewPage;
