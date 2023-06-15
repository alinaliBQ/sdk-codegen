/*

 MIT License

 Copyright (c) 2023 Looker Data Sciences, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */
import type { PayloadAction } from '@reduxjs/toolkit'
import { takeEvery, put, call, select } from 'typed-redux-saga'
import type { ConfigValues } from '../utils'
import { getVersions, validateUrl } from '../utils'
import type {
  ClearFormActionPayload,
  HandleUrlChangePayload,
  OAuthFormState,
  SaveConfigPayload,
} from './slice'
import { oAuthFormActions } from './slice'

/**
 * get saved configData from localStorage key
 */
const getLocalStorageConfig = (configKey: string) => {
  const EmptyConfig = {
    base_url: '',
    looker_url: '',
  }
  const data = localStorage.getItem(configKey)
  const result = data ? JSON.parse(data) : EmptyConfig

  return result as ConfigValues
}

/**
 * checks for saved configData in localStorage
 */
function* initSaga(action: PayloadAction<string>) {
  const { initFormSuccessAction, setFailureAction } = oAuthFormActions
  try {
    const result = yield* call(getLocalStorageConfig, action.payload)
    yield* put(initFormSuccessAction(result))
  } catch (error: any) {
    yield* put(setFailureAction(error.message))
  }
}

/**
 * handles validating the new url and adds or removes form validation message
 */
function* handleUrlChangeSaga(action: PayloadAction<HandleUrlChangePayload>) {
  const { updateValidationMessagesAction, hanldeUrlChangeSuccess } =
    oAuthFormActions
  try {
    const url = validateUrl(action.payload.value)
    if (!url) throw new Error(`${action.payload.value} is not a valid url`)

    // clear the error message if one was there
    yield* put(
      updateValidationMessagesAction({
        elementName: action.payload.name,
        newMessage: null,
      })
    )
  } catch (error: any) {
    yield* put(
      updateValidationMessagesAction({
        elementName: action.payload.name,
        newMessage: error,
      })
    )
  } finally {
    // update the form element
    const url = validateUrl(action.payload.value)
    yield* put(hanldeUrlChangeSuccess(url || action.payload.value))
  }
}

/**
 * clears form, removes local storage config key and triggers callback function
 */
function* clearFormSaga(action: PayloadAction<ClearFormActionPayload>) {
  const { clearFormActionSuccess, setFailureAction, updateMessageBarAction } =
    oAuthFormActions
  try {
    const { configKey, setHasConfig, isAuthenticated } = action.payload
    localStorage.removeItem(configKey)
    if (setHasConfig) setHasConfig(false)
    if (isAuthenticated) {
      yield* put(
        updateMessageBarAction({
          intent: 'warn',
          text: 'Please reload the browser page to log out',
        })
      )
    }
    yield* put(clearFormActionSuccess())
  } catch (error: any) {
    yield* put(setFailureAction(error.message))
  }
}

/**
 * verify button clicked, verifys apiServerUrl and populates OAuth server URL if valid
 */
function* handleVerifySaga() {
  const apiServerUrl = yield* select(
    (state: OAuthFormState) => state.apiServerUrl
  )
  const {
    handleVerifyActionFailure,
    handleVerifyActionSuccess,
    clearMessageBarAction,
  } = oAuthFormActions

  try {
    yield* put(clearMessageBarAction())
    const versionsUrl = `${apiServerUrl}/versions`

    const versions = yield* call(getVersions, versionsUrl)
    if (!versions) throw new Error()

    yield* put(handleVerifyActionSuccess(versions.web_server_url))
  } catch (error: any) {
    yield* put(handleVerifyActionFailure(error.message))
  }
}

/**
 * save button clicked, verify api server url and if valid save config data to localstorage
 */
function* handleSaveConfigSaga(action: PayloadAction<SaveConfigPayload>) {
  const apiServerUrl = yield* select(
    (state: OAuthFormState) => state.apiServerUrl
  )
  const {
    handleVerifyActionFailure,
    clearMessageBarAction,
    handleSaveConfigSuccess,
  } = oAuthFormActions
  const { configKey, setHasConfig, client_id, redirect_uri } = action.payload

  try {
    yield* put(clearMessageBarAction())
    const versionsUrl = `${apiServerUrl}/versions`

    const versions = yield* call(getVersions, versionsUrl)
    if (!versions) throw new Error()

    const { api_server_url, web_server_url } = versions
    const data = {
      base_url: api_server_url,
      looker_url: web_server_url,
      client_id,
      redirect_uri,
    }
    localStorage.setItem(configKey, JSON.stringify(data))
    if (setHasConfig) setHasConfig(true)

    yield* put(
      handleSaveConfigSuccess({
        base_url: api_server_url,
        looker_url: web_server_url,
      })
    )
  } catch (error: any) {
    yield* put(handleVerifyActionFailure(error.message))
  }
}

export function* saga() {
  const {
    initAction,
    handleUrlChangeAction,
    clearFormAction,
    handleVerifyAction,
    handleSaveConfigAction,
  } = oAuthFormActions
  yield* takeEvery(initAction, initSaga)
  yield* takeEvery(handleUrlChangeAction, handleUrlChangeSaga)
  yield* takeEvery(clearFormAction, clearFormSaga)
  yield* takeEvery(handleVerifyAction, handleVerifySaga)
  yield* takeEvery(handleSaveConfigAction, handleSaveConfigSaga)
}
