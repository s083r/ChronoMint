import Immutable from 'immutable'
import { abstractFetchingModel } from 'models/AbstractFetchingModel'
import ExchangesCollection from './ExchangesCollection'

export default class ExchangeModel extends abstractFetchingModel({
  exchanges: new ExchangesCollection(),
  exchangesForOwner: new ExchangesCollection(),
  assetSymbols: [],
  filter: new Immutable.Map(),
  showFilter: true,
  lastPages: 0,
  pagesCount: 0,
}) {
  lastPages (value) {
    return this._getSet('lastPages', value)
  }

  pagesCount (value) {
    return this._getSet('pagesCount', value)
  }

  exchanges (value) {
    return this._getSet('exchanges', value)
  }

  exchangesForOwner (value) {
    return this._getSet('exchangesForOwner', value)
  }

  showFilter (value) {
    return this._getSet('showFilter', value)
  }

  assetSymbols (value) {
    return this._getSet('assetSymbols', value)
  }

  filter (value) {
    return this._getSet('filter', value)
  }
}
