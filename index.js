

const AlexaFactory = require('./alexaFactory.');
const alexaLogger = require('./logger');
const KidsService = require('./kidsService');

// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
  try {
    context.callbackWaitsForEmptyEventLoop = false;
    return alexaLogger
      .init()
      .then(() => {
        const kidsSkill = new KidsService({
          requestId: event.request.requestId,
          session: event.session.attributes,
          sessionId: event.session.sessionId,
          intent: event.request.intent,
          reqType: event.request.type,
          appId: event.session.application.applicationId,
          intentName: event.request.intent ? event.request.intent.name : null
        });
        kidsSkill.logRequest();
        return kidsSkill.handleIntent();
      })
      .then((resp) => {
        const {
          sessionAttributes, speechletResponse
        } = resp;
        return callback(null, AlexaFactory.buildResponse({ sessionAttributes, speechletResponse: AlexaFactory.buildSpeechletResponse(speechletResponse) }));
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
