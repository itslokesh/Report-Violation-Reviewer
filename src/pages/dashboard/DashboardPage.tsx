import React, { useEffect, useState, useCallback } from 'react';
import { 
  Container, 
  Grid, 
  Typography, 
  Box, 
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Refresh,
  Download,
  PictureAsPdf,
  TableChart,
  Dashboard as DashboardIcon,
  TrendingUp,
  Map,
  People,
  Assessment
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  fetchDashboardStats, 
  fetchViolationTypeStats, 
  fetchGeographicStats, 
  fetchOfficerPerformance 
} from '../../store/slices/dashboardSlice';
import { useNotification } from '../../hooks/useNotification';

// Dashboard Components
import DashboardStats from '../../components/dashboard/DashboardStats';
import ViolationTypeChart from '../../components/charts/ViolationTypeChart';
import TrendChart from '../../components/charts/TrendChart';
import GeographicHeatmap from '../../components/charts/GeographicHeatmap';
import OfficerPerformanceChart from '../../components/charts/OfficerPerformanceChart';
import StatusDistributionChart from '../../components/charts/StatusDistributionChart';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { showNotification } = useNotification();
  const [tabValue, setTabValue] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { stats, loading, error } = useAppSelector(state => state.dashboard);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        dispatch(fetchDashboardStats()).unwrap(),
        dispatch(fetchViolationTypeStats()).unwrap(),
        dispatch(fetchGeographicStats()).unwrap(),
        dispatch(fetchOfficerPerformance()).unwrap()
      ]);
      setLastUpdated(new Date());
      showNotification('success', 'Success', 'Dashboard data refreshed successfully');
    } catch (error) {
      console.error('DashboardPage: Failed to load dashboard data:', error);
      showNotification('error', 'Error', 'Failed to load dashboard data');
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, showNotification]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    // TODO: Implement dashboard export functionality
    console.log(`Exporting dashboard as ${format}`);
    showNotification('success', 'Export Success', `Dashboard exported as ${format.toUpperCase()}`);
  };

  const getTabIcon = (index: number) => {
    switch (index) {
      case 0: return <DashboardIcon />;
      case 1: return <TrendingUp />;
      case 2: return <Map />;
      case 3: return <People />;
      case 4: return <Assessment />;
      default: return <DashboardIcon />;
    }
  };

  if (loading && !isRefreshing) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Traffic Police Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time monitoring and analytics for traffic violation management
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          <Chip 
            label={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
            size="small"
            variant="outlined"
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDashboardData}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => handleExport('pdf')}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Dashboard Stats */}
      <Box mb={3}>
        <DashboardStats />
      </Box>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label="Overview" 
            icon={getTabIcon(0)} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            label="Trends" 
            icon={getTabIcon(1)} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            label="Geographic" 
            icon={getTabIcon(2)} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            label="Performance" 
            icon={getTabIcon(3)} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            label="Analytics" 
            icon={getTabIcon(4)} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <ViolationTypeChart 
                title="Violation Type Distribution"
                height={400}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <StatusDistributionChart 
                title="Report Status Distribution"
                height={400}
              />
            </Grid>
            <Grid item xs={12}>
              <TrendChart 
                title="Weekly Violation Trends"
                height={400}
                defaultPeriod="weekly"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Trends Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TrendChart 
                title="Violation Trends Analysis"
                height={500}
                defaultPeriod="monthly"
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <ViolationTypeChart 
                title="Monthly Violation Types"
                height={400}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <StatusDistributionChart 
                title="Monthly Status Trends"
                height={400}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Geographic Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <GeographicHeatmap 
                title="Geographic Violation Distribution"
                height={600}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <ViolationTypeChart 
                title="Violation Types by Region"
                height={400}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <StatusDistributionChart 
                title="Status Distribution by Region"
                height={400}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <OfficerPerformanceChart 
                title="Officer Performance Metrics"
                height={600}
                maxOfficers={15}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <TrendChart 
                title="Processing Time Trends"
                height={400}
                defaultPeriod="weekly"
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <StatusDistributionChart 
                title="Approval vs Rejection Rates"
                height={400}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <TrendChart 
                title="Comprehensive Analytics"
                height={500}
                defaultPeriod="monthly"
              />
            </Grid>
            <Grid item xs={12} lg={4}>
              <ViolationTypeChart 
                title="Top Violation Types"
                height={500}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <OfficerPerformanceChart 
                title="Top Performers"
                height={400}
                maxOfficers={8}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <StatusDistributionChart 
                title="Resolution Analytics"
                height={400}
              />
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Quick Actions */}
      <Box mt={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={() => handleExport('pdf')}
            >
              Export PDF Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<TableChart />}
              onClick={() => handleExport('csv')}
            >
              Export CSV Data
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExport('excel')}
            >
              Export Excel Report
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default DashboardPage;
