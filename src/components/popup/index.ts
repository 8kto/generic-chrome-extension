/**
 * @fileOverview A wrapper for the popup dialog.
 * Binds the event handlers and dynamic layout.
 */

import { getPopupControllerInstance } from './PopupController'

/**
 * File is executed every time the extension icon is clicked in the browser tray
 */
getPopupControllerInstance().init()
