import React from 'react';
import { Grid, Card, CardContent, Typography, Box, useTheme, Skeleton, Alert } from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  Assignment, 
  CheckCircle, 
  Schedule,
  Speed
} from '@mui/icons-material';
import { useAppSelector } from '../../store';
import { selectDashboardStats, selectGlobalTimeRange } from '../../store/slices/dashboardSlice';
import { filterDataByGlobalTimeRange, DateUtils } from '../../shared/utils/date';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  color = 'primary' 
}) => {
  const theme = useTheme();
  const getColorValue = (color: string) => {
    switch (color) {
      case 'success': return theme.palette.success.main;
      case 'error': return theme.palette.error.main;
      case 'warning': return theme.palette.warning.main;
      case 'info': return theme.palette.info.main;
      case 'secondary': return theme.palette.secondary.main;
      default: return theme.palette.primary.main;
    }
  };

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold" color={getColorValue(color)}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                {trend.isPositive ? (
                  <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                )}
                <Typography 
                  variant="caption" 
                  color={trend.isPositive ? 'success.main' : 'error.main'}
                  fontWeight="medium"
                >
                  {trend.value}% {trend.label}
                </Typography>
              </Box>
            )}
          </Box>
          <Box 
            sx={{ 
              p: 1, 
              borderRadius: 2, 
              bgcolor: (theme) => (theme.palette as any)[color]?.light || theme.palette.primary.light,
              color: (theme) => (theme.palette as any)[color]?.main || theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const DashboardStats: React.FC = () => {
  const { stats, loading } = useAppSelector(selectDashboardStats);
  const globalTimeRange = useAppSelector(selectGlobalTimeRange);

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} lg={3} key={i}>
            <Card>
              <CardContent>
                <Skeleton variant="rectangular" height={60} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!stats) {
    return (
      <Alert severity="info">
        No dashboard statistics available. Please check your connection and try again.
      </Alert>
    );
  }

  const today = new Date();
  
  // For dashboard stats, we don't apply time filtering as the data is already aggregated
  // The global time range should be applied at the API level when fetching data
  const filteredStats = stats;

  return (
    <Grid container spacing={3}>
      {/* Total Reports */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Reports"
          value={filteredStats?.totalReports || 0}
          subtitle={`Last updated: ${DateUtils.formatDate(today, 'short')}`}
          icon={<Assignment sx={{ fontSize: 24 }} />}
          color="primary"
          trend={{
            value: 12,
            isPositive: true,
            label: 'vs yesterday'
          }}
        />
      </Grid>

      {/* Pending Reports */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Pending Reports"
          value={filteredStats?.pendingReports || 0}
          subtitle="Awaiting review"
          icon={<Schedule sx={{ fontSize: 24 }} />}
          color="warning"
          trend={{
            value: 8,
            isPositive: false,
            label: 'vs yesterday'
          }}
        />
      </Grid>

      {/* Processed Today */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Processed Today"
          value={filteredStats?.processedToday || 0}
          subtitle={`${filteredStats?.approvedToday || 0} approved, ${filteredStats?.rejectedToday || 0} rejected`}
          icon={<CheckCircle sx={{ fontSize: 24 }} />}
          color="success"
          trend={{
            value: 15,
            isPositive: true,
            label: 'vs yesterday'
          }}
        />
      </Grid>

      {/* Average Processing Time */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Avg. Processing Time"
          value={`${Math.max(0, Math.round((filteredStats?.averageProcessingTime || 0) / 60))}m`}
          subtitle="From submission to resolution"
          icon={<Speed sx={{ fontSize: 24 }} />}
          color="info"
          trend={{
            value: 5,
            isPositive: true,
            label: 'faster'
          }}
        />
      </Grid>

      {/* Additional Stats Row */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                {filteredStats?.approvedToday || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved Today
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="error.main" fontWeight="bold">
                {filteredStats?.rejectedToday || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rejected Today
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary.main" fontWeight="bold">
                {filteredStats?.weeklyTrend?.[filteredStats.weeklyTrend.length - 1]?.reports || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This Week
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="secondary.main" fontWeight="bold">
                {filteredStats?.monthlyTrend?.[filteredStats.monthlyTrend.length - 1]?.reports || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This Month
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default DashboardStats;
