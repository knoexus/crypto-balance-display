import React, { Fragment } from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'
import useStyles from './mui_styles/tableHead'

export default function UniswapRatesTable({anchor_token_symbol, rates}) {
    const classes = useStyles()
    return (
        <Fragment>
            <h4 className="h4__table-name">Uniswap Rates</h4>
            <TableContainer component={Paper}>
            <Table size="small" aria-label="a dense table">
                <TableHead className={classes.tableHead}>
                <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Rate in {anchor_token_symbol}</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {
                    Object.entries(rates).map(([key, value], idx) => 
                        <TableRow key={idx}>
                            <TableCell>{key}</TableCell>
                            <TableCell>{value ?? 'Unknown'}</TableCell>
                        </TableRow>
                    )
                }
                </TableBody>
            </Table>
            </TableContainer>
        </Fragment>
    )
}
