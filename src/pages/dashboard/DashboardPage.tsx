import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Container, 
  Grid, 
  Typography, 
  Box, 
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Refresh,
  Dashboard as DashboardIcon,
  TrendingUp,
  Map,
  People,
  Assessment,
  PictureAsPdf,
  TableChart,
  Download
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import { store } from '../../store';
import { 
  fetchDashboardStats, 
  fetchViolationTypeStats, 
  fetchGeographicStats, 
  fetchOfficerPerformance 
} from '../../store/slices/dashboardSlice';
import { useNotification } from '../../hooks/useNotification';
import ExportMenu from '../../components/common/ExportMenu';
import GlobalTimeRange from '../../components/common/GlobalTimeRange';
import { ExportService } from '../../shared/utils/export';
import html2canvas from 'html2canvas';

// Dashboard Components
import DashboardStats from '../../components/dashboard/DashboardStats';
import ViolationTypeChart from '../../components/charts/ViolationTypeChart';
import TrendChart from '../../components/charts/TrendChart';
import GeographicHeatmap from '../../components/charts/GeographicHeatmap';
import OfficerPerformanceChart from '../../components/charts/OfficerPerformanceChart';
import StatusDistributionChart from '../../components/charts/StatusDistributionChart';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { showNotification } = useNotification();
  const [tabValue, setTabValue] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { isLoading: loading, error } = useAppSelector(state => state.dashboard);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        dispatch(fetchDashboardStats()).unwrap(),
        dispatch(fetchViolationTypeStats()).unwrap(),
        dispatch(fetchGeographicStats()).unwrap(),
        dispatch(fetchOfficerPerformance()).unwrap()
      ]);
      setLastUpdated(new Date());
      showNotification('success', 'Success', 'Dashboard data refreshed successfully');
    } catch (error) {
      console.error('DashboardPage: Failed to load dashboard data:', error);
      showNotification('error', 'Error', 'Failed to load dashboard data');
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, showNotification]); // Keep dependencies but we'll handle the infinite loop differently

  // Use a ref to track if data has been loaded initially
  const hasLoadedInitialData = useRef(false);

  useEffect(() => {
    if (!hasLoadedInitialData.current) {
      loadDashboardData();
      hasLoadedInitialData.current = true;
    }
  }, [loadDashboardData]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

     const dashboardRef = useRef<HTMLDivElement>(null);
   const overviewTabRef = useRef<HTMLDivElement>(null);
   const trendsTabRef = useRef<HTMLDivElement>(null);
   const geographicTabRef = useRef<HTMLDivElement>(null);
   const performanceTabRef = useRef<HTMLDivElement>(null);

    const handleExport = async (format: 'pdf' | 'png' | 'csv') => {
    console.log(`Starting ${format} export...`);
    setIsExporting(true);
    try {
      // Get dashboard data from Redux store using the store instance
      const dashboardStats = store.getState().dashboard;
      console.log('Dashboard stats:', dashboardStats);
      
      if (format === 'csv') {
        console.log('Exporting as CSV...');
        // Create comprehensive dashboard CSV export
        const exportData = {
          title: 'Dashboard Summary',
          headers: ['Metric', 'Value', 'Description'],
          rows: [
            ['Total Reports', dashboardStats.stats?.totalReports || 0, 'Total violation reports in system'],
            ['Pending Reports', dashboardStats.stats?.pendingReports || 0, 'Reports awaiting review'],
            ['Approved Today', dashboardStats.stats?.approvedToday || 0, 'Reports approved today'],
            ['Rejected Today', dashboardStats.stats?.rejectedToday || 0, 'Reports rejected today'],
            ['Processed Today', dashboardStats.stats?.processedToday || 0, 'Reports processed today'],
            ['Average Processing Time', `${dashboardStats.stats?.averageProcessingTime || 0}m`, 'Average time to process reports'],
            ['Top Violation Types', dashboardStats.stats?.topViolationTypes?.length || 0, 'Number of violation types tracked'],
            ['Geographic Locations', dashboardStats.stats?.geographicStats?.length || 0, 'Cities with violation reports'],
            ['Last Updated', new Date().toLocaleString(), 'Dashboard data timestamp']
          ],
          summary: [
            { label: 'Export Type', value: 'Dashboard Summary' },
            { label: 'Generated On', value: new Date().toLocaleDateString() }
          ],
          timestamp: new Date()
        };

        console.log('CSV export data:', exportData);
        await ExportService.exportAsCSV(exportData);
        console.log('CSV export completed successfully');
        showNotification('success', 'Export Success', 'Dashboard exported as CSV successfully');
      } else if (format === 'png') {
        console.log('Exporting as PNG...');
        if (!dashboardRef.current) {
          throw new Error('Dashboard container not found');
        }

        await ExportService.exportAsPNG({
          element: dashboardRef.current,
          filename: 'dashboard_summary',
          title: 'Traffic Police Dashboard',
          subtitle: 'Real-time monitoring and analytics'
        });
        console.log('PNG export completed successfully');
        showNotification('success', 'Export Success', 'Dashboard exported as PNG successfully');
      } else if (format === 'pdf') {
        console.log('Exporting as PDF...');
        showNotification('info', 'Export Started', 'Capturing all dashboard charts for PDF export. This may take a moment...');
        
        // Store current tab to restore later
        const currentTab = tabValue;
        
        // Capture all chart images first
        const chartImages: { title: string; dataUrl: string }[] = [];
        
                 try {
           // Simplified approach - just wait for charts to render
           console.log('Waiting for charts to render...');
           await new Promise(resolve => setTimeout(resolve, 3000));
           
           // Force a re-render
           window.dispatchEvent(new Event('resize'));
           await new Promise(resolve => setTimeout(resolve, 2000));

                                // Capture Overview Tab Charts individually
                         if (overviewTabRef.current) {
               console.log('Capturing Overview tab...');
               
                                try {
                   // Simple approach - try to capture the entire overview tab
                   console.log('Attempting to capture overview tab...');
                   
                   // Debug: Check what's in the overview tab
                   console.log('Overview tab ref:', overviewTabRef.current);
                   if (overviewTabRef.current) {
                     console.log('Overview tab children:', overviewTabRef.current.children.length);
                     console.log('Overview tab innerHTML length:', overviewTabRef.current.innerHTML.length);
                     
                     // Check for chart elements
                     const svgElements = overviewTabRef.current.querySelectorAll('svg');
                     const canvasElements = overviewTabRef.current.querySelectorAll('canvas');
                     console.log(`Found ${svgElements.length} SVG elements and ${canvasElements.length} canvas elements`);
                     
                     // Try to capture individual charts first
                     const chartContainers = overviewTabRef.current.querySelectorAll('[data-chart-container]');
                     console.log(`Found ${chartContainers.length} chart containers`);
                     
                     for (let i = 0; i < chartContainers.length; i++) {
                       const container = chartContainers[i] as HTMLElement;
                       const title = container.getAttribute('data-chart-title') || `Chart ${i + 1}`;
                       console.log(`Attempting to capture ${title}...`);
                       
                       try {
                         const chartCanvas = await html2canvas(container, {
                           useCORS: true,
                           allowTaint: true,
                           backgroundColor: '#ffffff',
                           scale: 1.0,
                           logging: true,
                           width: 600,
                           height: 400
                         });
                         
                         const dataUrl = chartCanvas.toDataURL('image/png', 1.0);
                         console.log(`${title} captured successfully:`, {
                           canvasDimensions: `${chartCanvas.width}x${chartCanvas.height}`,
                           dataUrlLength: dataUrl.length
                         });
                         
                         chartImages.push({
                           title: title,
                           dataUrl: dataUrl
                         });
                         
                       } catch (error) {
                         console.error(`Failed to capture ${title}:`, error);
                       }
                     }
                     
                     // If no individual charts were captured, try the overview tab
                     if (chartImages.length === 0) {
                       console.log('No individual charts captured, trying overview tab...');
                       
                       try {
                         const overviewCanvas = await html2canvas(overviewTabRef.current, {
                           useCORS: true,
                           allowTaint: true,
                           backgroundColor: '#ffffff',
                           scale: 1.0,
                           logging: true,
                           width: 1200,
                           height: 800
                         });
                         
                         const dataUrl = overviewCanvas.toDataURL('image/png', 1.0);
                         console.log('Overview tab captured successfully:', {
                           canvasDimensions: `${overviewCanvas.width}x${overviewCanvas.height}`,
                           dataUrlLength: dataUrl.length
                         });
                         
                         chartImages.push({
                           title: 'Dashboard Overview',
                           dataUrl: dataUrl
                         });
                         
                       } catch (error) {
                         console.error('Failed to capture overview tab:', error);
                         console.error('Error details:', error);
                       }
                     }
                   } else {
                     console.warn('Overview tab ref not found');
                   }
                 } catch (error) {
                   console.error('Failed to capture Overview tab charts:', error);
                 }
            } else {
              console.warn('Overview tab ref not found');
            }

                     // For now, just capture the overview tab to keep it simple
           console.log('Skipping other tabs for now, focusing on overview tab...');

          

                     // Restore original tab
           setTabValue(currentTab);
           
           console.log('=== CHART CAPTURE SUMMARY ===');
           console.log('Total charts captured:', chartImages.length);
           console.log('Captured chart titles:', chartImages.map(img => img.title));
           console.log('Chart data URLs:', chartImages.map(img => ({
             title: img.title,
             dataUrlLength: img.dataUrl.length,
             dataUrlPreview: img.dataUrl.substring(0, 100) + '...'
           })));
           console.log('=== END CHART CAPTURE SUMMARY ===');
          
                     if (chartImages.length === 0) {
             console.warn('No charts were captured! This is unexpected.');
           } else {
             console.log(`Successfully captured ${chartImages.length} chart(s)`);
           }
          
          // Create comprehensive dashboard PDF export with charts
          const exportData = {
            title: 'Traffic Police Dashboard Report',
            headers: ['Metric', 'Value', 'Description'],
            rows: [
              ['Total Reports', dashboardStats.stats?.totalReports || 0, 'Total violation reports in system'],
              ['Pending Reports', dashboardStats.stats?.pendingReports || 0, 'Reports awaiting review'],
              ['Approved Today', dashboardStats.stats?.approvedToday || 0, 'Reports approved today'],
              ['Rejected Today', dashboardStats.stats?.rejectedToday || 0, 'Reports rejected today'],
              ['Processed Today', dashboardStats.stats?.processedToday || 0, 'Reports processed today'],
              ['Average Processing Time', `${dashboardStats.stats?.averageProcessingTime || 0}m`, 'Average time to process reports'],
              ['Top Violation Types', dashboardStats.stats?.topViolationTypes?.length || 0, 'Number of violation types tracked'],
              ['Geographic Locations', dashboardStats.stats?.geographicStats?.length || 0, 'Cities with violation reports'],
              ['Last Updated', new Date().toLocaleString(), 'Dashboard data timestamp']
            ],
            summary: [
              { label: 'Export Type', value: 'Dashboard Summary Report' },
              { label: 'Generated On', value: new Date().toLocaleDateString() },
              { label: 'Total Metrics', value: '9 Key Performance Indicators' },
              { label: 'Charts Included', value: `${chartImages.length} Dashboard Sections` }
            ],
            timestamp: new Date(),
            chartImages: chartImages
          };

          console.log('PDF export data with charts:', exportData);
          console.log('About to call ExportService.exportAsPDF...');
          
          try {
            await ExportService.exportAsPDF(exportData);
            console.log('PDF export completed successfully');
            showNotification('success', 'Export Success', 'Dashboard exported as PDF successfully');
          } catch (exportError) {
            console.error('PDF export failed:', exportError);
            showNotification('error', 'Export Failed', 'Failed to export dashboard as PDF');
            throw exportError;
          }
        } catch (error) {
          console.error('Chart capture failed:', error);
          // Restore original tab
          setTabValue(currentTab);
          
          // Fallback to basic PDF without charts
          const exportData = {
            title: 'Traffic Police Dashboard Report',
            headers: ['Metric', 'Value', 'Description'],
            rows: [
              ['Total Reports', dashboardStats.stats?.totalReports || 0, 'Total violation reports in system'],
              ['Pending Reports', dashboardStats.stats?.pendingReports || 0, 'Reports awaiting review'],
              ['Approved Today', dashboardStats.stats?.approvedToday || 0, 'Reports approved today'],
              ['Rejected Today', dashboardStats.stats?.rejectedToday || 0, 'Reports rejected today'],
              ['Processed Today', dashboardStats.stats?.processedToday || 0, 'Reports processed today'],
              ['Average Processing Time', `${dashboardStats.stats?.averageProcessingTime || 0}m`, 'Average time to process reports'],
              ['Top Violation Types', dashboardStats.stats?.topViolationTypes?.length || 0, 'Number of violation types tracked'],
              ['Geographic Locations', dashboardStats.stats?.geographicStats?.length || 0, 'Cities with violation reports'],
              ['Last Updated', new Date().toLocaleString(), 'Dashboard data timestamp']
            ],
            summary: [
              { label: 'Export Type', value: 'Dashboard Summary Report' },
              { label: 'Generated On', value: new Date().toLocaleDateString() },
              { label: 'Total Metrics', value: '9 Key Performance Indicators' }
            ],
            timestamp: new Date()
          };
          await ExportService.exportAsPDF(exportData);
          showNotification('success', 'Export Success', 'Dashboard exported as PDF (basic version)');
        }
      }
    } catch (error) {
      console.error('Dashboard export failed:', error);
      showNotification('error', 'Export Failed', `Failed to export dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const getTabIcon = (index: number) => {
    switch (index) {
      case 0: return <DashboardIcon />;
      case 1: return <TrendingUp />;
      case 2: return <Map />;
      case 3: return <People />;
      case 4: return <Assessment />;
      default: return <DashboardIcon />;
    }
  };

  if (loading && !isRefreshing) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }} ref={dashboardRef}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Traffic Police Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time monitoring and analytics for traffic violation management
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          <Chip 
            label={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
            size="small"
            variant="outlined"
          />
          <GlobalTimeRange />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDashboardData}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
                     <ExportMenu onExport={handleExport} disabled={loading || isExporting} />
            {isExporting && (
              <Chip 
                label="Exporting PDF..."
                size="small"
                color="primary"
                icon={<CircularProgress size={16} />}
              />
            )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Dashboard Stats */}
      <Box mb={3}>
        <DashboardStats />
      </Box>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label="Overview" 
            icon={getTabIcon(0)} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            label="Trends" 
            icon={getTabIcon(1)} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            label="Geographic" 
            icon={getTabIcon(2)} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            label="Performance" 
            icon={getTabIcon(3)} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          
        </Tabs>

                           {/* Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            <div ref={overviewTabRef}>
              <Grid container spacing={3}>
                <Grid item xs={12} lg={6}>
                  <div data-chart-container data-chart-title="Violation Type Distribution">
                    <ViolationTypeChart 
                      title="Violation Type Distribution"
                      height={400}
                      isVisible={tabValue === 0}
                    />
                  </div>
                </Grid>
                <Grid item xs={12} lg={6}>
                  <div data-chart-container data-chart-title="Report Status Distribution">
                    <StatusDistributionChart 
                      title="Report Status Distribution"
                      height={400}
                      isVisible={tabValue === 0}
                    />
                  </div>
                </Grid>
              </Grid>
            </div>
          </TabPanel>

                 {/* Trends Tab */}
         <TabPanel value={tabValue} index={1}>
           <div ref={trendsTabRef}>
             <Grid container spacing={3}>
               <Grid item xs={12}>
                 <TrendChart 
                   title="Violation Trends Analysis"
                   height={500}
                   defaultPeriod="monthly"
                 />
               </Grid>
               <Grid item xs={12}>
                 <div data-chart-container data-chart-title="Weekly Violation Trends">
                   <TrendChart 
                     title="Weekly Violation Trends"
                     height={400}
                     defaultPeriod="weekly"
                   />
                 </div>
               </Grid>
             </Grid>
           </div>
         </TabPanel>

        {/* Geographic Tab */}
        <TabPanel value={tabValue} index={2}>
          <div ref={geographicTabRef}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <GeographicHeatmap 
                  title="Geographic Violation Distribution"
                  height={600}
                  isVisible={tabValue === 2}
                />
              </Grid>
            </Grid>
          </div>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={tabValue} index={3}>
          <div ref={performanceTabRef}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                                 <OfficerPerformanceChart 
                   title="Officer Performance Metrics"
                   height={600}
                 />
              </Grid>
              <Grid item xs={12} lg={6}>
                <TrendChart 
                  title="Processing Time Trends"
                  height={400}
                  defaultPeriod="weekly"
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <StatusDistributionChart 
                  title="Approval vs Rejection Rates"
                  height={400}
                  isVisible={tabValue === 3}
                />
              </Grid>
            </Grid>
          </div>
        </TabPanel>

        
      </Paper>

      {/* Quick Actions */}
      <Box mt={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={() => handleExport('pdf')}
            >
              Export PDF Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<TableChart />}
              onClick={() => handleExport('csv')}
            >
              Export CSV Data
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExport('png')}
            >
              Export PNG Screenshot
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default DashboardPage;
