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

const info = chalk.hex('#2ef7f7');
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
    console.log(info("Root Requested by " + req.ip));
    res.sendFile(__dirname + "/static/"+mainPageName+".html");
});

app.get('/getSharedFiles/:id', function (req, res) { //AJAX endpoint for getting sharedFiles by userid
    console.log(heading("---- -- /getSharedFiles/id -- ----"));
    console.log(info("Request for userid " + req.params.id + " requested by " + req.ip));
    checkHeader(req.headers.accept, "application/json, text/plain")
        .then(function () {
            return authUser();
        })
        .then(function () {
            return dbGetSharedFiles(req.params.id);
        })
        .then(function (json) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(json);
            console.log(success("Request finnished!\n"));            
        })
        .catch(function () {
            console.log(eror("Error in endpoint /getSharedFiles/id: "+err+"\n"));
            res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
            res.end("Invalid Request");
     })
});

app.get('/getUserFiles/:id', function (req, res) {
    console.log(heading("---- -- /getUserFiles/id -- ----"));
    console.log(info("Request for userid " + req.params.id + " by " + req.ip));
    checkHeader(req.headers.accept, "application/json, text/plain")
        .then(function () {
            return authUser();
        })
        .then(function () {
            return dbGetUserFiles(req.params.id);
        })
        .then(function (json) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(json);
            console.log(success("Request finnished!\n"));
        })
        .catch(function (err) {
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
    checkHeader(req.headers["content-type"], "application/json")
        .then(function () {
            return authUser();
        })
        .then(function () {
            return dbAddUpload(req.body.id, req.body.fileSize, req.body.fileName);
        })
        .then(function (result) {
            return dbAddShareEntries(result, req.body.shareWith);
        })
        .then(function (uploadId) {
            console.log(info("Pending Uploads now: " + JSON.stringify(pendingUploads)));
            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ "UploadID": uploadId }));
            console.log(success("Request finnished!\n"));
        })
        .catch(function (err) {
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
        .then(function () {
            return checkHeader(req.headers["content-type"], "application/octet-stream");
        })
        .then(function () {
            return authUser();
        })
        .then(function () {
            return getRawBody(req)
        })
        .then(function (buf) {
            return saveFile(buf, "userfiles/" + req.params.id);
        })
        .then(function () {
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
        .then(function () {
            return checkIfExists(__dirname + '/userfiles/' + req.params.id);
        })
        .then(function () {
            return dbGetUpload(req.params.id);
        })
        .then(function (filename) {
            res.download(__dirname + '/userfiles/' + req.params.id, filename);
            console.log(success("Send file "+result+"\nRequest finished!\n"));
        })
        .catch(function (err) {
            console.log(error("Error in endpoint /downloadFile/id: " + err));
            res.writeHead(404, { "Content-Type": "text/plain" }); //Error 404: Not found
            res.end("Requested file not found!");
            console.log(error("Request failed!\n"));
    });
});

app.post('/ckeckIds', function (req, res) {
    console.log(heading("---- -- /ckeckIds/ -- ----"));
    console.log(info("Request to check ids " + req.body.ids + " by " + req.ip));
    let tempNames = [];
    for (let i = 0; i < req.body.ids.length; i++) {
        if (dbCheckUsername(req.body.ids[i])) {
            tempName.push(req.body.ids[i]);
        }
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ "ValidIds": tempNames }));
    console.log(success("Request finnished!\n"));
});

app.post('/delete', function (req, res) {
    console.log(heading("---- -- /delete -- ----"));
    console.log(info("Request to delete file " + req.params.id + " by " + req.ip));
    checkHeader(req.headers["content-type"], "application/json")
        .then(function () {
            return authUser(undefined, undefined, req.body.delId);
        })
        .then(function () {
            return checkIfExists(req.body.delId);
        })
        .then(function () {
            deleteFile(req.body.delId);
        })
        .then(function () {

            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("File Deleted");
            console.log(success("Request finnished!\n"));
        })
        .catch(function (err) {
            console.log(error("Error in endpoint /delete: " + err));
            res.writeHead(404, { "Content-Type": "text/plain" }); //Error 404: Not found
            res.end("Requested file not found!");
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
            for (let i = 0; i < shareArray.length; i++) {
                let tempQuery = "INSERT INTO `wtf`.`shares` (`user_id`, `file_id`) VALUES ('" + shareArray[i] + "', '" + fileid + "');";
                db.query(tempQuery, function (err, result) {
                    if (err) {
                        reject("Error in query: " + err);
                    } else {
                        console.log(info("dbAddShareEntries added share for file " + fileid + " for user " + shareArray[i]));
                    }
                });
            }
        }
        resolve(fileid);
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

function dbCheckUsername(name) { //checks if user with exists by name
    let tempQuery = "SELECT name FROM wtf.users WHERE name LIKE \""+db.escape(name)+"\";";
    db.query(tempQuery, function (err, result) {
        if (err) {
            return false;
        } else {
            return true;
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