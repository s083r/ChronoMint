import React, { PureComponent } from 'react'

import './BrandLogo.scss'

export default class BrandLogo extends PureComponent {
  constructor (props) {
    super(props)
  }

  render () {
    return (
      <div styleName='root'>
        <span styleName='title1'>Chrono</span>
        <span styleName='title2'>bank.io</span>
      </div>
    )
  }
}
