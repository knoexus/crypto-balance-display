import React, { Fragment, useEffect, useState } from 'react'
import BalanceTable from './BalanceTable'
import addresses from '../addresses.js'
import Web3 from 'web3'
import { ChainId, Fetcher, Route, WETH } from '@uniswap/sdk'
import UniswapRatesTable from './UniswapRatesTable'

export default function Main() {
    const [isConnected, changeConnected] = useState(false)
    const [balances, changeBalances] = useState({
        "ETH": null,
        "USDC": null,
        "DAI": null
    })

    const anchor_token_symbol = "USDT"
    const [rates, changeRates] = useState({
        "ETH": null,
        "USDC": null,
        "DAI": null
    })
    const [web3, setWeb3] = useState(null)

    const connectToWallet = () => {
        if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider)
            window.ethereum.enable()
            changeConnected(true)
            setWeb3(window.web3)
        }
    }

    const displayBalance = async () => {
        if (web3) {
            web3.eth.getAccounts(async (err, accs) => {      
                if (err != null || accs.length === 0) {
                  return
                }
                const account = accs[0]
                try {
                    const ethBalance = await getEthBalance(account)
                    const daiBalance = await getTokenBalance(addresses["DAI"], account)
                    const usdcBalance = await getTokenBalance(addresses["USDC"], account) 
                    changeBalances({
                        "ETH": ethBalance,
                        "USDC": usdcBalance,
                        "DAI": daiBalance
                    })
                } catch(err) {
                    alert('Make sure you have selected a valid network or have sufficient gas.')
                }
            }) 
        }
        else {
            console.log('here') // trigger error
        }
    }

    const getEthBalance = async (walletAddress) => {
        try {
            const balance = await web3.eth.getBalance(walletAddress)
            const _ethBalance = await web3.utils.fromWei(balance, "ether")
            return parseFloat(_ethBalance)
        } catch(err) {
            alert('Error while getting your ETH balance.')
            return null
        }
        
    }

    const getTokenBalance = async (tokenAddress, walletAddress) => {
        const minABI = [
          {
            "constant":true,
            "inputs":[{"name":"_owner","type":"address"}],
            "name":"balanceOf",
            "outputs":[{"name":"balance","type":"uint256"}],
            "type":"function"
          },
          {
            "constant":true,
            "inputs":[],
            "name":"decimals",
            "outputs":[{"name":"","type":"uint8"}],
            "type":"function"
          }
        ]
        try {
            const contract = await new web3.eth.Contract(minABI, tokenAddress)
            const balance = await contract.methods.balanceOf(walletAddress).call()
            return balance / Math.pow(10, 6)
        } catch (err) {
            alert('Error while getting your token balance.')
            return null 
        }
        // balance = web3.utils.hexToNumber(balance) / Math.pow(10, 6)
    }

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
            const DAI_SWAP = await getExchangeRateERC20_ERC_20("DAI", swap_token_symbol)
            const USDC_SWAP = await getExchangeRateERC20_ERC_20("USDC", swap_token_symbol)
            const ETH_SWAP = await getExchangeRateETH_ERC_20(swap_token_symbol)
            changeRates({
                "ETH": ETH_SWAP,
                "USDC": USDC_SWAP,
                "DAI": DAI_SWAP
            })
        }
        catch {
            alert("Error while executing swap rates calculation.")
        }
    }


    return (
        <Fragment>
            <div>
                <button onClick={connectToWallet} className="connect">Connect</button>
                { isConnected ? "" : "Not " } Connected To MetaMask
            </div>
            {
                isConnected &&
                <div>
                    <button onClick={displayBalance}>DisplayBalance</button>
                    <button onClick={() => getExchangeRates(anchor_token_symbol)}>SwapRate</button>
                    <div>
                        <BalanceTable balances={balances}/>
                        <UniswapRatesTable anchor_token_symbol={anchor_token_symbol} rates={rates}/>
                    </div>
                </div>
            }
        </Fragment>
    )
}
