/* eslint-disable  func-names */
/* eslint-disable  dot-notation */
/* eslint-disable  new-cap */
/* eslint quote-props: ['error', 'consistent']*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports en-US lauguage.
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-trivia
 **/

'use strict';

const Alexa = require('alexa-sdk');
const makePlainText = Alexa.utils.TextUtils.makePlainText;
const makeRichText = Alexa.utils.TextUtils.makeRichText;
const makeImage = Alexa.utils.ImageUtils.makeImage;
const questions = require('./questionResponse.json');

const ANSWER_COUNT = 4; // The number of possible answers per trivia question.
const GAME_LENGTH = 5;  // The number of questions per trivia game.
const GAME_STATES = {
    TRIVIA: '_TRIVIAMODE', // Asking trivia questions.
    START: '_STARTMODE', // Entry point, start the game.
    HELP: '_HELPMODE', // The user is asking for help.
    STOP: '_STOPMODE', // The user is about to quit the game.
};

/**
 * When editing your questions pay attention to your punctuation. Make sure you use question marks or periods.
 * Make sure the first answer is the correct one. Set at least ANSWER_COUNT answers, any extras will be shuffled in.
 */
const languageString = {
    'en': {
        'translation': {
            'QUESTIONS': questions,
            'GAME_NAME': 'It Makes Cents Currency Quiz', // Be sure to change this for your skill.
            'HELP_MESSAGE': 'I will ask you %s multiple choice questions. Respond with the number of the answer. ' +
                'For example, say one, two, three, or four. To start a new game at any time, say, start game. ',
            'REPEAT_QUESTION_MESSAGE': 'To repeat the last question, say, repeat. ',
            'ASK_MESSAGE_START': 'Would you like to start playing?',
            'HELP_REPROMPT': 'To give an answer to a question, respond with the number of the answer. ',
            'STOP_MESSAGE': 'Would you like to start another game?',
            'CONTINUE_MESSAGE': 'Would you like to continue playing?',
            'CANCEL_MESSAGE': 'Ok, let\'s play again soon.',
            'NO_MESSAGE': 'Ok, we\'ll play another time. Goodbye!',
            'TRIVIA_UNHANDLED': 'Try saying a number between 1 and %s',
            'HELP_UNHANDLED': 'Say yes to continue, or no to end the game.',
            'STOP_UNHANDLED': 'Say yes to start another game, or no to exit the quiz.',
            'START_UNHANDLED': 'Say start to start a new game.',
            'NEW_GAME_MESSAGE': 'Welcome to %s. ',
            'WELCOME_MESSAGE': 'I will ask you %s questions, try to get as many right as you can. ' +
            'Just say the number of the answer. Let\'s begin. ',
            'ANSWER_CORRECT_MESSAGE': 'correct. ',
            'ANSWER_WRONG_MESSAGE': 'wrong. ',
            'CORRECT_ANSWER_MESSAGE': 'The correct answer is %s: %s. ',
            'ANSWER_IS_MESSAGE': 'That answer is ',
            'TELL_QUESTION_MESSAGE': 'Question %s. %s ',
            'GAME_OVER_MESSAGE': 'You got %s out of %s questions correct. Thank you for playing!',
            'SCORE_IS_MESSAGE': 'Your score is %s. ',
        },
    }
};

const backgroundImages = [
    "https://coingame.s3.amazonaws.com/coins-large.jpg",
    "https://coingame.s3.amazonaws.com/bank-building-large.jpg",
    "https://coingame.s3.amazonaws.com/ben-large.jpg",
    "https://coingame.s3.amazonaws.com/coin-stack-large.jpg",
    "https://coingame.s3.amazonaws.com/cubby-large.jpg",
    "https://coingame.s3.amazonaws.com/face-large.jpg",
    "https://coingame.s3.amazonaws.com/hold-large.jpg",
    "https://coingame.s3.amazonaws.com/hundred-large.jpg",
    "https://coingame.s3.amazonaws.com/jar-large.jpg",
    "https://coingame.s3.amazonaws.com/margaret-large.jpg",
    "https://coingame.s3.amazonaws.com/money-table-large.jpg",
    "https://coingame.s3.amazonaws.com/paper-large.jpg",
    "https://coingame.s3.amazonaws.com/penny-large.jpg",
    "https://coingame.s3.amazonaws.com/piggy-large.jpg",
    "https://coingame.s3.amazonaws.com/pyramid-large.jpg",
    "https://coingame.s3.amazonaws.com/world-map-large.jpg"
];

const newSessionHandlers = {
    'LaunchRequest': function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState('StartGame', true);
    },
    'QuizIntent': function() {
        this.handler.state = GAME_STATES.START;
        this.emitWithState('StartGame', true);
    },
    'AMAZON.StartOverIntent': function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState('StartGame', true);
    },
    'AMAZON.HelpIntent': function () {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState('helpTheUser', true);
    },
    'Unhandled': function () {
        const speechOutput = this.t('START_UNHANDLED');
        askWithCardBackground(this, speechOutput, speechOutput, speechOutput);
    },
};

function populateGameQuestions(translatedQuestions) {
    console.log('in populateGameQuestions method');
    const gameQuestions = [];
    const indexList = [];
    let index = translatedQuestions.length;
    console.log('index ', index); //index 30

    if (GAME_LENGTH > index) {
        throw new Error('Invalid Game Length.');
    }

    for (let i = 0; i < translatedQuestions.length; i++) {
        indexList.push(i);
    }

    // Pick GAME_LENGTH random questions from the list to ask the user, make sure there are no repeats.
    for (let j = 0; j < GAME_LENGTH; j++) {
        const rand = Math.floor(Math.random() * index);
        index -= 1;

        const temp = indexList[index];
        indexList[index] = indexList[rand];
        indexList[rand] = temp;
        gameQuestions.push(indexList[index]);
    }

    console.log('gameQuestions ', gameQuestions); //[7, 12, 28, 3, 22]

    return gameQuestions;
}

/**
 * Get the answers for a given question, and place the correct answer at the spot marked by the
 * correctAnswerTargetLocation variable. Note that you can have as many answers as you want but
 * only ANSWER_COUNT will be selected.
 * */
function populateRoundAnswers(gameQuestionIndexes, correctAnswerIndex, correctAnswerTargetLocation, translatedQuestions) {
    const answers = [];
    console.log('in populateRoundAnswersMethod');
    const answersCopy = translatedQuestions[gameQuestionIndexes[correctAnswerIndex]][Object.keys(translatedQuestions[gameQuestionIndexes[correctAnswerIndex]])[0]].slice();
    console.log('answersCopy ', answersCopy); // answersCopy [ 'Billie Mae Richards', 'Burl Ives', 'Paul Soles', 'Lady Gaga' ]
    let index = answersCopy.length;
    console.log('index ', index); // 4

    if (index < ANSWER_COUNT) {
        throw new Error('Not enough answers for question.');
    }

    // Shuffle the answers, excluding the first element which is the correct answer.
    for (let j = 1; j < answersCopy.length; j++) {
        const rand = Math.floor(Math.random() * (index - 1)) + 1;
        index -= 1;

        const swapTemp1 = answersCopy[index];
        answersCopy[index] = answersCopy[rand];
        answersCopy[rand] = swapTemp1;
        console.log('answersCopy[rand]', answersCopy[rand]); // hit 3 times saying 'Lady Gaga'
    }

    // Swap the correct answer into the target location
    for (let i = 0; i < ANSWER_COUNT; i++) {
        answers[i] = answersCopy[i];
    }
    const swapTemp2 = answers[0];
    answers[0] = answers[correctAnswerTargetLocation];
    answers[correctAnswerTargetLocation] = swapTemp2;
    console.log('answers ', answers); //answers [ 'Billie Mae Richards', 'Lady Gaga', 'Burl Ives', 'Paul Soles' ] then goes to start game
    return answers;
}

function isAnswerSlotValid(intent) {
    const answerSlotFilled = intent && intent.slots && intent.slots.Answer && intent.slots.Answer.value;
    const answerSlotIsInt = answerSlotFilled && !isNaN(parseInt(intent.slots.Answer.value, 10));
    return answerSlotIsInt
        && parseInt(intent.slots.Answer.value, 10) < (ANSWER_COUNT + 1)
        && parseInt(intent.slots.Answer.value, 10) > 0;
}

function getFollowUpSentence(question) {
    if (question.hasOwnProperty('follow-up')) {
        return question['follow-up'] + ' ';
    } else {
        return '';
    } 
}

function getRandomBackgroundUrl() {
    const rand = Math.floor(Math.random() * backgroundImages.length);
    return backgroundImages[rand];
}

function askWithCardBackground(context, speechOutput, repromptText, cardText) {
    context.response.speak(speechOutput)
            .listen(repromptText);
    if (context.event.context.System.device.supportedInterfaces.Display) {
        const builder = new Alexa.templateBuilders.BodyTemplate1Builder();
        const template = builder.setTitle(context.t('GAME_NAME'))
                                .setBackgroundImage(makeImage(getRandomBackgroundUrl()))
                                .setTextContent(makeRichText(cardText))
                                .build();

        context.response.renderTemplate(template);
    }
    context.emit(':responseReady');
}

function tellWithCardBackground(context, speechOutput, cardText) {
    context.response.speak(speechOutput);
    if (context.event.context.System.device.supportedInterfaces.Display) {
        const builder = new Alexa.templateBuilders.BodyTemplate1Builder();
        const template = builder.setTitle(context.t('GAME_NAME'))
                                .setBackgroundImage(makeImage(getRandomBackgroundUrl()))
                                .setTextContent(makeRichText(cardText))
                                .build();

        context.response.renderTemplate(template);
    }
    context.emit(':responseReady');
}

function handleUserGuess(userGaveUp) {
    const answerSlotValid = isAnswerSlotValid(this.event.request.intent);
    let speechOutput = '';
    let speechOutputAnalysis = '';
    const gameQuestions = this.attributes.questions;
    let correctAnswerIndex = parseInt(this.attributes.correctAnswerIndex, 10);
    let currentScore = parseInt(this.attributes.score, 10);
    let currentQuestionIndex = parseInt(this.attributes.currentQuestionIndex, 10);
    const correctAnswerText = this.attributes.correctAnswerText;
    const translatedQuestions = this.t('QUESTIONS');

    console.log('in handleUserGuess ');
    console.log('gameQuestions ', gameQuestions);
    console.log('correctAnswerIndex ', correctAnswerIndex);
    console.log('currentScore ', currentScore);
    console.log('currentQuestionIndex ', currentQuestionIndex);
    console.log('correctAnswerIndex ', correctAnswerIndex);
    console.log('translatedQuestions ', translatedQuestions);

    if (answerSlotValid && parseInt(this.event.request.intent.slots.Answer.value, 10) === this.attributes['correctAnswerIndex']) {
        currentScore++;
        speechOutputAnalysis = this.t('ANSWER_CORRECT_MESSAGE');
    } else {
        if (!userGaveUp) {
            speechOutputAnalysis = this.t('ANSWER_WRONG_MESSAGE');
        }

        speechOutputAnalysis += this.t('CORRECT_ANSWER_MESSAGE', correctAnswerIndex, correctAnswerText);
    }

    speechOutputAnalysis += this.attributes['follow-up'];

    // Check if we can exit the game session after GAME_LENGTH questions (zero-indexed)
    if (this.attributes['currentQuestionIndex'] === GAME_LENGTH - 1) {
        speechOutput = userGaveUp ? '' : this.t('ANSWER_IS_MESSAGE');
        let cardText = speechOutput;
        speechOutput += speechOutputAnalysis + this.t('GAME_OVER_MESSAGE', currentScore.toString(), GAME_LENGTH.toString());
        cardText += speechOutputAnalysis + "<br /><br />" + this.t('GAME_OVER_MESSAGE', currentScore.toString(), GAME_LENGTH.toString());

        tellWithCardBackground(this, speechOutput, cardText);
    } else {
        currentQuestionIndex += 1;
        correctAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
        const spokenQuestion = Object.keys(translatedQuestions[gameQuestions[currentQuestionIndex]])[0];
        const roundAnswers = populateRoundAnswers.call(this, gameQuestions, currentQuestionIndex, correctAnswerIndex, translatedQuestions);
        const questionIndexForSpeech = currentQuestionIndex + 1;
        let repromptText = this.t('TELL_QUESTION_MESSAGE', questionIndexForSpeech.toString(), spokenQuestion);
        let cardText = this.t('TELL_QUESTION_MESSAGE', questionIndexForSpeech.toString(), spokenQuestion);
        cardText += "<br />"

        for (let i = 0; i < ANSWER_COUNT; i++) {
            repromptText += `${i + 1}. ${roundAnswers[i]}. `;
            cardText += `<br />${i + 1}. ${roundAnswers[i]}. `;
        }

        speechOutput += userGaveUp ? '' : this.t('ANSWER_IS_MESSAGE');
        speechOutput += speechOutputAnalysis + this.t('SCORE_IS_MESSAGE', currentScore.toString()) + repromptText;
        
        let followUp = getFollowUpSentence(translatedQuestions[gameQuestions[currentQuestionIndex]]);

        Object.assign(this.attributes, {
            'speechOutput': repromptText,
            'repromptText': repromptText,
            'cardText': cardText,
            'currentQuestionIndex': currentQuestionIndex,
            'correctAnswerIndex': correctAnswerIndex + 1,
            'questions': gameQuestions,
            'score': currentScore,
            'correctAnswerText': translatedQuestions[gameQuestions[currentQuestionIndex]][Object.keys(translatedQuestions[gameQuestions[currentQuestionIndex]])[0]][0],
            'follow-up': followUp
        });

        askWithCardBackground(this, speechOutput, repromptText, cardText);
    }
}

const startStateHandlers = Alexa.CreateStateHandler(GAME_STATES.START, {
    'StartGame': function (newGame) {
        let speechOutput = newGame ? this.t('NEW_GAME_MESSAGE', this.t('GAME_NAME')) + this.t('WELCOME_MESSAGE', GAME_LENGTH.toString()) : '';
        // Select GAME_LENGTH questions for the game
        const translatedQuestions = this.t('QUESTIONS');
        const gameQuestions = populateGameQuestions(translatedQuestions);
        // Generate a random index for the correct answer, from 0 to 3
        const correctAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
        // Select and shuffle the answers for each question
        const roundAnswers = populateRoundAnswers(gameQuestions, 0, correctAnswerIndex, translatedQuestions);
        const currentQuestionIndex = 0;
        const spokenQuestion = Object.keys(translatedQuestions[gameQuestions[currentQuestionIndex]])[0];
        let repromptText = this.t('TELL_QUESTION_MESSAGE', '1', spokenQuestion);
        let cardText = this.t('TELL_QUESTION_MESSAGE', '1', spokenQuestion);
        cardText += "<br />"
        for (let i = 0; i < ANSWER_COUNT; i++) {
            repromptText += `${i + 1}. ${roundAnswers[i]}. `;
            cardText += `<br />${i + 1}. ${roundAnswers[i]}. `;
        }

        
    console.log('in startGame ');
    console.log('translatedQuestions ', translatedQuestions);
    /*
[{ 'Who was the voice of Rudolph in the 1964 classic?': [ 'Billie Mae Richards', 'Burl Ives', 'Paul Soles', 'Lady Gaga' ] }, etc]
goes on with every single question
    */
    console.log('gameQuestions ', gameQuestions); // gameQuestions [ 7, 12, 28, 3, 22 ]
    console.log('correctAnswerIndex ', correctAnswerIndex); // 0
    console.log('roundAnswers ', roundAnswers); // roundAnswers [ 'Billie Mae Richards', 'Lady Gaga', 'Burl Ives', 'Paul Soles' ]
    console.log('spokenQuestion ', spokenQuestion); // Who was the voice of Rudolph in the 1964 classic?

        speechOutput += repromptText;

        let followUp = getFollowUpSentence(translatedQuestions[gameQuestions[currentQuestionIndex]]);

        Object.assign(this.attributes, {
            'speechOutput': repromptText,
            'repromptText': repromptText,
            'cardText': cardText,
            'currentQuestionIndex': currentQuestionIndex,
            'correctAnswerIndex': correctAnswerIndex + 1,
            'questions': gameQuestions,
            'score': 0,
            'correctAnswerText': translatedQuestions[gameQuestions[currentQuestionIndex]][Object.keys(translatedQuestions[gameQuestions[currentQuestionIndex]])[0]][0],
            'follow-up': followUp
        });

        // Set the current state to trivia mode. The skill will now use handlers defined in triviaStateHandlers
        this.handler.state = GAME_STATES.TRIVIA;

        askWithCardBackground(this, speechOutput, repromptText, cardText);
    },
});

const triviaStateHandlers = Alexa.CreateStateHandler(GAME_STATES.TRIVIA, {
    'AnswerIntent': function () {
        handleUserGuess.call(this, false);
    },
    'DontKnowIntent': function () {
        handleUserGuess.call(this, true);
    },
    'AMAZON.StartOverIntent': function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState('StartGame', false);
    },
    'AMAZON.RepeatIntent': function () {
        askWithCardBackground(this, this.attributes['speechOutput'], this.attributes['repromptText'], this.attributes['cardText']);
    },
    'AMAZON.HelpIntent': function () {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState('helpTheUser', false);
    },
    'AMAZON.StopIntent': function () {
        this.handler.state = GAME_STATES.STOP;
        this.emitWithState('StopGame');
    },
    'AMAZON.CancelIntent': function () {
        tellWithCardBackground(this, this.t('CANCEL_MESSAGE'), this.t('CANCEL_MESSAGE'));
    },
    'Unhandled': function () {
        const speechOutput = this.t('TRIVIA_UNHANDLED', ANSWER_COUNT.toString());
        askWithCardBackground(this, speechOutput, speechOutput, speechOutput);
    },
    'SessionEndedRequest': function () {
        console.log(`Session ended in trivia state: ${this.event.request.reason}`);
    },
});

const helpStateHandlers = Alexa.CreateStateHandler(GAME_STATES.HELP, {
    'helpTheUser': function (newGame) {
        const askMessage = newGame ? this.t('ASK_MESSAGE_START') : this.t('REPEAT_QUESTION_MESSAGE') + this.t('CONTINUE_MESSAGE');
        const speechOutput = this.t('HELP_MESSAGE', GAME_LENGTH) + askMessage;
        const repromptText = this.t('HELP_REPROMPT') + askMessage;
        askWithCardBackground(this, speechOutput, repromptText, repromptText);
    },
    'AMAZON.StartOverIntent': function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState('StartGame', false);
    },
    'AMAZON.RepeatIntent': function () {
        const newGame = !(this.attributes['speechOutput'] && this.attributes['repromptText']);
        this.emitWithState('helpTheUser', newGame);
    },
    'AMAZON.HelpIntent': function () {
        const newGame = !(this.attributes['speechOutput'] && this.attributes['repromptText']);
        this.emitWithState('helpTheUser', newGame);
    },
    'AMAZON.YesIntent': function () {
        if (this.attributes['speechOutput'] && this.attributes['repromptText']) {
            this.handler.state = GAME_STATES.TRIVIA;
            this.emitWithState('AMAZON.RepeatIntent');
        } else {
            this.handler.state = GAME_STATES.START;
            this.emitWithState('StartGame', false);
        }
    },
    'AMAZON.NoIntent': function () {
        const speechOutput = this.t('NO_MESSAGE');
        tellWithCardBackground(this, speechOutput, speechOutput);
    },
    'AMAZON.StopIntent': function () {
        this.handler.state = GAME_STATES.STOP;
        this.emitWithState('StopGame');
    },
    'AMAZON.CancelIntent': function () {
        tellWithCardBackground(this, this.t('CANCEL_MESSAGE'), this.t('CANCEL_MESSAGE'));
    },
    'Unhandled': function () {
        const speechOutput = this.t('HELP_UNHANDLED');
        askWithCardBackground(this, speechOutput, speechOutput, speechOutput);
    },
    'SessionEndedRequest': function () {
        console.log(`Session ended in help state: ${this.event.request.reason}`);
    },
});

const stopStateHandlers = Alexa.CreateStateHandler(GAME_STATES.STOP, {
    'StopGame': function() {
        const speechOutput = this.t('STOP_MESSAGE');
        askWithCardBackground(this, speechOutput, speechOutput, speechOutput);
    },
    'AMAZON.StartOverIntent': function () {
        this.emitWithState('AMAZON.YesIntent');
    },
    'AMAZON.RepeatIntent': function () {
        askWithCardBackground(this, this.attributes['speechOutput'], this.attributes['repromptText'], this.attributes['cardText']);
    },
    'AMAZON.StopIntent': function () {
        this.emitWithState('AMAZON.NoIntent');
    },
    'AMAZON.YesIntent': function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState('StartGame', false);
    },
    'AMAZON.NoIntent': function () {
        const speechOutput = this.t('NO_MESSAGE');
        tellWithCardBackground(this, speechOutput, speechOutput);
    },
    'Unhandled': function () {
        const speechOutput = this.t('STOP_UNHANDLED');
        askWithCardBackground(this, speechOutput, speechOutput, speechOutput);
    },
    'SessionEndedRequest': function () {
        console.log(`Session ended in trivia state: ${this.event.request.reason}`);
    },
});

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageString;
    alexa.registerHandlers(newSessionHandlers, startStateHandlers, triviaStateHandlers, helpStateHandlers, stopStateHandlers);
    alexa.execute();
};