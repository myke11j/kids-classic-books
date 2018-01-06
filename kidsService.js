/**
 * @file kidsService.js
 * @author Mukul <@mukul1904>
 * @desc Service for kids-classic-books Alexa skill
 */


/* eslint-disable strict, no-return-assign, consistent-return, no-unused-vars */

'use strict';

const goodReadsJSONResponse = require('goodreads-json-api');
const https = require('https');

const messages = require('./messages');
const alexaLogger = require('./logger');

const GOODREADS_KEY = process.env.GOODREADS_KEY;
const skillName = 'Kids Classic Books';

/**
 * @const
 * @desc Stores all the Goodreads shelves which can be classified for kids books
 * Any book which have one of this shelve will be consider a kids book
 */
const kidsShelves = [
  'children', 'childrens', 'children-s-book', 'children-s-books', 'kids', 'kid', 'fantasy-middlegrade',
  'middle-grade', 'fantasy-middlegrade', 'middle-grades'
];

/**
 * @constructor
 *
 * @param {Object} book
 * @param {Object} author
 * @param {Object} intent
 * @param {Object} session
 */
function KidsService(params) {
  const {
        book, author, intent, session, requestId, reqType, appId, sessionId, intentName
    } = params;
  this.name = 'KidsService';
  this.book = book;
  this.author = author;
  this.intent = intent || {};
  this.session = session || {};
  this.requestId = requestId;
  this.reqType = reqType;
  this.appId = appId;
  this.sessionId = sessionId;
  this.intentName = intentName || '';
}

KidsService.prototype.logRequest = function () {
  alexaLogger.logInfo(`ApplicationId=${this.appId}. RequestID=${this.reqType}. ReqType=${this.reqType}. Intent=${this.intentName}. SessionsId=${this.sessionId}`);
};

KidsService.prototype.handleIntent = function () {
  return new Promise((resolve) => {
    switch (this.reqType) {
      case 'LaunchRequest':
        this.handleLaunchRequest((resp) => {
          const {
                        sessionAttributes, speechletResponse
                    } = resp;
          return resolve({ sessionAttributes, speechletResponse });
        });
        break;
      case 'IntentRequest':
        this.handleIntentRequest((resp) => {
          const {
                        sessionAttributes, speechletResponse
                    } = resp;
          return resolve({ sessionAttributes, speechletResponse });
        });
        break;
      case 'SessionEndedRequest':
        this.handleExitRequest((resp) => {
          const {
                        sessionAttributes, speechletResponse
                    } = resp;
          return resolve({ sessionAttributes, speechletResponse });
        });
        break;
      default:
        break;
    }
  });
};

/**
 * @desc Greeting handler
 */
KidsService.prototype.handleLaunchRequest = function (done) {
    // If we wanted to initialize the session to have some attributes we could add those here.
  const sessionAttributes = {};
    // const cardTitle = messages.cardGreeting();
    // const speechOutput = messages.messageGreeting();
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
  const repromptText = messages.repromptGreeting();
  const shouldEndSession = false;
  const outputSpeech = this.generateOutputSpeech(messages.messageGreeting());
  const card = this.generateCard(messages.cardGreeting(), messages.messageGreeting());
  done({
    sessionAttributes,
    speechletResponse: { card, outputSpeech, repromptText, shouldEndSession }
  });
};

/**
 * @desc Exit and StopIntent handler
 */
KidsService.prototype.handleExitRequest = function (done) {
  const shouldEndSession = true;
  const card = this.generateCard(messages.cardGoodBye(), messages.messageGoodBye());
  const outputSpeech = this.generateOutputSpeech(messages.messageGoodBye());
  this.session = {};
  done({
    sessionAttributes: {},
    speechletResponse: { card, outputSpeech, repromptText: null, shouldEndSession }
  });
};

/**
 * @desc CancelIntent handler
 */
KidsService.prototype.handleCancelRequest = function (done) {
  const shouldEndSession = true;
  const card = this.generateCard(messages.cardGoodBye(), messages.messageGoodBye());
  const outputSpeech = this.generateOutputSpeech(messages.messageGoodBye());
  this.session = {};
  done({
    sessionAttributes: {},
    speechletResponse: { card, outputSpeech, repromptText: null, shouldEndSession }
  });
};

/**
 * @desc HelpIntent handler
 */
KidsService.prototype.handleHelpRequest = function (done) {
  const shouldEndSession = false;
  const repromptText = messages.messageReprompt();
  const card = this.generateCard(messages.cardHelp(), messages.messageHelp());
  const outputSpeech = this.generateOutputSpeech(messages.messageHelp());
  done(this.session,
        { card, outputSpeech, repromptText, shouldEndSession });
};

KidsService.prototype.handleIntentRequest = function (done) {
  switch (this.intentName) {
    case 'AMAZON.YesIntent':
      this.handleYesRequest((sessionAttributes, speechletResponse) => {
        done({ sessionAttributes, speechletResponse });
      });
      break;
    case 'AMAZON.NoIntent':
      this.handleNoRequest((sessionAttributes, speechletResponse) => {
        done({ sessionAttributes, speechletResponse });
      });
      break;
    case 'AMAZON.CancelIntent':
      this.handleCancelRequest((resp) => {
        done(resp);
      });
      break;
    case 'AMAZON.StopIntent':
      this.handleExitRequest((resp) => {
        done(resp);
      });
      break;
    case 'AMAZON.HelpIntent':
      this.handleHelpRequest((sessionAttributes, speechletResponse) => done({ sessionAttributes, speechletResponse }));
      break;
    case 'GetAlltimePopularChildrenBooks':
      this.handleBookInfoRequest((sessionAttributes, speechletResponse) => done({ sessionAttributes, speechletResponse }));
      break;
    case 'GetBookInfo':
      this.handleBookInfoRequest((sessionAttributes, speechletResponse) => done({ sessionAttributes, speechletResponse }));
      break;
    case 'GetWeeklyPoularChildrenBooks':
      this.handleBookInfoRequest((sessionAttributes, speechletResponse) => done({ sessionAttributes, speechletResponse }));
      break;
    default:
      break;
  }
};

/* Card related methods */
KidsService.prototype.generateCardTitle = function () {
  return `${skillName} - ${this.appendBooktitleAndAuthor()}`;
};

KidsService.prototype.generateCardText = function () {
  let text = this.generateSpeechText().speechOutput;
  if (this.intentName === 'GetBookInfo' && this.session.book.url) {
    text += ` Goodread URL: ${this.session.book.url}`;
  }
  return text;
};

KidsService.prototype.generateCard = function (cardTitle, cardText) {
  const card = {
    type: 'Standard',
    title: cardTitle || this.generateCardTitle(),
    text: cardText || this.generateCardText(),
    content: cardText || this.generateCardText()
  };
  if (this.intentName === 'GetBookInfo' && this.session.book) {
    card.image = {};
    card.type = 'Standard';
    card.image.smallImageUrl = this.session.book.small_image_url;
    card.image.largeImageUrl = this.session.book.image_url;
  }
  return card;
};

/* OutputSpeech related methods */
KidsService.prototype.generateOutputSpeech = function (output) {
  const outputSpeech = {
    type: 'PlainText',
    text: output || this.generateSpeechText().speechOutput
  };
  return outputSpeech;
};

KidsService.prototype.generateSpeechText = function () {
  const { session } = this;
  const resp = {};
  switch (session.lastReq) {
    case 'basic':
      resp.speechOutput = `${session.book.description} Do you want to get list of similiar books?`;
      break;
    case 'Description':
      resp.speechOutput = session.book.description;
      break;
    case 'Similiar Books':
      resp.speechOutput = 'similiar_books';
      break;
    case 'More books from Author':
      resp.speechOutput = 'similiar_books';
      break;
    default:
      resp.speechOutput = `${session.book.title} from ${session.author.name} was published in ${session.book.publication_year} by publisher ${session.book.publisher}. `
                + `It consists of ${session.book.num_pages} pages. `
                + `Its average rating on Goodreads is ${session.book.average_rating} from ${session.book.ratings_count} ratings. `
                + `Do you want to listen to a brief description of ${session.book.title}? `;
      break;
  }
  return resp;
};

KidsService.prototype.setLastReq = function () {
  const { session } = this;
  switch (session.lastReq) {
    case 'basic':
      session.lastReq = 'Description';
      break;
    case 'Description':
      session.lastReq = 'Similiar Books';
      break;
    case 'Similiar Books':
      session.lastReq = 'More books from Author';
      break;
    case 'More books from Author':
      session.lastReq = 'Last';
      break;
    default:
      session.lastReq = 'basic';
      break;
  }
};

KidsService.prototype.handleYesRequest = function (done) {
  const shouldEndSession = false;
  const repromptText = messages.messageReprompt();
  const card = this.generateCard();
  const outputSpeech = this.generateOutputSpeech();
  done(this.session,
        { card, outputSpeech, repromptText, shouldEndSession });
};

KidsService.prototype.handleNoRequest = function (done) {
  const shouldEndSession = true;
  const repromptText = messages.messageReprompt();
  const card = this.generateCard(messages.cardHelp());
  const outputSpeech = this.generateOutputSpeech(messages.messageHelp());
  done(this.session,
        { card, outputSpeech, repromptText, shouldEndSession });
};

KidsService.prototype.handleBookInfoRequest = function (done) {
  const bookVal = this.intent.slots.BookName.value;
  const authorVal = this.intent.slots.AuthorName.value;
  alexaLogger.logInfo(`Author: ${authorVal}, Book: ${bookVal}`);
  this.book = bookVal;
  this.author = authorVal;
  const repromptText = messages.messageReprompt();
  const shouldEndSession = false;

  /**
   * In case user doesn't mention either book title or author
   */
  if (this.validateRequest(authorVal, bookVal)) {
    const card = this.generateCard(messages.cardInvalidRequest(), messages.messageInvalidRequest());
    const outputSpeech = this.generateOutputSpeech(messages.messageInvalidRequest());
    return done(this.session,
            { card, outputSpeech, repromptText, shouldEndSession });
  }
  const {
        API
    } = this.generateEndPointAndCardTitle();
  alexaLogger.logInfo(`Endpoint generated: ${API}`);
  https.get(API, (res) => {
    const options = {
      xml: {
        normalizeWhitespace: true
      }
    };
    const statusCode = res.statusCode;
    const contentType = res.headers['content-type'];
    let error;
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' +
                `Status Code: ${statusCode}`);
    }
    /**
     * In case statusCode is not 200
     */
    if (error) {
      alexaLogger.logError(error.message);
      // consume response data to free up memory
      res.resume();
      const card = this.generateCard(messages.cardInvalidRequest(), messages.messageInvalidRequest());
      const outputSpeech = this.generateOutputSpeech(messages.messageInvalidRequest());
      return done(this.session,
          { card, outputSpeech, repromptText: null, shouldEndSession: true });
    }

    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', chunk => rawData += chunk);
    res.on('end', () => {
      try {
        /* JSON response converted from Goodreads XML response */
        const resp = goodReadsJSONResponse.convertToJson(rawData);
        const {
            popular_shelves, book, author
        } = resp;
        this.book = book.title;
        this.author = author.name;
        this.setSession(resp);
        if (!this.isBookIsEligible(popular_shelves)) {
          const card = this.generateCard(messages.cardIneligibleRequest(), messages.messageIneligibleRequest(this.book));
          const outputSpeech = this.generateOutputSpeech(messages.messageIneligibleRequest(this.book));
          return done(this.session,
                { card, outputSpeech, repromptText: null, shouldEndSession: true });
        }
        const card = this.generateCard();
        const outputSpeech = this.generateOutputSpeech();
        this.setLastReq();
        return done(this.session,
            { card, outputSpeech, repromptText: null, shouldEndSession: true });
      } catch (e) {
        alexaLogger.logError(e.message);
      }
    });
  }).on('error', (e) => {
    alexaLogger.logError(`Got error: ${e.message}`);
  });
};

KidsService.prototype.isBookIsEligible = function (bookShelves) {
  let flag = false;
  for (let index = 0; index < kidsShelves.length; index++) {
    const item = kidsShelves[index];
    if (bookShelves.filter(shelf => shelf.name === item).length) {
      alexaLogger.logInfo(`${this.book} classified as ${item}`);
      flag = true;
      break;
    }
  }
  return flag;
};

KidsService.prototype.validateRequest = (author, title) => !author && !title;

KidsService.prototype.appendBooktitleAndAuthor = function () {
  let title = this.book;
  if (this.author) title += ` from ${this.author}`;
  return title;
};

KidsService.prototype.generateEndPointAndCardTitle = function () {
  const { book, author } = this;
  const resp = {};
  resp.API = 'https://www.goodreads.com/book/title.xml';
  if (author) {
    resp.API += `?author${author}&key=${GOODREADS_KEY}&title=${book}`;
  } else {
    resp.API += `?key=${GOODREADS_KEY}&title=${book}`;
  }
  return resp;
};

KidsService.prototype.setSession = function (session) {
  this.session = session;
};

KidsService.prototype.getSession = function () {
  return this.session;
};

module.exports = KidsService;
