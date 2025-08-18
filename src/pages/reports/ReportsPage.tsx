import React, { useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, CircularProgress, Alert, Button, TableSortLabel, Stack, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  fetchReports, 
  selectReports,
  selectReportsPagination,
  selectReportsLoading,
  selectReportsError,
  selectReportsFilters,
  setPage,
  setLimit,
  setSort,
  setFilters,
  clearFilters
} from '../../store/slices/reportsSlice';
import { useNavigate } from 'react-router-dom';
import { formatViolationType } from '../../shared/utils/formatting';
import { ReportStatus } from '../../shared/models/common';

const ReportsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const reports = useAppSelector(selectReports);
  const pagination = useAppSelector(selectReportsPagination);
  const isLoading = useAppSelector(selectReportsLoading);
  const error = useAppSelector(selectReportsError);
  const filters = useAppSelector(selectReportsFilters);

  const DESELECT_ALL = '__DESELECT_ALL__';

  const VIOLATION_TYPE_OPTIONS: string[] = [
    'WRONG_SIDE_DRIVING',
    'NO_PARKING_ZONE',
    'SIGNAL_JUMPING',
    'SPEED_VIOLATION',
    'HELMET_SEATBELT_VIOLATION',
    'MOBILE_PHONE_USAGE',
    'LANE_CUTTING',
    'DRUNK_DRIVING_SUSPECTED',
    'OTHERS',
  ];

  const STATUS_OPTIONS: ReportStatus[] = [
    ReportStatus.PENDING,
    ReportStatus.UNDER_REVIEW,
    ReportStatus.APPROVED,
    ReportStatus.REJECTED,
    ReportStatus.DUPLICATE,
  ];

  useEffect(() => {
    dispatch(fetchReports({ 
      page: pagination.page, 
      limit: pagination.limit,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
      ...(filters ?? {}),
      ...(filters?.violationType && (filters.violationType as any).length > 1 ? { violationTypeMode: 'any' as const } : {}),
    }));
  }, [dispatch, pagination.page, pagination.limit, pagination.sortBy, pagination.sortOrder, filters]);

  const handleChangePage = (_: unknown, newPage: number) => {
    dispatch(setPage(newPage + 1)); // TablePagination is 0-based; API is 1-based
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setLimit(parseInt(event.target.value, 10)));
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4" gutterBottom>
          Violation Reports
        </Typography>
        <Button variant="outlined" onClick={() => dispatch(fetchReports({ page: pagination.page, limit: pagination.limit, sortBy: pagination.sortBy, sortOrder: pagination.sortOrder, ...(filters ?? {}), ...(filters?.violationType && (filters.violationType as any).length > 1 ? { violationTypeMode: 'any' as const } : {}) }))}>
          Refresh
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="violation-types-label">Violation Types</InputLabel>
            <Select
              labelId="violation-types-label"
              multiple
              value={(filters?.violationType as any) ?? []}
              onChange={(e) => {
                const raw = e.target.value as string[];
                const value = raw.includes(DESELECT_ALL) ? [] : raw;
                dispatch(setFilters({ ...(filters ?? {}), violationType: value } as any));
                dispatch(setPage(1));
              }}
              renderValue={(selected) => (selected as string[]).map(v => formatViolationType(v)).join(', ')}
              label="Violation Types"
            >
              <MenuItem value={DESELECT_ALL} dense>
                <ListItemText primary="Deselect all" />
              </MenuItem>
              {VIOLATION_TYPE_OPTIONS.map((vt) => (
                <MenuItem key={vt} value={vt}>
                  <Checkbox checked={((filters?.violationType as any) ?? []).includes(vt)} />
                  <ListItemText primary={formatViolationType(vt)} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              multiple
              value={(filters?.status as any) ?? []}
              onChange={(e) => {
                const raw = e.target.value as (ReportStatus[] | string[]);
                const value = (raw as string[]).includes(DESELECT_ALL) ? [] : (raw as ReportStatus[]);
                dispatch(setFilters({ ...(filters ?? {}), status: value } as any));
                dispatch(setPage(1));
              }}
              renderValue={(selected) => (selected as string[]).join(', ')}
              label="Status"
            >
              <MenuItem value={DESELECT_ALL} dense>
                <ListItemText primary="Deselect all" />
              </MenuItem>
              {STATUS_OPTIONS.map((st) => (
                <MenuItem key={st} value={st}>
                  <Checkbox checked={((filters?.status as any) ?? []).includes(st)} />
                  <ListItemText primary={st} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="text" onClick={() => dispatch(clearFilters())}>Clear Filters</Button>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Report ID</TableCell>
                <TableCell sortDirection={pagination.sortBy === 'violationType' ? (pagination.sortOrder === 'asc' ? 'asc' : 'desc') : false}>
                  <TableSortLabel
                    active={pagination.sortBy === 'violationType'}
                    direction={pagination.sortBy === 'violationType' ? (pagination.sortOrder === 'asc' ? 'asc' : 'desc') : 'asc'}
                    onClick={() => dispatch(setSort({ sortBy: 'violationType', sortOrder: pagination.sortBy === 'violationType' && pagination.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                  >
                    Violation Type
                  </TableSortLabel>
                </TableCell>
                <TableCell>Vehicle Number</TableCell>
                <TableCell sortDirection={pagination.sortBy === 'status' ? (pagination.sortOrder === 'asc' ? 'asc' : 'desc') : false}>
                  <TableSortLabel
                    active={pagination.sortBy === 'status'}
                    direction={pagination.sortBy === 'status' ? (pagination.sortOrder === 'asc' ? 'asc' : 'desc') : 'asc'}
                    onClick={() => dispatch(setSort({ sortBy: 'status', sortOrder: pagination.sortBy === 'status' && pagination.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={pagination.sortBy === 'timestamp' ? (pagination.sortOrder === 'asc' ? 'asc' : 'desc') : false}>
                  <TableSortLabel
                    active={pagination.sortBy === 'timestamp'}
                    direction={pagination.sortBy === 'timestamp' ? (pagination.sortOrder === 'asc' ? 'asc' : 'desc') : 'desc'}
                    onClick={() => dispatch(setSort({ sortBy: 'timestamp', sortOrder: pagination.sortBy === 'timestamp' && pagination.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No reports found
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id} hover onClick={() => navigate(`/reports/${report.id}`)} style={{ cursor: 'pointer' }}>
                    <TableCell>#{report.id}</TableCell>
                    <TableCell>{formatViolationType((report as any).violationType)}</TableCell>
                    <TableCell>{report.vehicleNumber || '-'}</TableCell>
                    <TableCell>{String(report.status)}</TableCell>
                    <TableCell>{new Date(report.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          onPageChange={handleChangePage}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Paper>
    </Box>
  );
};

export default ReportsPage;
