import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  Chip,
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
  PieChart, 
  BarChart, 
  Pie, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  PieChart as PieChartIcon, 
  BarChart as BarChartIcon,
  Download,
  MoreVert,
  PictureAsPdf,
  TableChart,
  DateRange,
  Schedule,
  CalendarToday,
  Clear
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store';
import { selectViolationTypeStats, selectGlobalTimeRange, selectLocalTimeRange, fetchViolationTypeStats, setLocalTimeRange, clearLocalTimeRange } from '../../store/slices/dashboardSlice';
import { filterDataByGlobalTimeRange, filterDataByLocalTimeRange } from '../../shared/utils/date';
import { ViolationReport } from '../../shared/models/violation';
import { ViolationType } from '../../shared/models/common';
import { getSeriesColorByIndex, getGridColor, getAxisTickColor } from '../../theme/chart';

interface ViolationTypeChartProps {
  title?: string;
  height?: number;
  showExport?: boolean;
  isVisible?: boolean;
}

const ViolationTypeChart: React.FC<ViolationTypeChartProps> = ({ 
  title = "Violation Type Distribution",
  height = 400,
  showExport = true,
  isVisible = true
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [timeRangeAnchorEl, setTimeRangeAnchorEl] = useState<null | HTMLElement>(null);
  const { stats: vioStats, loading } = useAppSelector(selectViolationTypeStats);
  const globalTimeRange = useAppSelector(selectGlobalTimeRange);
  const localTimeRange = useAppSelector(selectLocalTimeRange);

  // Use refs to track the last time range values to prevent infinite loops
  const lastTimeRangeRef = useRef<string>('');

  // Memoize the effective time range to prevent unnecessary re-renders
  const effectiveTimeRange = useMemo(() => {
    return localTimeRange.isApplied ? localTimeRange : globalTimeRange;
  }, [localTimeRange.isApplied, localTimeRange.type, localTimeRange.startDate, localTimeRange.endDate, localTimeRange.relativeRange, globalTimeRange.isApplied, globalTimeRange.type, globalTimeRange.startDate, globalTimeRange.endDate, globalTimeRange.relativeRange]);

  // Fetch violation type stats on component mount and when time ranges change
  useEffect(() => {
    // Only fetch data if the component is visible
    if (!isVisible) {
      return;
    }

    const timeRangeKey = `${effectiveTimeRange.type}-${effectiveTimeRange.startDate}-${effectiveTimeRange.endDate}-${effectiveTimeRange.relativeRange}-${effectiveTimeRange.isApplied}`;
    
    if (lastTimeRangeRef.current !== timeRangeKey) {
      console.log('ViolationTypeChart: Dispatching fetchViolationTypeStats with time range:', effectiveTimeRange);
      dispatch(fetchViolationTypeStats(effectiveTimeRange));
      lastTimeRangeRef.current = timeRangeKey;
    }
  }, [effectiveTimeRange, dispatch, isVisible]);

  const COLORS = Array.from({ length: 12 }, (_, i) => getSeriesColorByIndex(theme, i));

  // Get violation type data with global time range filter
  const getViolationTypeData = () => {
    console.log('ViolationTypeChart - vioStats:', vioStats);
    
    if (vioStats && vioStats.length > 0) {
      // For violation type stats, we don't apply time filtering as the data is already aggregated
      console.log('ViolationTypeChart - returning vioStats:', vioStats);
      return vioStats;
    }

    console.log('ViolationTypeChart - no stats available, returning empty array');
    return [];
  };

  const violationTypeData = getViolationTypeData();
  
  console.log('ViolationTypeChart - violationTypeData:', violationTypeData);
  if (violationTypeData.length > 0) {
    console.log('Sample violation type item:', violationTypeData[0]);
    console.log('All violation type items:', violationTypeData.map(item => ({ type: item.type, count: item.count, percentage: item.percentage })));
  }

  const getViolationTypeColor = (type: ViolationType, fallbackIndex: number): string => {
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
    return colorMap[type] || COLORS[fallbackIndex % COLORS.length];
  };

  const generateDistinctColors = (count: number): string[] => {
    if (count <= COLORS.length) {
      // Use theme-derived palette first if it covers the needed count
      return Array.from({ length: count }, (_, i) => COLORS[i % COLORS.length]);
    }
    // Otherwise generate evenly-spaced HSL colors to guarantee uniqueness
    return Array.from({ length: count }, (_, i) => {
      const hue = Math.round((360 / Math.max(1, count)) * i);
      return `hsl(${hue}, 70%, 50%)`;
    });
  };

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
    console.log(`Exporting as ${format}`);
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
    dispatch(setLocalTimeRange({ ...localTimeRange, type }));
  };

  const handleRelativeRangeChange = (range: string) => {
    dispatch(setLocalTimeRange({ ...localTimeRange, relativeRange: range }));
  };

  const handleApplyTimeRange = () => {
    dispatch(setLocalTimeRange({ ...localTimeRange, isApplied: true }));
    // Refetch data with the new time range filter
    dispatch(fetchViolationTypeStats(localTimeRange));
    handleTimeRangeMenuClose();
  };

  const handleClearTimeRange = () => {
    dispatch(clearLocalTimeRange());
    // Refetch data without time range filter
    dispatch(fetchViolationTypeStats(globalTimeRange));
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

  const getViolationTypeFromDisplayName = (displayName: string): ViolationType => {
    switch (displayName) {
      case 'Wrong Side Driving': return ViolationType.WRONG_SIDE_DRIVING;
      case 'No Parking Zone': return ViolationType.NO_PARKING_ZONE;
      case 'Signal Jumping': return ViolationType.SIGNAL_JUMPING;
      case 'Speed Violation': return ViolationType.SPEED_VIOLATION;
      case 'Helmet/Seatbelt Violation': return ViolationType.HELMET_SEATBELT_VIOLATION;
      case 'Mobile Phone Usage': return ViolationType.MOBILE_PHONE_USAGE;
      case 'Lane Cutting': return ViolationType.LANE_CUTTING;
      case 'Drunk Driving (Suspected)': return ViolationType.DRUNK_DRIVING_SUSPECTED;
      case 'Others': return ViolationType.OTHERS;
      default: return ViolationType.OTHERS;
    }
  };

  const normalizeToEnum = (value: string | null | undefined): ViolationType | null => {
    if (!value) return null;
    const key = value.toString().trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z_]/g, '');
    const candidates = Object.keys(ViolationType) as Array<keyof typeof ViolationType>;
    const direct = candidates.find(k => k === (key as any));
    if (direct) return ViolationType[direct];
    for (const c of candidates) { if (key.includes(c)) return ViolationType[c]; }
    if (key.includes('RED') || key.includes('SIGNAL')) return ViolationType.SIGNAL_JUMPING;
    if (key.includes('SPEED')) return ViolationType.SPEED_VIOLATION;
    if (key.includes('HELMET') || key.includes('SEATBELT')) return ViolationType.HELMET_SEATBELT_VIOLATION;
    if (key.includes('PARK')) return ViolationType.NO_PARKING_ZONE;
    if (key.includes('LANE')) return ViolationType.LANE_CUTTING;
    if (key.includes('DRUNK')) return ViolationType.DRUNK_DRIVING_SUSPECTED;
    if (key.includes('MOBILE') || key.includes('PHONE')) return ViolationType.MOBILE_PHONE_USAGE;
    if (key.includes('WRONG') || key.includes('OPPOSITE')) return ViolationType.WRONG_SIDE_DRIVING;
    return ViolationType.OTHERS;
  };

  const extractViolationsFromMetadata = (mediaMetadata?: string): ViolationType[] => {
    if (!mediaMetadata) return [];
    try {
      const data = JSON.parse(mediaMetadata);
      const paths: Array<string[]> = [['detectedViolations'], ['violations'], ['predictions']];
      for (const p of paths) {
        let node: any = data;
        for (const key of p) node = node?.[key];
        if (Array.isArray(node) && node.length) {
          const normalized = node
            .map((v: any) => (typeof v === 'string' ? v : v?.code || v?.label || ''))
            .map((s: string) => normalizeToEnum(s))
            .filter(Boolean) as ViolationType[];
          if (normalized.length) return normalized;
        }
      }
      if (typeof data === 'string') {
        const parts = data.split(/[,|]/).map(s => s.trim());
        const normalized = parts.map(normalizeToEnum).filter(Boolean) as ViolationType[];
        if (normalized.length) return normalized;
      }
    } catch (_) {
      const parts = mediaMetadata.split(/[,|]/).map(s => s.trim());
      const normalized = parts.map(normalizeToEnum).filter(Boolean) as ViolationType[];
      if (normalized.length) return normalized;
    }
    return [];
  };

  const fromReports = useMemo(() => {
    console.log('fromReports - violationTypeData:', violationTypeData);
    
    // Since the data is already coming with proper display names, we should use fromStats instead
    // This function is meant for processing raw violation reports, but we're getting pre-processed stats
    console.log('fromReports: Data is already processed, using fromStats logic instead');
    return [];
  }, [violationTypeData]);

     const fromStats = useMemo(() => {
     console.log('fromStats - violationTypeData:', violationTypeData);
     
     if (!violationTypeData || violationTypeData.length === 0) {
       console.log('fromStats: No violation type data available');
       return [];
     }
     
     // Calculate total count for percentage calculation
     const totalCount = violationTypeData.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
     console.log('fromStats - Total count:', totalCount);
     
     const rows = violationTypeData.map((s: any, i: number) => {
       // Use displayName for the chart label
       const name = s.displayName || 'Unknown';
       const value = s.count || 0;
       
       // Calculate percentage if not provided or if it's 0
       let percentage = s.percentage || 0;
       if (percentage === 0 && totalCount > 0 && value > 0) {
         percentage = (value / totalCount) * 100;
       }
       
       // Use the enum type for color mapping
       const type = s.type;
       const color = getViolationTypeColor(type, i);
       
       console.log(`fromStats row ${i}: displayName=${s.displayName}, type=${s.type}, name=${name}, value=${value}, percentage=${percentage}, totalCount=${totalCount}`);
       
       return {
         name,
         value,
         percentage,
         type,
         color,
       };
     });
     
     console.log('fromStats final rows:', rows);
     return rows;
   }, [violationTypeData]);

  const chartData = fromReports.length > 0 ? fromReports : fromStats;
  console.log('chartData selected:', chartData === fromReports ? 'fromReports' : 'fromStats');
  console.log('chartData:', chartData);
  const uniqueColors = useMemo(() => generateDistinctColors(chartData.length), [chartData.length]);
  const coloredData = useMemo(() => chartData.map((d, i) => ({ ...d, color: uniqueColors[i] })), [chartData, uniqueColors]);

  const LEGEND_ESTIMATE = 56;
  // Separate heights so bar can be tall while pie stays compact. Make pie larger.
  const pieChartHeight = Math.max(220, height - 100 - LEGEND_ESTIMATE);
  const barChartHeight = Math.max(260, height - 90);
  const pieOuterRadius = Math.max(70, Math.floor(pieChartHeight / 2) - 14);
  const truncate = (text: string, max = 16) => (text?.length > max ? `${text.slice(0, max - 1)}…` : text);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1, p: 2, boxShadow: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold">{data.name}</Typography>
          <Typography variant="body2" color="text.secondary">Count: {data.value}</Typography>
          <Typography variant="body2" color="text.secondary">Percentage: {Number(data.percentage ?? 0).toFixed(1)}%</Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Card elevation={0} sx={{ height, border: '1px solid', borderColor: 'divider' }}>
      <CardHeader
        title={title}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <ToggleButtonGroup value={chartType} exclusive onChange={handleChartTypeChange} size="small">
              <ToggleButton value="pie" aria-label="pie chart"><PieChartIcon /></ToggleButton>
              <ToggleButton value="bar" aria-label="bar chart"><BarChartIcon /></ToggleButton>
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
         {loading ? (
           <Box display="flex" justifyContent="center" alignItems="center" height={height - 100}>
             <Typography variant="body2" color="text.secondary">Loading violation type data...</Typography>
           </Box>
         ) : coloredData.length === 0 ? (
           <Box display="flex" justifyContent="center" alignItems="center" height={height - 100}>
             <Typography variant="body2" color="text.secondary">No violation type data available</Typography>
           </Box>
         ) : chartType === 'pie' ? (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height={pieChartHeight}>
                <PieChart>
                  <Pie
                    data={coloredData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={pieOuterRadius}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {coloredData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
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
              {coloredData.map((entry, idx) => (
                <Chip
                  key={idx}
                  size="small"
                  label={`${truncate(entry.name, 22)} (${(entry.percentage ?? 0).toFixed(1)}%)`}
                  sx={{ bgcolor: entry.color, color: 'white', justifyContent: 'flex-start' }}
                />
              ))}
            </Box>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={barChartHeight}>
            <BarChart data={coloredData} margin={{ top: 28, right: 20, left: 12, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(theme)} />
              <XAxis dataKey="name" tickFormatter={(v) => truncate(v)} angle={-30} textAnchor="end" height={72} interval={0} tick={{ fontSize: 12, fill: getAxisTickColor(theme) }} />
              <YAxis domain={[0, 'auto']} tick={{ fill: getAxisTickColor(theme) }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={theme.palette.primary.main} barSize={32}>
                {coloredData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
              </Bar>
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
                 onChange={(e) => dispatch(setLocalTimeRange({ ...localTimeRange, startDate: e.target.value }))}
                 size="small"
                 fullWidth
                 InputLabelProps={{ shrink: true }}
               />
               <TextField
                 label="End Date"
                 type="date"
                 value={localTimeRange.endDate}
                 onChange={(e) => dispatch(setLocalTimeRange({ ...localTimeRange, endDate: e.target.value }))}
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

export default ViolationTypeChart;
