// Requet Handlers

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');

// Define the handlers
var handlers = {};

// Users
handlers.users = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1)
        handlers._users[data.method](data, callback);
    else
        callback(405);
};

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback) {
    // check that all required fields are filled out
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement){
        // make sure that the user doesn't already exist
        _data.read('users', phone, function(err, data){
            if(err){
                // Hash the password
                var hashedPassword = helpers.hash(password);

                if(hashedPassword) {
                    // Create the user object
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    }

                    // Store the user
                    _data.create('users', phone, userObject, function(err){
                        if(!err) return callback(200)
                        else {
                            console.log(err);
                            callback(500, {'Error': 'Could not create the new user'});
                        }
                    });
                }
                else {
                    callback(500, {'Error': 'Could not hash the user\'s password'});
                }

            } else {
                // user already exists
                callback(400, {'Error': 'A user with same phone number already exists'});
            }
        });

    }else{
        callback(400, {'Error': 'Missing required fields'});
    }
};

// Users - get
// Required data: phone
// Optional data: none
handlers._users.get = function(data, callback) {
    // Check phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length > 0 ? data.queryStringObject.phone : false;
    if(phone){
        // Get the token from the headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify the given token is valid fo the phone number
        handlers._tokens.verifyToken(token, phone, function(isTokenValid){
            if(isTokenValid){
                 // Lookup the user
                _data.read('users', phone, function(err, data){
                    if(!err && data){
                        // Remove hashed password
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, {'Error': 'Missing required token in headers'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// Users - put
// Require data: phone
// Optional data: firstName, lastName, password
// (at least one optinal data is required)
handlers._users.put = function(data, callback) {
    // Check the required field
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length > 0 ? data.queryStringObject.phone : false;

    // Check the optional fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if the phon is invalid
    if(phone){
        // Error if nothing is sent to update
        if(firstName || lastName || password){
            // Get the token from the headers
            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            // Verify the given token is valid fo the phone number
            handlers._tokens.verifyToken(token, phone, function(isTokenValid){
                if(isTokenValid){
                    // Lookup the user
                    _data.read('users', phone, function(err, userData){
                        if(!err && userData){
                            // Update the user data
                            if(firstName) userData.firstName = firstName;
                            if(lastName) userData.lastName = lastName;
                            if(password) {

                                userData.hashedPassword = helpers.hash(password);
                            }
                            
                            // Store the updated data
                            _data.update('users', phone, userData, function(err){
                                if(!err){
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, {'Error': 'Could not update the user'});
                                }
                            });
                        } else {
                            callback(404, {'Error': 'The sepecified user doesn\'t exists'});
                        }
                    });
                } else {
                    callback(403, {'Error': 'Missing required token in headers'});
                }
            });
        } else {
            callback(400, {'Error': 'Missing fields to update'});
        }
    } else {
        callback(400, {'Error': "Missing required field"});
    }
};

// Users - delete
// Required data: phone
// Optional data: none
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = function(data, callback) {
    // Check phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length > 0 ? data.queryStringObject.phone : false;
    if(phone){
        // Get the token from the headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify the given token is valid fo the phone number
        handlers._tokens.verifyToken(token, phone, function(isTokenValid){
            if(isTokenValid){
                
            } else {
                callback(403, {'Error': 'Missing required token in headers'});
            }
        });
        // Lookup the user
        _data.read('users', phone, function(err, data){
            if(!err && data){
                // Remove user data
                _data.delete('users', phone, function(err){
                    if(!err){
                        callback(200);
                    } else {
                        callback(500, {'Error': 'Could not delete the user'});
                    }
                });
            } else {
                callback(404, {'Error': "Could not find the specified user"});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// Tokens
handlers.tokens = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1)
        handlers._tokens[data.method](data, callback);
    else
        callback(405);
};

// container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data, callback) {
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if(phone && password){
        // Lookup the user who matches that phone number
        _data.read('users', phone, function(err, userData){
            if(!err && userData){
                // Hash the password, and compare with stored hash password
                var hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword){
                    // crate a new token with a random name. set expiration date 1 hour in the future.
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60 * 60;
                    var tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, function(err){
                        if(!err){
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error': 'Could not create the new token'});
                        }
                    });
                } else {
                    callback(400, {'Error': 'Provided phone or password is invalid'});
                }
            } else {
                callback(400, {'Error': 'Provided phone or password is invalid'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function(data, callback) {
    // Check that the id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.length == 20 ? data.queryStringObject.id : false;
    if(id){
        // Lookup the token
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData){
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function(data, callback) {
    // Check the required fields
    var id = typeof(data.payload.id) == 'string' && data.payload.id.length == 20 ? data.payload.id : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if(id && extend){
        // Lookup the token
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData){
                // Check token is not expired alreay
                if(tokenData.expires > Date.now()){
                    // set expires an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    // Store the new token data
                    _data.update('tokens', id, tokenData, function(err){
                        if(!err){
                            callback(200);
                        } else {
                            callback(500, {'Error': 'Could not extend the token'});
                        }
                    });
                } else{
                    callback(400, {'Error': 'Token already expired, can\'t be extend'});
                }
            } else {
                callback(404, {'Error': 'Token not found'});
            }
        });
    } else {
      callback(400, {'Error': 'Missing required field(s) or field(s) are invalid'});
    }
};

// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data, callback) {
    // Check id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.length == 20 ? data.queryStringObject.id : false;
    if(id){
        // Lookup the id
        _data.read('tokens', id, function(err, data){
            if(!err && data){
                // Remove token
                _data.delete('tokens', id, function(err){
                    if(!err){
                        callback(200);
                    } else {
                        callback(500, {'Error': 'Could not delete the token'});
                    }
                });
            } else {
                callback(404, {'Error': "Could not find the specified token"});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// Verify if a given token id is currently valid for a given use
handlers._tokens.verifyToken = function(id, phone, callback){
    // Lookup the token
    _data.read('tokens', id, function(err, tokenData){
        if(!err && tokenData){
            // Check the token is for given user and not expired
            if(tokenData.phone == phone && tokenData.expires > Date.now()){
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

// ping handler
handlers.ping = function(data, callback){
    // callback a http status code and a payload object
    callback(200);
}

// Not found handler
handlers.notfound = function(data, callback){
    callback(404);
}

module.exports = handlers;