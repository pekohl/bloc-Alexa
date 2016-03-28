/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * example of how to create a Lambda function for handling Alexa Skill requests.
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, ask Car Facts for a car fact"
 *  Alexa: "Here's your car fact: ..."
 */

/**
 * App ID for the skill
 */
var APP_ID = undefined; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";

/**
 * Array containing car facts.
 */
var CAR_FACTS = [
    "You pay 8 times more for a gallon of Grande Latte coffee than you do for gas.",
    "Red cars are prohibited in Shanghai.",
    "The average driver speed in Los Angeles in ninteen seventy two was 60 miles per hour, in ninteen eighty two it was 17 miles per hour.",
    "The average American spends 2 weeks of their life at stop lights.",
    "The biggest speeding ticket was given in Switzerland for a whopping 1 million dollars.",
    "Drivers kill more deer than hunters annually.",
    "The car radio was invented in 1929.",
    "Ther are currently 1 billion cars in use on the planet.",
    "About 165,000 cars are prdouced every DAY. ",
    "The average car has 30,000 parts.",
    "The average American spends about 38 hours a year stuck in traffic",
    "There are more cars than people in Los Angeles.",
    "Honking your horn, except in an emergency, is illegal in New York City",
    "95% of a cars lifetime is spent parked.",
    "in 2012, Nevada became the first state to issue licenses for self-driving cars.",
    "Up to 80% of an average car is recyclable.",
    "The average Bugatti customer has bought 84 cars, 3 jets and 1 yacht.",
    "The Benz Patent-Motorwagen is believed to be the first modern automobile. It was built in 1886 by German inventor Carl Benz.",
    "Ferrari produces a maximum of 14 cars per day.",
    "An airbag takes only 40 milliseconds to deploy.",
    "Hong Kong is home to the most Rolls Royce’s in the world.",
    "1 out of every 4 cars produced in the world come from China.",
    "90% of drivers sing behind the wheel.",
    "Many British traffic police officers carry teddy bears to console children after car crashes.",
    "1 out of every 7 cars sold in the United States are sold in southern California.",
    "In 1925, you could purchase a Ford automobile for less than $300 U.S. dollars.",
    "A car was created that is fueled by cappuccino as an attempt at creating a renewable energy source. The car system converts used coffee grounds to flammable gas. It takes 56 espressos to fuel one mile in the car-puccino.",
    "The world’s most profitable car manufacturer is Porsche.",
    "Roads were first made for bicyclists, not cars."



];

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');


var CarFacts = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
CarFacts.prototype = Object.create(AlexaSkill.prototype);
CarFacts.prototype.constructor = CarFacts;

CarFacts.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("CarFacts onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

CarFacts.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("CarFacts onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleNewFactRequest(response);
};

/**
 * Overridden to show that a subclass can override this function to teardown session state.
 */
CarFacts.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("CarFacts onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

CarFacts.prototype.intentHandlers = {
    "GetNewFactIntent": function (intent, session, response) {
        handleNewFactRequest(response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can ask Car Facts to tell me a car fact, or, you can say exit... What can I help you with?", "What can I help you with?");
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

/**
 * Gets a random new fact from the list and returns to the user.
 */
function handleNewFactRequest(response) {
    // Get a random car fact from the car facts list
    var factIndex = Math.floor(Math.random() * CAR_FACTS.length);
    var fact = CAR_FACTS[factIndex];

    // Create speech output
    var speechOutput = "Here's your car fact: " + fact;

    response.tellWithCard(speechOutput, "CarFacts", speechOutput);
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the CarFacts skill.
    var carFact = new CarFacts();
    carFact.execute(event, context);
};

