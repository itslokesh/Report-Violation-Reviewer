import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Avatar } from '@mui/material';

const ProfilePage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}>
                A
              </Avatar>
              <Typography variant="h6" gutterBottom>
                Admin User
              </Typography>
              <Typography variant="body2" color="text.secondary">
                admin@trafficpolice.gov.in
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Typography variant="body1">
              Name: Admin User
            </Typography>
            <Typography variant="body1">
              Email: admin@trafficpolice.gov.in
            </Typography>
            <Typography variant="body1">
              Role: Administrator
            </Typography>
            <Typography variant="body1">
              Department: Traffic Police
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
