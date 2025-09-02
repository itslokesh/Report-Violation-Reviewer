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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  Download,
  MoreVert,
  PictureAsPdf,
  TableChart,
  DateRange,
  Schedule,
  CalendarToday,
  Clear
} from '@mui/icons-material';
import { useAppSelector } from '../../store';
import { selectOfficerPerformance, selectGlobalTimeRange } from '../../store/slices/dashboardSlice';
import { filterDataByGlobalTimeRange, filterDataByLocalTimeRange } from '../../shared/utils/date';
import { getGridColor, getAxisTickColor } from '../../theme/chart';

interface OfficerPerformanceChartProps {
  title?: string;
  height?: number;
  showExport?: boolean;
}

const OfficerPerformanceChart: React.FC<OfficerPerformanceChartProps> = ({ 
  title = "Officer Performance",
  height = 400,
  showExport = true
}) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [timeRangeAnchorEl, setTimeRangeAnchorEl] = useState<null | HTMLElement>(null);
  const { stats: officerStats, loading } = useAppSelector(selectOfficerPerformance);
  const globalTimeRange = useAppSelector(selectGlobalTimeRange);

  // Local time range state
  const [localTimeRange, setLocalTimeRange] = useState({
    type: 'relative' as 'absolute' | 'relative',
    startDate: '',
    endDate: '',
    relativeRange: '7d',
    isApplied: false
  });

  // Get officer performance data with global and local time range filters
  const getOfficerData = () => {
    if (officerStats && officerStats.length > 0) {
      let filteredData = officerStats;
      
      // Apply global time range filter if it's applied
      if (globalTimeRange.isApplied) {
        filteredData = filterDataByGlobalTimeRange(filteredData, globalTimeRange);
      }

      // Apply local time range filter if it's applied
      if (localTimeRange.isApplied) {
        filteredData = filterDataByLocalTimeRange(filteredData, localTimeRange);
      }

      return filteredData;
    }
    return [];
  };

  const officerData = getOfficerData();

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: 'bar' | 'line' | 'pie' | null,
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
    console.log(`Exporting officer performance data as ${format}`);
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
      isApplied: true
    });
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

  const chartData = officerData.map((officer: any) => ({
    name: officer.officerName || 'Officer',
    processed: officer.reportsProcessed || 0,
    approved: Math.round((officer.approvalRate || 0) * 100),
    accuracy: Math.round((officer.accuracyRate || 0) * 100),
    avgTime: Math.max(0, Math.round((officer.averageProcessingTime || 0) / 60)),
    challans: officer.challansIssued || 0
  }));

  const truncate = (text: string, max = 12) => (text?.length > max ? `${text.slice(0, max - 1)}…` : text);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1, p: 2, boxShadow: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold">{label}</Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" color="text.secondary">
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card sx={{ height }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="body2" color="text.secondary">Loading officer performance data...</Typography>
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
            <ToggleButtonGroup value={chartType} exclusive onChange={handleChartTypeChange} size="small">
              <ToggleButton value="bar" aria-label="bar chart"><BarChartIcon /></ToggleButton>
              <ToggleButton value="line" aria-label="line chart"><LineChartIcon /></ToggleButton>
              <ToggleButton value="pie" aria-label="pie chart"><PieChartIcon /></ToggleButton>
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

            {localTimeRange.isApplied && localTimeRange.relativeRange !== '30d' && (
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
        {chartData.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={height - 100}>
            <Typography variant="body2" color="text.secondary">No officer performance data available</Typography>
          </Box>
        ) : chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height={height - 120}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(theme)} />
              <XAxis dataKey="name" tickFormatter={(v) => truncate(v)} angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12, fill: getAxisTickColor(theme) }} />
              <YAxis tick={{ fill: getAxisTickColor(theme) }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="processed" fill={theme.palette.primary.main} name="Reports Processed" />
              <Bar dataKey="challans" fill={theme.palette.secondary.main} name="Challans Issued" />
            </BarChart>
          </ResponsiveContainer>
        ) : chartType === 'line' ? (
          <ResponsiveContainer width="100%" height={height - 120}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(theme)} />
              <XAxis dataKey="name" tickFormatter={(v) => truncate(v)} angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12, fill: getAxisTickColor(theme) }} />
              <YAxis tick={{ fill: getAxisTickColor(theme) }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="approved" stroke={theme.palette.success.main} name="Approval Rate (%)" strokeWidth={2} />
              <Line type="monotone" dataKey="accuracy" stroke={theme.palette.info.main} name="Accuracy Rate (%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={height - 120}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${truncate(name)}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="processed"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={theme.palette.primary.main} />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
            </PieChart>
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

export default OfficerPerformanceChart;
