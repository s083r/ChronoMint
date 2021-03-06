import BigNumber from 'bignumber.js'
import { I18n } from 'platform/i18n'
import Immutable from 'immutable'
import moment from 'moment'
import uniqid from 'uniqid'
import { abstractModel } from './AbstractModel'

class TxExecModel extends abstractModel({
  contract: '',
  func: '',
  args: {},
  value: new BigNumber(0),
  gas: new BigNumber(0),
  isGasUsed: false,
  estimateGasLaxity: new BigNumber(0),
  hash: null,
}) {
  constructor (data) {
    super({
      id: (data && data.id) || uniqid(),
      ...data,
    })
  }

  time () {
    return moment(this.get('timestamp')).format('Do MMMM YYYY HH:mm:ss')
  }

  date (format) {
    const time = this.get('timestamp') / 1000
    return time && moment.unix(time).format(format || 'HH:mm, MMMM Do, YYYY') || null
  }

  contract () {
    return this.get('contract')
  }

  funcName () {
    return this.get('func')
  }

  args () {
    return this.get('args') || {}
  }

  gas (): BigNumber {
    return this.get('gas')
  }

  setGas (v: BigNumber, isGasUsed = false): TxExecModel {
    return this.set('gas', v)
      .set('isGasUsed', isGasUsed)
      .set('estimateGasLaxity', isGasUsed ? this.gas().minus(v) : new BigNumber(0))
  }

  isGasUsed () {
    return this.get('isGasUsed')
  }

  estimateGasLaxity (): BigNumber {
    return this.get('estimateGasLaxity')
  }

  value (): BigNumber {
    return this.get('value')
  }

  hash () {
    return this.get('hash')
  }

  /**
   * @returns {string}
   * @private
   */
  _i18n () {
    return `tx.${this.get('contract')}.`
  }

  i18nFunc () {
    return `${this._i18n() + this.funcName()}.`
  }

  func () {
    return `${this.i18nFunc()}title`
  }

  title () {
    return I18n.t(this.func())
  }

  details () {
    const args = this.args()
    const list = new Immutable.Map(Object.entries(args))

    return list.entrySeq().map(([key, value]) => ({
      label: I18n.t(this.i18nFunc() + key),
      value,
    }))
  }
}

export default TxExecModel
