import React, { useState, useRef, useMemo } from 'react';
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
  useTheme,
  Button,
  Popover,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Divider,
  Tooltip
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatReportStatus } from '../../shared/utils/formatting';
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
  Assignment,
  DateRange,
  CalendarToday,
  Clear
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store';
import { selectStatusDistribution, selectGlobalTimeRange, fetchStatusDistribution } from '../../store/slices/dashboardSlice';
import { filterDataByGlobalTimeRange, filterDataByLocalTimeRange } from '../../shared/utils/date';
import { getGridColor, getAxisTickColor } from '../../theme/chart';

interface StatusDistributionChartProps {
  title?: string;
  height?: number;
  showExport?: boolean;
  isVisible?: boolean;
}

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ 
  title = "Report Status Distribution",
  height = 380,
  showExport = true,
  isVisible = true
}) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'stacked'>('pie');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [timeRangeAnchorEl, setTimeRangeAnchorEl] = useState<null | HTMLElement>(null);
  const { stats, loading } = useAppSelector(selectStatusDistribution);
  const globalTimeRange = useAppSelector(selectGlobalTimeRange);

  // Local time range state
  const [localTimeRange, setLocalTimeRange] = useState({
    type: 'relative' as 'absolute' | 'relative',
    startDate: '',
    endDate: '',
    relativeRange: '7d',
    isApplied: false
  });

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: 'pie' | 'bar' | null,
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
    console.log(`Exporting status distribution data as ${format}`);
    handleExportMenuClose();
  };

  // Time range handlers
  const handleTimeRangeMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setTimeRangeAnchorEl(event.currentTarget);
  };

  const handleTimeRangeMenuClose = () => {
    setTimeRangeAnchorEl(null);
  };

  const handleTimeRangeTypeChange = (type: 'absolute' | 'relative') => {
    setLocalTimeRange(prev => ({ ...prev, type }));
  };

  const handleRelativeRangeChange = (range: string) => {
    setLocalTimeRange(prev => ({ ...prev, relativeRange: range }));
  };

  const handleApplyTimeRange = () => {
    setLocalTimeRange(prev => ({ ...prev, isApplied: true }));
    handleTimeRangeMenuClose();
  };

  const handleClearTimeRange = () => {
    setLocalTimeRange({
      type: 'relative',
      startDate: '',
      endDate: '',
      relativeRange: '30d',
      isApplied: false
    });
    // Reset to global time range data
    dispatch(fetchStatusDistribution(undefined));
  };

  const getTimeRangeDisplay = () => {
    if (!localTimeRange.isApplied) {
      return 'Last 30 days';
    }

    if (localTimeRange.type === 'absolute') {
      return localTimeRange.startDate && localTimeRange.endDate
        ? `${localTimeRange.startDate} to ${localTimeRange.endDate}`
        : 'Select dates';
    } else {
      const rangeMap: { [key: string]: string } = {
        '1d': 'Last 24 hours',
        '7d': 'Last 7 days',
        '30d': 'Last 30 days',
        '90d': 'Last 90 days',
        '1y': 'Last year',
        'ytd': 'Year to date',
        'mtd': 'Month to date'
      };
      return rangeMap[localTimeRange.relativeRange] || 'Select range';
    }
  };

  function getStatusIcon(status: string) {
    switch (status) {
      case 'Pending': return <Schedule fontSize="small" />;
      case 'Under Review': return <Assignment fontSize="small" />;
      case 'Approved': return <CheckCircle fontSize="small" />;
      case 'Rejected': return <Cancel fontSize="small" />;
      case 'Duplicate': return <Assignment fontSize="small" />;
      case 'Resolved': return <CheckCircle fontSize="small" />;
      case 'PENDING': return <Schedule fontSize="small" />;
      case 'UNDER_REVIEW': return <Assignment fontSize="small" />;
      case 'APPROVED': return <CheckCircle fontSize="small" />;
      case 'REJECTED': return <Cancel fontSize="small" />;
      default: return <Assignment fontSize="small" />;
    }
  }

  // Get status data from the new status distribution API
  const getStatusData = () => {
    if (!stats || !Array.isArray(stats)) return [];

    console.log('StatusDistributionChart - stats:', stats);

    // Map the API response to our chart format
    const statusData = stats.map((item: any) => {
      const status = item.status || 'UNKNOWN';
      const count = Number(item.count || 0);
      const percentage = Number(item.percentage || 0);
      
      // Map status names to display names
      let displayStatus = status;
      switch (status.toUpperCase()) {
        case 'PENDING':
          displayStatus = 'Pending';
          break;
        case 'UNDER_REVIEW':
          displayStatus = 'Under Review';
          break;
        case 'APPROVED':
          displayStatus = 'Approved';
          break;
        case 'REJECTED':
          displayStatus = 'Rejected';
          break;
        default:
          displayStatus = status;
      }

      // Get color based on status
      let color = '#757575'; // default gray
      switch (status.toUpperCase()) {
        case 'PENDING':
          color = '#ff9800'; // orange
          break;
        case 'UNDER_REVIEW':
          color = '#2196f3'; // blue
          break;
        case 'APPROVED':
          color = '#4caf50'; // green
          break;
        case 'REJECTED':
          color = '#f44336'; // red
          break;
      }

      return {
        status: displayStatus,
        count,
        percentage,
        color,
        icon: getStatusIcon(displayStatus)
      };
    });

    console.log('StatusDistributionChart - processed statusData:', statusData);
    return statusData;
  };

  const statusData = getStatusData();

  // Use refs to track the last time range values to prevent infinite loops
  const lastTimeRangeRef = useRef<string>('');

  // Memoize the effective time range to prevent unnecessary re-renders
  const effectiveTimeRange = useMemo(() => {
    return localTimeRange.isApplied ? localTimeRange : globalTimeRange;
  }, [localTimeRange.isApplied, localTimeRange.type, localTimeRange.startDate, localTimeRange.endDate, localTimeRange.relativeRange, globalTimeRange.isApplied, globalTimeRange.type, globalTimeRange.startDate, globalTimeRange.endDate, globalTimeRange.relativeRange]);

  // Initial data fetch
  React.useEffect(() => {
    // Only fetch data if the component is visible
    if (!isVisible) {
      return;
    }

    if (!stats) {
      console.log('StatusDistributionChart: Initial data fetch');
      dispatch(fetchStatusDistribution(undefined));
    }
  }, [stats, dispatch, isVisible]);

  // Trigger API call when local time range changes
  React.useEffect(() => {
    // Only fetch data if the component is visible
    if (!isVisible) {
      return;
    }

    const timeRangeKey = `${effectiveTimeRange.type}-${effectiveTimeRange.startDate}-${effectiveTimeRange.endDate}-${effectiveTimeRange.relativeRange}-${effectiveTimeRange.isApplied}`;
    
    if (lastTimeRangeRef.current !== timeRangeKey) {
      if (localTimeRange.isApplied) {
        console.log('StatusDistributionChart: Dispatching fetchStatusDistribution due to local time range change:', localTimeRange);
        // Convert local time range to AnalyticsFilter format
        let filter: any = {};
        
        if (localTimeRange.type === 'absolute' && localTimeRange.startDate && localTimeRange.endDate) {
          filter.dateRange = {
            start: new Date(localTimeRange.startDate),
            end: new Date(localTimeRange.endDate)
          };
        } else if (localTimeRange.type === 'relative') {
          // For relative ranges, we'll need to calculate the actual dates
          const endDate = new Date();
          let startDate = new Date();
          
          switch (localTimeRange.relativeRange) {
            case '1d':
              startDate.setDate(endDate.getDate() - 1);
              break;
            case '7d':
              startDate.setDate(endDate.getDate() - 7);
              break;
            case '30d':
              startDate.setDate(endDate.getDate() - 30);
              break;
            case '90d':
              startDate.setDate(endDate.getDate() - 90);
              break;
            case '1y':
              startDate.setDate(endDate.getDate() - 365);
              break;
            case 'ytd':
              startDate = new Date(endDate.getFullYear(), 0, 1);
              break;
            case 'mtd':
              startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
              break;
            default:
              startDate.setDate(endDate.getDate() - 30);
          }
          
          filter.dateRange = { start: startDate, end: endDate };
        }
        
        dispatch(fetchStatusDistribution(filter));
      } else {
        // Use global time range
        dispatch(fetchStatusDistribution(undefined));
      }
      lastTimeRangeRef.current = timeRangeKey;
    }
  }, [effectiveTimeRange, dispatch, isVisible]);

  const getStatusColor = (status: string): string => {
    // High-contrast fixed palette to avoid similar colors
    switch (status) {
      case 'Pending': return '#F59E0B';       // amber-500
      case 'Under Review': return '#3B82F6';  // blue-500
      case 'Approved': return '#10B981';      // emerald-500
      case 'Rejected': return '#EF4444';      // red-500
      case 'Duplicate': return '#6B7280';     // gray-500
      case 'Resolved': return '#0EA5E9';      // sky-500
      default: return '#9CA3AF';              // gray-400
    }
  };

  const weeklyData = React.useMemo(() => {
    // The new status distribution API doesn't include weekly trend data
    // This is used for the stacked bar chart view
    return [];
  }, []);

  // Separate heights so the bar chart can be larger and pie matches Violation Type styling
  const pieChartHeight = Math.max(220, height - 120);
  const barChartHeight = Math.max(260, height - 110);
  const pieOuterRadius = Math.max(70, Math.floor(pieChartHeight / 2) - 14);
  const truncate = (text: string, max = 14) => (text?.length > max ? `${text.slice(0, max - 1)}…` : text);

  if (loading) {
    return (
      <Card sx={{ height }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="body2" color="text.secondary">Loading status distribution data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Removed unused computed summaries to keep component lean

  return (
    <Card sx={{ height }}>
      <CardHeader
        title={title}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <ToggleButtonGroup value={chartType} exclusive onChange={handleChartTypeChange} size="small">
              <ToggleButton value="pie" aria-label="pie chart"><PieChartIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="bar" aria-label="bar chart"><BarChartIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="stacked" aria-label="stacked bar chart"><BarChartIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
            
            {/* Time Range Button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<DateRange />}
              onClick={handleTimeRangeMenuOpen}
              sx={{ minWidth: 120, justifyContent: 'space-between' }}
            >
              {getTimeRangeDisplay()}
            </Button>

            {localTimeRange.isApplied && (
              <Tooltip title="Clear time range filter">
                <IconButton
                  size="small"
                  onClick={handleClearTimeRange}
                  sx={{ color: 'error.main' }}
                >
                  <Clear fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

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
        {/* Summary chips removed per request */}

        {chartType !== 'pie' && (
          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
            {statusData.map((item, index) => (
              <Chip key={index} icon={item.icon} label={`${item.status} (${item.percentage}%)`} size="small" sx={{ bgcolor: item.color, color: 'white', fontSize: '0.7rem' }} />
            ))}
          </Box>
        )}

        {statusData.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={height - 200}>
            <Typography variant="body2" color="text.secondary">No status data available</Typography>
          </Box>
        ) : chartType === 'pie' ? (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height={pieChartHeight}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={pieOuterRadius}
                    dataKey="count"
                    nameKey="status"
                  >
                    {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{
              width: { xs: '40%', sm: 200 },
              minWidth: 140,
              maxWidth: 220,
              maxHeight: pieChartHeight,
              overflowY: 'auto',
              pl: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.75
            }}>
              {statusData.map((item, idx) => (
                <Chip key={idx} size="small" label={`${item.status} (${item.percentage}%)`} sx={{ bgcolor: item.color, color: 'white', justifyContent: 'flex-start' }} />
              ))}
            </Box>
          </Box>
        ) : chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height={barChartHeight}>
            <BarChart data={statusData} margin={{ top: 24, right: 20, left: 12, bottom: 84 }} barCategoryGap="8%" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(theme)} />
              <XAxis dataKey="status" tickFormatter={(v) => truncate(v)} angle={-32} textAnchor="end" height={84} interval={0} tick={{ fontSize: 12, fill: getAxisTickColor(theme) }} />
              <YAxis domain={[0, 'dataMax + 2']} tick={{ fill: getAxisTickColor(theme) }} />
              <RechartsTooltip />
              <Bar dataKey="count" barSize={32}>
                {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={barChartHeight}>
            <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }} barCategoryGap="8%" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12 }} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="pending" stackId="a" fill={theme.palette.warning.main} name="Pending" />
              <Bar dataKey="approved" stackId="a" fill={theme.palette.success.main} name="Approved" />
              <Bar dataKey="rejected" stackId="a" fill={theme.palette.error.main} name="Rejected" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>

      {/* Time Range Popover */}
      <Popover
        open={Boolean(timeRangeAnchorEl)}
        anchorEl={timeRangeAnchorEl}
        onClose={handleTimeRangeMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: { width: 350, p: 2 }
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight="bold">Chart Time Range Filter</Typography>
          <Typography variant="body2" color="text.secondary">
            This filter will be applied to this chart only
          </Typography>

          {/* Time Range Type Selection */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>Filter Type</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant={localTimeRange.type === 'relative' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<Schedule />}
                onClick={() => handleTimeRangeTypeChange('relative')}
                fullWidth
              >
                Relative
              </Button>
              <Button
                variant={localTimeRange.type === 'absolute' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<CalendarToday />}
                onClick={() => handleTimeRangeTypeChange('absolute')}
                fullWidth
              >
                Absolute
              </Button>
            </Stack>
          </Box>

          <Divider />

          {/* Relative Time Range Options */}
          {localTimeRange.type === 'relative' && (
            <FormControl fullWidth size="small">
              <InputLabel>Select Range</InputLabel>
              <Select
                value={localTimeRange.relativeRange}
                label="Select Range"
                onChange={(e) => handleRelativeRangeChange(e.target.value)}
              >
                <MenuItem value="1d">Last 24 hours</MenuItem>
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
                <MenuItem value="1y">Last year</MenuItem>
                <MenuItem value="ytd">Year to date</MenuItem>
                <MenuItem value="mtd">Month to date</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Absolute Time Range Options */}
          {localTimeRange.type === 'absolute' && (
            <Stack spacing={2}>
              <TextField
                label="Start Date"
                type="date"
                value={localTimeRange.startDate}
                onChange={(e) => setLocalTimeRange(prev => ({ ...prev, startDate: e.target.value }))}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Date"
                type="date"
                value={localTimeRange.endDate}
                onChange={(e) => setLocalTimeRange(prev => ({ ...prev, endDate: e.target.value }))}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          )}

          {/* Apply Button */}
          <Button
            variant="contained"
            onClick={handleApplyTimeRange}
            fullWidth
            disabled={localTimeRange.type === 'absolute' ? (!localTimeRange.startDate || !localTimeRange.endDate) : !localTimeRange.relativeRange}
          >
            Apply Filter
          </Button>
        </Stack>
      </Popover>
    </Card>
  );
};

export default StatusDistributionChart;
