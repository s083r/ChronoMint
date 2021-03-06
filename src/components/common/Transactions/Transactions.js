import {
  CircularProgress,
  Divider,
  Paper,
  RaisedButton,
  Table,
  TableBody,
  TableFooter,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { Translate } from 'react-redux-i18n'
import { connect } from 'react-redux'
import { getBlockExplorerUrl } from '@chronobank/login/network/settings'
import { DUCK_TOKENS } from 'redux/tokens/actions'
import TokensCollection from 'models/tokens/TokensCollection'
import TokenModel from 'models/tokens/TokenModel'
import globalStyles from '../../../styles'
import styles from './styles'

const mapStateToProps = (state) => ({
  selectedNetworkId: state.get('network').selectedNetworkId,
  selectedProviderId: state.get('network').selectedProviderId,
  tokens: state.get(DUCK_TOKENS),
})

@connect(mapStateToProps, null)
class Transactions extends PureComponent {
  renderTrx (tx) {
    const token: TokenModel = this.props.tokens.item(tx.symbol())
    const blockExplorerUrl = (txHash) => getBlockExplorerUrl(this.props.selectedNetworkId, this.props.selectedProviderId, txHash, token.blockchain())

    return (
      <TableRow key={tx.id()}>
        <TableRowColumn style={styles.columns.id}>{tx.blockNumber}</TableRowColumn>
        <TableRowColumn style={styles.columns.hash}>
          {blockExplorerUrl(tx.txHash)
            ? <a href={blockExplorerUrl(tx.txHash)} target='_blank' rel='noopener noreferrer'>{tx.txHash}</a>
            : tx.txHash
          }
        </TableRowColumn>
        <TableRowColumn style={styles.columns.time}>{tx.time()}</TableRowColumn>
        <TableRowColumn style={styles.columns.value}>
          {`${tx.sign() + tx.value()} ${tx.symbol()}`}
        </TableRowColumn>
      </TableRow>
    )
  }

  render () {
    const { transactions, isFetching, endOfList } = this.props

    return (
      <Paper style={globalStyles.paper} zDepth={1} rounded={false}>
        <h3 style={globalStyles.title}><Translate value='tx.transactions' /></h3>
        <Divider style={{ backgroundColor: globalStyles.title.color }} />
        <Table selectable={false}>
          <TableHeader adjustForCheckbox={false} displaySelectAll={false}>
            <TableRow>
              <TableHeaderColumn style={styles.columns.id}><Translate value='terms.block' /></TableHeaderColumn>
              <TableHeaderColumn style={styles.columns.hash}><Translate value='terms.hash' /></TableHeaderColumn>
              <TableHeaderColumn style={styles.columns.time}><Translate value='terms.time' /></TableHeaderColumn>
              <TableHeaderColumn style={styles.columns.value}><Translate value='terms.value' /></TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody displayRowCheckbox={false}>
            {transactions.sortBy((x) => x.get('time'))
              .reverse()
              .valueSeq()
              .map((tx) => this.renderTrx(tx))}
            {!transactions.size && !isFetching ? (<TableRow>
              <TableRowColumn>
                <Translate value='tx.noTransactions' />
              </TableRowColumn>
            </TableRow>) : ''}
            {isFetching
              ? (<TableRow key='loader'>
                <TableRowColumn style={{ width: '100%', textAlign: 'center' }} colSpan={4}>
                  <CircularProgress style={{ margin: '0 auto' }} size={24} thickness={1.5} />
                </TableRowColumn>
              </TableRow>) : null}
          </TableBody>
          {!isFetching && !endOfList ? <TableFooter adjustForCheckbox={false}>
            <TableRow>
              <TableRowColumn>
                <RaisedButton
                  label={<Translate value='nav.loadMore' />}
                  onTouchTap={() => this.props.onLoadMore()}
                  fullWidth
                  primary
                />
              </TableRowColumn>
            </TableRow>
          </TableFooter> : ''}
        </Table>
      </Paper>
    )
  }
}

Transactions.propTypes = {
  selectedNetworkId: PropTypes.number,
  selectedProviderId: PropTypes.number,
  isFetched: PropTypes.bool,
  isFetching: PropTypes.bool,
  transactions: PropTypes.object,
  toBlock: PropTypes.number,
  onLoadMore: PropTypes.func,
  endOfList: PropTypes.bool,
  tokens: PropTypes.instanceOf(TokensCollection),
}

export default Transactions
