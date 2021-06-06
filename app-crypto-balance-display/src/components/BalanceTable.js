import React, { Fragment, useState } from 'react'
import Loading from './Loading'
import addresses from '../addresses.js'
import abis from '../abis.js'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'
import useStyles from './mui_styles/tableHead'

export default function BalanceTable({web3, init_state}) {
    const [balances, changeBalances] = useState(init_state)
    const [loadingBalances, changeLoadingBalances] = useState(false)

    const displayBalance = async () => {
        if (web3) {
            web3.eth.getAccounts(async (err, accs) => {      
                if (err != null || accs.length === 0) {
                  return
                }
                const account = accs[0]
                try {
                    changeLoadingBalances(true)
                    const ethBalance = await getEthBalance(account)
                    const daiBalance = await getTokenBalance(addresses["DAI"], account)
                    const usdcBalance = await getTokenBalance(addresses["USDC"], account) 
                    changeBalances({
                        "ETH": ethBalance,
                        "USDC": usdcBalance,
                        "DAI": daiBalance
                    })
                    changeLoadingBalances(false)
                } catch(err) {
                    changeLoadingBalances(false)
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
        const minABI = abis["min_abi"]
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

    const classes = useStyles()

    return (
        <Fragment>
            <button className="button__show-balances" onClick={displayBalance}>{loadingBalances ? <Loading className="loading-show-balances"/> : "Display Balance"}</button>
            <h4 className="h4__table-name">Your Token Balances</h4>
            <TableContainer component={Paper}>
                <Table size="small" aria-label="a dense table">
                    <TableHead className={classes.tableHead}>
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
