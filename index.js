'use strict';

const goodReadsJSONResponse = require('goodreads-json-api');
const https = require('https');

const helpers = require('./helpers');
const messages = require('./messages');
const alexaLogger = require('./logger');

const GOODREADS_KEY = process.env.GOODREADS_KEY;

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
  // If we wanted to initialize the session to have some attributes we could add those here.
  const sessionAttributes = {};
  const cardTitle = messages.cardGreeting();
  const speechOutput = messages.messageGreeting();
  // If the user either does not reply to the welcome message or says something that is not
  // understood, they will be prompted again with this text.
  const repromptText = messages.repromptGreeting();
  const shouldEndSession = false;

  callback(sessionAttributes,
    helpers.buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
  const cardTitle = messages.cardGoodBye();
  const speechOutput = messages.messageGoodBye();
  // Setting this to true ends the session and exits the skill.
  const shouldEndSession = true;

  callback({}, helpers.buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function handleSessionHelpRequest(callback) {
    const cardTitle = messages.cardHelp();
    const speechOutput = messages.messageHelp();
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = false;

    callback({}, helpers.buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function handleYesIntent (intent, session, callback) {

}

function isBookIsEligible (bookShelves) {
  return bookShelves.filter(shelf => shelf.name === 'children').length || bookShelves.filter(shelf => shelf.name === 'childrens').length || bookShelves.filter(shelf => shelf.name === 'children-s-book').length || bookShelves.filter(shelf => shelf.name === 'kids').length;
}

function validateRequest (author, title) {
  return !author && !title;
}

/**
 * @desc Geneates API to hit and corrsoponding card title for reuqest
 * @param {*} author 
 * @param {*} title 
 */
function generateEndPointAndCardTitle (title, author) {
  const resp = {};
  resp.reqCardTitle = `Kids Classic Book - ${title}`;
  if (author) resp.reqCardTitle  += ` from ${author}`;
  resp.API = 'https://www.goodreads.com/book/title.xml';
  if (author) {
    resp.API += '?author' + author + '&key=' + GOODREADS_KEY + '&title=' + title;
  } else {
    resp.API += '?key=' + GOODREADS_KEY + '&title=' + title;
  }
  return resp;
}

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
      helpers.buildSpeechletResponse(messages.cardInvalidRequest(), speechOutput, repromptText, shouldEndSession));
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
        helpers.buildSpeechletResponse(reqCardTitle, speechOutput, null, false));
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
          speechOutput = `${book.title} from ${author.name} was published in ${book.publication_year} by publisher ${book.publisher}. It consists of ${book.num_pages} pages. Its average rating on Goodreads is ${book.average_rating}`;
        }
        sessionAttributes.book = book;
        sessionAttributes.author = author;
        return callback(sessionAttributes,
          helpers.buildSpeechletResponse(reqCardTitle, speechOutput, repromptText, shouldEndSession));
      } catch (e) {
        alexaLogger.logError(e.message);
      }
    });
  }).on('error', (e) => {
    alexaLogger.logError(`Got error: ${e.message}`);
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
