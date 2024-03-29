// Requet Handlers

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

// Define the handlers
var handlers = {};

/**
 * HTML Handlers
 */

 // Index handler
 handlers.index = function(data, callback){
     // Reject any request that isn't a GET
     if(data.method == 'get'){
        // Read in a template as a string
        helpers.getTemplate('index', function(err, str){
            if(!err && str){
                callback(200, str, 'html');
            } else {
                callback(500, undefined, 'html');
            }
        });
     } else {
         callback(405, undefined, 'html');
     }
 };


/**
 * JSON API Handlers
 */
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
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length > 0 ? data.queryStringObject.phone.trim() : false;

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
handlers._users.delete = function(data, callback) {
    // Check phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length > 0 ? data.queryStringObject.phone : false;
    if(phone){
        // Get the token from the headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify the given token is valid fo the phone number
        handlers._tokens.verifyToken(token, phone, function(isTokenValid){
            if(isTokenValid){
                // Lookup the user
                _data.read('users', phone, function(err, userData){
                    if(!err && userData){
                        // Remove user data
                        _data.delete('users', phone, function(err){
                            if(!err){
                                // Delete each of the checks associated with the user
                                var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                var checksToDelete = userChecks.length;
                                if(checksToDelete > 0){
                                    var checksDeleted = 0;
                                    var deletionErrors = false;

                                    // Loop through the checks
                                    userChecks.forEach(function(checkId){
                                        // Delete the check
                                        _data.delete('checks', checkId, function(err){
                                            if(err) deletionErrors = true;
                                            checksDeleted++;
                                            if(checksDeleted == checksToDelete){
                                                if(!deletionErrors){
                                                    callback(200);
                                                } else {
                                                    callback(500, {'Error': 'Error while deleting all of the user\'s checks'});
                                                }
                                            }
                                        });
                                    });
                                } else {
                                    callback(200);
                                }
                            } else {
                                callback(500, {'Error': 'Could not delete the user'});
                            }
                        });
                    } else {
                        callback(404, {'Error': "Could not find the specified user"});
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
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
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
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
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

// Checks
handlers.checks = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1)
        handlers._checks[data.method](data, callback);
    else
        callback(405);
};

// Container for checks
handlers._checks = {};

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
handlers._checks.post = function(data, callback){
    // Validate inputs
    var protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol.trim()) > -1 ? data.payload.protocol.trim() : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.length > 0 ? data.payload.url : false;
    var method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method.trim()) > -1 ? data.payload.method.trim() : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
    
    if(protocol && url && method && successCodes && timeoutSeconds){
        // Check the token is provided in the headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        
        // Lookup the user by reading the token
        _data.read('tokens', token, function(err, tokenData){
            if(!err && tokenData){
                var userPhone  = tokenData.phone;

                // Lookup the user data
                _data.read('users', userPhone, function(err, userData){
                    if(!err && userData){
                        var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                        // Verify that the user has less than the number of max-checks-per-user
                        if(userChecks.length < config.maxChecks){
                            // Create random check id for the check
                            var checkId = helpers.createRandomString(20);

                            // Create the check object, and include the user's phone
                            var checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSeconds': timeoutSeconds
                            };

                            // Store the object
                            _data.create('checks', checkId, checkObject, function(err){
                                if(!err){
                                    // Add the check id to user's object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    // Save thw new user data
                                    _data.update('users', userPhone, userData, function(err){
                                        if(!err){
                                            // Return the data abou the check
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, {'Error': 'Could not update the user with new check'});
                                        }
                                    });
                                } else {
                                    callback(500, {'Error': 'Could not create the check'});
                                }
                            });
                        } else {
                            callback(400, {'Error': 'The user alreay has the maximum number of checks ('+config.maxChecks+')'});
                        }
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(403);
            }
        });
    } else {
        callback(400, {'Error': "Missing required field(s) or field(s) are invalid"});
    }
};

// Checks - get
// Required data: id
// Optional data: none
handlers._checks.get = function(data, callback){
    // Check that the id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){
        // Lookup the check
        _data.read('checks', id, function(err, checkData){
            if(!err && checkData){
                // Get the token from the headers
                var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                // Verify the given token is valid and belongs to the user who created the check
                handlers._tokens.verifyToken(token, checkData.userPhone, function(isTokenValid){
                    if(isTokenValid){
                        // Return the check data
                        callback(200, checkData);
                    } else {
                        callback(403, {'Error': 'Missing required token in headers'});
                    }
                });
            } else {
                callback(404, {'Error': 'Check with given id not found'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// Checks - put
// Required data: id
// Optional data: protocol, url, statusCodes, method, timeoutSeconds
// one optional data must be required
handlers._checks.put = function(data, callback){
    // Check the required field
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;

    // Check the optional fields
    var protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol.trim()) > -1 ? data.payload.protocol.trim() : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.length > 0 ? data.payload.url : false;
    var method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method.trim()) > -1 ? data.payload.protocol.trim() : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if(id){
        // Check one of the optinal field is available
        if(protocol || url || method || successCodes || timeoutSeconds){
            _data.read('checks', id, function(err, checkData){
                if(!err && checkData){
                     // Get the token from the headers
                    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                    // Verify the given token is valid and belongs to the user who created the check
                    handlers._tokens.verifyToken(token, checkData.userPhone, function(isTokenValid){
                        if(isTokenValid){
                            // Update the check data
                            if(protocol) checkData.protocol = protocol;
                            if(url) checkData.url = url;
                            if(method) checkData.method = method;
                            if(successCodes) checkData.successCodes = successCodes;
                            if(timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds;

                            // Store the updated check data
                            _data.update('checks', id, checkData, function(err){
                                if(!err){
                                    callback(200);
                                } else {
                                    callback(500, {'Error': 'Could not update the check data'});
                                }
                            });
                        } else {
                            callback(403);
                        }
                    });
                } else {
                    callback(404, {'Error': "Check not found"});
                }
            });
        } else {
            callback(400, {'Error': 'Missing field(s) to update'});
        }
    } else {
        callback(400, {'Error': 'Missing required field(s) or field(s) are invalid'});
    }
};

// Checks - delete
// Required data: id
// Optional data: none
handlers._checks.delete = function(data, callback){
    // Check id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;
    if(id){
        // Lookup the check
        _data.read('checks', id, function(err, checkData){
            if(!err && checkData){
                // Get the token from the headers
                var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

                // Verify the given token is valid fo the phone number
                handlers._tokens.verifyToken(token, checkData.userPhone, function(isTokenValid){
                    if(isTokenValid){
                        // Delete the check data
                        _data.delete('checks', id, function(err){
                            if(!err){
                                 // Lookup the user
                                _data.read('users', checkData.userPhone, function(err, userData){
                                    if(!err && userData){
                                        var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                                        // Remove the deleted check from the user's checks
                                        var checkPosition = userChecks.indexOf(id);
                                        if(checkPosition > -1){
                                            userChecks.splice(checkPosition,1);
                                             
                                            // Re-save the user's data
                                            _data.update('users', checkData.userPhone, userData, function(err){
                                                if(!err){
                                                    callback(200);
                                                } else {
                                                    callback(500, {'Error': 'Could not update the user'});
                                                }
                                            });
                                        } else {
                                            callback(500, {'Error': 'Could not find the check on user\'s checks'});
                                        }
                                    } else {
                                        callback(404, {'Error': "Could not find the user who created the check"});
                                    }
                                });
                            } else {
                                callback(500, {'Error': 'Could not the delete the check data'});
                            }
                        });
                    } else {
                        callback(403, {'Error': 'Missing required token in headers'});
                    }
                });
            } else {
                callback(404, {'Error': 'Check not found'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
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