'use strict';
//Node Packages
const express = require('express');
const app = require('express')();
const fileUpload = require('express-fileupload');
const http = require('http').Server(app);
const mysql = require('mysql');
const bodyParser = require('body-parser');
const getRawBody = require('raw-body');
const saveFile = require('save-file');
const fs = require('fs');

//Required for Google Auth
const audiance = "942241099204-887hriil80dgus1ubdmd88r834sjuabd.apps.googleusercontent.com";
const { OAuth2Client } = require('google-auth-library');
var client = new OAuth2Client(audiance, '', '');

//Enables colored output in console
const coloredText = require('chalk');
const chalk = new coloredText.constructor({ level: 3 });

//Defining styles of console output
const info = chalk.hex('#2ef7f7');
const heading = chalk.hex('#2ef7f7').underline;
const success = chalk.hex('#38ef32');
const warn = chalk.hex('#ffd505');
const error = chalk.hex('#ff3705');

const mainPageName = "index"; //Page that is send to client when requesting root
const port = 1337; // Listening Port of the app

// ---- ---- ROUTING ---- ----

// ---- LISTENING ----
http.listen(port, function () {
    console.log(success("Server up on " + port + "\n->Time to party<-"));
});

// ---- ROOT PAGE ----
app.get('/', function (req, res) { //sending root
    console.log(heading("---- -- / -- ----"));
    console.log(info("Root requested by " + req.ip+"\n"));
    res.sendFile(__dirname + "/static/"+mainPageName+".html");
});

// ---- DISPLAYING FILES ----
app.get('/getSharedFiles/:token', function (req, res) { //AJAX endpoint for getting sharedFiles
    console.log(heading("---- -- /getSharedFiles/token -- ----"));
    console.log(info("Requested by " + req.ip));
    checkHeader(req.headers.accept, "application/json, text/plain")
        .then(() => {
            return authUser(req.params.token);
        })
        .then((userId) => {
            return dbGetSharedFiles(userId);
        })
        .then((json) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(json);
            console.log(success("Request finnished!\n"));
        })
        .catch((err) => {
            console.log(error("Error in endpoint /getSharedFiles: " + err + "\n"));
            res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
            res.end("Invalid Request");
      });
});

app.get('/getUserFiles/:token', function (req, res) { //get all files uploaded by user
    console.log(heading("---- -- /getUserFiles/token -- ----"));
    console.log(info("Requested by " + req.ip));
    checkHeader(req.headers.accept, "application/json, text/plain")
        .then(() => {
            return authUser(req.params.token);
        })
        .then((userid) => {
            return dbGetUserFiles(userid);
        })
        .then((json) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(json);
            console.log(success("Request finnished!\n"));
        })
        .catch((err) => {
            console.log(error("Error in endpoint /getUserFiles: " + err + "\n"));
            res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
            res.end("Invalid Request");
      });
});


// ---- FILE UPLOAD ----
app.use(fileUpload());
app.use(bodyParser.json());

var pendingUploads = {}; //Keeps track of pending uploads to reduce load on database

app.post('/upload', function (req, res) { //metadata upload that returns uploadId to client
    console.log(heading("---- -- /upload -- ----"));
    console.log(info("Request by " + req.ip));
    let tempUploadId = undefined; //used to be able to get the uploadId in dbAddShareEntries()
    let tempUserId = undefined;
    checkHeader(req.headers["content-type"], "application/json")
        .then(() => {
            return authUser(req.body.id);
        })
        .then((userId) => {
            tempUserId = userId;
            return dbCheckDubFilename(req.body.fileName, userId);
        })
        .then(() => {
            return dbAddUpload(tempUserId, req.body.fileSize, req.body.fileName);
        })
        .then((uploadId) => {
            tempUploadId = uploadId; //used to be able to get the uploadId in dbAddShareEntries()
            return dbTranslateShares(req.body.shareWith);
        })
        .then((shareIds) => {
            return dbAddShareEntries(tempUploadId, shareIds);
        })
        .then(() => {
            console.log(info("Pending Uploads now: " + JSON.stringify(pendingUploads)));
            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ "UploadID": tempUploadId }));
            console.log(success("Request finnished!\n"));
        })
        .catch((err) => {
            console.log(error("Error in endpoint /upload: " + err));
            console.log(error("Request failed!\n"));
            res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
            res.end("Invalid Request");
    });
});

app.put('/upload/:id', function (req, res) { //upload for the file content in binary using the given uploadId
    console.log(heading("---- -- /upload/id -- ----"));
    console.log(info("Request to upload file with ID " + req.params.id + " by " + req.ip));
    validateUploadId(req.params.id)
        .then(() => {
            return checkHeader(req.headers["content-type"], "application/octet-stream");
        })
        .then(() => {
            return authUser(req.headers["wtftoken"]); //token for authentication is passed in the header of the request
        })
        .then(() => {
            return getRawBody(req);
        })
        .then((buf) => {
            return saveFile(buf, "userfiles/" + req.params.id);
        })
        .then(() => {
            delete pendingUploads[req.params.id];
            console.log(info("Pending Uploads now: " + JSON.stringify(pendingUploads)));
            res.writeHead(201, { "Content-Type": "text/plain" });
            res.end("File uploaded!");
            console.log(success("Upload finished!\n"));
        })
        .catch(function (err) {
            console.log(error("Error in endpoint /upload/id: " + err+"\n"));
            res.writeHead(500, { "Content-Type": "text/plain" }); //Error 500: Internal Server error
            res.end("That went wrong...");
    });
});

app.post('/checkIds', function (req, res) { //returns all valid usernames in input array as array
    console.log(heading("---- -- /ckeckIds -- ----"));
    console.log(info("Request to check ids " + req.body.ids + " by " + req.ip));
    if (req.body.ids != undefined) {
        dbCheckUsernames(req.body.ids)
            .then((resArr) => {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ "ValidIds": resArr }));
                console.log(success("Request finnished!\n"));
            })
            .catch((err) => {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ "ValidIds": [] }));
                console.log(error("Request failed!\n"));
            });
    } else {
        console.log(error("Error in endpoint /ckeckIds: ids were undefined\n"));
        res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
        res.end("Invalid Request");
    }
});

// ---- FILE DOWNLOAD ----
app.get('/downloadFile/:id/:token', function (req, res) { //endpoint for downloading file with given id
    console.log(heading("---- -- /downloadFile/id/token -- ----"));
    console.log(info("Request to download file " + req.params.id + " by " + req.ip));
    authUser(req.params.token, req.params.id)
        .then(() => {
            return checkIfExists(__dirname + '/userfiles/' + req.params.id);
        })
        .then(() => {
            return dbIncDlCount(req.params.id)
        })
        .then(() => {
            return dbGetUpload(req.params.id);
        })
        .then((filename) => {
            res.download(__dirname + '/userfiles/' + req.params.id, filename);
            console.log(info("Sent file " + filename));
            console.log(success("Request finished!\n"));
        })
        .catch((err) => {
            console.log(error("Error in endpoint /downloadFile/id: " + err));
            res.writeHead(404, { "Content-Type": "text/plain" }); //Error 404: Not found
            res.end("Requested file not found!");
            console.log(error("Request failed!\n"));
    });
});

// ---- FILE DELETION ----
app.post('/delete', function (req, res) { //deletes file with given id
    console.log(heading("---- -- /delete -- ----"));
    console.log(info("Request to delete file " + req.params.id + " by " + req.ip));
    checkHeader(req.headers["content-type"], "application/json")
        .then(() => {
            return authUser(req.body.token,req.body.delId);
        })
        .then(() => {
            return checkIfExists(__dirname + '/userfiles/' + req.body.delId);
        })
        .then(() => {
            return dbDeleteShares(req.body.delId);
        })
        .then(() => {
            return dbDeleteFile(req.body.delId);
        })
        .then(() => {
            return deleteFile(req.body.delId);
        })
        .then(() => {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("File Deleted");
            console.log(success("Request finnished!\n"));
        })
        .catch((err) => {
            console.log(error("Error in endpoint /delete: " + err));
            res.writeHead(404, { "Content-Type": "text/plain" }); //Error 404: Not found
            res.end("Requested file not found!");
            console.log(error("Request failed!\n"));
      });
});

// ---- USER MANAGEMENT ----
app.post('/signIn', function (req, res) { //checks user token, responds with id if known user, responds with 0 if new user
    console.log(heading("---- -- /signIn -- ----"));
    console.log(info("Request to sign in user from " + req.ip));
    checkHeader(req.headers["content-type"], "application/json")
        .then(() => {
            return authUser(req.body.token);
        })
        .then((userId) => {
            return dbCheckUserExists(userId);
        })
        .then((isUser) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ "isAuth": isUser }));
            console.log(success("Request finished!\n"));
        })
        .catch((err) => {
            console.log(error("Error in endpoint /signIn: " + err));
            res.writeHead(500, { "Content-Type": "text/plain" }); //Error 500: Internal Server Error
            res.end("Authentication error");
            console.log(error("Request failed!\n"));
      });
});

app.post('/createUser', function (req, res) { //checks user token, responds with id if username is valid, responds with 0 if name is already taken
    console.log(heading("---- -- /createUser -- ----"));
    console.log(info("Request to create user " + req.body.name + " from " + req.ip));
    let tempUserid = undefined;
    checkHeader(req.headers["content-type"], "application/json")
        .then(() => {
            return authUser(req.body.token);
        })
        .then((userid) => {
            tempUserid = userid;
            return dbCheckUsernames([req.body.name]);
        })
        .then((result) => {
            if (result[0] != undefined) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ "Userid": 0 })); // respond with id 0 if name is already taken
                console.log(warn("Name " + req.body.name + " already taken"));
                console.log(success("Request finnished!\n"));
            } else {
                dbAddUser(req.body.name, tempUserid)
                    .then((id) => {
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ "Userid": id })); // responds with userid if user was created successfully
                        console.log(success("Request finnished!\n"));
                    })
                    .catch((err) => {
                        console.log(error("Error in endpoint /createUser: " + err));
                        res.writeHead(500, { "Content-Type": "text/plain" }); //Error 500: Internal Server Error
                        res.end("Internal error");
                        console.log(error("Request failed!\n"));
                });
            }
        })
        .catch((err) => {
            console.log(error("Error in endpoint /createUser: " + err));
            res.writeHead(500, { "Content-Type": "text/plain" }); //Error 500: Internal Server Error
            res.end("Internal error");
            console.log(error("Request failed!\n"));
    })
});

// ---- STATIC FILES ----
app.use('/', express.static(__dirname + '/static')); //Sends static files (CSS,JavaScript,etc)

// ---- 404 HANDLING ----
var count404 = 0;
app.use(function (req, res) { //sends 404 pages
    console.log(heading("---- -- 404 Handler -- ----"));
    console.log(info("File " + req.originalUrl + " requested by " + req.ip));
    res.sendFile(__dirname + '/static/404/404' + (count404++ % 3) + '.html');
    console.log(warn("Number of 404s so far: " + count404 + "\n"));
});

// ---- ---- END OF ROUTING ---- ----

// ---- ---- DATABASE ---- ----

// ---- INITIALISATION ----
var db = mysql.createConnection({ //configuring db parameters
    host: "localhost",
    user: "User1",
    password: "ibims1user"
});

db.connect(function (err) { //opening connection to database, connection is kept open
    if (err) { console.log(error("Database connection failed!\n" + err)); return }
    else {console.log(success("MySQL connected"))}
});

// ---- QUERIES GETTING DATA ----
function dbGetUserFiles(userid) { // resolves to array of all files of given user
    return new Promise(function (resolve, reject) {
        let tempQuery = "SELECT files.id,filename,upload_time,name FROM wtf.files LEFT JOIN wtf.shares ON wtf.files.id = wtf.shares.file_id LEFT JOIN wtf.users ON wtf.shares.user_id = wtf.users.id WHERE owner = " + db.escape(userid) + " ORDER BY wtf.files.id;";
        db.query(tempQuery, function (err, result) {
            if (err) {
                reject("Error in query: " + err);
            } else {
                let tempData = [];
                for (let i = 0; i < result.length; i++) { //builds object to be sent to client, removes duplicates in filename
                    if (arrContainsObj(result[i], tempData)) {
                        if (result[i].name !== null) {tempData[tempData.length - 1].name.push(result[i].name); }
                    } else {
                        let tempObj = {};
                        tempObj.ID = result[i].id;
                        tempObj.filename = result[i].filename;
                        tempObj.upload_time = result[i].upload_time;
                        tempObj.name = [];
                        tempObj.name.push(result[i].name);
                        tempData.push(tempObj);
                    }
                }
                let json = JSON.stringify(tempData);
                console.log(info("dbGetUserFiles for userid " + userid + " resulted in:\n" + json));
                resolve(json);
            }
        });
    });
}

function dbGetSharedFiles(userid) { // resolves to array of all files shared with given user
    return new Promise(function (resolve, reject) {
        let tempQuery = "SELECT filename,upload_time,name,files.id  FROM wtf.shares JOIN wtf.files ON wtf.shares.file_id = wtf.files.id JOIN wtf.users ON wtf.files.owner = wtf.users.id WHERE user_id = " + db.escape(userid) + ";";
        db.query(tempQuery, function (err, result) {
            if (err) {
                reject("Error in query: " + err);
            } else {
                let json = JSON.stringify(result);
                console.log(info("dbGetSharedFiles for userid " + userid + " resulted in:\n" + json));
                resolve(json);
            }
        });
    });
}

function dbGetUpload(fileId) { //return filename of file with given id
    return new Promise(function (resolve, reject) {
        let tempQuery = "SELECT filename FROM wtf.files WHERE id =" + db.escape(fileId) + ";";
        db.query(tempQuery, function (err, result) {
            if (err) {
                reject("Error in query: " + err);
            } else {
                if (result.length == 0) {
                    reject("No entry found for ID " + fileId);
                } else {
                    console.log(info("dbGetUpload retrieved filename " + result[0].filename + " for fileid " + fileId));
                    resolve(result[0].filename);
                }
            }
        });
    });
}

// ---- QUERIES CHECKING DATA ----
function dbCheckUsernames(names) { //checks if users exist by name, resolves array containing all valid names
    return new Promise(function (resolve, reject) {
        let tempNames = [];
        let execCount = 0; // Counts executions of querys, workaround to only resolve when tempNames is compiled completely
        for (let i = 0; i < names.length; i++) {
            let tempQuery = "SELECT name FROM wtf.users WHERE name LIKE " + db.escape(names[i]) + ";"; //db.escape already puts name in single quotes
            db.query(tempQuery, function (err, result) {
                execCount++;
                if (!err) {
                    if (result.length !== 0) {
                        console.log(info("Name " + names[i] + " found in database"));
                        tempNames.push(names[i]);
                    } else {
                        console.log(warn("Name " + names[i] + " not in database"));
                    }
                    if (execCount === names.length) { //without this resolve happens before we are actually done here
                        resolve(tempNames);
                    }
                }
            });
        }
    });
}

function dbCheckFilePermission(userid, fileid) { //checks wether user is allowed to access file or not - yes, it's ugly...
    return new Promise(function (resolve, reject) {
        function dbCheckIfOwn(userid, fileid) {
            return new Promise(function (resolve, reject) {
                console.log(info("Checking permission of user " + userid + " for fileId " + fileid));
                let tempQuery = "SELECT filename FROM wtf.files WHERE id=" + db.escape(fileid) + " AND owner=" + db.escape(userid) + ";";
                db.query(tempQuery, function (err, result) { //checks if user is owner of file
                    if (err) {
                        reject(false);
                    } else {
                        if (result.length === 0) {
                            reject(false);
                        } else {
                            resolve(true);
                        }
                    }
                });
            });
        }
        function dbCheckIfShared(userid, fileid) {
            return new Promise(function (resolve, reject) {
                resolve(true);
            });
        }
        dbCheckIfOwn(userid, fileid)
            .then(function () { resolve(true) })
            .catch(function () {
                dbCheckIfShared(userid, fileid)
                    .then(function () { resolve(true) })
                    .catch(function () {
                        console.log(error("Access denied")); reject(false)
                    });
            });
    });
}

function dbCheckUserExists(userId) { //checks if user with given id is already in database
    return new Promise(function (resolve, reject) {
        let tempQuery = "SELECT name FROM wtf.users WHERE id LIKE " + db.escape(userId) + ";";
        db.query(tempQuery, function (err, result) {
            if (err) {
                reject("Error in query: " + err);
            } else {
                if (result.length == 0) {
                    console.log(info("No user with this token"));
                    resolve(false);
                } else {
                    console.log(info("dbGetUserId found name " + result[0].name + " for id " + userId));
                    resolve(true);
                }
            }
        });
    });
}

function dbCheckDubFilename(filename, userid) { //checks if file with given name has already been uploaded by same user
    return new Promise(function (resolve, reject) {
        let tempQuery = "SELECT id FROM wtf.files WHERE owner=" + db.escape(userid) + " AND filename LIKE " + db.escape(filename) + ";";
        db.query(tempQuery, function (err, result) {
            if (err) {
                reject("Error in query: " + err);
            } else {
                if (result[0] == undefined) {
                    resolve(true);
                } else {
                    reject("Filename already taken");
                }
            }
        });
    });
}

// ---- QUERIES ADDING DATA ----
function dbAddUpload(userid, fileSize, fileName) { //resolves to fileid used for upload later on
    return new Promise(function (resolve, reject) {
        let tempQuery = "INSERT INTO `wtf`.`files` (`owner`, `filename`) VALUES ('" + userid + "', '" + fileName + "');";
        db.query(tempQuery, function (err, result) {
            if (err) {
                reject("Error in query: " + err);
            } else {
                console.log(info("dbAddUpload added entry with ID " + result.insertId + " for user " + userid));
                pendingUploads[result.insertId] = fileName;
                resolve(result.insertId);
            }
        });
    });
}

function dbAddShareEntries(fileid, shareArray) { //Adds shares for given fileid
    return new Promise(function (resolve, reject) {
        if (shareArray.length !== 0) {
            let execCount = 0;
            for (let i = 0; i < shareArray.length; i++) {
                let tempQuery = "INSERT INTO `wtf`.`shares` (`user_id`, `file_id`) VALUES (" + db.escape(shareArray[i]) + ", '" + db.escape(fileid) + "');";
                db.query(tempQuery, function (err, result) {
                    execCount++;
                    if (err) {
                        reject("Error in query: " + err);
                    } else {
                        console.log(info("dbAddShareEntries added share for file " + fileid + " for user " + shareArray[i]));
                        if (execCount === shareArray.length) {
                            resolve(true);
                        }
                    }
                });
            }
        } else {
            resolve(true);
        }
    });
}

function dbAddUser(name, userid) { //adds new user with given name and email adress
    return new Promise(function (resolve, reject) {
        let tempQuery = "INSERT INTO `wtf`.`users` (`name`, `id`) VALUES (" + db.escape(name) + ", " + db.escape(userid) + ");";
        db.query(tempQuery, function (err, result) {
            if (err) {
                reject("Error in query: " + err);
            } else {
                console.log(info("dbAddUser added user " + name + " with id " + userid));
                resolve(userid);
            }
        });
    });
}

// ---- QUERIES DELETING DATA ----
function dbDeleteShares(fileId) { // deletes all shares for given fileId
    return new Promise(function (resolve, reject) {
        let tempQuery = "DELETE FROM `wtf`.`shares` WHERE `file_id` = "+db.escape(fileId)+";";
        db.query(tempQuery, function (err, result) {
            if (err) {
                reject("Error in query: " + err);
            } else {
                console.log(info("Deleted " + result.affectedRows + " shares for file " + fileId));
                resolve("Shares deleted");
            }
        });
    });
}

function dbDeleteFile(fileId) { // deletes file entry for given fileId
    return new Promise(function (resolve, reject) {
        let tempQuery = "DELETE FROM `wtf`.`files` WHERE `id` = " + db.escape(fileId) + ";";
        db.query(tempQuery, function (err, result) {
            if (err) {
                reject("Error in query: " + err);
            } else {
                console.log(info("Deleted db entry for fileId " + fileId));
                resolve("File deleted");
            }
        });
    });
}

// ---- QUERIES TRANSFORMING DATA ----
function dbTranslateShares(usernames) { //ranslates array of usernames to array of userids
    return new Promise(function (resolve, reject) {
        let tempUserids = [];
        if (usernames.length !== 0) {
            let execCount = 0;
            for (let i = 0; i < usernames.length; i++) {
                let tempQuery = "SELECT id FROM wtf.users WHERE name LIKE " + db.escape(usernames[i]) + ";";
                db.query(tempQuery, function (err, result) {
                    execCount++;
                    if (!err) {
                        if (result.length != 0) {
                            console.log(info("Found id " + result[0].id + " for username " + usernames[i]));
                            tempUserids.push(result[0].id);
                        }
                        if (execCount === usernames.length) {
                            resolve(tempUserids);
                        }
                    }
                });
            }
        } else {
            resolve(tempUserids);
        }
    });
}

function dbIncDlCount(fileId) { //increments the download count of the file - currently not reflected/implemented on frontend
    return new Promise(function (resolve, reject) {
        let tempQuery = "UPDATE wtf.files SET dl_count= dl_count + 1 WHERE id=" + db.escape(fileId) + ";"
        db.query(tempQuery, function (err, result) {
            if (err) {
                console.log(warn("Could not increment dl_count of fileid " + fileId));
                resolve(false); //resolves in any case since download count feature not vital
            } else {
                resolve(true);
            }
        });
    });
}

// ---- ---- END OF DATABASE ---- ----

// ---- ---- HELPER FUNCTIONS ----  ----

function arrContainsObj(obj, array) { //checks if obj is already in array based on obj.filename, returns boolean
    for (let x = 0; x < array.length; x++) {
        if (array[x].filename.includes(obj.filename)) {
            return true;
        }
    }
    return false;
}

function authUser(userToken, fileId) { //resolves if user is authorized
    return new Promise(function (resolve, reject) {
        console.log(info("Checking identity of user"));
        client.verifyIdToken({ "idToken": userToken, "audiance": audiance })
            .then((login) => {
                console.log(info("Authenticated user " + login.payload.sub + " successfully"));
                if (fileId != undefined) {
                    dbCheckFilePermission(login.payload.sub, fileId)
                        .then(() => {
                            resolve(login.payload.sub); //User allowed to access file
                        })
                        .catch(() => {
                            console.log(warn("User " + login.payload.sub + " not allowed to access file " + fileId));
                            reject("Fileaccess denied"); //User not allowed to access file
                        })
                } else {
                    resolve(login.payload.sub); //User authenticated, no fileid given
                }
            })
            .catch((err) => {
                reject(err); //User could not be authenticated
        });
    });
}

function checkHeader(header, expectedHeader) { //checks for correct header, resolve if valid
    return new Promise(function (resolve, reject) {
        if (header === expectedHeader) {
            resolve(true);
        } else {
            reject("Header missmatch");
        }
    });
}

function validateUploadId(uploadId) { //checks if upload with given id is actually queued for upload
    return new Promise(function (resolve, reject) {
        if (pendingUploads[uploadId] == undefined) {
            reject("UploadId " + uploadId + " not listed in pendingUplaods");
        } else {
            resolve(true);
        }
    });
}

function checkIfExists(path) { //check if file exists aand resolves with path if file exists
    return new Promise(function (resolve, reject) {
        if (fs.existsSync(path)) {
            resolve(path);
        } else {
            reject(error("Requested file " + path + " does not exist!"));
        }
    });
}

function deleteFile(fileId) { //deletes file from disk based on fileid
    return new Promise(function (resolve, reject) {
        console.log(info("Deleting File " + fileId));
        fs.unlink(__dirname + '/userfiles/' + fileId, function (err) {
            if (err) {
                reject("File could not be deleted");
            } else {
                resolve("File deleted");
            }
        });
    });
}

// ---- ---- END OF HELPER FUNCTIONS ---- ----

/*                                   .,,,.
                           @@@@@@@(.       ,#@@@@@@&
                      @@@@#                         %@@@&
                  #@@@                                   @@@/
               &@@,                                         /@@,
             @@/                @@                             @@@
           @@.                  *@   @@@   @@                    /@@
         @@                      @# @@@@  @@    @@@@#              #@@
       (@&   #@@@@@@@@@(         @@&@ ,@ @@     @@     @@            @@
      @@     @@@@@@@@@@@         @@@   @@@     @@     @@ (@@           @@
     @@           @@@@@@                .     /@%    @@@                @@
    @@         #@@@  ,@@                       .   ,@@  *                @@
   @@         @@@    ,@@                            /           (@        @@
  @@        /@@,      @@        #@@@@@@@@                       @@@        @@
 /@        @@@                @@@@     &@@@                      @@@       *@.
 @@        @@                @@&          @@@@@@@@                @@,       @@
 @        @@@               @@@                 @@@*              @@@       ,@
@@       ,@@           &@@@@@@(     @@@@@@*       @@.             .@@        @(
@@       @@@          @@@           @@@@@@*       @@@@@(           @@*       @@
@@       @@@         @@&            @@@@@@*           @@@          @@&       @@
@@       @@@         @@.            @@@@@@*            @@@         @@%       @@
@@       /@@         (@@            @@@@@@*            @@@         @@.       @@
#@        @@#         (@@@/     @@@@@@@@@@@@@@(      %@@@         @@@        @,
 @*       @@@            @@@@@    @@@@@@@@@@@   @@@@@@@           @@&       &@
 @@        @@/                     &@@@@@@@                      @@@        @@
  @&       #@@                       @@@@              *,       @@@        @@
  %@        &@@                        /               @@     &@@@        *@,
   @@                                                  @@   *@@@          @%
    @@                   /@                            @@ @@@@           @&
     #@.             @@ %@#   &@                       @@@@#           &@(
      ,@@              @@(    @@     @@(               @@@@@@@@@@@    @@
        @@         @@@@@/    @@     @@@@  @@@                       .@@
          @@          %     &@     @@ @@ @@ @@                     @@
            @@.            *@@@@  @@  .@%@  @@                  *@@
              @@@                 @/   @@   @@                @@@
                .@@&                                       @@@
                   ,@@@,                               (@@@
                        @@@@@                    .@@@@@
                             .@@@@@@@@@@@@@@@@@@&.

Serverfile and this fancy logo created by Alexander Gebhardt aka iAlex(https://github.com/iAIex)
*/