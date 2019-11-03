/*
 * PHPToJS - PHP-to-JavaScript transpiler
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phptojs
 *
 * Released under the MIT license
 * https://github.com/uniter/phptojs/raw/master/MIT-LICENSE.txt
 */

'use strict';

/*
 * Translations for transpilation-related errors
 */
module.exports = {
    'en_GB': {
        'core': {
            'goto_disallowed': '\'goto\' into loop or switch statement is disallowed',
            'goto_to_undefined_label': '\'goto\' to undefined label \'${label}\'',
            'interface_method_body_not_allowed': 'Interface function ${className}::${methodName}() cannot contain body',
            'interface_property_not_allowed': 'Interfaces may not include member variables',
            'label_already_defined': 'Label \'${label}\' already defined',
            'operator_requires_positive_number': '\'${operator}\' operator accepts only positive numbers'
        }
    }
};
