/*

 MIT License

 Copyright (c) 2021 Looker Data Sciences, Inc.

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

import type {
  ILooker40SDK,
} from '@looker/sdk'
import {
  LookerExtensionSDK as _LookerExtensionSDK,
} from '@looker/sdk'
import type { ExtensionHostApi } from '../connect'
import { SdkConnection } from './sdk_connection'

export type LookerSDKFactory = (hostConnection: ExtensionHostApi) => ILooker40SDK

export class LookerExtensionSDK {

  /**
   * Creates an extension SDK client
   * @param hostConnection extension host API
   * @deprecated use createClient
   */
  static create40Client(hostConnection: ExtensionHostApi): ILooker40SDK {
    return LookerExtensionSDK.createClient(hostConnection)
  }

  /**
   * @param hostConnection extension host API
   */
  static createClient(hostConnection: ExtensionHostApi): ILooker40SDK {
    return _LookerExtensionSDK.createClient(new SdkConnection(hostConnection))
  }
}

export const defaultLookerSDKFactory = (hostConnection: ExtensionHostApi) => LookerExtensionSDK.createClient(hostConnection)