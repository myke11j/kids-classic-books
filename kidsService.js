/**
 * @file kidsService.js
 * @author Mukul <@mukul1904>
 * @desc Service for kids-classic-books Alexa skill
 */


/* eslint-disable strict, new-cap */

'use strict';

const goodReadsJSONResponse = require('goodreads-json-api');
const https = require('https');

const messages = require('./messages');
const alexaLogger = require('./logger');

const GOODREADS_KEY = process.env.GOODREADS_KEY;

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
    this.book = book || undefined;
    this.author = author || undefined;
    this.intent = intent;
    this.session = session || {};
    this.requestId = requestId;
    this.reqType = reqType;
    this.appId = appId;
    this.sessionId = sessionId;
    this.intentName = intentName;
}

KidsService.prototype.logRequest = function () {
    alexaLogger.logInfo(`ApplicationId=${this.appId}. RequestID=${this.reqType}. ReqType=${this.reqType}. Intent=${this.intentName}. SessionsId=${this.sessionId}`);
};

KidsService.prototype.handleIntent = function () {
    return new Promise((resolve) => {
        let speechResponse = {};
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

KidsService.prototype.handleLaunchRequest = function (done) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = messages.cardGreeting();
    const speechOutput = messages.messageGreeting();
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = messages.repromptGreeting();
    const shouldEndSession = false;

    done(sessionAttributes,
        { cardTitle, speechOutput, repromptText, shouldEndSession });
};

KidsService.prototype.handleIntentRequest = function (done) {
    return new Promise((resolve) => {
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
                this.handleCancelRequest((sessionAttributes, speechletResponse) => {
                    done({ sessionAttributes, speechletResponse });
                });
                break;
            case 'AMAZON.StopIntent':
                this.handleExitRequest((sessionAttributes, speechletResponse) => {
                    done({ sessionAttributes, speechletResponse });
                });
                break;
            case 'AMAZON.HelpIntent':
                this.handleHelpRequest((sessionAttributes, speechletResponse) => {
                    return done({ sessionAttributes, speechletResponse });
                });
                break;
            case 'GetAlltimePopularChildrenBooks':
                this.handleBookInfoRequest((sessionAttributes, speechletResponse) => {
                    return done({ sessionAttributes, speechletResponse });
                });
                break;
            case 'GetBookInfo':
                this.handleBookInfoRequest((sessionAttributes, speechletResponse) => {
                    return done({ sessionAttributes, speechletResponse });
                });
                break;
            case 'GetWeeklyPoularChildrenBooks':
                this.handleBookInfoRequest((sessionAttributes, speechletResponse) => {
                    return done({ sessionAttributes, speechletResponse });
                });
                break;
            default:
                break;
        }
    });
};

KidsService.prototype.handleExitRequest = function (done) {
    const cardTitle = messages.cardGoodBye();
    const speechOutput = messages.messageGoodBye();
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;
    done(this.session,
        { cardTitle, speechOutput, repromptText: null, shouldEndSession });
};

KidsService.prototype.handleCancelRequest = function (done) {
    const cardTitle = messages.cardGoodBye();
    const speechOutput = messages.messageGoodBye();
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = false;
    const repromptText = messages.messageReprompt();
    this.session = {};
    done(this.session,
        { cardTitle, speechOutput, repromptText, shouldEndSession });
};

KidsService.prototype.handleHelpRequest = function (done) {
    const cardTitle = messages.cardHelp();
    const speechOutput = messages.messageHelp();
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = false;
    const repromptText = messages.messageReprompt();
    done(this.session,
        { cardTitle, speechOutput, repromptText, shouldEndSession });
};

KidsService.prototype.handleYesRequest = function (done) {
    const cardTitle = messages.cardHelp();
    const speechOutput = this.generateResponse();
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = false;
    const repromptText = messages.messageReprompt();
    done(this.session,
        { cardTitle, speechOutput, repromptText, shouldEndSession });
};

KidsService.prototype.handleBookInfoRequest = function (done) {
    const bookVal = this.intent.slots['BookName'].value;
    const authorVal = this.intent.slots['AuthorName'].value;
    alexaLogger.logInfo(`Author: ${bookVal}, Book: ${authorVal}`);

    const repromptText = messages.messageReprompt();
    const sessionAttributes = {};
    const shouldEndSession = false;
    let speechOutput = '';
    if (this.validateRequest(authorVal, bookVal)) {
        speechOutput = messages.messageInvalidRequest();
        return done(this.session,
            { cardTitle: messages.cardInvalidRequest(), speechOutput, repromptText, shouldEndSession });
    }
    const {
        reqCardTitle, API
    } = this.generateEndPointAndCardTitle(bookVal, authorVal);
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
            return done(this.session,
                { cardTitle: reqCardTitle, speechOutput, repromptText: null, shouldEndSession: false });
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => rawData += chunk);
        res.on('end', () => {
            try {
                const resp = goodReadsJSONResponse.convertToJson(rawData);
                const {
                   author, book
                } = resp;
                this.setSession(resp);
                if (!this.isBookIsEligible(resp.popular_shelves)) {
                    speechOutput = messages.messageIneligibleRequest(reqCardTitle);
                } else {
                    speechOutput = this.generateResponse();
                }
                sessionAttributes.book = book;
                sessionAttributes.author = author;
                return done(this.session,
                    { cardTitle: reqCardTitle, speechOutput, repromptText, shouldEndSession });
            } catch (e) {
                alexaLogger.logError(e.message);
            }
        });
    }).on('error', (e) => {
        alexaLogger.logError(`Got error: ${e.message}`);
    });
};

KidsService.prototype.isBookIsEligible = (bookShelves) => bookShelves.filter(shelf => shelf.name === 'children').length || bookShelves.filter(shelf => shelf.name === 'childrens').length || bookShelves.filter(shelf => shelf.name === 'children-s-book').length || bookShelves.filter(shelf => shelf.name === 'kids').length;

KidsService.prototype.validateRequest = (author, title) => !author && !title;

/**
 * @desc Geneates API to hit and corrsoponding card title for reuqest
 * @param {*} author 
 * @param {*} title 
 */
KidsService.prototype.generateEndPointAndCardTitle = function (title, author) {
    const resp = {};
    resp.reqCardTitle = `Kids Classic Book - ${title}`;
    if (author) resp.reqCardTitle += ` from ${author}`;
    resp.API = 'https://www.goodreads.com/book/title.xml';
    if (author) {
        resp.API += '?author' + author + '&key=' + GOODREADS_KEY + '&title=' + title;
    } else {
        resp.API += '?key=' + GOODREADS_KEY + '&title=' + title;
    }
    return resp;
}

KidsService.prototype.generateResponse = function () {
    const { session } = this;
    const { book, author } = session;
    let resp;
    switch (session.lastReq) {
        case 'basic':
            session.lastReq = 'description';
            resp = session.book.description + ' Do you want to know similiar books?';
            break;
        case 'description':
            session.lastReq = 'similiar_books'
            resp = book.description;
            break;
        case 'similiar_books':
            resp = similiar_books;
            session.lastReq = 'more_author_books'
            break;
        case 'more_author_books':
            resp = similiar_books;
            break;
        default:
            session.lastReq = 'basic';
            resp = `${book.title} from ${author.name} was published in ${book.publication_year} by publisher ${book.publisher}. `
                + `It consists of ${book.num_pages} pages. `
                + `Its average rating on Goodreads is ${book.average_rating} from ${book.ratings_count} ratings. `
                + `Do you want to listen to a brief description of ${book.title}? `;
            break;
    }
        console.log(resp);
    return resp;
};

KidsService.prototype.setSession = function (session) {
    this.session = session;
};

KidsService.prototype.getSession = function () {
    return this.session;
}

module.exports = KidsService;
