import React, { useMemo, useState } from 'react';
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
  Chip
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
  TableChart
} from '@mui/icons-material';
import { useAppSelector } from '../../store';
import { selectReports } from '../../store/slices/reportsSlice';
import { selectViolationTypeStats } from '../../store/slices/dashboardSlice';
import { ViolationReport } from '../../shared/models/violation';
import { ViolationType } from '../../shared/models/common';
import { getSeriesColorByIndex, getGridColor, getAxisTickColor } from '../../theme/chart';

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
  const theme = useTheme();
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const reports = useAppSelector(selectReports) as ViolationReport[];
  const { stats: vioStats } = useAppSelector(selectViolationTypeStats);

  const COLORS = Array.from({ length: 12 }, (_, i) => getSeriesColorByIndex(theme, i));

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
    const counts: Record<ViolationType, number> = {
      [ViolationType.WRONG_SIDE_DRIVING]: 0,
      [ViolationType.NO_PARKING_ZONE]: 0,
      [ViolationType.SIGNAL_JUMPING]: 0,
      [ViolationType.SPEED_VIOLATION]: 0,
      [ViolationType.HELMET_SEATBELT_VIOLATION]: 0,
      [ViolationType.MOBILE_PHONE_USAGE]: 0,
      [ViolationType.LANE_CUTTING]: 0,
      [ViolationType.DRUNK_DRIVING_SUSPECTED]: 0,
      [ViolationType.OTHERS]: 0,
    };
    (reports || []).forEach((r) => {
      const fromMeta = extractViolationsFromMetadata(r.media?.mediaMetadata);
      const types = fromMeta.length ? fromMeta : (r.violationType ? [r.violationType] : []);
      if (types.length === 0) {
        counts[ViolationType.OTHERS] += 1;
      } else {
        types.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
      }
    });
    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    const rows = Object.keys(counts).map((k, i) => ({
      name: getViolationTypeLabel(ViolationType[k as keyof typeof ViolationType]),
      value: counts[k as keyof typeof counts],
      percentage: total ? (counts[k as keyof typeof counts] / total) * 100 : 0,
      type: ViolationType[k as keyof typeof ViolationType],
      color: getViolationTypeColor(ViolationType[k as keyof typeof ViolationType], i)
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
    return rows;
  }, [reports]);

  const fromStats = useMemo(() => {
    const rows = (vioStats || []).map((s: any, i: number) => ({
      name: getViolationTypeLabel(s.type),
      value: s.count,
      percentage: s.percentage,
      type: s.type as ViolationType,
      color: getViolationTypeColor(s.type as ViolationType, i),
    }));
    return rows;
  }, [vioStats]);

  const chartData = fromReports.length > 0 ? fromReports : fromStats;
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
        {coloredData.length === 0 ? (
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
    </Card>
  );
};

export default ViolationTypeChart;
