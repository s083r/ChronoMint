import tokenService from 'services/TokenService'
import BigNumber from 'bignumber.js'
import contractsManagerDAO from 'dao/ContractsManagerDAO'
import Immutable from 'immutable'
import ExchangeOrderModel from 'models/exchange/ExchangeOrderModel'
import { DUCK_SESSION } from 'redux/session/actions'
import exchangeService from 'services/ExchangeService'
import { fetchTokenBalance, WALLET_ALLOWANCE } from 'redux/mainWallet/actions'
import TokenModel from 'models/tokens/TokenModel'
import { DUCK_TOKENS, subscribeOnTokens } from 'redux/tokens/actions'
import AllowanceModel from 'models/wallet/AllowanceModel'
import Amount from 'models/Amount'

export const DUCK_EXCHANGE = 'exchange'

export const EXCHANGE_INIT = 'exchange/INIT'
export const EXCHANGE_GET_ORDERS_START = 'exchange/GET_ORDERS_START'
export const EXCHANGE_SET_PAGES_COUNT = 'exchange/EXCHANGE_SET_PAGES_COUNT'
export const EXCHANGE_GET_ORDERS_FINISH = 'exchange/GET_ORDERS_FINISH'
export const EXCHANGE_GET_DATA_START = 'exchange/GET_DATA_START'
export const EXCHANGE_GET_DATA_FINISH = 'exchange/GET_DATA_FINISH'
export const EXCHANGE_SET_FILTER = 'exchange/EXCHANGE_SET_FILTER'
export const EXCHANGE_REMOVE_FOR_OWNER = 'exchange/EXCHANGE_REMOVE_FOR_OWNER'
export const EXCHANGE_UPDATE = 'exchange/EXCHANGE_UPDATE'
export const EXCHANGE_UPDATE_FOR_OWNER = 'exchange/EXCHANGE_UPDATE_FOR_OWNER'
export const EXCHANGE_MIDDLEWARE_DISCONNECTED = 'exchange/EXCHANGE_MIDDLEWARE_DISCONNECTED'
export const EXCHANGE_EXCHANGES_LIST_GETTING_START = 'exchange/EXCHANGE_EXCHANGES_LIST_GETTING_START'
export const EXCHANGE_EXCHANGES_LIST_GETTING_FINISH = 'exchange/EXCHANGE_EXCHANGES_LIST_GETTING_FINISH'
export const EXCHANGE_EXCHANGES_LIST_GETTING_FINISH_CONCAT = 'exchange/EXCHANGE_EXCHANGES_LIST_GETTING_FINISH_CONCAT0'
export const EXCHANGE_GET_OWNERS_EXCHANGES_START = 'exchange/EXCHANGE_GET_OWNERS_EXCHANGES_START'
export const EXCHANGE_GET_OWNERS_EXCHANGES_FINISH = 'exchange/EXCHANGE_GET_OWNERS_EXCHANGES_FINISH'
const PAGE_SIZE = 20

export const exchange = (isBuy: boolean, amount: BigNumber, exchange: ExchangeOrderModel) => async (dispatch, getState) => {
  try {
    const exchangeDAO = await contractsManagerDAO.getExchangeDAO(exchange.address())
    const tokens = getState().get(DUCK_TOKENS)
    if (isBuy) {
      await exchangeDAO.buy(amount, exchange, tokens.item(exchange.symbol()))
    } else {
      await exchangeDAO.sell(amount, exchange, tokens.item(exchange.symbol()))
    }
  } catch (e) {
    // no rollback
  }
}

export const search = (values: Immutable.Map) => async (dispatch) => {
  dispatch({ type: EXCHANGE_SET_FILTER, filter: values })
  dispatch(getNextPage())
}

const getAssetsSymbols = () => async (dispatch) => {
  const exchangeManagerDAO = await contractsManagerDAO.getExchangeManagerDAO()
  let assetSymbols
  try {
    assetSymbols = await exchangeManagerDAO.getAssetSymbols()
  } catch (e) {
    dispatch({ type: EXCHANGE_MIDDLEWARE_DISCONNECTED })
  }

  dispatch({ type: EXCHANGE_GET_DATA_FINISH, assetSymbols })
}

export const getExchange = () => async (dispatch) => {
  dispatch({ type: EXCHANGE_GET_DATA_START })
  await dispatch(getExchangesCount())
  await dispatch(getAssetsSymbols())

  dispatch(getExchangesForOwner())
  dispatch(getNextPage())
}

export const getExchangesForOwner = () => async (dispatch, getState) => {
  const exchange = getState().get(DUCK_EXCHANGE)
  if (!exchange.exchangesForOwner().isFetching()) {
    dispatch({ type: EXCHANGE_GET_OWNERS_EXCHANGES_START })
    const exchangeManagerDAO = await contractsManagerDAO.getExchangeManagerDAO()
    const exchanges = await exchangeManagerDAO
      .getExchangesForOwner(getState().get(DUCK_SESSION).account)
    dispatch({ type: EXCHANGE_GET_OWNERS_EXCHANGES_FINISH, exchanges })
  }
}

export const getTokensAllowance = (exchange: ExchangeOrderModel) => async (dispatch, getState) => {
  const token = getState().get(DUCK_TOKENS).item(exchange.symbol())
  const { account } = getState().get(DUCK_SESSION)
  const dao = tokenService.getDAO(token)
  const allowance = await dao.getAccountAllowance(account, exchange.address())
  console.log('--actions#', 2)
  dispatch({
    type: WALLET_ALLOWANCE, allowance: new AllowanceModel({
      amount: new Amount(allowance, token.id()),
      spender: exchange.address(), //address
      token: token.id(), // id
      isFetched: true,
      isFetching: false,
    }),
  })
}

export const approveTokensForExchange = (exchange: ExchangeOrderModel, token: TokenModel, amount: Amount) => async () => {
  const dao = await contractsManagerDAO.getExchangeDAO(exchange.address())
  await dao.approveSell(token, amount)
}

export const getExchangesCount = () => async (dispatch) => {
  const exchangeManagerDAO = await contractsManagerDAO.getExchangeManagerDAO()
  const count = await exchangeManagerDAO.getExchangesCount()
  dispatch({ type: EXCHANGE_SET_PAGES_COUNT, count })
}

export const getNextPage = () => async (dispatch, getState) => {
  dispatch({ type: EXCHANGE_EXCHANGES_LIST_GETTING_START })

  const exchangeManagerDAO = await contractsManagerDAO.getExchangeManagerDAO()
  const state = getState().get(DUCK_EXCHANGE)
  let filter = {}
  if (state.filter().get('token')) {
    filter.symbol = state.filter().get('token')
  }
  if (state.filter().get('filterMode')) {
    filter.isBuy = state.filter().get('filterMode').name === 'BUY'
  }

  const exchanges = await exchangeManagerDAO.getExchanges(
    state.lastPages(),
    PAGE_SIZE,
    filter,
    {
      fromMiddleWare: state.showFilter(),
    })

  exchanges.items().map((exchange) => {
    dispatch(subscribeOnTokens((token: TokenModel) => () => {
      if (token.symbol() === exchange.symbol()) {
        exchangeService.subscribeToExchange(exchange.address())
        exchangeService.subscribeToToken(token, exchange.address())
      }
    }))
  })

  if (state.lastPages() === 0) {
    const lastPages = state.lastPages() + exchanges.size()
    dispatch({
      type: EXCHANGE_EXCHANGES_LIST_GETTING_FINISH,
      exchanges,
      lastPages,
      pagesCount: lastPages < PAGE_SIZE ? lastPages : state.pagesCount(),
    })
  } else {
    dispatch({
      type: EXCHANGE_EXCHANGES_LIST_GETTING_FINISH_CONCAT,
      exchanges,
      lastPages: state.lastPages() + exchanges.size(),
    })
  }
}

export const updateExchange = (exchange: ExchangeOrderModel) => (dispatch, getState) => {
  const state = getState().get(DUCK_EXCHANGE)

  state.exchangesForOwner().item(exchange.id()) && dispatch({ type: EXCHANGE_UPDATE_FOR_OWNER, exchange })

  state.exchanges().item(exchange.id()) && dispatch({ type: EXCHANGE_UPDATE, exchange })
}

export const createExchange = (exchange: ExchangeOrderModel) => async (dispatch, getState) => {
  const tokens = getState().get(DUCK_TOKENS)
  const exchangeManagerDAO = await contractsManagerDAO.getExchangeManagerDAO()
  const txHash = await exchangeManagerDAO.createExchange(exchange, tokens.item(exchange.symbol()))
  dispatch({ type: EXCHANGE_UPDATE_FOR_OWNER, exchange: exchange.isPending(true).transactionHash(txHash) })
}

export const withdrawFromExchange = (exchange: ExchangeOrderModel, wallet, amount: Amount, symbol: string) => async () => {
  const exchangeDAO = await contractsManagerDAO.getExchangeDAO(exchange.address())
  if (symbol.toLowerCase() === 'eth') {
    await exchangeDAO.withdrawEth(wallet, amount)
  } else {
    await exchangeDAO.withdrawTokens(wallet, amount)
  }
}

export const getExchangeFromState = (state: Object, address: string) => {
  return state.exchanges().item(address) || state.exchangesForOwner().item(address)
}

export const watchExchanges = () => async (dispatch, getState) => {
  if (getState().get(DUCK_EXCHANGE).isInited()) {
    return
  }
  dispatch({ type: EXCHANGE_INIT, isInited: true })

  dispatch(getExchange())
  const account = getState().get(DUCK_SESSION).account
  try {
    await exchangeService.subscribeToCreateExchange(account)
  } catch (e) {
    // eslint-disable-next-line
    console.error('watch error', e.message)
  }

  exchangeService.on('ExchangeCreated', async (tx) => {
    if (account === tx.args.user) {
      const exchangeManageDAO = await contractsManagerDAO.getExchangeManagerDAO()
      const exchangeAddress = tx.args.exchange
      const exchangeData = await exchangeManageDAO.getExchangeData([ exchangeAddress ], getState().get(DUCK_TOKENS))
      const exchange = exchangeData.item(exchangeAddress)
      dispatch(getAssetsSymbols())
      dispatch(subscribeOnTokens((token: TokenModel) => () => {
        if (token.symbol() === exchange.symbol()) {
          exchangeService.subscribeToExchange(exchange.address())
          exchangeService.subscribeToToken(token, exchange.address())
        }
      }))
      dispatch({
        type: EXCHANGE_REMOVE_FOR_OWNER,
        exchange: exchange.transactionHash(tx.transactionHash),
      })
      dispatch({ type: EXCHANGE_UPDATE_FOR_OWNER, exchange })
    }
    dispatch(getExchangesCount())
  })
  exchangeService.on('Error', async (/*tx*/) => {
    // eslint-disable-next-line
    // console.error('event error', tx)
  })

  exchangeService.on('FeeUpdated', async (/*tx*/) => {
    // eslint-disable-next-line
    // console.log('--actions#FeeUpdated', tx)
  })

  exchangeService.on('PricesUpdated', async (/*tx*/) => {
    // eslint-disable-next-line
    // console.log('--actions#PricesUpdated', tx)
  })

  exchangeService.on('ActiveChanged', async (/*tx*/) => {
    // eslint-disable-next-line
    // console.log('--actions#ActiveChanged', tx)
  })

  exchangeService.on('Buy', async (tx) => {
    const state = getState().get(DUCK_EXCHANGE)
    const exchange = getExchangeFromState(state, tx.exchange)
    dispatch(updateExchange(exchange
      .assetBalance(exchange.assetBalance().minus(tx.tokenAmount))
      .ethBalance(exchange.ethBalance().plus(tx.ethAmount)),
    ))
  })

  exchangeService.on('Sell', async (tx) => {
    const state = getState().get(DUCK_EXCHANGE)
    const tokens = getState().get(DUCK_TOKENS)
    const exchange = getExchangeFromState(state, tx.exchange)
    dispatch(fetchTokenBalance(tokens.item('ETH')))
    dispatch(updateExchange(exchange
      .ethBalance(exchange.ethBalance().minus(tx.ethAmount)),
    ))
  })

  exchangeService.on('WithdrawEther', async (tx) => {
    const state = getState().get(DUCK_EXCHANGE)
    const exchange = getExchangeFromState(state, tx.exchange)
    dispatch(updateExchange(exchange
      .ethBalance(exchange.ethBalance().minus(tx.ethAmount)),
    ))
  })

  exchangeService.on('WithdrawTokens', async (tx) => {
    const state = getState().get(DUCK_EXCHANGE)
    const exchange = getExchangeFromState(state, tx.exchange)
    dispatch(updateExchange(exchange
      .assetBalance(exchange.assetBalance().minus(tx.tokenAmount)),
    ))
  })

  exchangeService.on('ReceivedEther', async (tx) => {
    const state = getState().get(DUCK_EXCHANGE)
    const exchange = getExchangeFromState(state, tx.exchange)
    dispatch(updateExchange(exchange
      .ethBalance(exchange.ethBalance().plus(tx.ethAmount))))
  })

  exchangeService.on('Transfer', async (tx) => {
    const state = getState().get(DUCK_EXCHANGE)
    const exchange = getExchangeFromState(state, tx.to())
    exchange && dispatch(updateExchange(exchange
      .assetBalance(exchange.assetBalance().plus(tx.value())),
    ))
  })
}
