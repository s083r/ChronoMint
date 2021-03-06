import web3Provider from '@chronobank/login/network/Web3Provider'

export const DUCK_MONITOR = 'monitor'

export const CHANGE_NETWORK_STATUS = 'monitor/CHANGE_NETWORK_STATUS'
export const CHANGE_SYNC_STATUS = 'monitor/CHANGE_SYNC_STATUS'

export const changeNetworkStatus = (status) => ({ type: CHANGE_NETWORK_STATUS, status })

export const changeSyncStatus = (status, progress) => ({ type: CHANGE_SYNC_STATUS, status, progress })

export const watchInitMonitor = () => (dispatch) => {
  web3Provider.getMonitorService()
    .on('network', (status) => dispatch(changeNetworkStatus(status)))
    .on('sync', (status, progress) => dispatch(changeSyncStatus(status, progress)))
}
