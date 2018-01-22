'use strict';
const express = require('express');
const app = require('express')();
const fileUpload = require('express-fileupload');
const http = require('http').Server(app);
const mysql = require('mysql');
const bodyParser = require('body-parser');
const getRawBody = require('raw-body');
const saveFile = require('save-file');
const fs = require('fs');
const coloredText = require('chalk');
const chalk = new coloredText.constructor({ level: 3 });

const info = chalk.hex('#2ef7f7'); //Defining styles of console output
const heading = chalk.hex('#2ef7f7').underline;
const success = chalk.hex('#38ef32');
const warn = chalk.hex('#ffd505');
const error = chalk.hex('#ff3705');

const mainPageName = "index"; //Page that is send to client when requesting root
const port = 80; // Listening Port of the app

// ---- LISTENING ----
http.listen(port, function () {
    console.log(success("Server up on "+port+"\n->Time to party<-"));
});

// ---- ROUTING ----
app.get('/', function (req, res) {
    console.log(heading("---- -- / -- ----"));
    console.log(info("Root Requested by " + req.ip+"\n"));
    res.sendFile(__dirname + "/static/"+mainPageName+".html");
});

app.get('/getSharedFiles/:id', function (req, res) { //AJAX endpoint for getting sharedFiles by userid
    console.log(heading("---- -- /getSharedFiles/id -- ----"));
    console.log(info("Request for userid " + req.params.id + " requested by " + req.ip));
    checkHeader(req.headers.accept, "application/json, text/plain")
        .then(() => {
            return authUser();
        })
        .then(() => {
            return dbGetSharedFiles(req.params.id);
        })
        .then((json) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(json);
            console.log(success("Request finnished!\n"));            
        })
        .catch(() => {
            console.log(eror("Error in endpoint /getSharedFiles/id: "+err+"\n"));
            res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
            res.end("Invalid Request");
     })
});

app.get('/getUserFiles/:id', function (req, res) {
    console.log(heading("---- -- /getUserFiles/id -- ----"));
    console.log(info("Request for userid " + req.params.id + " by " + req.ip));
    checkHeader(req.headers.accept, "application/json, text/plain")
        .then(() => {
            return authUser();
        })
        .then(() => {
            return dbGetUserFiles(req.params.id);
        })
        .then((json) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(json);
            console.log(success("Request finnished!\n"));
        })
        .catch((err) => {
            console.log(error("Error in endpoint /getUserFiles/id: " + err+"\n"));
            res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
            res.end("Invalid Request");
    })
});


// ---- FILE UPLOAD ----
app.use(fileUpload());
app.use(bodyParser.json());

var pendingUploads = {}; //Keeps track of pending uploads to reduce load on database

app.post('/upload', function (req, res) {
    console.log(heading("---- -- /upload -- ----"));
    console.log(info("Request for userid " + req.body.id + " by " + req.ip));
    let tempUploadId = undefined;
    checkHeader(req.headers["content-type"], "application/json")
        .then(() => {
            return authUser(req.body.id);
        })
        .then(() => {
            return dbAddUpload(req.body.id, req.body.fileSize, req.body.fileName);
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

app.post('/upload/deprecated/:id', function (req, res) { //DEPRECATED - DO NOT USE
    console.log(warn("---- -- /deprecated/upload/id -- ----"));
    console.log(warn(req));
    res.writeHead(301, { "Location": "/upload/" }); //Error 301: Moved Permanently
    res.end("Deprecated Endpoint - Moved to URL/upload/");
    /*console.log("Request to upload fileid " + req.params.id);

    let myFile = req.files.myFile; //Name of input field

    myFile.mv("userfiles/" + myFile.name, function (err) { //move (mv()) file to userfiles
        if (err)
            return res.status(500).send(err);
        res.status(201).send('File uploaded!');

    });*/
});

app.put('/upload/:id', function (req, res) {
    console.log(heading("---- -- /upload/id -- ----"));
    console.log(info("Request to upload file with ID " + req.params.id + " by " + req.ip));
    validateUploadId(req.params.id)
        .then(() => {
            return checkHeader(req.headers["content-type"], "application/octet-stream");
        })
        .then(() => {
            return authUser(req.params.id);
        })
        .then(() => {
            return getRawBody(req)
        })
        .then((buf) => {
            return saveFile(buf, "userfiles/" + req.params.id);
        })
        .then(() => {
            delete pendingUploads[req.params.id];
            console.log(info("Pending Uploads now: " + JSON.stringify(pendingUploads)));
            console.log(success("Upload finished!\n"));
        })
        .catch(function (err) {
            console.log(error("Error in endpoint /upload/id: " + err));
            res.writeHead(500, { "Content-Type": "text/plain" }); //Error 500: Internal Server error
            res.end("That went wrong...");
    });
});

// ---- FILE DOWNLOAD ----
app.get('/downloadFile/:id', function (req, res) {
    console.log(heading("---- -- /downloadFile/id -- ----"));
    console.log(info("Request to download file " + req.params.id + " by " + req.ip));
    authUser()
        .then(() => {
            return checkIfExists(__dirname + '/userfiles/' + req.params.id);
        })
        .then(() => {
            return dbGetUpload(req.params.id);
        })
        .then((filename) => {
            res.download(__dirname + '/userfiles/' + req.params.id, filename);
            console.log(success("Send file "+filename+"\nRequest finished!\n"));
        })
        .catch((err) => {
            console.log(error("Error in endpoint /downloadFile/id: " + err));
            res.writeHead(404, { "Content-Type": "text/plain" }); //Error 404: Not found
            res.end("Requested file not found!");
            console.log(error("Request failed!\n"));
    });
});

app.post('/checkIds', function (req, res) {
    console.log(heading("---- -- /ckeckIds -- ----"));
    console.log(info("Request to check ids " + req.body.ids + " by " + req.ip));
    let tempNames = [];
    if (req.body.ids != undefined) {
        dbCheckUsernames(req.body.ids)
            .then((resArr) => {
                console.log(resArr);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ "ValidIds": resArr }));
                console.log(success("Request finnished!\n"));
            })
            .catch((err) => {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ "ValidNames": [] }));
                console.log(error("Request failed!\n"));
        });
    }
});

app.post('/delete', function (req, res) {
    console.log(heading("---- -- /delete -- ----"));
    console.log(info("Request to delete file " + req.params.id + " by " + req.ip));
    checkHeader(req.headers["content-type"], "application/json")
        .then(() => {
            return authUser(undefined, undefined, req.body.delId);
        })
        .then(() => {
            return checkIfExists(__dirname + '/userfiles/'+req.body.delId);
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
        })
});

app.post('/signIn', function (req, res) { //checks user token, responds with id if known user, responds with 0 if new user
    console.log(heading("---- -- /signIn -- ----"));
    console.log(info("Request to sign in user with mail "+req.body.mail+" from " + req.ip));
    checkHeader(req.headers["content-type"], "application/json")
        .then(() => {
            return dbGetUserId(req.body.mail);
        })
        .then((userid) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(userid));
            console.log(success("Request finnished!\n"));
        })
        .catch((err) => {
            console.log(error("Error in endpoint /signIn: " + err));
            res.writeHead(500, { "Content-Type": "text/plain" }); //Error 500: Internal Server Error
            res.end("Internal error");
            console.log(error("Request failed!\n"));
        })
});

app.post('/createUser', function (req, res) { //checks user token, responds with id if known user, responds with 0 if new user
    console.log(heading("---- -- /cerateUser -- ----"));
    console.log(info("Request to create user " + req.body.name + " with mail " + req.body.mail + " from " + req.ip));
    checkHeader(req.headers["content-type"], "application/json")
        .then(() => {
            return dbCheckUserNames([req.body.name]);
        })
        .then((result) => {
            console.log(result)
            if (result[0] != undefined) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ "Userid": 0 })); // respond with id 0 if name is already taken
                console.log(warn("Name " + req.body.name + " already taken"));
            } else {
                dbAddUser(req.body.name, req.body.mail)
                    .then((id) => {
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ "Userid": id }));
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


app.use('/', express.static(__dirname + '/static')); //Sends static files

// ---- 404 Handling ----
var count404 = 0;
app.use(function (req, res) {
    console.log(heading("---- -- 404 Handler -- ----"));
    console.log(info("File " + req.originalUrl + " requested by " + req.ip));
    res.sendFile(__dirname + '/static/404/404' + (count404++ % 2) + '.html');
    console.log(warn("Number of 404s so far: " + count404 + "\n"));
});

// ---- DATABASE ----

//ALTER TABLE tablename AUTO_INCREMENT = 1; for resetting AI

var db = mysql.createConnection({
    host: "localhost",
    user: "User1",
    password: "ibims1user"
});

db.connect(function (err) {
    if (err) { console.log(error("Database connection failed!\n" + err)); return }
    else {console.log(success("MySQL connected"))}
});

function dbGetUserFiles(userid) {
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

function dbGetSharedFiles(userid) {
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

function dbAddUpload(userid, fileSize, fileName) {
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

function dbAddShareEntries(fileid, shareArray) {
    return new Promise(function (resolve, reject) {
        if (shareArray.length !== 0) {
            let execCount = 0;
            console.log(execCount);
            for (let i = 0; i < shareArray.length; i++) {
                let tempQuery = "INSERT INTO `wtf`.`shares` (`user_id`, `file_id`) VALUES ('" + db.escape(shareArray[i]) + "', '" + db.escape(fileid) + "');";
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

function dbGetUpload(fileId) {
    return new Promise(function (resolve, reject) {
        let tempQuery = "SELECT filename FROM wtf.files WHERE id ="+db.escape(fileId)+";";
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
                        console.log(info("Pushing " + names[i]));
                        tempNames.push(names[i]);
                    } else {
                        console.log(warn("Rejecting " + names[i]));
                    }
                    if (execCount === names.length) { //without this resolve happens before we are actually done here
                        resolve(tempNames);
                    }
                }
            });
        }
    });
}

function dbCheckFilePermission(userid, fileid) { //checks wether user is allowed to access file or not
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
            .then(function () { console.log(success("Access granted"));resolve(true) })
            .catch(function () {
                dbCheckIfShared(userid, fileid)
                    .then(function () { console.log(success("Access granted")); resolve(true) })
                    .catch(function () { console.log(error("Access denied")); reject(false) });

            });
    });
}

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

function dbDeleteFile(fileId) { // deletes all shares for given fileId
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

function dbGetUserId(mail) {
    return new Promise(function (resolve, reject) {
        let tempQuery = "SELECT name FROM wtf.users WHERE mail LIKE " + db.escape(mail) + ";";
        db.query(tempQuery, function (err, result) {
            if (err) {
                reject("Error in query: " + err);
            } else {
                if (result.length == 0) {
                    console.log(info("No user with mail " + mail));
                    reject({ "Userid": 0 });
                } else {
                    console.log(info("dbGetUserId found ID " + result[0].id + " for mail " + mail));
                    resolve({ "Userid": result[0].id });
                }
            }
        });
    });
}

function dbAddUser(name, mail) {
    return new Promise(function (resolve, reject) {
        let tempQuery = "INSERT INTO `wtf`.`users` (`name`, `mail`) VALUES (" + db.escape(name) + ", " + db.escape(mail) + ");";
        console.log("Query " + tempQuery);
        db.query(tempQuery, function (err, result) {
            if (err) {
                reject("Error in query: " + err);
            } else {
                console.log(info("dbAddUser added user "+name+" with id " + result.insertId));
                resolve(result.insertId);
            }
        });
    });
}

function dbTranslateShares(usernames) {
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

// ---- HELPER FUNCTIONS ----

function arrContainsObj(obj, array) { //checks if obj is already in array based on obj.filename, returns boolean
    for (let x = 0; x < array.length; x++) {
        if (array[x].filename.includes(obj.filename)) {
            return true;
        }
    }
    return false;
}

function getFileExtension(filename) { //Currently not in use
    if (filename==undefined) {
        console.log(warn("Helper get Filename Extension: input was empty, returning extension nope"));
        return "nope";
    }
    let tempFilename = filename.split(".");
    if (tempFilename.length === 0) {
        return tempFilename[0];
    } else {
        return tempFilename[tempFilename.length - 1];
    }
}

function authUser(userid, userToken, fileId) { //resolves if user is authorized
    return new Promise(function (resolve, reject) {
        console.log(info("Checking identity of user " + userid));
        console.log(warn("CURRENTLY NO AUTHENTICATION ON SEVRER SIDE"));
        resolve(true);
        // TODO Implement authentication @Senpai96 - Michael Schreder
            //resolve if usertoken matches user and fileId is not defined
            //if fileId is given call function dbcheckFilePermission(userid,fileid) and resolve if dbcheckFilePermission(userid,fileid) resolves
            //Reject with descriptive error message if usertoken is invalid or dbcheckFilePermission returns false
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

function validateUploadId(uploadId) {
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

function deleteFile(fileId) {
    return new Promise(function (resolve, reject) {
        console.log("Deleting File " + fileId);
        fs.unlink(__dirname + '/userfiles/' + fileId, function (err) {
            if (err) {
                reject("File could not be deleted");
            } else {
                resolve("File deleted");
            }
        });
    });
}