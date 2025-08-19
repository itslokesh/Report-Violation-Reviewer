import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Box, 
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Slider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { 
  MoreVert,
  PictureAsPdf,
  Download,
  TableChart,
  Fullscreen,
  FullscreenExit,
  
} from '@mui/icons-material';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectGeographicStats, fetchGeographicStats } from '../../store/slices/dashboardSlice';
import { selectReports } from '../../store/slices/reportsSlice';
import { ViolationReport } from '../../shared/models/violation';
import { ViolationType } from '../../shared/models/common';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GeographicHeatmapProps {
  title?: string;
  height?: number;
  showExport?: boolean;
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

const GeographicHeatmap: React.FC<GeographicHeatmapProps> = ({ 
  title = "Geographic Violation Distribution",
  height = 500,
  showExport = true,
  defaultCenter = [20.5937, 78.9629], // India center
  defaultZoom = 5
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [radius, setRadius] = useState<number>(25);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [useHeatmap, setUseHeatmap] = useState<boolean>(true);
  // Raw counts mode: each report contributes weight=1 to the heatmap (no cell aggregation)
  const RAW_COUNTS = true;
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const mapBoxRef = useRef<HTMLDivElement | null>(null);
  const [selectedViolationTypes] = useState<ViolationType[]>([]);
  const { stats, loading } = useAppSelector(selectGeographicStats);
  const reports = useAppSelector(selectReports) as ViolationReport[];
  const dispatch = useAppDispatch();

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format: 'pdf' | 'png' | 'csv') => {
    // TODO: Implement export functionality
    console.log(`Exporting geographic data as ${format}`);
    handleExportMenuClose();
  };

  const getViolationTypeColor = (type: ViolationType): string => {
    const colorMap: Record<ViolationType, string> = {
      [ViolationType.WRONG_SIDE_DRIVING]: '#c62828',
      [ViolationType.NO_PARKING_ZONE]: '#f57c00',
      [ViolationType.SIGNAL_JUMPING]: '#1976d2',
      [ViolationType.SPEED_VIOLATION]: '#0288d1',
      [ViolationType.HELMET_SEATBELT_VIOLATION]: '#7b1fa2',
      [ViolationType.MOBILE_PHONE_USAGE]: '#8e24aa',
      [ViolationType.LANE_CUTTING]: '#2e7d32',
      [ViolationType.DRUNK_DRIVING_SUSPECTED]: '#d32f2f',
      [ViolationType.OTHERS]: '#757575'
    };
    return colorMap[type] || '#757575';
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

  // Date range filter (default last 30 days)
  const formatDateInput = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = `${d.getMonth() + 1}`.padStart(2, '0');
    const dd = `${d.getDate()}`.padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const [fromDate, setFromDate] = useState<string>(formatDateInput(thirtyDaysAgo));
  const [toDate, setToDate] = useState<string>(formatDateInput(today));
  const applyDateFilter = () => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
    if (start > end) return;
    void dispatch(fetchGeographicStats({ dateRange: { start, end } } as any));
  };

  const getHeatmapData = () => {
    if (!stats && (!reports || reports.length === 0)) return [];
    
    const allHotspots: Array<{
      latitude: number;
      longitude: number;
      address: string;
      violationCount: number;
      violationTypes: ViolationType[];
      city: string;
      district: string;
    }> = [];

    if (stats) {
      stats.forEach((geoStat: any) => {
        (geoStat.hotspots || []).forEach((hotspot: any) => {
          allHotspots.push({
            ...hotspot,
            city: geoStat.city,
            district: geoStat.district
          });
        });
      });
    }

    // Fallback/enrichment: include individual report locations (weight = 1)
    (reports || []).forEach((r) => {
      const lat = Number((r as any)?.location?.latitude ?? (r as any)?.location?.lat ?? 0);
      const lng = Number((r as any)?.location?.longitude ?? (r as any)?.location?.lng ?? 0);
      if (!isFinite(lat) || !isFinite(lng) || lat === 0 && lng === 0) return;
      allHotspots.push({
        latitude: lat,
        longitude: lng,
        address: (r as any)?.location?.address ?? r.reporterCity ?? 'Location',
        violationCount: 1,
        violationTypes: [r.violationType as ViolationType],
        city: r.reporterCity,
        district: ''
      });
    });

    // Filter by selected violation types if any
    if (selectedViolationTypes.length > 0) {
      return allHotspots.filter(hotspot => 
        hotspot.violationTypes.some(type => selectedViolationTypes.includes(type))
      );
    }

    return allHotspots;
  };

  const heatmapData = getHeatmapData();

  // Aggregate nearby points into cells to reflect violations per vicinity (used when RAW_COUNTS is false)
  const aggregated = useMemo(() => {
    if (RAW_COUNTS) return [] as Array<{ latitude: number; longitude: number; aggregateCount: number }>;
    const precision = 0.02; // ~2km cell at equator
    const cells = new Map<string, { latSum: number; lngSum: number; weightSum: number; count: number }>();
    for (const h of heatmapData) {
      const latKey = Math.round(h.latitude / precision) * precision;
      const lngKey = Math.round(h.longitude / precision) * precision;
      const key = `${latKey}:${lngKey}`;
      const entry = cells.get(key) || { latSum: 0, lngSum: 0, weightSum: 0, count: 0 };
      const w = Math.max(1, h.violationCount);
      entry.latSum += h.latitude * w;
      entry.lngSum += h.longitude * w;
      entry.weightSum += w;
      entry.count += w;
      cells.set(key, entry);
    }
    return Array.from(cells.entries()).map(([key, v]) => ({
      latitude: v.latSum / (v.weightSum || 1),
      longitude: v.lngSum / (v.weightSum || 1),
      aggregateCount: v.count,
    }));
  }, [heatmapData, RAW_COUNTS]);

  // Prepare points for heat layer: [lat, lng, intensity]
  const maxViolations = useMemo(() => {
    if (RAW_COUNTS) {
      const validReports = (reports || []).filter((r) => {
        const lat = Number((r as any)?.location?.latitude ?? (r as any)?.location?.lat ?? 0);
        const lng = Number((r as any)?.location?.longitude ?? (r as any)?.location?.lng ?? 0);
        return isFinite(lat) && isFinite(lng) && !(lat === 0 && lng === 0);
      });
      if (validReports.length > 0) return validReports.length;
      // Fallback to hotspot totals if reports are not available
      const totalFromHotspots = heatmapData.reduce((sum, h) => sum + (h.violationCount || 0), 0);
      return totalFromHotspots;
    }
    return Math.max(...aggregated.map(d => d.aggregateCount), 0);
  }, [aggregated, reports, RAW_COUNTS, heatmapData]);

  const heatPoints = useMemo(() => {
    if (RAW_COUNTS) {
      const reportPts: Array<[number, number, number]> = [];
      (reports || []).forEach((r) => {
        const lat = Number((r as any)?.location?.latitude ?? (r as any)?.location?.lat ?? 0);
        const lng = Number((r as any)?.location?.longitude ?? (r as any)?.location?.lng ?? 0);
        if (!isFinite(lat) || !isFinite(lng) || (lat === 0 && lng === 0)) return;
        reportPts.push([lat, lng, 1]);
      });
      if (reportPts.length > 0) return reportPts;
      // Fallback: use backend hotspots with intensity proportional to violationCount
      const max = Math.max(...heatmapData.map(d => d.violationCount), 1);
      return heatmapData.map(h => [h.latitude, h.longitude, Math.max(0.1, h.violationCount / max)] as [number, number, number]);
    }
    if (!aggregated.length) return [] as Array<[number, number, number]>;
    const max = Math.max(...aggregated.map(d => d.aggregateCount), 1);
    return aggregated.map(d => [d.latitude, d.longitude, Math.max(0.1, d.aggregateCount / max)] as [number, number, number]);
  }, [aggregated, reports, RAW_COUNTS, heatmapData]);

  const getMarkerRadius = (violationCount: number): number => {
    // Scale radius based on violation count
    const minRadius = 5;
    const maxRadius = radius;
    const maxViolations = Math.max(...heatmapData.map(d => d.violationCount), 1);
    return Math.max(minRadius, (violationCount / maxViolations) * maxRadius);
  };

  const getMarkerColor = (violationTypes: ViolationType[]): string => {
    if (violationTypes.length === 0) return '#757575';
    
    // Use the most common violation type color
    const typeCounts = violationTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<ViolationType, number>);
    
    const mostCommonType = Object.entries(typeCounts).reduce((a, b) => 
      typeCounts[a[0] as ViolationType] > typeCounts[b[0] as ViolationType] ? a : b
    )[0] as ViolationType;
    
    return getViolationTypeColor(mostCommonType);
  };

  const getTotalStats = () => {
    if (RAW_COUNTS) {
      const validReports = (reports || []).filter((r) => {
        const lat = Number((r as any)?.location?.latitude ?? (r as any)?.location?.lat ?? 0);
        const lng = Number((r as any)?.location?.longitude ?? (r as any)?.location?.lng ?? 0);
        return isFinite(lat) && isFinite(lng) && !(lat === 0 && lng === 0);
      });
      if (validReports.length > 0) {
        const totalViolations = validReports.length;
        const totalHotspots = new Set(validReports.map((r) => {
          const lat = Number((r as any)?.location?.latitude ?? (r as any)?.location?.lat ?? 0);
          const lng = Number((r as any)?.location?.longitude ?? (r as any)?.location?.lng ?? 0);
          const precision = 0.001; // identify unique coordinates approximately
          return `${Math.round(lat / precision) * precision}:${Math.round(lng / precision) * precision}`;
        })).size;
        const totalCities = new Set(validReports.map((r) => r.reporterCity)).size;
        return { totalHotspots, totalViolations, totalCities };
      }
      // Fallback: use backend hotspot totals
      const totalHotspots = heatmapData.length;
      const totalViolations = heatmapData.reduce((sum, h) => sum + (h.violationCount || 0), 0);
      const totalCities = stats ? stats.length : 0;
      return { totalHotspots, totalViolations, totalCities };
    }
    // Aggregated mode summaries
    const totalHotspots = aggregated.length;
    const totalViolations = aggregated.reduce((sum, c) => sum + (c.aggregateCount || 0), 0);
    const totalCities = stats ? stats.length : new Set((reports || []).map(r => r.reporterCity)).size;
    return { totalHotspots, totalViolations, totalCities };
  };

  const totalStats = getTotalStats();

  // Fullscreen handlers
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && mapBoxRef.current) {
        await mapBoxRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (_) {
      // no-op
    }
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Lightweight React Leaflet wrapper for Leaflet.heat
  const HeatLayer: React.FC<{ points: Array<[number, number, number]>; radius: number }> = ({ points, radius }) => {
    const map = useMap();
    useEffect(() => {
      let heat: any;
      let cancelled = false;
      const ensurePlugin = async () => {
        if (!(L as any).heatLayer) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[data-leaflet-heat]');
            if (existing) { existing.addEventListener('load', () => resolve()); return; }
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet.heat/dist/leaflet-heat.js';
            script.async = true;
            script.setAttribute('data-leaflet-heat', 'true');
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load leaflet.heat'));
            document.body.appendChild(script);
          });
        }
        if (cancelled) return;
        // Boost contrast with a vivid yellow->red gradient and slightly higher minOpacity
        heat = (L as any).heatLayer(points, {
          radius,
          blur: Math.max(10, Math.floor(radius * 0.6)),
          maxZoom: 18,
          minOpacity: 0.35,
          gradient: {
            0.0: '#fff7bc',   // brighter yellow
            0.35: '#fec44f',  // vivid yellow-orange
            0.6: '#fe9929',   // orange
            0.8: '#ec7014',   // deep orange
            0.9: '#cc4c02',   // orange-red
            1.0: '#993404'    // deep red-brown
          }
        });
        heat.addTo(map);
      };
      ensurePlugin();
      return () => {
        cancelled = true;
        if (heat) {
          try { map.removeLayer(heat); } catch {}
        }
      };
    }, [map, points, radius]);
    return null;
  };

  if (loading) {
    return (
      <Card sx={{ height }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="body2" color="text.secondary">
              Loading geographic data...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={title}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <FormControlLabel
              control={<Switch checked={useHeatmap} onChange={(e) => setUseHeatmap(e.target.checked)} size="small" />}
              label="Heatmap"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  size="small"
                />
              }
              label="Labels"
            />
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
        {/* Summary & Filters */}
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <Chip 
            label={`Hotspots: ${totalStats.totalHotspots}`} 
            color="primary" 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`Violations: ${totalStats.totalViolations}`} 
            color="secondary" 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`Cities: ${totalStats.totalCities}`} 
            color="info" 
            variant="outlined" 
            size="small"
          />
          <Box sx={{ flex: 1 }} />
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="caption" color="text.secondary">From</Typography>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }} />
            <Typography variant="caption" color="text.secondary">To</Typography>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }} />
            <IconButton size="small" onClick={applyDateFilter} aria-label="apply date filter" title="Apply">
              <Download fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Radius / Intensity Control */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {useHeatmap ? 'Heat radius' : 'Marker radius'}: {radius}px
          </Typography>
          <Slider
            value={radius}
            onChange={(_, value) => setRadius(value as number)}
            min={10}
            max={60}
            step={5}
            marks
            size="small"
          />
        </Box>

        {/* Map Container - force square aspect ratio */}
        <Box sx={{ width: '100%', position: 'relative' }}>
          <Box ref={mapBoxRef} sx={{ width: '100%', aspectRatio: '4 / 3', position: 'relative', borderRadius: 1, overflow: 'hidden', bgcolor: 'background.default' }}>
            {heatmapData.length === 0 ? (
              <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                sx={{ position: 'absolute', inset: 0, border: 1, borderColor: 'divider', bgcolor: 'grey.50' }}
              >
                <Typography variant="body2" color="text.secondary">No geographic data available</Typography>
              </Box>
            ) : (
              <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ position: 'absolute', inset: 0 }}>
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>, &copy; OpenStreetMap contributors'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {useHeatmap && (<HeatLayer points={heatPoints} radius={radius} />)}
                {!useHeatmap && heatmapData.map((hotspot, index) => (
                  <CircleMarker
                    key={index}
                    center={[hotspot.latitude, hotspot.longitude]}
                    radius={getMarkerRadius(hotspot.violationCount)}
                    fillColor={getMarkerColor(hotspot.violationTypes)}
                    color={getMarkerColor(hotspot.violationTypes)}
                    weight={2}
                    opacity={0.8}
                    fillOpacity={0.6}
                  >
                    <Popup>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">{hotspot.address}</Typography>
                        <Typography variant="body2" color="text.secondary">City: {hotspot.city}</Typography>
                        <Typography variant="body2" color="text.secondary">District: {hotspot.district}</Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary">Violations: {hotspot.violationCount}</Typography>
                        <Box mt={1}>
                          <Typography variant="caption" color="text.secondary">Violation Types:</Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                            {hotspot.violationTypes.map((type, typeIndex) => (
                              <Chip key={typeIndex} label={getViolationTypeLabel(type)} size="small" sx={{ bgcolor: getViolationTypeColor(type), color: 'white', fontSize: '0.7rem' }} />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </Popup>
                    {showLabels && (
                      <Tooltip permanent>
                        <Typography variant="caption">{hotspot.violationCount}</Typography>
                      </Tooltip>
                    )}
                  </CircleMarker>
                ))}
              </MapContainer>
            )}
            {/* Fullscreen Toggle */}
            <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10000 }}>
              <IconButton size="small" color="default" onClick={toggleFullscreen} sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider' }} aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}>
                {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
              </IconButton>
            </Box>
            {/* Heatmap Legend overlay */}
            <Box sx={{ position: 'absolute', bottom: 12, right: 12, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25, boxShadow: 2, minWidth: 180, zIndex: 9999, pointerEvents: 'none' }}>
              <Typography variant="caption" color="text.secondary">Intensity</Typography>
              <Box sx={{ mt: 0.75, height: 10, borderRadius: 1, background: 'linear-gradient(to right, #fff7bc, #fec44f, #fe9929, #ec7014, #cc4c02, #993404)' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Low</Typography>
                <Typography variant="caption" color="text.secondary">High</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">0</Typography>
                <Typography variant="caption" color="text.secondary">{maxViolations}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Legend */}
        <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
          <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 1 }}>
            Violation Type Colors:
          </Typography>
          {Object.values(ViolationType).map((type) => (
            <Chip
              key={type}
              label={getViolationTypeLabel(type)}
              size="small"
              sx={{ 
                bgcolor: getViolationTypeColor(type),
                color: 'white',
                fontSize: '0.7rem'
              }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default GeographicHeatmap;
