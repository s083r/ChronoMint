import TokenModel from 'models/tokens/TokenModel'
import LOCModel from './LOCModel'

describe('LOC model', () => {
  it('should construct and return data', async () => {
    let model = new LOCModel({
      name: 'name',
      oldName: 'oldName',
      website: 'www',
      issueLimit: 1000,
      issued: 10,
      redeemed: 5,
      status: 1,
      isNew: false,
      token: new TokenModel({
        address: 'a1',
        symbol: 'LHT',
      }),
    })
    model = model.set('expDate', '11111111111')
    model = model.set('createDate', '222222222222')

    expect(model).toMatchSnapshot()
  })
})
