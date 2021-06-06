import React, { useState } from 'react'
import BalanceTable from './BalanceTable'
import UniswapRatesTable from './UniswapRatesTable'
import Web3 from 'web3'

import '../styles/main.css'

export default function Main() {
    const [isConnected, changeConnected] = useState(false)
    const [web3, setWeb3] = useState(null)

    const anchor_token_symbol = "USDT"
    const symbols = ["ETH", "USDC", "DAI"]
    const symbol_init = symbols.reduce((acc, el) => {
        acc[el] = null
        return acc
    }, {})

    const connectToWallet = async () => {
        if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider)
            window.ethereum.enable()
            changeConnected(true)
            setWeb3(window.web3)
        }
    }

    return (
        <div className="div__main">
            <div className="div___connection">
                { !isConnected && <button onClick={connectToWallet} className="button__connect">Connect</button> }
                <span className={`span__connection-status span__connection-status-${isConnected ? "affirmative" : "negative"}`}>{ isConnected ? "" : "Not " } Connected to MetaMask</span>
            </div>
            {
                isConnected &&
                <div className="div__tables">
                    <div className="div__table-info">
                        <BalanceTable web3={web3} init_state={symbol_init}/>
                    </div>
                    <div className="div__table-info">
                        <UniswapRatesTable web3={web3} anchor_token_symbol={anchor_token_symbol} init_state={symbol_init}/>
                    </div>
                </div>
            }
        </div>
    )
}
