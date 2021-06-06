import React, { Fragment, useState } from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'
import useStyles from './mui_styles/tableHead'
import Loading from './Loading'
import addresses from '../addresses.js'
import { ChainId, Fetcher, Route, WETH } from '@uniswap/sdk'

export default function UniswapRatesTable({web3, anchor_token_symbol, init_state}) {
    const [loadingRates, changeLoadingRates] = useState(false)
    const [rates, changeRates] = useState(init_state)

    const getExchangeRateERC20_ERC_20 = async (symbol_of, symbol_for) => {
        const SWAP_OF = await Fetcher.fetchTokenData(ChainId.MAINNET, addresses[symbol_of])
        const SWAP_FOR = await Fetcher.fetchTokenData(ChainId.MAINNET, addresses[symbol_for])
        
        const pair = await Fetcher.fetchPairData(SWAP_FOR, SWAP_OF)
        const route = new Route([pair], SWAP_OF)

        return route.midPrice.toSignificant(6)
    }

    const getExchangeRateETH_ERC_20 = async (symbol_for) => {
        const SWAP_FOR = await Fetcher.fetchTokenData(ChainId.MAINNET, addresses[symbol_for])
        const pair = await Fetcher.fetchPairData(SWAP_FOR, WETH[SWAP_FOR.chainId])
        const route = new Route([pair], WETH[SWAP_FOR.chainId])
        return route.midPrice.toSignificant(6)
    }

    const getExchangeRates = async (swap_token_symbol) => {
        try {
            changeLoadingRates(true)
            const DAI_SWAP = await getExchangeRateERC20_ERC_20("DAI", swap_token_symbol)
            const USDC_SWAP = await getExchangeRateERC20_ERC_20("USDC", swap_token_symbol)
            const ETH_SWAP = await getExchangeRateETH_ERC_20(swap_token_symbol)
            changeRates({
                "ETH": ETH_SWAP,
                "USDC": USDC_SWAP,
                "DAI": DAI_SWAP
            })
            changeLoadingRates(false)
        }
        catch {
            changeLoadingRates(false)
            alert("Error while executing swap rates calculation.")
        }
    }

    const classes = useStyles()
    return (
        <Fragment>
            <button className="button__show-swap-rates" onClick={() => getExchangeRates(anchor_token_symbol)}>{loadingRates ? <Loading className="loading-show-swap-rates"/> : "Display Exchange Rates"}</button>
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
