import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Box, 
  IconButton,
  MenuItem,
  Button,
  Popover,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Divider,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Paper,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { 
  DateRange,
  Schedule,
  CalendarToday,
  Clear,
  Layers,
  Label,
  Fullscreen,
  FullscreenExit,
  ExpandMore,
  LocationOn,
  Warning
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store';
import { selectGeographicStats, selectGlobalTimeRange, fetchGeographicStats } from '../../store/slices/dashboardSlice';
import { filterDataByGlobalTimeRange, filterDataByLocalTimeRange } from '../../shared/utils/date';
import { ViolationType } from '../../shared/models/common';
import ExportMenu from '../common/ExportMenu';

// Heatmap Layer Component
interface HeatmapLayerProps {
  data: Array<{
    latitude: number;
    longitude: number;
    violationCount: number;
    address: string;
    violationTypes: ViolationType[];
  }>;
  radius: number;
  maxZoom: number;
  blur: number;
  gradient: { [key: number]: string };
  maxIntensity: number;
}

// Map Event Handler Component for location preservation
interface MapEventHandlerProps {
  onMapMove: (center: [number, number], zoom: number) => void;
  onZoomChange: (zoom: number) => void;
}

const MapEventHandler: React.FC<MapEventHandlerProps> = ({ onMapMove, onZoomChange }) => {
  const map = useMap();

  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onMapMove([center.lat, center.lng], zoom);
      onZoomChange(zoom);
    };

    const handleZoomEnd = () => {
      const zoom = map.getZoom();
      onZoomChange(zoom);
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleZoomEnd);
    
    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onMapMove, onZoomChange]);

  return null;
};

const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ data, radius, maxZoom, blur, gradient, maxIntensity }) => {
  const map = useMap();
  const heatmapRef = useRef<L.HeatLayer | null>(null);

  useEffect(() => {
    console.log('HeatmapLayer useEffect triggered with:', {
      dataLength: data.length,
      data: data,
      radius,
      maxZoom,
      blur,
      gradient,
      maxIntensity
    });

    if (data.length === 0) {
      console.log('HeatmapLayer: No data provided, skipping heatmap creation');
      return;
    }

    // Convert data to heatmap format: [lat, lng, intensity]
    const heatmapData = data.map(violation => [
      violation.latitude,
      violation.longitude,
      violation.violationCount
    ]);

    console.log('HeatmapLayer: Converted heatmap data:', heatmapData);

    // Remove existing heatmap layer
    if (heatmapRef.current) {
      console.log('HeatmapLayer: Removing existing heatmap layer');
      map.removeLayer(heatmapRef.current);
    }

    // Create new heatmap layer with dynamic max intensity
    const heatmapOptions = {
      radius: radius,
      blur: blur,
      maxZoom: maxZoom,
      gradient: gradient,
      max: maxIntensity
    };

    console.log('HeatmapLayer: Creating heatmap with options:', heatmapOptions);

    heatmapRef.current = L.heatLayer(heatmapData as [number, number, number][], heatmapOptions);

    // Add heatmap to map
    console.log('HeatmapLayer: Adding heatmap to map');
    heatmapRef.current.addTo(map);

    // Cleanup function
    return () => {
      if (heatmapRef.current) {
        console.log('HeatmapLayer: Cleaning up heatmap layer');
        map.removeLayer(heatmapRef.current);
      }
    };
  }, [data, radius, maxZoom, blur, gradient, maxIntensity, map]);

  return null;
};

// Hotspot Markers Component
interface HotspotMarkersProps {
  hotspots: Array<{
    latitude: number;
    longitude: number;
    violationCount: number;
    address: string;
    violationTypes: string[];
    statusCounts: {
      REJECTED: number;
      APPROVED: number;
      PENDING: number;
    };
    district: string;
    isIndividual: boolean;
  }>;
  showHotspots: boolean;
}

const HotspotMarkers: React.FC<HotspotMarkersProps> = ({ hotspots, showHotspots }) => {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!showHotspots) {
      // Remove all markers
      markersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      markersRef.current = [];
      return;
    }

    // Remove existing markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

    // Create custom icon for hotspots
    const hotspotIcon = L.divIcon({
      className: 'hotspot-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: #1976d2;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          <span>H</span>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    // Add markers for each hotspot
    hotspots.forEach((hotspot, index) => {
      const marker = L.marker([hotspot.latitude, hotspot.longitude], {
        icon: hotspotIcon
      });

      // Create popup content
      const getDisplayAddress = (address: string) => {
        // Use the actual address from API response, even if it's a hash
        if (address && address.trim()) {
          return address;
        }
        return `Hotspot Location (${hotspot.district})`;
      };

      const popupContent = `
        <div style="min-width: 250px; font-family: Arial, sans-serif;">
          <h3 style="margin: 0 0 10px 0; color: #1976d2; font-size: 16px;">
            ${getDisplayAddress(hotspot.address)}
          </h3>
          <div style="margin-bottom: 10px;">
            <strong>Violations:</strong> ${hotspot.violationCount}<br>
            <strong>District:</strong> ${hotspot.district}
          </div>
          <div style="margin-bottom: 10px;">
            <div style="display: flex; gap: 5px; margin-bottom: 5px;">
              <span style="background: #4caf50; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">
                Approved: ${hotspot.statusCounts.APPROVED}
              </span>
              <span style="background: #f44336; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">
                Rejected: ${hotspot.statusCounts.REJECTED}
              </span>
              <span style="background: #ff9800; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">
                Pending: ${hotspot.statusCounts.PENDING}
              </span>
            </div>
          </div>
          ${hotspot.violationTypes.length > 0 ? `
            <div>
              <strong>Violation Types:</strong><br>
              <div style="display: flex; flex-wrap: wrap; gap: 3px; margin-top: 5px;">
                ${hotspot.violationTypes.slice(0, 3).map(type => 
                  `<span style="background: #e3f2fd; color: #1976d2; padding: 1px 4px; border-radius: 2px; font-size: 10px;">${type}</span>`
                ).join('')}
                ${hotspot.violationTypes.length > 3 ? 
                  `<span style="background: #e3f2fd; color: #1976d2; padding: 1px 4px; border-radius: 2px; font-size: 10px;">+${hotspot.violationTypes.length - 3} more</span>` 
                  : ''
                }
              </div>
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // Cleanup function
    return () => {
      markersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      markersRef.current = [];
    };
  }, [hotspots, showHotspots, map]);

  return null;
};

interface GeographicHeatmapProps {
  title?: string;
  height?: number;
  showExport?: boolean;
  isVisible?: boolean;
}

const GeographicHeatmap: React.FC<GeographicHeatmapProps> = ({ 
  title = "Geographic Distribution",
  height = 500,
  showExport = true,
  isVisible = true
}) => {
  const dispatch = useAppDispatch();
  const [timeRangeAnchorEl, setTimeRangeAnchorEl] = useState<null | HTMLElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { stats: geoStats, loading } = useAppSelector(selectGeographicStats);
  const globalTimeRange = useAppSelector(selectGlobalTimeRange);

  // Local time range state
  const [localTimeRange, setLocalTimeRange] = useState({
    type: 'relative' as 'absolute' | 'relative',
    startDate: '',
    endDate: '',
    relativeRange: '30d',
    isApplied: true
  });

  // Toggle buttons state
  const [viewMode, setViewMode] = useState<'heatmap' | 'hotspots'>('heatmap');
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  
  // Heat radius slider state
  const [heatRadius, setHeatRadius] = useState<number>(15);
  
  // Map state for location preservation
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // India center
  const [mapZoom, setMapZoom] = useState<number>(5);
  const [currentZoom, setCurrentZoom] = useState<number>(5);

  // Fixed color scheme for heatmap (green to red intensity) - darker greens for black map
  const heatmapGradient = {
    0.0: 'rgba(0, 100, 0, 0.9)',      // Dark green (low intensity) - much darker for visibility
    0.2: 'rgba(0, 150, 0, 0.9)',      // Medium green (medium-low intensity) - darker
    0.4: 'rgba(255, 255, 0, 0.95)',   // Bright yellow (medium intensity) - high contrast
    0.6: 'rgba(255, 140, 0, 0.95)',   // Dark orange (high intensity) - darker
    0.8: 'rgba(255, 0, 0, 0.95)',     // Bright red (very high intensity) - high contrast
    1.0: 'rgba(255, 0, 0, 1.0)'       // Solid red (maximum intensity)
  };

  // Get geographic data - API calls now handle time range filtering
  const getGeographicData = () => {
    if (geoStats && geoStats.length > 0) {
      return geoStats;
    }
    return [];
  };

  const geographicData = getGeographicData();

  // Use refs to track the last time range values to prevent infinite loops
  const lastGlobalTimeRangeRef = useRef<string>('');
  const lastLocalTimeRangeRef = useRef<string>('');

  // Memoize the effective time range to prevent unnecessary re-renders
  const effectiveTimeRange = useMemo(() => {
    return localTimeRange.isApplied ? localTimeRange : globalTimeRange;
  }, [localTimeRange.isApplied, localTimeRange.type, localTimeRange.startDate, localTimeRange.endDate, localTimeRange.relativeRange, globalTimeRange.isApplied, globalTimeRange.type, globalTimeRange.startDate, globalTimeRange.endDate, globalTimeRange.relativeRange]);

  // Initial data fetch when component becomes visible
  useEffect(() => {
    if (isVisible && !geoStats && !loading) {
      console.log('GeographicHeatmap: Initial data fetch');
      dispatch(fetchGeographicStats(undefined));
    }
  }, [isVisible, geoStats, loading, dispatch]);

  // Trigger API call when global time range changes (if no local time range is applied)
  useEffect(() => {
    // Only fetch data if the component is visible
    if (!isVisible) {
      return;
    }

    if (!localTimeRange.isApplied && globalTimeRange.isApplied) {
      const globalTimeRangeKey = `${globalTimeRange.type}-${globalTimeRange.startDate}-${globalTimeRange.endDate}-${globalTimeRange.relativeRange}`;
      
      if (lastGlobalTimeRangeRef.current !== globalTimeRangeKey) {
        console.log('GeographicHeatmap: Dispatching fetchGeographicStats due to global time range change:', globalTimeRange);
        dispatch(fetchGeographicStats(undefined));
        lastGlobalTimeRangeRef.current = globalTimeRangeKey;
      }
    }
  }, [effectiveTimeRange, dispatch, isVisible]);

  // Trigger API call when local time range changes
  useEffect(() => {
    // Only fetch data if the component is visible
    if (!isVisible) {
      return;
    }

    if (localTimeRange.isApplied) {
      const localTimeRangeKey = `${localTimeRange.type}-${localTimeRange.startDate}-${localTimeRange.endDate}-${localTimeRange.relativeRange}`;
      
      if (lastLocalTimeRangeRef.current !== localTimeRangeKey) {
        console.log('GeographicHeatmap: Dispatching fetchGeographicStats due to local time range change:', localTimeRange);
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
        
        dispatch(fetchGeographicStats(filter));
        lastLocalTimeRangeRef.current = localTimeRangeKey;
      }
    }
  }, [effectiveTimeRange, dispatch, isVisible]);

  // Get individual violations for heatmap
  const getIndividualViolationsData = () => {
    console.log('getIndividualViolationsData - geographicData:', geographicData);
    
    if (geographicData && geographicData.length > 0) {
      const allViolations: Array<{
        latitude: number;
        longitude: number;
        violationCount: number;
        address: string;
        violationTypes: ViolationType[];
      }> = [];

      geographicData.forEach((geoStat: any, index: number) => {
        console.log(`GeoStat ${index}:`, geoStat);
        console.log(`GeoStat ${index} individualViolations:`, geoStat.individualViolations);
        
        if (geoStat.individualViolations && Array.isArray(geoStat.individualViolations)) {
          console.log(`GeoStat ${index} has ${geoStat.individualViolations.length} individual violations`);
          
          geoStat.individualViolations.forEach((violation: any, vIndex: number) => {
            console.log(`Violation ${vIndex}:`, violation);
            
            // More robust coordinate parsing
            let lat = 0;
            let lng = 0;
            
            // Try different possible coordinate formats
            if (typeof violation.latitude === 'string') {
              lat = parseFloat(violation.latitude);
            } else if (typeof violation.latitude === 'number') {
              lat = violation.latitude;
            } else if (violation.lat) {
              lat = typeof violation.lat === 'string' ? parseFloat(violation.lat) : violation.lat;
            }
            
            if (typeof violation.longitude === 'string') {
              lng = parseFloat(violation.longitude);
            } else if (typeof violation.longitude === 'number') {
              lng = violation.longitude;
            } else if (violation.lng) {
              lng = typeof violation.lng === 'string' ? parseFloat(violation.lng) : violation.lng;
            }
            
            console.log(`Violation ${vIndex} coordinates: lat=${lat}, lng=${lng} (original: lat=${violation.latitude}, lng=${violation.longitude})`);
            
            // Only add violations with valid coordinates
            if (lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng) && 
                lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              allViolations.push({
                latitude: lat,
                longitude: lng,
                violationCount: 1, // Each individual violation counts as 1
                address: violation.address ?? 'Unknown Location',
                violationTypes: [violation.violationType] || []
              });
              console.log(`Added violation ${vIndex} to heatmap data`);
            } else {
              console.log(`Skipped violation ${vIndex} due to invalid coordinates`);
            }
          });
        } else {
          console.log(`GeoStat ${index} has no individualViolations or it's not an array`);
        }
      });
      
      console.log('getIndividualViolationsData - final allViolations:', allViolations);
      return allViolations;
    }
    
    console.log('getIndividualViolationsData - no geographic data available');
    return [];
  };

  // Get hotspots for display
  const getHotspotsData = () => {
    console.log('getHotspotsData - geographicData:', geographicData);
    
    if (geographicData && geographicData.length > 0) {
      const allHotspots: Array<{
        latitude: number;
        longitude: number;
        violationCount: number;
        address: string;
        violationTypes: string[];
        statusCounts: {
          REJECTED: number;
          APPROVED: number;
          PENDING: number;
        };
        district: string;
        isIndividual: boolean;
      }> = [];

      geographicData.forEach((geoStat: any, index: number) => {
        console.log(`GeoStat ${index} hotspots:`, geoStat.hotspots);
        
        if (geoStat.hotspots && Array.isArray(geoStat.hotspots)) {
          console.log(`GeoStat ${index} has ${geoStat.hotspots.length} hotspots`);
          
          geoStat.hotspots.forEach((hotspot: any, hIndex: number) => {
            console.log(`Hotspot ${hIndex}:`, hotspot);
            
            // More robust coordinate parsing for hotspots
            let lat = 0;
            let lng = 0;
            
            // Try different possible coordinate formats
            if (typeof hotspot.latitude === 'string') {
              lat = parseFloat(hotspot.latitude);
            } else if (typeof hotspot.latitude === 'number') {
              lat = hotspot.latitude;
            } else if (hotspot.lat) {
              lat = typeof hotspot.lat === 'string' ? parseFloat(hotspot.lat) : hotspot.lat;
            }
            
            if (typeof hotspot.longitude === 'string') {
              lng = parseFloat(hotspot.longitude);
            } else if (typeof hotspot.longitude === 'number') {
              lng = hotspot.longitude;
            } else if (hotspot.lng) {
              lng = typeof hotspot.lng === 'string' ? parseFloat(hotspot.lng) : hotspot.lng;
            }
            
            console.log(`Hotspot ${hIndex} coordinates: lat=${lat}, lng=${lng}, violationCount=${hotspot.violationCount} (original: lat=${hotspot.latitude}, lng=${hotspot.longitude})`);
            
            if (lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng) && 
                lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              allHotspots.push({
                latitude: lat,
                longitude: lng,
                violationCount: Number(hotspot.violationCount ?? 0),
                address: hotspot.address ?? 'Unknown Location',
                violationTypes: hotspot.violationTypes || [],
                statusCounts: hotspot.statusCounts || { REJECTED: 0, APPROVED: 0, PENDING: 0 },
                district: hotspot.district ?? geoStat.district ?? 'Unknown District',
                isIndividual: Boolean(hotspot.isIndividual ?? false)
              });
              console.log(`Added hotspot ${hIndex} to hotspots data`);
            } else {
              console.log(`Skipped hotspot ${hIndex} due to invalid coordinates`);
            }
          });
        } else {
          console.log(`GeoStat ${index} has no hotspots or it's not an array`);
        }
      });
      
      console.log('getHotspotsData - final allHotspots:', allHotspots);
      return allHotspots;
    }
    
    console.log('getHotspotsData - no geographic data available');
    return [];
  };

  const individualViolationsData = getIndividualViolationsData();
  const hotspotsData = getHotspotsData();
  
  console.log('Final data summary:');
  console.log('- individualViolationsData length:', individualViolationsData.length);
  console.log('- hotspotsData length:', hotspotsData.length);
  console.log('- individualViolationsData:', individualViolationsData);
  console.log('- hotspotsData:', hotspotsData);
  console.log('- Current viewMode:', viewMode);
  console.log('- Current showHotspots:', showHotspots);

  // Calculate dynamic max intensity based on current zoom level
  const getDynamicMaxIntensity = () => {
    // Use hotspots data if individual violations are not available
    const dataToUse = individualViolationsData.length > 0 ? individualViolationsData : hotspotsData;
    
    if (dataToUse.length === 0) return 1;
    
    // Get violations within current map bounds (approximate based on zoom)
    const baseMax = Math.max(...dataToUse.map(v => v.violationCount));
    
    console.log('Dynamic max intensity calculation:', {
      dataSource: individualViolationsData.length > 0 ? 'individualViolations' : 'hotspots',
      baseMax,
      currentZoom,
      dataLength: dataToUse.length
    });
    
    // Adjust based on zoom level - higher zoom shows more detail
    if (currentZoom >= 12) {
      return Math.max(baseMax, 10); // High zoom - show more detail
    } else if (currentZoom >= 8) {
      return Math.max(baseMax, 5); // Medium zoom
    } else {
      return Math.max(baseMax, 1); // Low zoom - show overview
    }
  };

  const dynamicMaxIntensity = getDynamicMaxIntensity();

  // Heatmap configuration
  const heatmapConfig = useMemo(() => ({
    radius: heatRadius,
    blur: 15,
    maxZoom: 10,
    gradient: heatmapGradient,
    maxIntensity: dynamicMaxIntensity
  }), [heatRadius, dynamicMaxIntensity]);

  const handleExport = async (format: 'pdf' | 'png' | 'csv') => {
    console.log(`Exporting geographic data as ${format}`);
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

  // Toggle button handlers
  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newViewMode: 'heatmap' | 'hotspots' | null) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleHeatRadiusChange = (_event: Event, newValue: number | number[]) => {
    setHeatRadius(newValue as number);
  };

  const handleFullScreenToggle = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Force map re-render when full-screen state changes or map location changes
  useEffect(() => {
    if (isFullScreen) {
      // Small delay to ensure dialog is fully rendered
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // When exiting full-screen, force a re-render of the normal map
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isFullScreen, mapCenter, mapZoom]);

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

  // Computed values for information boxes
  const hotspotsCount = hotspotsData.length;
  const totalViolations = individualViolationsData.length;
  const citiesCount = new Set(geographicData.map((geoStat: any) => geoStat.city)).size;

  if (loading && isVisible) {
    return (
      <Card sx={{ height }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="body2" color="text.secondary">Loading geographic data...</Typography>
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
            {/* Toggle Buttons */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="heatmap" aria-label="heatmap">
                <Layers fontSize="small" />
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  Heatmap
                </Typography>
              </ToggleButton>
              <ToggleButton value="hotspots" aria-label="hotspots">
                <LocationOn fontSize="small" />
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  Hotspots
                </Typography>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Hotspot Toggle */}
            <ToggleButton
              value="hotspots"
              selected={showHotspots}
              onChange={() => setShowHotspots(!showHotspots)}
              size="small"
              sx={{ ml: 1 }}
            >
              <LocationOn fontSize="small" />
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {showHotspots ? 'Hide' : 'Show'} Hotspots
              </Typography>
            </ToggleButton>

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

            {/* Full Screen Button */}
            <Tooltip title={isFullScreen ? "Exit full screen" : "Enter full screen"}>
              <IconButton
                size="small"
                onClick={handleFullScreenToggle}
                sx={{ color: isFullScreen ? 'error.main' : 'primary.main' }}
              >
                {isFullScreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
              </IconButton>
            </Tooltip>

            {showExport && (
              <ExportMenu onExport={handleExport} />
            )}
          </Box>
        }
      />
      <CardContent sx={{ p: 0, height: height - 100 }}>
        {geographicData.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="body2" color="text.secondary">No geographic data available</Typography>
          </Box>
        ) : (
          <>
            {/* Information Boxes and Controls */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                {/* Information Boxes */}
                <Stack direction="row" spacing={2}>
                  <Paper elevation={1} sx={{ p: 1.5, minWidth: 100, textAlign: 'center' }}>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {hotspotsCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Hotspots
                    </Typography>
                  </Paper>
                  <Paper elevation={1} sx={{ p: 1.5, minWidth: 100, textAlign: 'center' }}>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {totalViolations}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Violations
                    </Typography>
                  </Paper>
                  <Paper elevation={1} sx={{ p: 1.5, minWidth: 100, textAlign: 'center' }}>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {citiesCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Cities
                    </Typography>
                  </Paper>
                </Stack>

                {/* Heat Radius Slider */}
                {viewMode === 'heatmap' && (
                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Heatmap Radius: {heatRadius}px
                    </Typography>
                    <Slider
                      value={heatRadius}
                      onChange={handleHeatRadiusChange}
                      min={5}
                      max={50}
                      step={1}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Map Container */}
            <Box sx={{ height: height - 200 }}>
              <MapContainer
                key={`normal-${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                
                {/* Map Event Handler for location preservation */}
                <MapEventHandler 
                  onMapMove={(center, zoom) => {
                    setMapCenter(center);
                    setMapZoom(zoom);
                  }}
                  onZoomChange={(zoom) => {
                    setCurrentZoom(zoom);
                  }}
                />
                
                {/* Heatmap Layer */}
                {viewMode === 'heatmap' && (() => {
                  const heatmapData = individualViolationsData.length > 0 ? individualViolationsData : hotspotsData.map(hotspot => ({
                    latitude: hotspot.latitude,
                    longitude: hotspot.longitude,
                    violationCount: hotspot.violationCount,
                    address: hotspot.address,
                    violationTypes: hotspot.violationTypes as ViolationType[]
                  }));
                  
                  console.log('Heatmap data being passed:', heatmapData);
                  console.log('Heatmap config:', heatmapConfig);
                  
                  return (
                    <HeatmapLayer
                      data={heatmapData}
                      radius={heatmapConfig.radius}
                      maxZoom={heatmapConfig.maxZoom}
                      blur={heatmapConfig.blur}
                      gradient={heatmapConfig.gradient}
                      maxIntensity={heatmapConfig.maxIntensity}
                    />
                  );
                })()}

                {/* Hotspot Markers */}
                <HotspotMarkers 
                  hotspots={hotspotsData}
                  showHotspots={showHotspots || viewMode === 'hotspots'}
                />

                {/* Legend */}
                <Box
                  position="absolute"
                  top={10}
                  right={10}
                  bgcolor="rgba(255, 255, 255, 0.9)"
                  p={2}
                  borderRadius={1}
                  boxShadow={2}
                  zIndex={1000}
                >
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    {viewMode === 'heatmap' ? 'Violation Density Heatmap' : 'Hotspots Map'}
                  </Typography>
                  {viewMode === 'heatmap' && (
                    <>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          width={100}
                          height={20}
                          sx={{
                            background: `linear-gradient(to right, ${heatmapGradient[0.0]} 0%, ${heatmapGradient[0.2]} 20%, ${heatmapGradient[0.4]} 40%, ${heatmapGradient[0.6]} 60%, ${heatmapGradient[0.8]} 80%, ${heatmapGradient[1.0]} 100%)`,
                            borderRadius: 1
                          }}
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between" mt={0.5}>
                        <Typography variant="caption">0</Typography>
                        <Box sx={{ width: '50%', textAlign: 'center' }}>
                          <Typography variant="caption">{dynamicMaxIntensity}</Typography>
                        </Box>
                        <Box sx={{ width: '50%' }}></Box>
                      </Box>
                    </>
                  )}
                  {showHotspots && (
                    <Box mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        Click on blue markers (H) to view hotspot details
                      </Typography>
                    </Box>
                  )}
                </Box>
              </MapContainer>
            </Box>
          </>
        )}
      </CardContent>

      {/* Time Range Popover */}
      <Popover
        open={Boolean(timeRangeAnchorEl) && !isFullScreen}
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

      {/* Full Screen Dialog */}
      <Dialog
        open={isFullScreen}
        onClose={handleFullScreenToggle}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
            width: '95vw',
            maxWidth: '95vw',
            m: 0
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              {title} - Full Screen View
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {/* Toggle Buttons */}
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton value="heatmap" aria-label="heatmap">
                  <Layers fontSize="small" />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    Heatmap
                  </Typography>
                </ToggleButton>
                <ToggleButton value="hotspots" aria-label="hotspots">
                  <LocationOn fontSize="small" />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    Hotspots
                  </Typography>
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Hotspot Toggle */}
              <ToggleButton
                value="hotspots"
                selected={showHotspots}
                onChange={() => setShowHotspots(!showHotspots)}
                size="small"
                sx={{ ml: 1 }}
              >
                <LocationOn fontSize="small" />
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {showHotspots ? 'Hide' : 'Show'} Hotspots
                </Typography>
              </ToggleButton>

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

              {/* Full Screen Exit Button */}
              <Tooltip title="Exit full screen">
                <IconButton
                  size="small"
                  onClick={handleFullScreenToggle}
                  sx={{ color: 'error.main' }}
                >
                  <FullscreenExit fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, height: 'calc(90vh - 120px)' }}>
          {geographicData.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography variant="body2" color="text.secondary">No geographic data available</Typography>
            </Box>
          ) : (
            <>
              {/* Information Boxes and Controls */}
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                  {/* Information Boxes */}
                  <Stack direction="row" spacing={2}>
                    <Paper elevation={1} sx={{ p: 1.5, minWidth: 100, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {hotspotsCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Hotspots
                      </Typography>
                    </Paper>
                    <Paper elevation={1} sx={{ p: 1.5, minWidth: 100, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {totalViolations}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Violations
                      </Typography>
                    </Paper>
                    <Paper elevation={1} sx={{ p: 1.5, minWidth: 100, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {citiesCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Cities
                      </Typography>
                    </Paper>
                  </Stack>

                  {/* Heat Radius Slider */}
                  {viewMode === 'heatmap' && (
                    <Box sx={{ minWidth: 200 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Heatmap Radius: {heatRadius}px
                      </Typography>
                      <Slider
                        value={heatRadius}
                        onChange={handleHeatRadiusChange}
                        min={5}
                        max={50}
                        step={1}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* Full Screen Map Container */}
              <Box sx={{ height: 'calc(90vh - 180px)', minHeight: '400px' }}>
                <MapContainer
                  key={`fullscreen-${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  
                  {/* Map Event Handler for location preservation */}
                  <MapEventHandler 
                    onMapMove={(center, zoom) => {
                      setMapCenter(center);
                      setMapZoom(zoom);
                    }}
                    onZoomChange={(zoom) => {
                      setCurrentZoom(zoom);
                    }}
                  />
                  
                  {/* Heatmap Layer */}
                  {viewMode === 'heatmap' && (
                    <HeatmapLayer
                      data={individualViolationsData}
                      radius={heatmapConfig.radius}
                      maxZoom={heatmapConfig.maxZoom}
                      blur={heatmapConfig.blur}
                      gradient={heatmapConfig.gradient}
                      maxIntensity={heatmapConfig.maxIntensity}
                    />
                  )}

                  {/* Hotspot Markers */}
                  <HotspotMarkers 
                    hotspots={hotspotsData}
                    showHotspots={showHotspots || viewMode === 'hotspots'}
                  />

                  {/* Legend */}
                  <Box
                    position="absolute"
                    top={10}
                    right={10}
                    bgcolor="rgba(255, 255, 255, 0.9)"
                    p={2}
                    borderRadius={1}
                    boxShadow={2}
                    zIndex={1000}
                  >
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      {viewMode === 'heatmap' ? 'Violation Density Heatmap' : 'Hotspots Map'}
                    </Typography>
                    {viewMode === 'heatmap' && (
                      <>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            width={100}
                            height={20}
                            sx={{
                              background: `linear-gradient(to right, ${heatmapGradient[0.0]} 0%, ${heatmapGradient[0.2]} 20%, ${heatmapGradient[0.4]} 40%, ${heatmapGradient[0.6]} 60%, ${heatmapGradient[0.8]} 80%, ${heatmapGradient[1.0]} 100%)`,
                              borderRadius: 1
                            }}
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between" mt={0.5}>
                          <Typography variant="caption">0</Typography>
                          <Box sx={{ width: '50%', textAlign: 'center' }}>
                            <Typography variant="caption">{dynamicMaxIntensity}</Typography>
                          </Box>
                          <Box sx={{ width: '50%' }}></Box>
                        </Box>
                      </>
                    )}
                    {showHotspots && (
                      <Box mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          Click on blue markers (H) to view hotspot details
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </MapContainer>
              </Box>
            </>
          )}
        </DialogContent>

        {/* Full Screen Time Range Popover */}
        <Popover
          open={Boolean(timeRangeAnchorEl) && isFullScreen}
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
          container={() => document.querySelector('[role="dialog"]') || document.body}
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
      </Dialog>
    </Card>
  );
};

export default GeographicHeatmap;
