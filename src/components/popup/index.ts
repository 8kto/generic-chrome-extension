/**
 * @fileOverview A wrapper for the popup dialog.
 */

import ViewController from './ViewController'

/**
 * File is executed every time the extension icon is clicked in the browser tray,
 * therefore there is no way to use singletons
 */
new ViewController().init()
