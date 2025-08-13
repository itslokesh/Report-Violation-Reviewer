import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const ReportsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Violation Reports
      </Typography>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Report ID</TableCell>
                <TableCell>Violation Type</TableCell>
                <TableCell>Vehicle Number</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>#12345678</TableCell>
                <TableCell>Speeding</TableCell>
                <TableCell>MH12AB1234</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell>2024-01-15</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ReportsPage;
