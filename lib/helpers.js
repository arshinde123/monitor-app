// Helpers

// Dependencies
var crypto = require('crypto');
var querystring = require('querystring');
var https = require('https');
var path = require('path');
var fs = require('fs');

var config = require('./config');

// Container for the helpers 
var helpers = {};

// Create a SHA256 hash
helpers.hash = function(str){
    if(typeof(str) == 'string' && str.length > 0){
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
    try {
        var obj = JSON.parse(str)
        return obj;
    } catch (error) {
        return {};
    }
};

// Create a string random alpha-numeric characters of a given length
helpers.createRandomString = function(strLength){
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength){
        // Define all the possible characters that could go into a string
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        // start the final string
        var str = '';
        for(i=1; i<=strLength; i++){
            // Get the random character from the possible characters string
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));

            //Append this character to the final string.
            str += randomCharacter;
        }
        
        // Return the final string
        return str;
    } else {
        return false;
    }
};

// Send an SMS message via Twilio
helpers.sendTwilioSms = function(phone, msg, callback){
    // Validate the parameters
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim().length <= 1600 ? msg.trim() : false;
    
    if(phone && msg){
        // Configure the request payload
        var payload = {
            'From': config.twilio.fromPhone,
            'To': '+91'+phone,
            'Body': msg
        };

        // Stringify the payload
        var stringPayload = querystring.stringify(payload);

        // Configure the request details
        var requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages',
            'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-length': Buffer.byteLength(stringPayload)
            }
        };

        // Instantiate the request object
        var req = https.request(requestDetails, function(res){
            // Grab the status of the sent request
            var status = res.statusCode;

            // Callback if request went through
            if(status == 200 || status == 201){
                callback(false);
            } else {
                callback('Status code returned was '+status);
            }
        });

        // Bind to the error event so it doesn't get thrown
        req.on('error', function(e){
            callback(e);
        });

        // Add the payload to req
        req.write(stringPayload);

        // End the reqest
        req.end();
    } else {
        callback('Phone or Msg missing/invalid');
    }
};

// Get the string content of a template
helpers.getTemplate = function(templateName, callback){
    templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
    if(templateName){
        var templatesDir = path.join(__dirname, '/../templates/');
        fs.readFile(templatesDir+templateName+'.html', 'utf8', function(err, str){
            if(!err && str && str.length > 0){
                callback(false, str);
            } else{
                callback('No template file found');
            }
        });
    } else {
        callback('A valid template name not specified');
    }
}

// Export the container
module.exports = helpers;