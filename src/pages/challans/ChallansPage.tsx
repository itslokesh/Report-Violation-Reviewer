import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const ChallansPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Challans
      </Typography>
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
