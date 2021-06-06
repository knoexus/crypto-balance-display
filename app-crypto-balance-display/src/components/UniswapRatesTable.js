import React, { Fragment, useState } from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'
import ToggleButton from '@material-ui/lab/ToggleButton'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'

import useStyles from './mui_styles/tableHead'
import Loading from './Loading'
import {addresses, uniswap_addresses} from '../addresses.js'
import abis from '../abis.js'
import { ChainId, Fetcher, Route, WETH } from '@uniswap/sdk'


export default function UniswapRatesTable({web3, anchor_token_symbol, init_state}) {
    const [loadingRates, changeLoadingRates] = useState(false)
    const [rates, changeRates] = useState(init_state)

    const [fetchMethod, changeFetchMethod] = React.useState('sdk')

    const handleFetchMethod = (e, newFetchMethod) => {
        changeFetchMethod(newFetchMethod)
    }

    const getExchangeRateERC20_ERC20__sdk = async (symbol_of, symbol_for) => {
        const SWAP_OF = await Fetcher.fetchTokenData(ChainId.MAINNET, addresses[symbol_of])
        const SWAP_FOR = await Fetcher.fetchTokenData(ChainId.MAINNET, addresses[symbol_for])
        
        const pair = await Fetcher.fetchPairData(SWAP_FOR, SWAP_OF)
        const route = new Route([pair], SWAP_OF)

        return route.midPrice.toSignificant(6)
    }

    const getExchangeRateETH_ERC20__sdk = async (symbol_for) => {
        const SWAP_FOR = await Fetcher.fetchTokenData(ChainId.MAINNET, addresses[symbol_for])
        const pair = await Fetcher.fetchPairData(SWAP_FOR, WETH[SWAP_FOR.chainId])
        const route = new Route([pair], WETH[SWAP_FOR.chainId])
        return route.midPrice.toSignificant(6)
    }

    // web3 implementation
    const getFactoryContract = async () => {
        const factoryAddress = uniswap_addresses["uniswap_factory"]
        const factoryABI = abis["uniswap_factory_abi"]
        const factoryContract = await new web3.eth.Contract(factoryABI, factoryAddress)
        return factoryContract
    }

    const getExchangeRateERC20_ERC20__web3 = async (symbol_of, symbol_for) => {
        const factoryContract = await getFactoryContract()

        // tokenA
        const tokenABI_of = abis[`${symbol_of}_abi`]
        const tokenAddress_of = addresses[symbol_of]
        const tokenContract_of = await new web3.eth.Contract(tokenABI_of, tokenAddress_of)
        const exchangeAddress_of = await factoryContract.methods.getExchange(tokenAddress_of).call()
        // tokenB
        const tokenABI_for = abis[`${symbol_for}_abi`]
        const tokenAddress_for = addresses[symbol_for]
        const tokenContract_for = await new web3.eth.Contract(tokenABI_for, tokenAddress_for)
        const exchangeAddress_for = await factoryContract.methods.getExchange(tokenAddress_for).call()

        // tokenA (ERC20) to ETH conversion
        const inputAmount_of = 1
        const inputReserve_of = await tokenContract_of.methods.balanceOf(exchangeAddress_of).call()
        const outputReserve_of = await web3.eth.getBalance(exchangeAddress_of)

        const numerator_of = inputAmount_of * outputReserve_of * 997
        const denominator_of = inputReserve_of * 1000 + inputAmount_of * 997
        const outputAmount_of = numerator_of / denominator_of

        // ETH to tokenB conversion
        const inputAmount_for = outputAmount_of
        const inputReserve_for = await web3.eth.getBalance(exchangeAddress_for)
        const outputReserve_for = await tokenContract_for.methods.balanceOf(exchangeAddress_for).call()

        const numerator_for = inputAmount_for * outputReserve_for * 997
        const denominator_for = inputReserve_for * 1000 + inputAmount_for * 997
        const outputAmount_for = numerator_for / denominator_for

        const combinedFee = inputAmount_of * 0.00591

        const rate = outputAmount_for / inputAmount_of + combinedFee
        return rate
    }

    const getExchangeRateETH_ERC20__web3 = async (symbol_for) => {
        const factoryContract = await getFactoryContract()

        const tokenAddress = addresses[symbol_for]
        const tokenABI = abis[`${symbol_for}_abi`]
        const tokenContract = await new web3.eth.Contract(tokenABI, tokenAddress)

        const exchangeAddress = await factoryContract.methods.getExchange(tokenAddress).call()

        const inputAmount = 1
        const inputReserve = await web3.eth.getBalance(exchangeAddress)
        const outputReserve = await tokenContract.methods.balanceOf(exchangeAddress).call()
        console.log(inputReserve, outputReserve)

        const numerator = inputAmount * outputReserve * 997
        const denominator = inputReserve * 1000 + inputAmount * 997
        const outputAmount = numerator / denominator

        const fee = inputAmount * 0.003

        const rate = outputAmount / inputAmount + fee
        return rate
    }


    // combined

    const getExchangeRates = async (swap_token_symbol, getExchangeRateERC20_ERC20, getExchangeRateETH_ERC20) => {
        try {
            changeLoadingRates(true)
            const DAI_SWAP = await getExchangeRateERC20_ERC20("DAI", swap_token_symbol)
            const USDC_SWAP = await getExchangeRateERC20_ERC20("USDC", swap_token_symbol)
            const ETH_SWAP = await getExchangeRateETH_ERC20(swap_token_symbol)
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

    const getExchangeRatesWithSelection = async (swap_token_symbol) => {
        if (fetchMethod === "sdk") await getExchangeRates(swap_token_symbol, 
            getExchangeRateERC20_ERC20__sdk, getExchangeRateETH_ERC20__sdk)
        else await getExchangeRates(swap_token_symbol, 
            getExchangeRateERC20_ERC20__web3, getExchangeRateETH_ERC20__web3)
    }

    const classes = useStyles()

    return (
        <Fragment>
            <ToggleButtonGroup className={classes.toggle} value={fetchMethod} exclusive onChange={handleFetchMethod} aria-label="text formatting">
                <ToggleButton value="sdk" aria-label="bold">
                    SDK
                </ToggleButton>
                <ToggleButton value="web3" aria-label="bold">
                    WEB3 (TBD)
                </ToggleButton>
            </ToggleButtonGroup>
            <button className="button__show-swap-rates" onClick={() => getExchangeRatesWithSelection(anchor_token_symbol)}>{loadingRates ? <Loading className="loading-show-swap-rates"/> : "Display Exchange Rates"}</button>
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
