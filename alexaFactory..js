/**
 * @file alexaFactory.js
 * @author Mukul <@mukul1904>
 * @desc This file contains methods which generates and returns speech response for alexa
 */
'use strict';

const AlexaFactory = {};

/**
 * @param {Object} params
 * @param {String} params.title - CardTitle
 * @param {String} params.output - Speech text
 * @param {String} params.repromptText - Repropmt Speech text
 * @param {Boolean} params.shouldEndSession - Session flag, which decided whether to end session or not
 */
AlexaFactory.buildSpeechletResponse = (params) => {
    const {
        title, output, repromptText, shouldEndSession
    } = params;
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `${title}`,
            content: `${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

/**
 * @param {Object} params
 * @param {Object} params.sessionAttributes
 * @param {Object} params.speechletResponse
 */
AlexaFactory.buildResponse = (params) => {
    const {
        sessionAttributes, speechletResponse
    } = params;
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}

module.exports = AlexaFactory;