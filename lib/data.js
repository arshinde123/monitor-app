/*
* Library for storing and editing data
*/

// Dependencies
var fs = require('fs');
var path = require('path');

var helpers = require('./helpers');

// container for the module
var lib = {};

// base directory
lib.baseDir = path.join(__dirname, '/../.data/');

// write data to a file
lib.create = function(dir, file, data, callback) {
    // open the file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor){
        if(!err && fileDescriptor) {
            // convert data to string
            var stringData = JSON.stringify(data);

            // write to file and close it
            fs.writeFile(fileDescriptor, stringData, function(err){
                if(!err) {
                    fs.close(fileDescriptor, function(err){
                        if(!err) {
                            callback(false);
                        } else {
                            callback('Error closing a file');
                        }
                    });
                } else {
                    callback('Error writing to new file');
                }
            });
        } else {
            callback('Could not create new file. It may already exist');
        }
    });
};

// Read data from a file
lib.read = function(dir, file, callback) {
    // read file
    fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf8', function(err, data){
        if(!err && data) {
            var parseData = helpers.parseJsonToObject(data);
            callback(false, parseData);
        }
        else callback(err, data);
    });
};

// Update data into a file
lib.update = function(dir, file, data, callback){
    // Open the file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', function(err, fileDescriptor){
        if(!err & fileDescriptor) {
            // convert data to string
            var stringData = JSON.stringify(data);

            // Truncate the file
            fs.truncate(fileDescriptor, function(err){
                if(!err) {
                    // write to the file
                    fs.writeFile(fileDescriptor, stringData, function(err){
                        if(!err) {
                            fs.close(fileDescriptor, function(err){
                                if(!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing a file');
                                }
                            });
                        } else {
                            callback('Error writing to the existing file.');
                        }
                    })
                } else {
                    callback('Error truncating file.');
                }
            });
        } else {
            callback('Could not open the file for updating. It may not exist.')
        }
    });
}

// Delete a file
lib.delete = function(dir, file, callback) {
    // Unlink the file
    fs.unlink(lib.baseDir+dir+'/'+file+".json", function(err){
        if(!err) callback(false);
        else callback('Error deleting the file');
    });
}

// export the module
module.exports = lib;