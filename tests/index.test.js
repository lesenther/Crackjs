const assert = require('assert');

const Crackjs = require('../');

describe('Test the cracker', _ => {

    it('should crack', done => {
        const crackjs = new Crackjs('./tests/file.zip', './tests/words.dic');

        crackjs.start()
        .then(result => {
            assert.equal(result, 'test');
            done();
        });
    });

});