'use strict';

/**
 Copyright 2013–2022 Kenan Yildirim <https://kenany.me/>
Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const isDate = require('lodash.isdate');
const isEmpty = require('lodash.isempty');
const isPlainObject = require('lodash.isplainobject');
const strftime = require('strftime');

/**
 * @param {unknown} obj
 * @returns {string}
 */
function format(obj) {
  if (isDate(obj)) {
    return strftime('%FT%TZ', obj);
  } else if (Number(obj) === obj) {
    return Number.isInteger(obj) ? obj + 0.1 : obj;
  } else {
    return JSON.stringify(obj);
  }
}

/**
 * @param {readonly unknown[][]} simplePairs
 * @returns {boolean}
 */
function isArrayOfTables(simplePairs) {
  return simplePairs.some(function (array) {
    const value = array[1];
    return Array.isArray(value) && isPlainObject(value[0]);
  });
}

/**
 * @param {readonly unknown[]} obj
 * @returns {boolean}
 */
function isObjectArrayOfTables(obj) {
  return Array.isArray(obj) && obj.length === 2 && isPlainObject(obj[1][0]);
}

/**
 * @param {readonly unknown[][]} simplePairs
 * @returns {boolean}
 */
function isLastObjectArrayOfTables(simplePairs) {
  const array = simplePairs[simplePairs.length - 1];
  return isObjectArrayOfTables(array);
}

/**
 * @param {string} key
 * @returns {string}
 */
function escapeKey(key) {
  return /^[a-zA-Z0-9-_]*$/.test(key) ? key : `"${key}"`;
}

/**
 * @param {object} hash
 * @param {object} options
 * @returns {string}
 */
module.exports = function (hash, options = {}) {
  /**
   * @param {object} hash
   * @param {string} prefix
   * @returns {void}
   */
  function visit(hash, prefix) {
    const nestedPairs = [];
    const simplePairs = [];
    const indentStr = ''.padStart(options.indent, ' ');

    Object.keys(hash).forEach((key) => {
      const value = hash[key];
      (isPlainObject(value) ? nestedPairs : simplePairs).push([key, value]);
    });

    if (
      !isEmpty(prefix) &&
      !isEmpty(simplePairs) &&
      !isArrayOfTables(simplePairs)
    ) {
      toml += '[' + prefix + ']\n';
    }

    simplePairs.forEach((array) => {
      const key = array[0];
      const value = array[1];

      if (isObjectArrayOfTables(array)) {
        if (simplePairs.indexOf(array) > 0 && options.newlineAfterSection) {
          const lastObj = simplePairs[simplePairs.indexOf(array) - 1];
          if (!isObjectArrayOfTables(lastObj)) {
            toml += '\n';
          }
        }
        value.forEach((obj) => {
          if (!isEmpty(prefix)) {
            toml += '[[' + prefix + '.' + key + ']]\n';
          } else {
            toml += '[[' + key + ']]\n';
          }
          visit(obj, '');
        });
      } else {
        toml += indentStr + escapeKey(key) + ' = ' + format(value) + '\n';
      }
    });

    if (
      !isEmpty(simplePairs) &&
      !isLastObjectArrayOfTables(simplePairs) &&
      options.newlineAfterSection
    ) {
      toml += '\n';
    }

    nestedPairs.forEach((array) => {
      const key = array[0];
      const value = array[1];

      visit(
        value,
        isEmpty(prefix)
          ? escapeKey(key.toString())
          : `${prefix}.${escapeKey(key.toString())}`
      );
    });
  }

  let toml = '';

  visit(hash, '');

  return toml;
};
