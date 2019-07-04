/*
* create and export configuration variables
*/

// container for all the environments

var environments = {};

// staging (default) environment
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging'
}

// production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production'
}

var currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
module.exports = typeof(environments[currentEnv]) == 'object' ? environments[currentEnv] : environments.staging;