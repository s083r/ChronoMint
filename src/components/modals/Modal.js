import React from 'react'
import { connect } from 'react-redux'
import * as a from 'redux/ui/modal.js'
import AlertModal from './AlertModal'
import ConfirmTxDialog from '../dialogs/ConfirmTxDialog/ConfirmTxDialog'
import UploadedFileModal from './UploadedFileModal'
import NewPollModal from './NewPollModal'
import PollModal from './poll/PollModal'

const mapDispatchToProps = (dispatch) => ({
  hideModal: () => dispatch(a.hideModal())
})

const mapStateToProps = (state) => {
  const {open, modalType, modalProps} = state.get('modal')
  return {
    open,
    modalType,
    modalProps
  }
}

type propsType = {
  open: boolean,
  modalType: string,
  hideModal: Function,
  modalProps: Object
}

export let MODAL_COMPONENTS = {
  [a.ALERT_TYPE]: AlertModal,
  [a.CONFIRM_TYPE]: ConfirmTxDialog,
  [a.UPLOADED_FILE_TYPE]: UploadedFileModal,
  [a.NEW_POLL_TYPE]: NewPollModal,
  [a.POLL_TYPE]: PollModal
}

export default connect(mapStateToProps, mapDispatchToProps)(
  ({open, modalType, hideModal, modalProps}: propsType) => {
    return MODAL_COMPONENTS[modalType]
      ? React.createElement(MODAL_COMPONENTS[modalType], {open, hideModal, ...modalProps})
      : null
  }
)
