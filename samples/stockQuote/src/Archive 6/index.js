/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This sample shows how to create a Lambda function for handling Alexa Skill requests that:
 *
 * - Web service: communicate with an external web service to get events for specified days in history (Wikipedia API)
 * - Pagination: after obtaining a list of events, read a small subset of events and wait for user prompt to read the next subset of events by maintaining session state
 * - Dialog and Session state: Handles two models, both a one-shot ask and tell model, and a multi-turn dialog model.
 * - SSML: Using SSML tags to control how Alexa renders the text-to-speech.
 *
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
var APP_ID = 'amzn1.echo-sdk-ams.app.35677929-49af-489d-b7b2-159fa590cb2f'; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var http = require('http');

/**
 * The AlexaSkill Module that has the AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * URL prefix to download history content from Wikipedia
 */
var urlPrefix = 'http://dev.markitondemand.com/MODApis/Api/v2/Quote/jsonp?symbol=';
// Alternate quote service: http://dev.markitondemand.com/MODApis/Api/v2/Quote/jsonp?symbol=ebay
// google quote service: https://www.google.com/finance/info?q=NSE:

/**
 * Variable defining number of events to be read at one time
 */
var paginationSize = 3;

/**
 * Variable defining the length of the delimiter between events
 Used in Parse function, which we are not using.
 */
//var delimiterSize = 2;

/**
 * HistoryBuffSkill is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
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

    "GetNextQuoteIntent": function (intent, session, response) {
        handleNextQuoteRequest(intent, session, response);
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
    // If we wanted to initialize the session to have some attributes we could add those here.
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
            speechText = "There is a problem connecting to Google at this time. Please try again later.";
            cardContent = speechText;
            response.tell(speechText);
        } else {
            for (i = 0; i < paginationSize; i++) {
                cardContent = cardContent + priceDetails[3] + " ";
                speechText = "<p>" + speechText + priceDetails[3] + "</p> ";
            }
            speechText = speechText + " <p>Do you want to quote another?</p>";
            var speechOutput = {
                speech: "<speak>" + prefixContent + speechText + "</speak>",
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

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleNextQuoteRequest(intent, session, response) {
    var cardTitle = "Stock quote ",
        sessionAttributes = session.attributes,
        result = sessionAttributes.text,
        speechText = "",
        cardContent = "",
        repromptText = "Do you want to quote another?",
        i;
    if (!result) {
        speechText = "With Stock Quote, you can get current stock quotes for companies listed on the New York Stock Exchange.  For example, you could say A M Z N, or G O O G, or you can say exit. Now, which symbol do you want to quote?";
        cardContent = speechText;
    } else if (sessionAttributes.index >= result.length) {
        speechText = "There is no info for this symbol. Try another by saying <break time = \"0.3s\"/> quote for A M Z N.";
        cardContent = "There is no info for this symbol. Try another by saying, quote for A M Z N.";
    } else {
        for (i = 0; i < paginationSize; i++) {
            if (sessionAttributes.index>= result.length) {
                break;
            }
            speechText = speechText + "<p>" + result[sessionAttributes.index] + "</p> ";
            cardContent = cardContent + result[sessionAttributes.index] + " ";
            sessionAttributes.index++;
        }
        if (sessionAttributes.index < result.length) {
            speechText = speechText + " Wanna go deeper in history?";
            cardContent = cardContent + " Wanna go deeper in history?";
        }
    }
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

function getJsonQuoteFromgoogle(stockSymbol, eventCallback) {
    var url = urlPrefix + stockSymbol;
    console.log('getJsonQuoteFromgoogle called - ' + url);
    http.get(url, function(res) {
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
//            var str = '
//
//            // [
//            {
//            "id": "14135"
//            ,"t" : "GE"
//            ,"e" : "NYSE"
//            ,"l" : "30.91"
//            ,"l_fix" : "30.91"
//            ,"l_cur" : "30.90"
//            ,"s": "2"
//            ,"ltt":"6:35PM EDT"
//            ,"lt" : "Apr 6, 6:35PM EDT"
//            ,"lt_dts" : "2016-04-06T18:35:25Z"
//            ,"c" : "-0.07"
//            ,"c_fix" : "-0.07"
//            ,"cp" : "-0.24"
//            ,"cp_fix" : "-0.24"
//            ,"ccol" : "chr"
//            ,"pcls_fix" : "30.98"
//            ,"el": "30.90"
//            ,"el_fix": "30.90"
//            ,"el_cur": "30.90"
//            ,"elt" : "Apr 6, 7:55PM EDT"
//            ,"ec" : "-0.01"
//            ,"ec_fix" : "-0.01"
//            ,"ecp" : "-0.02"
//            ,"ecp_fix" : "-0.02"
//            ,"eccol" : "chr"
//            ,"div" : "0.23"
//            ,"yld" : "2.98"
//            }
//            ]
//'
            var re = /[\/]/g; 
            console.log(body);
            var priceDetails = JSON.parse(body);
            console.log('priceDetails JSON parse: ' + priceDetails);
//            var stringResult = parseJson(body);

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

