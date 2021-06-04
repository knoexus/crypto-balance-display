import React, { Fragment, useEffect, useState } from 'react'
import addresses from '../addresses.js'
import Web3 from 'web3'

export default function Main() {
    const [enabled, changeEnabled] = useState(false)
    const [balances, changeBalances] = useState({
        "ETH": null,
        "USDC": null,
        "DAI": null
    })
    const [web3, setWeb3] = useState(null)

    useEffect(() => {
        if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider)
            window.ethereum.enable()
            changeEnabled(true)
            setWeb3(window.web3)
        }
    }, [])

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

    return (
        <Fragment>
            <button onClick={displayBalance}>DisplayBalance</button>
            <div>
                { enabled ? "true" : "false" }
                <ul>
                    { Object.entries(balances).map((e, idx) => <li key={idx}>{e}</li>) }
                </ul>
            </div>
        </Fragment>
    )
}
