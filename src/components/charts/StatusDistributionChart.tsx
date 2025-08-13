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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  MoreVert,
  PictureAsPdf,
  Download,
  TableChart,
  CheckCircle,
  Cancel,
  Schedule,
  Assignment
} from '@mui/icons-material';
import { useAppSelector } from '../../store';
import { selectDashboardStats } from '../../store/slices/dashboardSlice';
import { ReportStatus } from '../../shared/models/common';

interface StatusDistributionChartProps {
  title?: string;
  height?: number;
  showExport?: boolean;
}

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ 
  title = "Report Status Distribution",
  height = 400,
  showExport = true
}) => {
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'stacked'>('pie');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { stats, loading } = useAppSelector(selectDashboardStats);

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: 'pie' | 'bar' | 'stacked' | null,
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
    console.log(`Exporting status distribution data as ${format}`);
    handleExportMenuClose();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Pending': return '#ed6c02';
      case 'Under Review': return '#1976d2';
      case 'Approved': return '#2e7d32';
      case 'Rejected': return '#d32f2f';
      case 'Duplicate': return '#757575';
      case 'Resolved': return '#388e3c';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Schedule fontSize="small" />;
      case 'Under Review': return <Assignment fontSize="small" />;
      case 'Approved': return <CheckCircle fontSize="small" />;
      case 'Rejected': return <Cancel fontSize="small" />;
      case 'Duplicate': return <Assignment fontSize="small" />;
      case 'Resolved': return <CheckCircle fontSize="small" />;
      default: return <Assignment fontSize="small" />;
    }
  };

  const getStatusData = () => {
    if (!stats) return [];
    
    // Mock data - replace with actual API data
    const statusData = [
      { status: 'Pending', count: stats.pendingReports || 0, percentage: 0 },
      { status: 'Under Review', count: Math.round((stats.pendingReports || 0) * 0.3), percentage: 0 },
      { status: 'Approved', count: stats.approvedToday || 0, percentage: 0 },
      { status: 'Rejected', count: stats.rejectedToday || 0, percentage: 0 },
      { status: 'Duplicate', count: Math.round((stats.totalReports || 0) * 0.05), percentage: 0 },
      { status: 'Resolved', count: stats.processedToday || 0, percentage: 0 }
    ];

    const total = statusData.reduce((sum, item) => sum + item.count, 0);
    
    return statusData.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
      color: getStatusColor(item.status),
      icon: getStatusIcon(item.status)
    }));
  };

  const getWeeklyStatusData = () => {
    if (!stats?.weeklyTrend) return [];
    
    return stats.weeklyTrend.map(week => ({
      period: week.date || 'Week',
      pending: week.pending || 0,
      approved: week.approved || 0,
      rejected: week.rejected || 0,
      total: (week.pending || 0) + (week.approved || 0) + (week.rejected || 0)
    }));
  };

  const statusData = getStatusData();
  const weeklyData = getWeeklyStatusData();

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
            {label}
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
              {entry.name}: {entry.value} ({entry.payload.percentage}%)
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height - 100}>
      <PieChart>
        <Pie
          data={statusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ status, percentage }) => `${status} (${percentage}%)`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
        >
          {statusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height - 100}>
      <BarChart data={statusData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="status" 
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" fill="#1976d2">
          {statusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderStackedBarChart = () => (
    <ResponsiveContainer width="100%" height={height - 100}>
      <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="period" 
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="pending" stackId="a" fill="#ed6c02" name="Pending" />
        <Bar dataKey="approved" stackId="a" fill="#2e7d32" name="Approved" />
        <Bar dataKey="rejected" stackId="a" fill="#d32f2f" name="Rejected" />
      </BarChart>
    </ResponsiveContainer>
  );

  const getTotalStats = () => {
    const total = statusData.reduce((sum, item) => sum + item.count, 0);
    const pending = statusData.find(item => item.status === 'Pending')?.count || 0;
    const resolved = statusData.find(item => item.status === 'Resolved')?.count || 0;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    
    return { total, pending, resolved, resolutionRate };
  };

  const totalStats = getTotalStats();

  if (loading) {
    return (
      <Card sx={{ height }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="body2" color="text.secondary">
              Loading status distribution data...
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
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              size="small"
            >
              <ToggleButton value="pie" aria-label="pie chart">
                <PieChartIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="bar" aria-label="bar chart">
                <BarChartIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="stacked" aria-label="stacked bar chart">
                <BarChartIcon fontSize="small" />
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
            label={`Total: ${totalStats.total}`} 
            color="primary" 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`Pending: ${totalStats.pending}`} 
            color="warning" 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`Resolved: ${totalStats.resolved}`} 
            color="success" 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`Resolution Rate: ${totalStats.resolutionRate}%`} 
            color="info" 
            variant="outlined" 
            size="small"
          />
        </Box>

        {/* Status Breakdown */}
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {statusData.map((item, index) => (
            <Chip
              key={index}
              icon={item.icon}
              label={`${item.status}: ${item.count} (${item.percentage}%)`}
              size="small"
              sx={{ 
                bgcolor: item.color,
                color: 'white',
                fontSize: '0.7rem'
              }}
            />
          ))}
        </Box>

        {statusData.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={height - 200}>
            <Typography variant="body2" color="text.secondary">
              No status data available
            </Typography>
          </Box>
        ) : (
          <>
            {chartType === 'pie' && renderPieChart()}
            {chartType === 'bar' && renderBarChart()}
            {chartType === 'stacked' && renderStackedBarChart()}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusDistributionChart;
