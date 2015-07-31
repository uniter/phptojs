/*
 * PHPToJS - PHP-to-JavaScript transpiler
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phptojs
 *
 * Released under the MIT license
 * https://github.com/uniter/phptojs/raw/master/MIT-LICENSE.txt
 */

'use strict';

var expect = require('chai').expect,
    phpToJS = require('../..'),
    Transpiler = require('transpiler/src/Transpiler');

describe('Public API', function () {
    it('should export a Transpiler', function () {
        expect(phpToJS).to.be.an.instanceOf(Transpiler);
    });
});
