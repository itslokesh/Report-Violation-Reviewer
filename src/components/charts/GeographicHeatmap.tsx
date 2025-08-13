import React, { useState, useEffect } from 'react';
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
  MyLocation,
  Layers
} from '@mui/icons-material';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppSelector } from '../../store';
import { selectGeographicStats } from '../../store/slices/dashboardSlice';
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
  const [radius, setRadius] = useState<number>(20);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [selectedViolationTypes, setSelectedViolationTypes] = useState<ViolationType[]>([]);
  const { stats, loading } = useAppSelector(selectGeographicStats);

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
      [ViolationType.SPEEDING]: '#d32f2f',
      [ViolationType.RED_LIGHT_JUMP]: '#f57c00',
      [ViolationType.ILLEGAL_PARKING]: '#1976d2',
      [ViolationType.OVERTAKING]: '#388e3c',
      [ViolationType.SIGNAL_VIOLATION]: '#7b1fa2',
      [ViolationType.LANE_VIOLATION]: '#0288d1',
      [ViolationType.HELMET_VIOLATION]: '#689f38',
      [ViolationType.SEATBELT_VIOLATION]: '#ef6c00',
      [ViolationType.MOBILE_USAGE]: '#c2185b',
      [ViolationType.DRUNK_DRIVING]: '#d32f2f',
      [ViolationType.OVERLOADING]: '#f57c00',
      [ViolationType.OTHER]: '#757575'
    };
    return colorMap[type] || '#757575';
  };

  const getViolationTypeLabel = (type: ViolationType): string => {
    switch (type) {
      case ViolationType.SPEEDING: return 'Speeding';
      case ViolationType.RED_LIGHT_JUMP: return 'Red Light Jump';
      case ViolationType.ILLEGAL_PARKING: return 'Illegal Parking';
      case ViolationType.OVERTAKING: return 'Overtaking';
      case ViolationType.SIGNAL_VIOLATION: return 'Signal Violation';
      case ViolationType.LANE_VIOLATION: return 'Lane Violation';
      case ViolationType.HELMET_VIOLATION: return 'Helmet Violation';
      case ViolationType.SEATBELT_VIOLATION: return 'Seatbelt Violation';
      case ViolationType.MOBILE_USAGE: return 'Mobile Usage';
      case ViolationType.DRUNK_DRIVING: return 'Drunk Driving';
      case ViolationType.OVERLOADING: return 'Overloading';
      case ViolationType.OTHER: return 'Other';
      default: return 'Unknown';
    }
  };

  const getHeatmapData = () => {
    if (!stats) return [];
    
    const allHotspots: Array<{
      latitude: number;
      longitude: number;
      address: string;
      violationCount: number;
      violationTypes: ViolationType[];
      city: string;
      district: string;
    }> = [];

    stats.forEach(geoStat => {
      geoStat.hotspots.forEach(hotspot => {
        allHotspots.push({
          ...hotspot,
          city: geoStat.city,
          district: geoStat.district
        });
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
    if (!stats) return { totalHotspots: 0, totalViolations: 0, totalCities: 0 };
    
    const totalHotspots = stats.reduce((sum, geoStat) => sum + geoStat.hotspots.length, 0);
    const totalViolations = stats.reduce((sum, geoStat) => 
      sum + geoStat.hotspots.reduce((hotspotSum, hotspot) => hotspotSum + hotspot.violationCount, 0), 0
    );
    const totalCities = stats.length;
    
    return { totalHotspots, totalViolations, totalCities };
  };

  const totalStats = getTotalStats();

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
    <Card sx={{ height }}>
      <CardHeader
        title={title}
        action={
          <Box display="flex" alignItems="center" gap={1}>
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
        {/* Summary Stats */}
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
        </Box>

        {/* Radius Control */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Marker Radius: {radius}px
          </Typography>
          <Slider
            value={radius}
            onChange={(_, value) => setRadius(value as number)}
            min={5}
            max={50}
            step={5}
            marks
            size="small"
          />
        </Box>

        {/* Map Container */}
        <Box sx={{ height: height - 200, width: '100%', position: 'relative' }}>
          {heatmapData.length === 0 ? (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              height="100%"
              sx={{ 
                border: 1, 
                borderColor: 'divider', 
                borderRadius: 1,
                bgcolor: 'grey.50'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No geographic data available
              </Typography>
            </Box>
          ) : (
            <MapContainer
              center={defaultCenter}
              zoom={defaultZoom}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {heatmapData.map((hotspot, index) => (
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
                      <Typography variant="subtitle2" fontWeight="bold">
                        {hotspot.address}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        City: {hotspot.city}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        District: {hotspot.district}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        Violations: {hotspot.violationCount}
                      </Typography>
                      <Box mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          Violation Types:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                          {hotspot.violationTypes.map((type, typeIndex) => (
                            <Chip
                              key={typeIndex}
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
                      </Box>
                    </Box>
                  </Popup>
                  {showLabels && (
                    <Tooltip permanent>
                      <Typography variant="caption">
                        {hotspot.violationCount}
                      </Typography>
                    </Tooltip>
                  )}
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </Box>

        {/* Legend */}
        <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
          <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 1 }}>
            Violation Type Colors:
          </Typography>
          {Object.values(ViolationType).slice(0, 6).map((type) => (
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
