import { I18n } from 'platform/i18n'
import { abstractNoticeModel } from './AbstractNoticeModel'

export default class ArbitraryNoticeModel extends abstractNoticeModel({
  key: null,
  params: {},
}) {
  message () {
    return I18n.t(this.get('key'), this.get('params'))
  }
}
