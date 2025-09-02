import React, { useState, useMemo, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Box, 
  ToggleButton, 
  ToggleButtonGroup,
  useTheme,
  Button,
  Popover,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Divider,
  Tooltip,
  IconButton,
  MenuItem
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
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  ShowChart as AreaChartIcon,
  CalendarToday,
  ViewWeek,
  CalendarMonth,
  DateRange,
  Schedule,
  Clear
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store';
import { 
  selectWeeklyTrend, 
  selectGlobalTimeRange, 
  selectLocalTimeRange,
  fetchWeeklyTrend,
  setLocalTimeRange,
  clearLocalTimeRange
} from '../../store/slices/dashboardSlice';

import { getGridColor, getAxisTickColor } from '../../theme/chart';

interface TrendChartProps {
  title?: string;
  height?: number;
  defaultPeriod?: 'daily' | 'weekly' | 'monthly';
}

const TrendChart: React.FC<TrendChartProps> = ({ 
  title = "Violation Trends",
  height = 400,
  defaultPeriod = 'weekly'
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>(defaultPeriod);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [timeRangeAnchorEl, setTimeRangeAnchorEl] = useState<null | HTMLElement>(null);
  const { trend: weeklyTrend, loading } = useAppSelector(selectWeeklyTrend);
  const globalTimeRange = useAppSelector(selectGlobalTimeRange);
  const localTimeRange = useAppSelector(selectLocalTimeRange);

  // Fetch weekly trend data on component mount and when time ranges change
  useEffect(() => {
    const effectiveTimeRange = localTimeRange.isApplied ? localTimeRange : globalTimeRange;
    dispatch(fetchWeeklyTrend(effectiveTimeRange));
  }, [dispatch, globalTimeRange, localTimeRange]);

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
    newChartType: 'bar' | 'line' | 'area' | null,
  ) => {
    void event;
    if (newChartType !== null) {
      setChartType(newChartType);
    }
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
    console.log('Applying time range:', localTimeRange);
    dispatch(setLocalTimeRange({ ...localTimeRange, isApplied: true }));
    // Refetch data with the new time range filter
    dispatch(fetchWeeklyTrend(localTimeRange));
    handleTimeRangeMenuClose();
  };

  const handleClearTimeRange = () => {
    dispatch(clearLocalTimeRange());
    // Refetch data without time range filter
    dispatch(fetchWeeklyTrend(globalTimeRange));
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

  // Helper function to aggregate daily data into weeks
  const aggregateDataByWeek = (dailyData: any[]): any[] => {
    if (!dailyData || dailyData.length === 0) return [];

    console.log('aggregateDataByWeek - Input data:', dailyData);

    const weeklyMap = new Map<string, any>();

    dailyData.forEach((item: any) => {
      // Try different possible date fields
      let dateStr = item.date || item.period || item.week || item.month;
      
      if (!dateStr) {
        console.warn('No date field found in item:', item);
        return;
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateStr, 'in item:', item);
        return;
      }

      // Get the start of the week (Monday)
      const dayOfWeek = date.getDay();
      const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
      const startOfWeek = new Date(date);
      startOfWeek.setDate(startOfWeek.getDate() + diff);
      startOfWeek.setHours(0, 0, 0, 0);

      // Get the end of the week (Sunday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const weekKey = startOfWeek.toISOString().split('T')[0];
      
      // Format: "Jan 1-7, 2025" or "Jan 1-7" if same year
      const currentYear = new Date().getFullYear();
      const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      let weekLabel;
      if (startOfWeek.getFullYear() === currentYear) {
        if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
          weekLabel = `${startMonth}-${endOfWeek.getDate()}`;
        } else {
          weekLabel = `${startMonth}-${endMonth}`;
        }
      } else {
        if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
          weekLabel = `${startMonth}-${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
        } else {
          weekLabel = `${startMonth}-${endMonth}, ${startOfWeek.getFullYear()}`;
        }
      }

      console.log(`Aggregating ${dateStr} into week: ${weekLabel} (${startOfWeek.toDateString()} to ${endOfWeek.toDateString()})`);

      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          period: weekLabel,
          startDate: startOfWeek,
          endDate: endOfWeek,
          reports: 0,
          approved: 0,
          rejected: 0,
          pending: 0
        });
      }

      const weekData = weeklyMap.get(weekKey);
      weekData.reports += item.reports || 0;
      weekData.approved += item.approved || 0;
      weekData.rejected += item.rejected || 0;
      weekData.pending += item.pending || 0;
    });

    // Convert map to array and sort by date
    const result = Array.from(weeklyMap.values()).sort((a, b) => {
      return a.startDate.getTime() - b.startDate.getTime();
    });

    console.log('aggregateDataByWeek - Result:', result);
    return result;
  };

  // Helper function to aggregate daily data into months
  const aggregateDataByMonth = (dailyData: any[]): any[] => {
    if (!dailyData || dailyData.length === 0) return [];

    console.log('aggregateDataByMonth - Input data:', dailyData);

    const monthlyMap = new Map<string, any>();

    dailyData.forEach((item: any) => {
      // Try different possible date fields
      let dateStr = item.date || item.period || item.week || item.month;
      
      if (!dateStr) {
        console.warn('No date field found in item:', item);
        return;
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateStr, 'in item:', item);
        return;
      }

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Format: "Jan 2025" or "Jan" if current year
      const currentYear = new Date().getFullYear();
      const monthLabel = date.getFullYear() === currentYear 
        ? date.toLocaleDateString('en-US', { month: 'short' })
        : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

      console.log(`Aggregating ${dateStr} into month: ${monthLabel}`);

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          period: monthLabel,
          year: date.getFullYear(),
          month: date.getMonth(),
          reports: 0,
          approved: 0,
          rejected: 0,
          pending: 0
        });
      }

      const monthData = monthlyMap.get(monthKey);
      monthData.reports += item.reports || 0;
      monthData.approved += item.approved || 0;
      monthData.rejected += item.rejected || 0;
      monthData.pending += item.pending || 0;
    });

    // Convert map to array and sort by date
    const result = Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    console.log('aggregateDataByMonth - Result:', result);
    return result;
  };

  const getTrendData = useMemo(() => {
    if (!weeklyTrend) return [];

    console.log('getTrendData - Current period:', period);
    console.log('getTrendData - Weekly trend data:', weeklyTrend);

    let trendData: any[] = [];

    if (period === 'weekly') {
      // For weekly view, we need to aggregate daily data into weeks
      console.log('getTrendData - Aggregating into weeks...');
      trendData = aggregateDataByWeek(weeklyTrend);
    } else if (period === 'monthly') {
      // For monthly view, aggregate into months
      console.log('getTrendData - Aggregating into months...');
      trendData = aggregateDataByMonth(weeklyTrend);
    } else {
      // For daily view, format the dates properly
      console.log('getTrendData - Using daily data as-is...');
      trendData = weeklyTrend.map((item: any) => {
        const dateStr = item.date || item.period || item.week || item.month;
        if (dateStr) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return {
              ...item,
              period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            };
          }
        }
        return item;
      });
    }

    console.log('getTrendData - Final trend data:', JSON.stringify(trendData, null, 2));
    console.log('getTrendData - Global time range:', globalTimeRange);
    console.log('getTrendData - Local time range:', localTimeRange);

    return trendData.map((item: any) => {
      const reports = item.reports || 0;
      const approved = item.approved || 0;
      const rejected = item.rejected || 0;
      const pending = item.pending || 0;
      
      // Calculate "Reports to be reviewed" as Total Reports - (Approved + Rejected)
      const toBeReviewed = Math.max(0, reports - (approved + rejected));
      
      return {
        period: item.period || item.date || item.week || item.month || 'Period',
        reports,
        approved,
        rejected,
        pending,
        toBeReviewed
      };
    });
  }, [weeklyTrend, period, globalTimeRange, localTimeRange]);

  const truncate = (text: string, max = 10) => (text?.length > max ? `${text.slice(0, max - 1)}…` : text);

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
              <ToggleButton value="bar" aria-label="bar chart"><BarChartIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="line" aria-label="line chart"><LineChartIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="area" aria-label="area chart"><AreaChartIcon fontSize="small" /></ToggleButton>
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
          </Box>
        }
      />
      <CardContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={height - 100}>
            <Typography variant="body2" color="text.secondary">Loading trend data...</Typography>
          </Box>
        ) : getTrendData.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={height - 100}>
            <Typography variant="body2" color="text.secondary">No trend data available</Typography>
          </Box>
        ) : chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height={height - 120}>
            <BarChart data={getTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(theme)} />
              <XAxis dataKey="period" tickFormatter={(v) => truncate(v)} angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12, fill: getAxisTickColor(theme) }} />
              <YAxis tick={{ fill: getAxisTickColor(theme) }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="reports" fill={theme.palette.primary.main} name="Total Reports Submitted" />
              <Bar dataKey="approved" fill={theme.palette.success.main} name="Approved" />
              <Bar dataKey="rejected" fill={theme.palette.error.main} name="Rejected" />
              <Bar dataKey="toBeReviewed" fill={theme.palette.warning.main} name="Reports to be Reviewed" />
            </BarChart>
          </ResponsiveContainer>
        ) : chartType === 'line' ? (
          <ResponsiveContainer width="100%" height={height - 120}>
            <LineChart data={getTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(theme)} />
              <XAxis dataKey="period" tickFormatter={(v) => truncate(v)} angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12, fill: getAxisTickColor(theme) }} />
              <YAxis tick={{ fill: getAxisTickColor(theme) }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="reports" stroke={theme.palette.primary.main} name="Total Reports Submitted" strokeWidth={2} />
              <Line type="monotone" dataKey="approved" stroke={theme.palette.success.main} name="Approved" strokeWidth={2} />
              <Line type="monotone" dataKey="rejected" stroke={theme.palette.error.main} name="Rejected" strokeWidth={2} />
              <Line type="monotone" dataKey="toBeReviewed" stroke={theme.palette.warning.main} name="Reports to be Reviewed" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={height - 120}>
            <AreaChart data={getTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(theme)} />
              <XAxis dataKey="period" tickFormatter={(v) => truncate(v)} angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12, fill: getAxisTickColor(theme) }} />
              <YAxis tick={{ fill: getAxisTickColor(theme) }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="reports" stackId="1" stroke={theme.palette.primary.main} fill={theme.palette.primary.main} name="Total Reports Submitted" />
              <Area type="monotone" dataKey="approved" stackId="1" stroke={theme.palette.success.main} fill={theme.palette.success.main} name="Approved" />
              <Area type="monotone" dataKey="rejected" stackId="1" stroke={theme.palette.error.main} fill={theme.palette.error.main} name="Rejected" />
              <Area type="monotone" dataKey="toBeReviewed" stackId="1" stroke={theme.palette.warning.main} fill={theme.palette.warning.main} name="Reports to be Reviewed" />
            </AreaChart>
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

export default TrendChart;
