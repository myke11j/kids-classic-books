'use strict';

const goodReadsJSONResponse = require('goodreads-json-api');
const https = require('https');

const helpers = require('./helpers');
const messages = require('./messages');
const alexaLogger = require('./logger');

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
  // If we wanted to initialize the session to have some attributes we could add those here.
  const sessionAttributes = {};
  const cardTitle = messages.titleMessage;
  const speechOutput = messages.greetingMessage;
  // If the user either does not reply to the welcome message or says something that is not
  // understood, they will be prompted again with this text.
  const repromptText = messages.repromptMessage;
  const shouldEndSession = false;

  callback(sessionAttributes,
    helpers.buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
  const cardTitle = 'Session Ended';
  const speechOutput = messages.goodByeMessgae;
  // Setting this to true ends the session and exits the skill.
  const shouldEndSession = true;

  callback({}, helpers.buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function handleSessionHelpRequest(callback) {
    const cardTitle = 'Session help';
    const speechOutput = messages.helpMessage;
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, helpers.buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

/**
 * Sets the color in the session and prepares the speech to reply to the user.
 */
function getBookInfo(intent, session, callback) {
  if (intent.name === 'AMAZON.HelpIntent') {
    return handleSessionHelpRequest(callback);
  } else if (intent.name === 'AMAZON.StopIntent' || intent.name === 'AMAZON.CancelIntent') {
    return handleSessionEndRequest(callback);
  }
  const cardTitle = intent.name;
  const bookName = intent.slots['BookName'].value;
  const authorName = intent.slots['AuthorName'].value;
  // alexaLogger.logInfo(`Term ${slot.value} requested`);
  let repromptText = '';
  let sessionAttributes = {};
  const shouldEndSession = false;
  alexaLogger.logInfo(`Author: ${authorName}, Book: ${bookName}`);
  const API = 'https://www.goodreads.com/book/title.xml?author' + authorName + '&key=Uxb0zPb86N4STVy2ECWYA&title=' + bookName;
  alexaLogger.logInfo(API);
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
      console.log(error.message);
      // consume response data to free up memory
      res.resume();
      return;
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
        let speechOutput = `${book.title} from ${author.name} was published in ${book.publication_year} by publisher ${book.publisher}. It consists of ${book.num_pages} pages. Its average rating on Goodreads is ${book.average_rating}`;
        callback(sessionAttributes,
          helpers.buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      } catch (e) {
        console.log(e.message);
      }
    });
  }).on('error', (e) => {
    console.log(`Got error: ${e.message}`);
  });
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
  alexaLogger.logInfo(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
  alexaLogger.logInfo(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

  // Dispatch to your skill's launch.
  getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
  alexaLogger.logInfo(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

  const intent = intentRequest.intent;
  getBookInfo(intent, session, callback);
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
  alexaLogger.logInfo(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
  handleSessionEndRequest(callback);
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
        alexaLogger.logInfo(`event.session.application.applicationId=${event.session.application.applicationId}`);
        if (event.session.new) {
          onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
          onLaunch(event.request,
            event.session,
            (sessionAttributes, speechletResponse) => {
              callback(null, helpers.buildResponse(sessionAttributes, speechletResponse));
            });
        } else if (event.request.type === 'IntentRequest') {
          onIntent(event.request,
            event.session,
            (sessionAttributes, speechletResponse) => {
              callback(null, helpers.buildResponse(sessionAttributes, speechletResponse));
            });
        } else if (event.request.type === 'SessionEndedRequest') {
          onSessionEnded(event.request, event.session);
          callback();
        }
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
