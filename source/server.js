'use strict';

const path = require('path');
const dotenv = require('dotenv');
const botkit = require('botkit');
const event = require('./events');
const api = require('devrant-api');
const helpers = require('./helpers');
const beepboop = require('beepboop-botkit');

//
// Configure environment
// Here we configure the applications environment.
//

dotenv.config({
    silent: true
});

//
// Create a bot controller.
// Here we create the bot controller.
//

let botkitController = botkit.slackbot({
    debug: false,
    json_file_store: './store'
});

// 
// Intergrate Beep Boop
// Here we overide the default controller with beepboops.
// 

if (process.env.SLACK_TOKEN) {
    
    botkitController.spawn({token: process.env.SLACK_TOKEN}).startRTM(function (error, bot, payload) {
        if (error) throw error;
    });

} else {
    beepboop.start(botkitController, {debug: false});
}

//
// Commands
// Here we define any commands the bot will respond to.
//

botkitController.hears('help', [event.DIRECT_MESSAGE, event.DIRECT_MENTION], (bot, message) => {

    bot.startPrivateConversation({user: message.user}, (error, conversation) => {

        if (!error) {

            conversation.say('`rant [id]` - Get a rant.');
            conversation.say('`latest` - Get the latest rant.');
            conversation.say('`search [term]` or `find [term]` - Get a rant matchimg the term.');
            conversation.say('`surprise` or `random` - Get a surprise (random) rant.');
            conversation.say('`weekly` - Get a weekly rant.');
        } else {
            conversation.say('I was unable to get the list of commands for you, sorry :cry:.');
        }
    });
});

botkitController.hears(['latest', 'recent', 'newest'], [event.DIRECT_MESSAGE, event.DIRECT_MENTION], (bot, message) => {

    bot.startTyping(message);

    api.rants.all({algo: 'recent', app: 3}).then(rants => {

        const random = helpers.random(0, 10);
        const rant = rants[random];
        
        const response = {
            attachments: [
                helpers.formatRant(rant)
            ]
        };

        bot.reply(message, response);

    }).catch((error) => {
        const response = 'Oh no! I was unable to get the latest rant :cry:. ' +
                         'Note that this could be devRant\'s fault :joy:.';
        bot.reply(message, response + ' (*ERROR: "' + error.toString() + '"*)');
    });
});

botkitController.hears('rant ([0-9]{4,})', [event.DIRECT_MESSAGE, event.DIRECT_MENTION], (bot, message) => {

    if (message.match.indexOf(1) !== -1) {
        return false;
    }

    const id = message.match[1];

    bot.startTyping(message);

    api.rants.single(id, {app: 3}).then(rant => {

        const response = {
            attachments: [
                helpers.formatRant(rant)
            ]
        };

        bot.reply(message, response);

    }).catch((error) => {
        const response = 'Oh no! I was unable to get the requested rant :cry:. ' +
                         'Note that this could be devRant\'s fault :joy:.';
        bot.reply(message, response + ' (*ERROR: "' + error.toString() + '"*)');
    });
});

botkitController.hears(['search (.*)', 'find (.*)', 'get (.*)'], [event.DIRECT_MESSAGE, event.DIRECT_MENTION], (bot, message) => {

    if (message.match.indexOf(1) !== -1) {
        return false;
    }

    const term = message.match[1];

    bot.startTyping(message);

    api.api.search({term: term, app: '3'}).then(results => {

        const random = helpers.random(0, 10);
        const rant = results[random];

        const response = {
            attachments: [
                helpers.formatRant(rant)
            ]
        };

        bot.reply(message, response);

    }).catch((error) => {
        const response = 'Oh no! I was unable to search the requested term :cry:.' +
                         'Note that this could be devRant\'s fault :joy:.';
        bot.reply(message, response + ' (*ERROR: "' + error.toString() + '"*)');
    });
});

botkitController.hears(['surprise', 'random'], [event.DIRECT_MESSAGE, event.DIRECT_MENTION], (bot, message) => {

    bot.startTyping(message);

    api.rants.surprise({app: 3}).then(rant => {

        const response = {
            attachments: [
                helpers.formatRant(rant)
            ]
        };

        bot.reply(message, response);

    }).catch((error) => {
        const response = 'Oh no! I was unable to surprise you with a random rant :cry:.' +
                         'Note that this could be devRant\'s fault :joy:.';
        bot.reply(message, response + ' (*ERROR: "' + error.toString() + '"*)');
    });
});

botkitController.hears('weekly', [event.DIRECT_MESSAGE, event.DIRECT_MENTION], (bot, message) => {

    bot.startTyping(message);

    api.api.weeklyRants({app: 3}).then(results => {

        const random = helpers.random(0, 10);
        const rant = results[random];

        const response = {
            attachments: [
                helpers.formatRant(rant)
            ]
        };

        bot.reply(message, response);

    }).catch((error) => {
        const response = 'Oh no! I was unable to provide you with a weekly rant :cry:.' +
                         'Note that this could be devRant\'s fault :joy:.';
        bot.reply(message, response + ' (*ERROR: "' + error.toString() + '"*)');
    });
});

//
// Events
// Here we define any events the bot responds to.
//

botkitController.on('create_bot', (bot, config) => {

    if (!_bots[bot.config.token]) {

        bot.startRTM((error) => {

            if (!error) {

                trackBot(bot);

                bot.startPrivateConversation({user: config.createdBy}, (error, conversation) => {

                    if (error) {
                        throw new Error('Unable to start conversation.');
                    }

                    conversation.say('Hello, I am devRant bot. Thanks for allowing me to be apart of your Slack channel.');
                    conversation.say('To get started, `/invite` me to a channel.');
                    conversation.say('If you are unsure of anything, type `help` for a list of commands.');
                });
            } else {
                throw error;
            }
        });
    }
});
