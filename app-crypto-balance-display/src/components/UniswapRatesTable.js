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
import {decimals, addresses, uniswap_addresses} from '../token_info.js'
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

    const getTokenContract = async (symbol) => {
        const tokenAddress = addresses[symbol]
        const tokenABI = abis[`${symbol}_abi`]
        const tokenContract = await new web3.eth.Contract(tokenABI, tokenAddress)
        return tokenContract
    }

    const getMultiplier = (symbolA, symbolB) => {
        const decimalDifference = decimals[symbolA] - decimals[symbolB]
        const multiplier = decimalDifference === 0 ? 1 : decimalDifference > 0 ? 10**decimalDifference : 1/(10**Math.abs(decimalDifference))
        return multiplier
    }

    const getOutPutAmount = (inputAmount, inputReserve, outputReserve, multiplier=1) => {
        const numerator = inputAmount * outputReserve * 997 * multiplier
        const denominator = inputReserve * 1000 + inputAmount * 997
        const outputAmount = numerator / denominator
        return outputAmount
    }

    const getExchangeRateERC20_ERC20__web3 = async (symbol_of, symbol_for) => {
        const tokenContract_of = await getTokenContract(symbol_of)
        const tokenContract_for = await getTokenContract(symbol_for)
        const wethContract = await getTokenContract("WETH")

        const exchangeAddress_of = uniswap_addresses[symbol_of]
        const exchangeAddress_for = uniswap_addresses[symbol_for]

        // tokenA (ERC20) to ETH conversion
        const inputAmount_of = 1
        const inputReserve_of = await tokenContract_of.methods.balanceOf(exchangeAddress_of).call()
        const outputReserve_of = await wethContract.methods.balanceOf(exchangeAddress_of).call() 

        const outputAmount_of = getOutPutAmount(inputAmount_of, inputReserve_of, outputReserve_of)

        // ETH to tokenB conversion
        const inputAmount_for = outputAmount_of
        const inputReserve_for = await wethContract.methods.balanceOf(exchangeAddress_for).call() 
        const outputReserve_for = await tokenContract_for.methods.balanceOf(exchangeAddress_for).call()

        const outputAmount_for = getOutPutAmount(inputAmount_for, inputReserve_for, outputReserve_for)

        const combinedFee = inputAmount_of * 0.00591

        const multiplier = getMultiplier(symbol_of, symbol_for)

        const rate = outputAmount_for / inputAmount_of * multiplier + combinedFee

        return rate.toFixed(6)
    }

    const getExchangeRateETH_ERC20__web3 = async (symbol_for) => {
        const tokenContract = await getTokenContract(symbol_for)
        const wethContract = await getTokenContract("WETH")

        const exchangeAddress = uniswap_addresses[symbol_for]

        const inputAmount = 1
        const inputReserve = await wethContract.methods.balanceOf(exchangeAddress).call() 
        const outputReserve = await tokenContract.methods.balanceOf(exchangeAddress).call()

        const multiplier = getMultiplier("WETH", symbol_for)

        const numerator = inputAmount * outputReserve * 997 * multiplier
        const denominator = inputReserve * 1000 + inputAmount * 997
        const outputAmount = numerator / denominator

        const fee = inputAmount * 0.003
        const rate = outputAmount / inputAmount + fee
        
        return rate.toFixed(6)
    }


    // combined

    const getExchangeRates = async (swap_token_symbol, getExchangeRateERC20_ERC20, getExchangeRateETH_ERC20) => {
        try {
            changeLoadingRates(true)
            const DAI_SWAP = await getExchangeRateERC20_ERC20("DAI", swap_token_symbol)
            const USDC_SWAP = await getExchangeRateERC20_ERC20("USDC", swap_token_symbol)
            const LINK_SWAP = await getExchangeRateERC20_ERC20("LINK", swap_token_symbol)
            const ETH_SWAP = await getExchangeRateETH_ERC20(swap_token_symbol)
            changeRates({
                "ETH": ETH_SWAP,
                "USDC": USDC_SWAP,
                "DAI": DAI_SWAP,
                "LINK": LINK_SWAP
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
                    WEB3
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
