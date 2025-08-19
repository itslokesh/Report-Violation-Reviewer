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
  Chip,
  useTheme
} from '@mui/material';
import { 
  LineChart as ReLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  LabelList
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
import { getGridColor, getAxisTickColor } from '../../theme/chart';

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
  const theme = useTheme();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>(defaultPeriod);
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { stats, loading } = useAppSelector(selectDashboardStats);

  const handlePeriodChange = (
    event: React.MouseEvent<HTMLElement>,
    newPeriod: 'daily' | 'weekly' | 'monthly' | null,
  ) => {
    void event;
    if (newPeriod !== null) {
      setPeriod(newPeriod);
    }
  };

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: 'line' | 'area' | null,
  ) => {
    void event;
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
        return DateUtils.formatDate(date, 'short').split(' ')[1];
      default:
        return DateUtils.formatDate(date, 'short');
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1, p: 2, boxShadow: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold">{label}</Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" color={entry.color} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component="span" sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: entry.color, display: 'inline-block' }} />
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const trendData = getTrendData().map((item: any) => ({
    date: formatDate((item as any).date ?? (item as any).month ?? ''),
    reports: (item as any).reports ?? 0,
    approved: (item as any).approved ?? 0,
    rejected: (item as any).rejected ?? 0,
    pending: (item as any).pending ?? 0,
    revenue: (item as any).revenue ?? 0
  }));

  const chartAreaHeight = Math.max(180, height - 150);

  const getTotalStats = () => {
    const data: any[] = trendData as any[];
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
            <Typography variant="body2" color="text.secondary">Loading trend data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={chartAreaHeight}>
      <ReLineChart data={trendData} margin={{ top: 30, right: 30, left: 20, bottom: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(theme)} />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: getAxisTickColor(theme) }} interval="preserveStartEnd" />
        <YAxis tick={{ fill: getAxisTickColor(theme) }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="reports" stroke={theme.palette.primary.main} strokeWidth={2} name="New Reports" dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }}>
          <LabelList dataKey="reports" position="top" style={{ fontSize: 10, fill: theme.palette.text.primary }} />
        </Line>
        <Line type="monotone" dataKey="approved" stroke={theme.palette.success.main} strokeWidth={2} name="Approved" dot={{ fill: theme.palette.success.main, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="rejected" stroke={theme.palette.error.main} strokeWidth={2} name="Rejected" dot={{ fill: theme.palette.error.main, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="pending" stroke={theme.palette.warning.main} strokeWidth={2} name="Pending" dot={{ fill: theme.palette.warning.main, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
      </ReLineChart>
    </ResponsiveContainer>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={chartAreaHeight}>
      <AreaChart data={trendData} margin={{ top: 30, right: 30, left: 20, bottom: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(theme)} />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: getAxisTickColor(theme) }} interval="preserveStartEnd" />
        <YAxis tick={{ fill: getAxisTickColor(theme) }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area type="monotone" dataKey="reports" stackId="1" stroke={theme.palette.primary.main} fill={theme.palette.primary.main} fillOpacity={0.6} name="New Reports">
          <LabelList dataKey="reports" position="top" style={{ fontSize: 10, fill: theme.palette.text.primary }} />
        </Area>
        <Area type="monotone" dataKey="approved" stackId="1" stroke={theme.palette.success.main} fill={theme.palette.success.main} fillOpacity={0.6} name="Approved" />
        <Area type="monotone" dataKey="rejected" stackId="1" stroke={theme.palette.error.main} fill={theme.palette.error.main} fillOpacity={0.6} name="Rejected" />
        <Area type="monotone" dataKey="pending" stackId="1" stroke={theme.palette.warning.main} fill={theme.palette.warning.main} fillOpacity={0.6} name="Pending" />
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <Card sx={{ height }}>
      <CardHeader
        title={title}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <ToggleButtonGroup value={period} exclusive onChange={handlePeriodChange} size="small">
              <ToggleButton value="daily" aria-label="daily"><CalendarToday fontSize="small" /></ToggleButton>
              <ToggleButton value="weekly" aria-label="weekly"><ViewWeek fontSize="small" /></ToggleButton>
              <ToggleButton value="monthly" aria-label="monthly"><CalendarMonth fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup value={chartType} exclusive onChange={handleChartTypeChange} size="small">
              <ToggleButton value="line" aria-label="line chart"><TrendingUp fontSize="small" /></ToggleButton>
              <ToggleButton value="area" aria-label="area chart"><TrendingUp fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
            {showExport && (
              <>
                <IconButton size="small" onClick={handleExportMenuOpen}><MoreVert /></IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleExportMenuClose}>
                  <MenuItem onClick={() => handleExport('pdf')}><ListItemIcon><PictureAsPdf fontSize="small" /></ListItemIcon><ListItemText>Export as PDF</ListItemText></MenuItem>
                  <MenuItem onClick={() => handleExport('png')}><ListItemIcon><Download fontSize="small" /></ListItemIcon><ListItemText>Export as PNG</ListItemText></MenuItem>
                  <MenuItem onClick={() => handleExport('csv')}><ListItemIcon><TableChart fontSize="small" /></ListItemIcon><ListItemText>Export as CSV</ListItemText></MenuItem>
                </Menu>
              </>
            )}
          </Box>
        }
      />
      <CardContent>
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <Chip label={`Total Reports: ${totalStats.totalReports}`} color="primary" variant="outlined" size="small" />
          <Chip label={`Approved: ${totalStats.totalApproved}`} color="success" variant="outlined" size="small" />
          <Chip label={`Rejected: ${totalStats.totalRejected}`} color="error" variant="outlined" size="small" />
          {period === 'monthly' && (
            <Chip label={`Revenue: ₹${totalStats.totalRevenue.toLocaleString()}`} color="secondary" variant="outlined" size="small" />
          )}
        </Box>

        {trendData.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={chartAreaHeight}>
            <Typography variant="body2" color="text.secondary">No trend data available for {period} period</Typography>
          </Box>
        ) : (
          chartType === 'line' ? renderLineChart() : renderAreaChart()
        )}
      </CardContent>
    </Card>
  );
};

export default TrendChart;
