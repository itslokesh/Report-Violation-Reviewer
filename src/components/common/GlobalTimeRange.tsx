import React, { useState } from 'react';
import {
  Button,
  Popover,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  DateRange,
  Schedule,
  CalendarToday,
  Clear
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  selectGlobalTimeRange, 
  setGlobalTimeRange, 
  clearGlobalTimeRange,
  fetchDashboardStats,
  fetchViolationTypeStats,
  fetchGeographicStats,
  fetchOfficerPerformance
} from '../../store/slices/dashboardSlice';

const GlobalTimeRange: React.FC = () => {
  const dispatch = useAppDispatch();
  const globalTimeRange = useAppSelector(selectGlobalTimeRange);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [timeRangeType, setTimeRangeType] = useState<'absolute' | 'relative'>(globalTimeRange.type);
  const [startDate, setStartDate] = useState<string>(globalTimeRange.startDate);
  const [endDate, setEndDate] = useState<string>(globalTimeRange.endDate);
  const [relativeRange, setRelativeRange] = useState<string>(globalTimeRange.relativeRange);

  const handleTimeRangeMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleTimeRangeMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTimeRangeTypeChange = (type: 'absolute' | 'relative') => {
    setTimeRangeType(type);
  };

  const handleRelativeRangeChange = (range: string) => {
    setRelativeRange(range);
  };

  const handleApplyTimeRange = () => {
    dispatch(setGlobalTimeRange({
      type: timeRangeType,
      startDate,
      endDate,
      relativeRange,
      isApplied: true
    }));
    
    // Only refetch dashboard stats - other components will handle their own data fetching
    // when they detect the global time range change
    dispatch(fetchDashboardStats(undefined));
    
    handleTimeRangeMenuClose();
  };

  const handleClearTimeRange = () => {
    dispatch(clearGlobalTimeRange());
    setStartDate('');
    setEndDate('');
    setRelativeRange('30d');
    setTimeRangeType('relative');
    
    // Only refetch dashboard stats - other components will handle their own data fetching
    // when they detect the global time range change
    dispatch(fetchDashboardStats(undefined));
  };

  const getTimeRangeDisplay = () => {
    if (!globalTimeRange.isApplied) {
      return 'Last 30 days';
    }

    if (globalTimeRange.type === 'absolute') {
      return globalTimeRange.startDate && globalTimeRange.endDate 
        ? `${globalTimeRange.startDate} to ${globalTimeRange.endDate}` 
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
      return rangeMap[globalTimeRange.relativeRange] || 'Select range';
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<DateRange />}
        onClick={handleTimeRangeMenuOpen}
        sx={{ minWidth: 140, justifyContent: 'space-between' }}
      >
        {getTimeRangeDisplay()}
      </Button>
      
      {globalTimeRange.isApplied && globalTimeRange.relativeRange !== '30d' && (
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

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
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
          sx: { width: 400, p: 2 }
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight="bold">Global Time Range Filter</Typography>
          <Typography variant="body2" color="text.secondary">
            This filter will be applied to all dashboard sections
          </Typography>
          
          {/* Time Range Type Selection */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>Filter Type</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant={timeRangeType === 'relative' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<Schedule />}
                onClick={() => handleTimeRangeTypeChange('relative')}
                fullWidth
              >
                Relative
              </Button>
              <Button
                variant={timeRangeType === 'absolute' ? 'contained' : 'outlined'}
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
          {timeRangeType === 'relative' && (
            <FormControl fullWidth size="small">
              <InputLabel>Select Range</InputLabel>
              <Select
                value={relativeRange}
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
          {timeRangeType === 'absolute' && (
            <Stack spacing={2}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
            disabled={timeRangeType === 'absolute' ? (!startDate || !endDate) : !relativeRange}
          >
            Apply Global Filter
          </Button>
        </Stack>
      </Popover>
    </Box>
  );
};

export default GlobalTimeRange;
