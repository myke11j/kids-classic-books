/**
 * @file alexaFactory.js
 * @author Mukul <@mukul1904>
 * @desc This file contains methods which generates and returns speech response for alexa
 */


const AlexaFactory = {};

/**
 * @param {Object} params
 * @param {String} params.cardTitle - CardTitle
 * @param {String} params.speechOutput - Speech text
 * @param {String} params.repromptText - Repropmt Speech text
 * @param {Boolean} params.shouldEndSession - Session flag, which decided whether to end session or not
 */
AlexaFactory.buildSpeechletResponse = (params) => {
  const {
        outputSpeech, repromptText, shouldEndSession, card
    } = params;
  return {
    outputSpeech,
    card,
    reprompt: {
      outputSpeech: {
        type: 'PlainText',
        text: repromptText,
      },
    },
    shouldEndSession,
  };
};

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
};

module.exports = AlexaFactory;
