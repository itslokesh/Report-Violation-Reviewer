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
          // Helper function to wait for charts to be fully rendered
          const waitForChartsToRender = async (tabIndex: number) => {
            // Switch to the tab
            setTabValue(tabIndex);
            
            // Wait for tab switch animation and chart rendering
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Additional wait for charts to fully render
            await new Promise(resolve => setTimeout(resolve, 4000));
            
            // Force a re-render by triggering window resize
            window.dispatchEvent(new Event('resize'));
            
            // Wait a bit more for resize to take effect
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Additional wait for any async chart loading
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Force another resize to ensure all charts are fully rendered
            window.dispatchEvent(new Event('resize'));
            await new Promise(resolve => setTimeout(resolve, 2000));
          };

                                // Capture Overview Tab Charts individually
            if (overviewTabRef.current) {
              console.log('Capturing Overview tab charts individually...');
              await waitForChartsToRender(0);
              
              try {
                // Find individual chart containers within the overview tab
                const chartContainers = overviewTabRef.current.querySelectorAll('[data-chart-container]');
                console.log('Found chart containers:', chartContainers.length);
                
                if (chartContainers.length > 0) {
                  // Capture each chart individually
                  for (let i = 0; i < chartContainers.length; i++) {
                    const container = chartContainers[i] as HTMLElement;
                    const chartTitle = container.getAttribute('data-chart-title') || `Chart ${i + 1}`;
                    
                    try {
                      // Wait a bit more for this specific chart to render
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      
                      const chartCanvas = await html2canvas(container, {
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        scale: 2, // Higher resolution
                        logging: false,
                        width: container.offsetWidth,
                        height: container.offsetHeight,
                        scrollX: 0,
                        scrollY: 0,
                        windowWidth: container.offsetWidth,
                        windowHeight: container.offsetHeight
                      });
                      
                      chartImages.push({
                        title: chartTitle,
                        dataUrl: chartCanvas.toDataURL('image/png', 1.0)
                      });
                      console.log(`Captured chart: ${chartTitle}`);
                    } catch (chartError) {
                      console.error(`Failed to capture chart ${chartTitle}:`, chartError);
                    }
                  }
                } else {
                  console.log('No individual chart containers found, trying to capture specific charts...');
                  
                  // Try to capture specific charts by finding their containers
                  const violationTypeChart = overviewTabRef.current.querySelector('.MuiCard-root') as HTMLElement;
                  if (violationTypeChart) {
                    try {
                      const chartCanvas = await html2canvas(violationTypeChart, {
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        scale: 2,
                        logging: false,
                        width: violationTypeChart.offsetWidth,
                        height: violationTypeChart.offsetHeight,
                        scrollX: 0,
                        scrollY: 0,
                        windowWidth: violationTypeChart.offsetWidth,
                        windowHeight: violationTypeChart.offsetHeight
                      });
                      
                      chartImages.push({
                        title: 'Violation Type Distribution',
                        dataUrl: chartCanvas.toDataURL('image/png', 1.0)
                      });
                      console.log('Captured Violation Type Distribution chart');
                    } catch (error) {
                      console.error('Failed to capture Violation Type Distribution chart:', error);
                    }
                  }
                  
                  // Try to capture the second chart (Status Distribution)
                  const allCards = overviewTabRef.current.querySelectorAll('.MuiCard-root');
                  if (allCards.length > 1) {
                    try {
                      const statusChart = allCards[1] as HTMLElement;
                      const chartCanvas = await html2canvas(statusChart, {
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        scale: 2,
                        logging: false,
                        width: statusChart.offsetWidth,
                        height: statusChart.offsetHeight,
                        scrollX: 0,
                        scrollY: 0,
                        windowWidth: statusChart.offsetWidth,
                        windowHeight: statusChart.offsetHeight
                      });
                      
                      chartImages.push({
                        title: 'Report Status Distribution',
                        dataUrl: chartCanvas.toDataURL('image/png', 1.0)
                      });
                      console.log('Captured Report Status Distribution chart');
                    } catch (error) {
                      console.error('Failed to capture Report Status Distribution chart:', error);
                    }
                  }
                  
                  // Try to capture the third chart (Weekly Trends)
                  if (allCards.length > 2) {
                    try {
                      const trendsChart = allCards[2] as HTMLElement;
                      const chartCanvas = await html2canvas(trendsChart, {
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        scale: 2,
                        logging: false,
                        width: trendsChart.offsetWidth,
                        height: trendsChart.offsetHeight,
                        scrollX: 0,
                        scrollY: 0,
                        windowWidth: trendsChart.offsetWidth,
                        windowHeight: trendsChart.offsetHeight
                      });
                      
                      chartImages.push({
                        title: 'Weekly Violation Trends',
                        dataUrl: chartCanvas.toDataURL('image/png', 1.0)
                      });
                      console.log('Captured Weekly Violation Trends chart');
                    } catch (error) {
                      console.error('Failed to capture Weekly Violation Trends chart:', error);
                    }
                  }
                  
                  // If still no charts captured, fallback to entire overview tab
                  if (chartImages.length === 0) {
                    const overviewCanvas = await html2canvas(overviewTabRef.current, {
                      useCORS: true,
                      allowTaint: true,
                      backgroundColor: '#ffffff',
                      scale: 2,
                      logging: false,
                      width: overviewTabRef.current.offsetWidth,
                      height: overviewTabRef.current.offsetHeight,
                      scrollX: 0,
                      scrollY: 0,
                      windowWidth: overviewTabRef.current.offsetWidth,
                      windowHeight: overviewTabRef.current.offsetHeight
                    });
                    chartImages.push({
                      title: 'Overview - All Charts',
                      dataUrl: overviewCanvas.toDataURL('image/png', 1.0)
                    });
                    console.log('Overview tab captured as final fallback');
                  }
                }
              } catch (error) {
                console.error('Failed to capture Overview tab charts:', error);
              }
            } else {
              console.warn('Overview tab ref not found');
            }

          // Capture Trends tab charts
          if (trendsTabRef.current) {
            console.log('Capturing Trends tab charts...');
            await waitForChartsToRender(1);
            
                         try {
               const trendsCanvas = await html2canvas(trendsTabRef.current, {
                 useCORS: true,
                 allowTaint: true,
                 backgroundColor: '#ffffff',
                 scale: 2,
                 logging: false,
                 width: trendsTabRef.current.offsetWidth,
                 height: trendsTabRef.current.offsetHeight,
                 scrollX: 0,
                 scrollY: 0,
                 windowWidth: trendsTabRef.current.offsetWidth,
                 windowHeight: trendsTabRef.current.offsetHeight
               });
              chartImages.push({
                title: 'Trends - Violation Trends Analysis',
                dataUrl: trendsCanvas.toDataURL('image/png', 1.0)
              });
              console.log('Trends tab captured successfully');
            } catch (error) {
              console.error('Failed to capture Trends tab:', error);
            }
          } else {
            console.warn('Trends tab ref not found');
          }

          // Capture Geographic tab charts
          if (geographicTabRef.current) {
            console.log('Capturing Geographic tab charts...');
            await waitForChartsToRender(2);
            
            try {
              // Additional wait specifically for Geographic tab charts
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              const geographicCanvas = await html2canvas(geographicTabRef.current, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                width: geographicTabRef.current.scrollWidth,
                height: geographicTabRef.current.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                windowWidth: geographicTabRef.current.scrollWidth,
                windowHeight: geographicTabRef.current.scrollHeight
              });
              chartImages.push({
                title: 'Geographic - Violation Distribution Map',
                dataUrl: geographicCanvas.toDataURL('image/png', 1.0)
              });
              console.log('Geographic tab captured successfully');
            } catch (error) {
              console.error('Failed to capture Geographic tab:', error);
            }
          } else {
            console.warn('Geographic tab ref not found');
          }

          // Capture Performance tab charts
          if (performanceTabRef.current) {
            console.log('Capturing Performance tab charts...');
            await waitForChartsToRender(3);
            
            try {
              const performanceCanvas = await html2canvas(performanceTabRef.current, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                width: performanceTabRef.current.scrollWidth,
                height: performanceTabRef.current.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                windowWidth: performanceTabRef.current.scrollWidth,
                windowHeight: performanceTabRef.current.scrollHeight
              });
              chartImages.push({
                title: 'Performance - Officer Performance Metrics',
                dataUrl: performanceCanvas.toDataURL('image/png', 1.0)
              });
              console.log('Performance tab captured successfully');
            } catch (error) {
              console.error('Failed to capture Performance tab:', error);
            }
          } else {
            console.warn('Performance tab ref not found');
          }

          

          // Restore original tab
          setTabValue(currentTab);
          
          console.log('All charts captured:', chartImages.length);
          console.log('Captured chart titles:', chartImages.map(img => img.title));
          
          if (chartImages.length < 5) {
            console.warn(`Expected 5 charts but only captured ${chartImages.length}. Some charts may not have loaded properly.`);
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
          await ExportService.exportAsPDF(exportData);
          console.log('PDF export completed successfully');
          showNotification('success', 'Export Success', 'Dashboard exported as PDF successfully');
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
                  maxOfficers={15}
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
