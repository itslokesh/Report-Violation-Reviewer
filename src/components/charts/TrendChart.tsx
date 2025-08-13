import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Box, 
  ToggleButton, 
  ToggleButtonGroup,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp,
  MoreVert,
  PictureAsPdf,
  Download,
  TableChart,
  CalendarToday,
  ViewWeek,
  CalendarMonth
} from '@mui/icons-material';
import { useAppSelector } from '../../store';
import { selectDashboardStats } from '../../store/slices/dashboardSlice';
import { DateUtils } from '../../shared/utils/date';

interface TrendChartProps {
  title?: string;
  height?: number;
  showExport?: boolean;
  defaultPeriod?: 'daily' | 'weekly' | 'monthly';
}

const TrendChart: React.FC<TrendChartProps> = ({ 
  title = "Violation Trends",
  height = 400,
  showExport = true,
  defaultPeriod = 'weekly'
}) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>(defaultPeriod);
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { stats, loading } = useAppSelector(selectDashboardStats);

  const handlePeriodChange = (
    event: React.MouseEvent<HTMLElement>,
    newPeriod: 'daily' | 'weekly' | 'monthly' | null,
  ) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
    }
  };

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: 'line' | 'area' | null,
  ) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format: 'pdf' | 'png' | 'csv') => {
    // TODO: Implement export functionality
    console.log(`Exporting trend data as ${format}`);
    handleExportMenuClose();
  };

  const getTrendData = () => {
    switch (period) {
      case 'daily':
        return stats?.weeklyTrend || [];
      case 'weekly':
        return stats?.weeklyTrend || [];
      case 'monthly':
        return stats?.monthlyTrend || [];
      default:
        return stats?.weeklyTrend || [];
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    switch (period) {
      case 'daily':
        return DateUtils.formatDate(date, 'short');
      case 'weekly':
        return `Week ${DateUtils.getStartOfWeek(date).getDate()}`;
      case 'monthly':
        return DateUtils.formatDate(date, 'short').split(' ')[1]; // Month only
      default:
        return DateUtils.formatDate(date, 'short');
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            boxShadow: 2
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {formatDate(label)}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography 
              key={index}
              variant="body2" 
              color={entry.color}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Box 
                component="span" 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: entry.color,
                  display: 'inline-block'
                }} 
              />
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const trendData = getTrendData().map(item => ({
    date: formatDate(item.date || item.month || ''),
    reports: item.reports || 0,
    approved: item.approved || 0,
    rejected: item.rejected || 0,
    pending: item.pending || 0,
    revenue: item.revenue || 0
  }));

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="reports" 
          stroke="#1976d2" 
          strokeWidth={2}
          name="New Reports"
          dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="approved" 
          stroke="#2e7d32" 
          strokeWidth={2}
          name="Approved"
          dot={{ fill: '#2e7d32', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="rejected" 
          stroke="#d32f2f" 
          strokeWidth={2}
          name="Rejected"
          dot={{ fill: '#d32f2f', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="pending" 
          stroke="#ed6c02" 
          strokeWidth={2}
          name="Pending"
          dot={{ fill: '#ed6c02', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="reports" 
          stackId="1"
          stroke="#1976d2" 
          fill="#1976d2" 
          fillOpacity={0.6}
          name="New Reports"
        />
        <Area 
          type="monotone" 
          dataKey="approved" 
          stackId="1"
          stroke="#2e7d32" 
          fill="#2e7d32" 
          fillOpacity={0.6}
          name="Approved"
        />
        <Area 
          type="monotone" 
          dataKey="rejected" 
          stackId="1"
          stroke="#d32f2f" 
          fill="#d32f2f" 
          fillOpacity={0.6}
          name="Rejected"
        />
        <Area 
          type="monotone" 
          dataKey="pending" 
          stackId="1"
          stroke="#ed6c02" 
          fill="#ed6c02" 
          fillOpacity={0.6}
          name="Pending"
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const getPeriodIcon = (period: string) => {
    switch (period) {
      case 'daily': return <CalendarToday fontSize="small" />;
      case 'weekly': return <ViewWeek fontSize="small" />;
      case 'monthly': return <CalendarMonth fontSize="small" />;
      default: return <CalendarToday fontSize="small" />;
    }
  };

  const getTotalStats = () => {
    const data = getTrendData();
    return {
      totalReports: data.reduce((sum, item) => sum + (item.reports || 0), 0),
      totalApproved: data.reduce((sum, item) => sum + (item.approved || 0), 0),
      totalRejected: data.reduce((sum, item) => sum + (item.rejected || 0), 0),
      totalRevenue: data.reduce((sum, item) => sum + (item.revenue || 0), 0)
    };
  };

  const totalStats = getTotalStats();

  if (loading) {
    return (
      <Card sx={{ height }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="body2" color="text.secondary">
              Loading trend data...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height }}>
      <CardHeader
        title={title}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={handlePeriodChange}
              size="small"
            >
              <ToggleButton value="daily" aria-label="daily">
                <CalendarToday fontSize="small" />
              </ToggleButton>
              <ToggleButton value="weekly" aria-label="weekly">
                <ViewWeek fontSize="small" />
              </ToggleButton>
              <ToggleButton value="monthly" aria-label="monthly">
                <CalendarMonth fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              size="small"
            >
              <ToggleButton value="line" aria-label="line chart">
                <TrendingUp fontSize="small" />
              </ToggleButton>
              <ToggleButton value="area" aria-label="area chart">
                <TrendingUp fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            {showExport && (
              <>
                <IconButton size="small" onClick={handleExportMenuOpen}>
                  <MoreVert />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleExportMenuClose}
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
              </>
            )}
          </Box>
        }
      />
      <CardContent>
        {/* Summary Stats */}
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <Chip 
            label={`Total Reports: ${totalStats.totalReports}`} 
            color="primary" 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`Approved: ${totalStats.totalApproved}`} 
            color="success" 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`Rejected: ${totalStats.totalRejected}`} 
            color="error" 
            variant="outlined" 
            size="small"
          />
          {period === 'monthly' && (
            <Chip 
              label={`Revenue: ₹${totalStats.totalRevenue.toLocaleString()}`} 
              color="secondary" 
              variant="outlined" 
              size="small"
            />
          )}
        </Box>
        
        {trendData.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={height - 150}>
            <Typography variant="body2" color="text.secondary">
              No trend data available for {period} period
            </Typography>
          </Box>
        ) : (
          chartType === 'line' ? renderLineChart() : renderAreaChart()
        )}
      </CardContent>
    </Card>
  );
};

export default TrendChart;
