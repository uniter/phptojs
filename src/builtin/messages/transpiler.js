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
            'break_or_continue_in_wrong_context': '\'${operator}\' not in the \'loop\' or \'switch\' context',
            'break_or_continue_non_integer_operand': '\'${operator}\' operator with non-integer operand is no longer supported',
            'cannot_break_or_continue': 'Cannot \'${operator}\' ${levels} levels',
            'expect_exactly_one_arg': '${name}() must take exactly 1 argument',
            'goto_disallowed': '\'goto\' into loop or switch statement is disallowed',
            'goto_to_undefined_label': '\'goto\' to undefined label \'${label}\'',
            'interface_method_body_not_allowed': 'Interface function ${className}::${methodName}() cannot contain body',
            'interface_property_not_allowed': 'Interfaces may not include member variables',
            'label_already_defined': 'Label \'${label}\' already defined',
            'operator_requires_positive_integer': '\'${operator}\' operator accepts only positive integers',
            'strict_types_invalid_literal': 'strict_types declaration must have 0 or 1 as its value',
            'strict_types_value_must_be_literal': 'declare(strict_types) value must be a literal',
            'void_function_must_not_return_null': 'A void function must not return a value (did you mean "return;" instead of "return null;"?)',
            'void_function_must_not_return_value': 'A void function must not return a value',
            'yield_outside_function': 'The "yield" expression can only be used inside a function'
        }
    }
};
