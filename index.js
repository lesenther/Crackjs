'use strict';

const fs = require('fs');
const { extname, join } = require('path');

const runUntil = require('rununtil');

/**
 * Crackjs class
 *
 */
class Crackjs {

  /**
   * @param {String} target Path to the target zip file to crack
   * @param {String} dictionary Path to the dictionary file to use
   * @param {Function} method Function to use for cracking the file with,
   *    accepting two params, the first the path to the target file, and
   *    the second the password to try.  If false this is automatically
   *    determined by the file extension
   */
  constructor(target, dictionary, method) {
    this.dictionary = [];
    this.target = false;
    this.status = false;
    this.index = 0;
    this.password = false;
    this.method = (path, password) => new Promise(resolve => {
      console.log(`Trying to unlock ${path} with ${password}`);
      return resolve(false);
    });

    this.setTarget(target);
    this.setDictionary(dictionary);
    this.setMethod(method)
  }

  //--------------------------------------------------------------------------
  // Getters
  //--------------------------------------------------------------------------

  /**
   * Get the entire dictionary as an array or a specific item in the
   * dictionary if given an index
   *
   * @param {Integer} index Get a specific item in the dictionary and update
   *    the index, otherwise return the entire dictionary if false (default)
   */
  getDictionary(index = false) {
    if (index === false) {
      return this.dictionary;
    } else {
      index = !isNaN(index) ? index : parseInt(index);

      if (index > this.getDictionary().length - 1) {
        throw new Error(`Index out of bounds`);
      }

      this.setIndex(index); // Automatically update the index

      return this.getDictionary()[index];
    }
  }

  getIndex() {
    return this.index;
  }

  getMethod() {
    return this.method;
  }

  getPassword() {
    return this.password;
  }

  getStatus() {
    return this.status;
  }

  getTarget() {
    return this.target;
  }

  //--------------------------------------------------------------------------
  // Setters
  //--------------------------------------------------------------------------

  setDictionary(pathOrArr, sep = '\r\n') {
    if (typeof pathOrArr === 'string') {
      if (!fs.existsSync(pathOrArr)) {
        throw new Error(`Dictionary does not exist:  ${pathOrArr}`);
      }

      const stream = fs.readFileSync(pathOrArr);

      return this.dictionary = stream.toString().split(sep);
    }

    if (typeof pathOrArr === 'object' && pathOrArr.constructor === Array) {
      return this.dictionary = pathOrArr;
    }

    throw new Error(`Failed to set dictionary - invalid argument!`);
  }

  /**
   * 
   * @param {Number} index Current position in the dictionary
   */
  setIndex(index) {
    index = !isNaN(index) ? index : parseInt(index, 10);

    if (index < 0 || index >= this.getDictionary().length) {
      throw new Error(`Index out of range`)
    }

    return this.index = index;
  }

  /**
   * Set the method to use for cracking the file
   */
  setMethod(method = false) {
    if (method === false) {
      const filetype = extname(this.getTarget()).substr(1);
      const filepath = join(__dirname, 'modules', `${filetype}.js`);

      if (fs.existsSync(filepath)) {
        method = require(filepath);
      } else {
        throw new Error(`Unknown or unsupported file type:  ${filetype}`);
      }
    }

    if (typeof method !== 'function') {
      throw new Error(`Bad crack method`);
    }

    return this.method = method;
  }

  setPassword(password) {
    return this.password = password;
  }

  setStatus(status) {
    return this.status = status ? true : false;
  }

  setTarget(path) {
    if (!fs.existsSync(path)) {
      throw new Error(`Target does not exist:  ${path}`);
    } else if (!fs.statSync(path).isFile()) {
      throw new Error(`Target not a file:  ${path}`);
    }

    return this.target = path;
  }

  //--------------------------------------------------------------------------
  // Doers
  //--------------------------------------------------------------------------

  /**
   *
   * @returns {Promise} Resolves with false if no passwords in list were
   *    successful, -1 if cracking was incomplete, or the string of the
   *    password if successful.
   */
  start() {
    if (!this.getTarget()) {
      throw new Error(`No target specified`);
    } else if (!this.getDictionary().length) {
      throw new Error(`Dictionary is empty`);
    } else if (this.getStatus()) {
      throw new Error(`Cracking already in progress`);
    }

    this.setStatus(true);

    return runUntil(
      this.getMethod(),
      [ this.getTarget(), this.getDictionary(this.getIndex()) ],
      this.getDictionary().length - 1,
      password => {
        if (password) {
          this.stop();
          return this.setPassword(password);
        } else if (!this.getStatus()) {
          return -1;
        } else {
          return false;
        }
      },
      _ => {
        return [ this.getTarget(), this.getDictionary(this.getIndex() + 1) ];
      }
    ).then(cracked => {
      if (cracked && !this.getPassword()) {
        // Cracking was stopped prematurely
        return -1;
      } else if (cracked && this.getPassword()) {
        // The file was successfully cracked
        return this.getPassword();
      } else {
        // Cracking was unsuccessful
        return false;
      }
    });
  }

  /**
   * Stop cracking
   */
  stop() {
    if (!this.getStatus()) {
      return true;
    }

    return this.setStatus(false);
  }

}

module.exports = Crackjs;
