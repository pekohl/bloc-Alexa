/**

 * Examples:
 * One-shot model:
 * User:  "Alexa, ask Stock Quote for a quote for AMZN."
 * Alexa: "The current price of AMZN is $000.00. Would you like to quote another?"
 * User: "No."
 * Alexa: "Good bye!"
 *
 * Dialog model:
 * User:  "Alexa, open Stock Quote"
 * Alexa: "Stock Quote. What symbol would you like to quote?"
 * User:  "A M Z N"
 * Alexa: "The current price fo AMZN is $000.00. Would you like to quote another?
 * User: "No."
 * Alexa: "Good bye!"
 */


/**
 * App ID for the skill
 */
var APP_ID = 'amzn1.echo-sdk-ams.app.35677929-49af-489d-b7b2-159fa590cb2f';

var http = require('http');

var AlexaSkill = require('./AlexaSkill');

/**
 * URL prefix to look up stock information
 */
var urlPrefix = 'http://www.google.com/finance/info?q=NSE:';
// Alternate quote service: http://dev.markitondemand.com/MODApis/Api/v2/Quote/jsonp?symbol=ebay
// google quote service: https://www.google.com/finance/info?q=NSE:


var StockQuoteSkill = function() {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
StockQuoteSkill.prototype = Object.create(AlexaSkill.prototype);
StockQuoteSkill.prototype.constructor = StockQuoteSkill;

StockQuoteSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("StockQuoteSkill onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session init logic would go here
};

StockQuoteSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("StockQuoteSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

StockQuoteSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session cleanup logic would go here
};

StockQuoteSkill.prototype.intentHandlers = {

    "GetStockQuoteIntent": function (intent, session, response) {
        handleFirstQuoteRequest(intent, session, response);
    },


    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "With Stock Quote, you can get current stock quotes for companies listed on the New York Stock Exchange. Quotes may be delayed up to 20 minutes.  " +
            "For example, you could say A M Z N, or G O O G, or you can say exit. Now, which symbol do you want to quote?";
        var repromptText = "Which symbol should I look up?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    }
};

/**
 * Function to handle the onLaunch skill behavior
 */

function getWelcomeResponse(response) {
    var cardTitle = "Stock Quote";
    var repromptText = "With Stock Quote, you can get current stock quotes for companies listed on the New York Stock Exchange. Quotes may be delayed up to 20 minutes.  For example, you could say A M Z N, or G O O G, or you can say exit. Now, which symbol do you want to quote?";
    var speechText = "<p>Stock Quote.</p> <p>What symbol would you like to quote?</p>";
    var cardOutput = "Stock Quote. What symbol do you want to quote?";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.

    var speechOutput = {
        speech: "<speak>" + speechText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
}

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleFirstQuoteRequest(intent, session, response) {
    var stockSlot = intent.slots.stockSymbol.value;
    console.log("intent.slots.stockSymbol: " + stockSlot);
    var repromptText = "With Stock Quote, you can get current stock quotes for companies listed on the New York Stock Exchange. Quotes may be delayed up to 20 minutes.  For example, you could say A M Z N, or G O O G, or you can say exit. Now, which symbol do you want to quote?";

    var prefixContent = "<p>For ticker: " + stockSlot + ", </p>";
    var cardContent = "For ticker:  " + stockSlot + ", ";

    var cardTitle = "Current Price for: " + stockSlot;

    getJsonQuoteFromgoogle(stockSlot, function (priceDetails) {
        var speechText = "",
            i;

        if (priceDetails.length == 0) {
            speechText = "There is no info for this symbol. Try another by saying, <break time = \"0.3s\"/> QUOTE FOR,  <break time = \"0.3s\"/> and a new ticker symbol.";
            cardContent = speechText;
            response.tell(speechText);
        } else {
                cardContent = cardContent + priceDetails[0].l + " ";
                speechText = "For ticker: <say-as interpret-as='characters'>" + stockSlot + "</say-as><break time='.681s'/> $" + priceDetails[0].l;

//            speechText = speechText + " <p>Do you want to quote another?</p>";
            var speechOutput = {
                speech: "<speak>" + speechText + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };
            var repromptOutput = {
                speech: repromptText,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
        }
    });
}


function getJsonQuoteFromgoogle(stockSymbol, eventCallback) {
    var url = urlPrefix + stockSymbol;
    console.log('getJsonQuoteFromgoogle called - ' + url);

    http.get(url, function(res) {
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            var priceDetails = JSON.parse(body.substring(3,500));
            console.log('priceDetails JSON parse: ' + priceDetails);

            eventCallback(priceDetails);
        });
    }).on('error', function (e) {
        console.log("Got error in getJsonQuoteFromgoogle: ", e);
    });
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {

    var skill = new StockQuoteSkill();
    skill.execute(event, context);
};

