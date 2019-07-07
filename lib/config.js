/*
* create and export configuration variables
*/

// container for all the environments

var environments = {};

// staging (default) environment
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'thisIsASecret',
    'maxChecks': 5,
    'twilio': {
        'accountSid': 'ACf97c6c25524b95a354a4a01657ec2667',
        'authToken': '7c40cebaa058672904386485e7a1b4ca',
        'fromPhone': '+15005550006'
    }
}

// production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'thisIsAlsoASecret',
    'maxChecks': 5,
    'twilio': {
        'accountSid': '',
        'authToken': '',
        'fromPhone': ''
    }
}

var currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
module.exports = typeof(environments[currentEnv]) == 'object' ? environments[currentEnv] : environments.staging;