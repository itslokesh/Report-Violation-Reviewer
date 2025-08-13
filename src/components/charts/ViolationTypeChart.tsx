import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Box, 
  ToggleButton, 
  ToggleButtonGroup,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  PieChart, 
  BarChart, 
  Pie, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  PieChart as PieChartIcon, 
  BarChart as BarChartIcon,
  Download,
  MoreVert,
  PictureAsPdf,
  TableChart
} from '@mui/icons-material';
import { useAppSelector } from '../../store';
import { selectViolationTypeStats } from '../../store/slices/dashboardSlice';
import { ViolationType } from '../../shared/models/common';

interface ViolationTypeChartProps {
  title?: string;
  height?: number;
  showExport?: boolean;
}

const ViolationTypeChart: React.FC<ViolationTypeChartProps> = ({ 
  title = "Violation Type Distribution",
  height = 400,
  showExport = true
}) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { stats, loading } = useAppSelector(selectViolationTypeStats);

  const COLORS = [
    '#1976d2', '#dc004e', '#2e7d32', '#ed6c02', 
    '#9c27b0', '#0288d1', '#388e3c', '#f57c00',
    '#7b1fa2', '#0277bd', '#689f38', '#ef6c00'
  ];

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: 'pie' | 'bar' | null,
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
    console.log(`Exporting as ${format}`);
    handleExportMenuClose();
  };

  const getViolationTypeLabel = (type: ViolationType): string => {
    switch (type) {
      case ViolationType.WRONG_SIDE_DRIVING: return 'Wrong Side Driving';
      case ViolationType.NO_PARKING_ZONE: return 'No Parking Zone';
      case ViolationType.SIGNAL_JUMPING: return 'Signal Jumping';
      case ViolationType.SPEED_VIOLATION: return 'Speed Violation';
      case ViolationType.HELMET_SEATBELT_VIOLATION: return 'Helmet/Seatbelt Violation';
      case ViolationType.MOBILE_PHONE_USAGE: return 'Mobile Phone Usage';
      case ViolationType.LANE_CUTTING: return 'Lane Cutting';
      case ViolationType.DRUNK_DRIVING_SUSPECTED: return 'Drunk Driving (Suspected)';
      case ViolationType.OTHERS: return 'Others';
      default: return 'Unknown';
    }
  };

  const getViolationTypeColor = (type: ViolationType): string => {
    const colorMap: Record<ViolationType, string> = {
      [ViolationType.WRONG_SIDE_DRIVING]: '#d32f2f',
      [ViolationType.NO_PARKING_ZONE]: '#f57c00',
      [ViolationType.SIGNAL_JUMPING]: '#1976d2',
      [ViolationType.SPEED_VIOLATION]: '#388e3c',
      [ViolationType.HELMET_SEATBELT_VIOLATION]: '#7b1fa2',
      [ViolationType.MOBILE_PHONE_USAGE]: '#0288d1',
      [ViolationType.LANE_CUTTING]: '#689f38',
      [ViolationType.DRUNK_DRIVING_SUSPECTED]: '#ef6c00',
      [ViolationType.OTHERS]: '#757575'
    };
    return colorMap[type] || '#757575';
  };

  const chartData = stats?.map(stat => ({
    name: getViolationTypeLabel(stat.type),
    value: stat.count,
    percentage: stat.percentage,
    type: stat.type,
    trend: stat.trend,
    color: getViolationTypeColor(stat.type)
  })) || [];

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
            Count: {data.value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Percentage: {data.percentage.toFixed(1)}%
          </Typography>
          {data.trend && (
            <Typography 
              variant="body2" 
              color={data.trend === 'up' ? 'success.main' : data.trend === 'down' ? 'error.main' : 'text.secondary'}
            >
              Trend: {data.trend === 'up' ? '↗' : data.trend === 'down' ? '↘' : '→'} {data.trend}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <RechartsTooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
        <RechartsTooltip content={<CustomTooltip />} />
        <Bar dataKey="value" fill="#1976d2">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  if (loading) {
    return (
      <Card sx={{ height }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="body2" color="text.secondary">
              Loading violation type data...
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
                <PieChartIcon />
              </ToggleButton>
              <ToggleButton value="bar" aria-label="bar chart">
                <BarChartIcon />
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
        {chartData.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={height - 100}>
            <Typography variant="body2" color="text.secondary">
              No violation type data available
            </Typography>
          </Box>
        ) : (
          chartType === 'pie' ? renderPieChart() : renderBarChart()
        )}
      </CardContent>
    </Card>
  );
};

export default ViolationTypeChart;
