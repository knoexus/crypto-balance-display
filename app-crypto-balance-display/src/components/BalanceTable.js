import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

export default function BalanceTable({balances}) {
    return (
        <TableContainer component={Paper}>
        <Table size="small" aria-label="a dense table">
            <TableHead>
            <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Balance</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {
                Object.entries(balances).map(([key, value], idx) => 
                    <TableRow key={idx}>
                        <TableCell>{key}</TableCell>
                        <TableCell>{value ?? 'unknown'}</TableCell>
                    </TableRow>
                )
            }
            </TableBody>
        </Table>
        </TableContainer>
    )
}
