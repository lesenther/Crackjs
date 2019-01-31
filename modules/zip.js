'use strict';

const { exec } = require('child_process');

/**
 * Try to unzip a file using a specified password
 *
 * @param {String} path Path of the zip file
 * @param {String} password Password to try to unzip the file with
 * @returns {Promise} Resolves with the password if password is correct, false if password is wrong, or rejects on error.
 */
function tryPassword(path, password) {
    return new Promise((resolve, reject) => {
        exec(`unzip -o -P "${password}" ${path}`, (err, stdout, stderr) => {
            if (err) {
                const wrongPassword = stderr.substr(stderr.length - 19, 18) === 'incorrect password';

                return wrongPassword
                ? resolve(false)
                : reject(err);
            }

            return resolve(password);
        });
    });
}

module.exports = tryPassword;
