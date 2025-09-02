import React, { useRef } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import ExportMenu from '../../components/common/ExportMenu';
import { ExportService } from '../../shared/utils/export';

const ChallansPage: React.FC = () => {
  const challansRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  const challans = [
    {
      id: 'CH123456',
      vehicleNumber: 'MH12AB1234',
      violationType: 'Speeding',
      fineAmount: 1000,
      status: 'Issued',
      date: '2024-01-15'
    }
  ];

  const handleExport = async (format: 'pdf' | 'png' | 'csv') => {
    if (format === 'csv') {
      const exportData = {
        title: 'Challans',
        headers: ['Challan ID', 'Vehicle Number', 'Violation Type', 'Fine Amount', 'Status', 'Date'],
        rows: challans.map(challan => [
          challan.id,
          challan.vehicleNumber,
          challan.violationType,
          `₹${challan.fineAmount}`,
          challan.status,
          challan.date
        ]),
        summary: [
          { label: 'Total Challans', value: challans.length },
          { label: 'Total Fine Amount', value: `₹${challans.reduce((sum, c) => sum + c.fineAmount, 0)}` }
        ],
        timestamp: new Date()
      };

      await ExportService.exportAsCSV(exportData);
    } else if (format === 'png') {
      if (!challansRef.current) {
        throw new Error('Challans container not found');
      }

      await ExportService.exportAsPNG({
        element: challansRef.current,
        filename: 'challans',
        title: 'Challans',
        subtitle: 'Traffic Violation Challans'
      });
    } else if (format === 'pdf') {
      const exportData = {
        title: 'Challans Report',
        headers: ['Challan ID', 'Vehicle Number', 'Violation Type', 'Fine Amount', 'Status', 'Date'],
        rows: challans.map(challan => [
          challan.id,
          challan.vehicleNumber,
          challan.violationType,
          `₹${challan.fineAmount}`,
          challan.status,
          challan.date
        ]),
        summary: [
          { label: 'Total Challans', value: challans.length },
          { label: 'Total Fine Amount', value: `₹${challans.reduce((sum, c) => sum + c.fineAmount, 0)}` }
        ],
        timestamp: new Date()
      };

      await ExportService.exportAsPDF(exportData);
    }
  };

  return (
    <Box ref={challansRef}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4" gutterBottom>
          Challans
        </Typography>
        <ExportMenu onExport={handleExport} disabled={challans.length === 0} />
      </Box>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Challan ID</TableCell>
                <TableCell>Vehicle Number</TableCell>
                <TableCell>Violation Type</TableCell>
                <TableCell>Fine Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>#CH123456</TableCell>
                <TableCell>MH12AB1234</TableCell>
                <TableCell>Speeding</TableCell>
                <TableCell>₹1000</TableCell>
                <TableCell>Issued</TableCell>
                <TableCell>2024-01-15</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ChallansPage;
