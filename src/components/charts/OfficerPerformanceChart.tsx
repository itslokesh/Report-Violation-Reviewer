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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress
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
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TableChart as TableChartIcon,
  MoreVert,
  PictureAsPdf,
  Download,
  TrendingUp,
  TrendingDown,
  Person
} from '@mui/icons-material';
import { useAppSelector } from '../../store';
import { selectOfficerPerformance } from '../../store/slices/dashboardSlice';

interface OfficerPerformanceChartProps {
  title?: string;
  height?: number;
  showExport?: boolean;
  maxOfficers?: number;
}

const OfficerPerformanceChart: React.FC<OfficerPerformanceChartProps> = ({ 
  title = "Officer Performance Metrics",
  height = 500,
  showExport = true,
  maxOfficers = 10
}) => {
  const [viewType, setViewType] = useState<'chart' | 'table'>('chart');
  const [metricType, setMetricType] = useState<'processed' | 'time' | 'rate'>('processed');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { stats, loading } = useAppSelector(selectOfficerPerformance);

  const handleViewTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewType: 'chart' | 'table' | null,
  ) => {
    if (newViewType !== null) {
      setViewType(newViewType);
    }
  };

  const handleMetricTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMetricType: 'processed' | 'time' | 'rate' | null,
  ) => {
    if (newMetricType !== null) {
      setMetricType(newMetricType);
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
    console.log(`Exporting officer performance data as ${format}`);
    handleExportMenuClose();
  };

  const COLORS = [
    '#1976d2', '#dc004e', '#2e7d32', '#ed6c02', 
    '#9c27b0', '#0288d1', '#388e3c', '#f57c00',
    '#7b1fa2', '#0277bd', '#689f38', '#ef6c00'
  ];

  const getMetricData = () => {
    if (!stats) return [];
    
    const sortedStats = [...stats].sort((a, b) => {
      switch (metricType) {
        case 'processed':
          return b.reportsProcessed - a.reportsProcessed;
        case 'time':
          return a.averageProcessingTime - b.averageProcessingTime;
        case 'rate':
          return b.approvalRate - a.approvalRate;
        default:
          return b.reportsProcessed - a.reportsProcessed;
      }
    });

    return sortedStats.slice(0, maxOfficers).map((officer, index) => ({
      name: officer.officerName,
      badgeNumber: officer.badgeNumber,
      reportsProcessed: officer.reportsProcessed,
      averageProcessingTime: Math.round(officer.averageProcessingTime / 60), // Convert to minutes
      approvalRate: Math.round(officer.approvalRate * 100),
      accuracyRate: Math.round(officer.accuracyRate * 100),
      challansIssued: officer.challansIssued,
      color: COLORS[index % COLORS.length]
    }));
  };

  const getChartData = () => {
    const data = getMetricData();
    return data.map(item => ({
      name: item.name,
      value: metricType === 'processed' ? item.reportsProcessed :
             metricType === 'time' ? item.averageProcessingTime :
             item.approvalRate,
      color: item.color,
      badgeNumber: item.badgeNumber,
      reportsProcessed: item.reportsProcessed,
      averageProcessingTime: item.averageProcessingTime,
      approvalRate: item.approvalRate,
      accuracyRate: item.accuracyRate,
      challansIssued: item.challansIssued
    }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
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
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Badge: {data.badgeNumber}
          </Typography>
          <Typography variant="body2" color="primary">
            Reports Processed: {data.reportsProcessed}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Avg. Time: {data.averageProcessingTime}m
          </Typography>
          <Typography variant="body2" color="success.main">
            Approval Rate: {data.approvalRate}%
          </Typography>
          <Typography variant="body2" color="info.main">
            Accuracy Rate: {data.accuracyRate}%
          </Typography>
          <Typography variant="body2" color="secondary.main">
            Challans Issued: {data.challansIssued}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height - 100}>
      <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" fill="#1976d2">
          {getChartData().map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => {
    const data = getChartData().slice(0, 5); // Show top 5 for pie chart
    return (
      <ResponsiveContainer width="100%" height={height - 100}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name} (${value})`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderTable = () => (
    <TableContainer component={Paper} sx={{ maxHeight: height - 150 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>Officer</TableCell>
            <TableCell>Badge</TableCell>
            <TableCell align="right">Reports</TableCell>
            <TableCell align="right">Avg Time (m)</TableCell>
            <TableCell align="right">Approval Rate</TableCell>
            <TableCell align="right">Accuracy</TableCell>
            <TableCell align="right">Challans</TableCell>
            <TableCell align="center">Performance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {getMetricData().map((officer, index) => {
            const performanceScore = Math.round(
              (officer.approvalRate * 0.4 + 
               officer.accuracyRate * 0.3 + 
               (100 - officer.averageProcessingTime) * 0.3)
            );
            
            return (
              <TableRow key={index} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight="medium">
                      {officer.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={officer.badgeNumber} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {officer.reportsProcessed}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="text.secondary">
                    {officer.averageProcessingTime}m
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {officer.approvalRate}%
                    </Typography>
                    {officer.approvalRate > 80 ? (
                      <TrendingUp fontSize="small" color="success" />
                    ) : (
                      <TrendingDown fontSize="small" color="error" />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="info.main">
                    {officer.accuracyRate}%
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="secondary.main">
                    {officer.challansIssued}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress
                      variant="determinate"
                      value={performanceScore}
                      sx={{ 
                        width: 60, 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: 'grey.200'
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {performanceScore}%
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const getMetricLabel = () => {
    switch (metricType) {
      case 'processed': return 'Reports Processed';
      case 'time': return 'Average Processing Time (minutes)';
      case 'rate': return 'Approval Rate (%)';
      default: return 'Reports Processed';
    }
  };

  const getTotalStats = () => {
    if (!stats) return { totalOfficers: 0, totalReports: 0, avgApprovalRate: 0, avgProcessingTime: 0 };
    
    const totalOfficers = stats.length;
    const totalReports = stats.reduce((sum, officer) => sum + officer.reportsProcessed, 0);
    const avgApprovalRate = Math.round(
      stats.reduce((sum, officer) => sum + officer.approvalRate, 0) / totalOfficers * 100
    );
    const avgProcessingTime = Math.round(
      stats.reduce((sum, officer) => sum + officer.averageProcessingTime, 0) / totalOfficers / 60
    );
    
    return { totalOfficers, totalReports, avgApprovalRate, avgProcessingTime };
  };

  const totalStats = getTotalStats();

  if (loading) {
    return (
      <Card sx={{ height }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="body2" color="text.secondary">
              Loading officer performance data...
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
              value={viewType}
              exclusive
              onChange={handleViewTypeChange}
              size="small"
            >
              <ToggleButton value="chart" aria-label="chart view">
                <BarChartIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="table" aria-label="table view">
                <TableChartIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            {viewType === 'chart' && (
              <ToggleButtonGroup
                value={metricType}
                exclusive
                onChange={handleMetricTypeChange}
                size="small"
              >
                <ToggleButton value="processed" aria-label="reports processed">
                  Reports
                </ToggleButton>
                <ToggleButton value="time" aria-label="processing time">
                  Time
                </ToggleButton>
                <ToggleButton value="rate" aria-label="approval rate">
                  Rate
                </ToggleButton>
              </ToggleButtonGroup>
            )}
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
                      <TableChartIcon fontSize="small" />
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
            label={`Officers: ${totalStats.totalOfficers}`} 
            color="primary" 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`Total Reports: ${totalStats.totalReports}`} 
            color="secondary" 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`Avg Approval: ${totalStats.avgApprovalRate}%`} 
            color="success" 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`Avg Time: ${totalStats.avgProcessingTime}m`} 
            color="info" 
            variant="outlined" 
            size="small"
          />
        </Box>

        {viewType === 'chart' ? (
          <>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {getMetricLabel()}
            </Typography>
            {metricType === 'rate' ? renderPieChart() : renderBarChart()}
          </>
        ) : (
          renderTable()
        )}
      </CardContent>
    </Card>
  );
};

export default OfficerPerformanceChart;
