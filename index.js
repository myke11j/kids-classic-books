'use strict';

const AlexaFactory = require('./alexaFactory.');
const messages = require('./messages');
const alexaLogger = require('./logger');
const KidsService = require('./kidsService');

/**
 * Sets the color in the session and prepares the speech to reply to the user.
 */
function getBookInfo(intent, session, callback) {
  if (intent.name === 'AMAZON.HelpIntent') {
    return handleSessionHelpRequest(callback);
  } else if (intent.name === 'AMAZON.StopIntent' || intent.name === 'AMAZON.CancelIntent') {
    return handleSessionEndRequest(callback);
  } else if (intent.name === 'AMAZON.YesIntent') {
    return handleYesIntent(intent, session, callback);
  }
  const bookName = intent.slots['BookName'].value;
  const authorName = intent.slots['AuthorName'].value;
  const repromptText = messages.messageReprompt();
  const sessionAttributes = {};
  const shouldEndSession = false;
  let speechOutput = '';
  alexaLogger.logInfo(`Author: ${authorName}, Book: ${bookName}`);
  if (validateRequest(authorName, bookName)) {
    speechOutput = messages.messageInvalidRequest();
    return callback(sessionAttributes,
      AlexaFactory.buildSpeechletResponse(messages.cardInvalidRequest(), speechOutput, repromptText, shouldEndSession));
  }
  const {
    reqCardTitle, API
  } = generateEndPointAndCardTitle(bookName, authorName);
  alexaLogger.logInfo(`Endpoint generated: ${API}`);
  https.get(API, (res) => {
    const options = {
      xml: {
        normalizeWhitespace: true
      }
    }
    const statusCode = res.statusCode;
    const contentType = res.headers['content-type'];
    let error;
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' +
        `Status Code: ${statusCode}`);
    }
    if (error) {
      alexaLogger.logError(error.message);
      // consume response data to free up memory
      res.resume();
      speechOutput = messages.messageInvalidRequest();
      return callback(sessionAttributes,
        AlexaFactory.buildSpeechletResponse(reqCardTitle, speechOutput, null, false));
    }

    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => rawData += chunk);
    res.on('end', () => {
      try {
        const resp = goodReadsJSONResponse.convertToJson(rawData);
        // console.log(resp);
        const {
          author, book
        } = resp;
        if (!isBookIsEligible(resp.popular_shelves)) {
          speechOutput = messages.messageIneligibleRequest(reqCardTitle);
        } else {
          speechOutput = generateResponse({ book, author });
        }
        sessionAttributes.book = book;
        sessionAttributes.author = author;
        return callback(sessionAttributes,
          AlexaFactory.buildSpeechletResponse(reqCardTitle, speechOutput, repromptText, shouldEndSession));
      } catch (e) {
        alexaLogger.logError(e.message);
      }
    });
  }).on('error', (e) => {
    alexaLogger.logError(`Got error: ${e.message}`);
  });
}




// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
  try {
    context.callbackWaitsForEmptyEventLoop = false;
    alexaLogger
      .init()
      .then(() => {
        const kidsSkill = new KidsService({
          requestId: event.request.requestId,
          session: event.session.attributes,
          sessionId: event.session.sessionId,
          intent: event.request.intent,
          reqType: event.request.type,
          appId: event.session.application.applicationId,
          intentName: event.request.intent.name
        });
        kidsSkill.logRequest();
        return kidsSkill.handleIntent();
      })
      .then((resp) => {
        const {
          sessionAttributes, speechletResponse
        } = resp;
        return callback(null, AlexaFactory.buildResponse({ sessionAttributes, speechletResponse }));
      })
      .catch((err) => {
        alexaLogger.logError(`Error in handling request: ${err}`);
        return callback(err);
      });
  } catch (err) {
    alexaLogger.logError(`Error in try-catch: ${err}`);
    return callback(err);
  }
};
