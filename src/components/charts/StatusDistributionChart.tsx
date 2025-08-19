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
  Assignment
} from '@mui/icons-material';
import { useAppSelector } from '../../store';
import { selectDashboardStats } from '../../store/slices/dashboardSlice';
import { getGridColor, getAxisTickColor } from '../../theme/chart';

interface StatusDistributionChartProps {
  title?: string;
  height?: number;
  showExport?: boolean;
}

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ 
  title = "Report Status Distribution",
  height = 380,
  showExport = true
}) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'stacked'>('pie');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { stats, loading } = useAppSelector(selectDashboardStats);

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: 'pie' | 'bar' | 'stacked' | null,
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

  const normalizeStatus = (raw: string): string => {
    if (!raw) return 'Pending';
    const key = raw.toString().trim().toUpperCase().replace(/\s+/g, '_');
    if (key.includes('PENDING')) return 'Pending';
    if (key.includes('UNDER') && key.includes('REVIEW')) return 'Under Review';
    if (key.includes('IN_REVIEW')) return 'Under Review';
    if (key.includes('APPROVED') || key.includes('APPROVE')) return 'Approved';
    if (key.includes('REJECTED') || key.includes('REJECT')) return 'Rejected';
    if (key.includes('DUPLICATE') || key.includes('DUP')) return 'Duplicate';
    if (key.includes('RESOLVED') || key.includes('CLOSED') || key.includes('COMPLETED')) return 'Resolved';
    // Fallback: title-case the raw
    return raw
      .toLowerCase()
      .split(/[_\s]+/)
      .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ');
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

  const statusData = React.useMemo(() => {
    type Row = { status: string; count: number; percentage: number; color: string; icon: JSX.Element };
    if (!stats) return [] as Row[];
    // Prefer backend-provided distribution if available
    const backend = (stats as any).reportsByStatus as Record<string, number> | undefined;
    let rows: Array<{ status: string; count: number }> = [];
    if (backend && Object.keys(backend).length > 0) {
      rows = Object.entries(backend).map(([k, v]) => ({ status: formatReportStatus(k), count: v ?? 0 }));
    } else {
      // Fallback approximation
      rows = [
        { status: 'Pending', count: stats.pendingReports || 0 },
        { status: 'Approved', count: stats.approvedToday || 0 },
        { status: 'Rejected', count: stats.rejectedToday || 0 },
      ];
    }
    // Optional: include Duplicate and Resolved if backend has them or infer small values
    const hasDuplicate = rows.some(r => r.status.toLowerCase() === 'duplicate');
    const hasResolved = rows.some(r => r.status.toLowerCase() === 'resolved');
    if (!backend) {
      if (!hasDuplicate) rows.push({ status: 'Duplicate', count: Math.round(((stats.totalReports || 0) * 5) / 100) });
      if (!hasResolved) rows.push({ status: 'Resolved', count: stats.processedToday || 0 });
    }
    const total = rows.reduce((s, r) => s + r.count, 0) || 1;
    return rows.map(r => ({
      ...r,
      percentage: Math.round((r.count / total) * 100),
      color: getStatusColor(r.status),
      icon: getStatusIcon(r.status)
    })) as Row[];
  }, [stats]);

  const weeklyData = React.useMemo(() => {
    if (!stats?.weeklyTrend) return [] as Array<{ period: string; pending: number; approved: number; rejected: number }>; 
    return stats.weeklyTrend.map(w => ({
      period: w.date || 'Week',
      pending: w.pending || 0,
      approved: w.approved || 0,
      rejected: w.rejected || 0
    }));
  }, [stats]);

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
                  <Tooltip />
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
              <Tooltip />
              <Bar dataKey="count" barSize={32}>
                {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={barChartHeight}>
            <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }} barCategoryGap="8%" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="pending" stackId="a" fill={theme.palette.warning.main} name="Pending" />
              <Bar dataKey="approved" stackId="a" fill={theme.palette.success.main} name="Approved" />
              <Bar dataKey="rejected" stackId="a" fill={theme.palette.error.main} name="Rejected" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusDistributionChart;
