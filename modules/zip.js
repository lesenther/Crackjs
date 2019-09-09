'use strict';

const { exec, execSync } = require('child_process');

const { basename } = require('path');

const node7z = require('node-7z');

/**
 * Try to unzip a file using a specified password
 *
 * @param {String} path Path of the zip file
 * @param {String} password Password to try to unzip the file with
 * @returns {Promise} Resolves with the password if password is correct, false if password is wrong, or rejects on error.
 */
function tryPassword(path, password) {
    return new Promise((resolve, reject) => {
        const extraction = node7z.extractFull(path, path.replace(basename(path), ''), { password });
        extraction.on('end', _ => resolve(password));
        extraction.on('error', error => {
            if (error.message.indexOf('Wrong password') === -1) {
                return reject(error);
            }
            
            return resolve(false);
        });
    });
}

/**
 * Try to unzip a file using a specified password
 *
 * @param {String} path Path of the zip file
 * @param {String} password Password to try to unzip the file with
 * @returns {Promise} Resolves with the password if password is correct, false if password is wrong, or rejects on error.
 */
function tryPasswordSecondary(path, password) {
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

function chooseMethod() {
    try {
        execSync(`7z`, { stdio: 'ignore' });

        return tryPassword;
    } catch(error) {        
        return tryPasswordSecondary;
    }
}

module.exports = chooseMethod();
