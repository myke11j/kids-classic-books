'use strict';

module.exports = {
    cardGreeting : () => 'Welcome to Kids Classic Books',
    messageGreeting: () => 'Welcome to Kids Classic books. You can ask this skills, \'all-time most popular children books\', \'most popular children books of this week\' or book by title or author',
    repromptGreeting: () => 'I\'m sorry, I am not able to hear your request. Please repeat or say \'help\' for sample requests',
    cardHelp: () => 'Help from Kids Classic Books',
    messageHelp: () => 'You can ask this skills, \'all-time most popular children books\', \'most popular children books of this week\' or book by title or author',
    cardInvalidRequest: () => 'Kids Classic Books, unable to process request',
    messageInvalidRequest: () => 'I\'m sorry. I was not able to retrieve book title or author from your request. A sample request can be \'Tell me about Harry about from J.K. Rowlings\'',
    cardIneligibleRequest: () => 'Kids Classic Books, non-children book requested',
    messageIneligibleRequest: (book) => `${book} is not a children book according to our data records.`,
    cardGoodBye: () => 'Good Bye from Kids Classic Books',
    messageGoodBye: () => 'Good Bye',
    messageReprompt: () => 'I\'m sorry, I am not able to hear your request. Please repeat or say \'help\' for sample requests',
}