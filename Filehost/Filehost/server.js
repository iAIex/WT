'use strict';
const express = require('express');
const fileUpload = require('express-fileupload');
const saveFile = require('save-file');
const app = require('express')();
const http = require('http').Server(app);
const mysql = require('mysql');
const bodyParser = require('body-parser');
const getRawBody = require('raw-body');

const mainPageName = "index";
const port = 80; // Listening Port of the app

// ---- LISTENING ----
http.listen(port, function () {
    console.log("Server up on "+port+"\n->Time to party<-");
});

// ---- ROUTING ----
app.get('/', function (req, res) {
    console.log("---- -- / -- ----");
    console.log("Root Requested by " + req.ip);
    res.sendFile(__dirname + "/static/"+mainPageName+".html");
});

app.get('/getSharedFiles/:id', function (req, res) { //AJAX endpoint for getting sharedFiles by userid
    console.log("---- -- /getSharedFiles/id -- ----");
    console.log("Request for userid " + req.params.id + " requested by " + req.ip);
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
            console.log("Request finnished!\n");            
        })
        .catch(function () {
            console.log("Error in endpoint /getSharedFiles/id: "+err+"\n");
            res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
            res.end("Invalid Request");
     })
});

app.get('/getUserFiles/:id', function (req, res) {
    console.log("---- -- /getUserFiles/id -- ----");
    console.log("Request for userid " + req.params.id + " by " + req.ip);
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
            console.log("Request finnished!\n");
        })
        .catch(function (err) {
            console.log("Error in endpoint /getUserFiles/id: " + err);
            res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
            res.end("Invalid Request");
        })
});


// ---- FILE UPLOAD ----
app.use(fileUpload());
app.use(bodyParser.json());

var pendingUploads = {}; //Keeps track of pending uploads to reduce load on database

app.post('/upload', function (req, res) {
    console.log("---- -- /upload -- ----");
    console.log("Request for userid " + req.body.id + " by " + req.ip);
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
            console.log("UI"+uploadId);
            console.log("Pending Uploads now:");
            console.log(pendingUploads);
            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ "UploadID": uploadId }));
            console.log("Request finnished!\n");
        })
        .catch(function (err) {
            console.log("Error in endpoint /upload: " + err);
            console.log("Request failed!\n");
            res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
            res.end("Invalid Request");
    });
});

app.post('/upload/deprecated/:id', function (req, res) { //DEPRECATED - DO NOT USE
    console.log("---- -- /deprecated/upload/id -- ----");
    console.log(req);
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
    console.log("---- -- /upload/id -- ----");
    console.log("Request to upload file with ID " + req.params.id + " by " + req.ip);
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
            console.log("Pending Uploads now:");
            console.log(pendingUploads);
            console.log("Upload finished!\n");
        })
        .catch(function (err) {
            console.log("Error in endpoint /upload/id: " + err);
            res.writeHead(500, { "Content-Type": "text/plain" }); //Error 500: Internal Server error
            res.end("That went wrong...");
    });
});

// ---- FILE DOWNLOAD ----
app.get('/downloadFile/:id', function (req, res) {
    console.log("---- -- /downloadFile/id -- ----");
    console.log("Request to download file " + req.params.id + " by " + req.ip);
    authUser()
        .then(function () {
            return dbGetUpload(req.params.id);
        })
        .then(function (result) {
            res.download(__dirname + '/userfiles/' + req.params.id, result);
            console.log("Send file "+result+"\nRequest finished!\n");
        })
        .catch(function (err) {
            console.log("Error in endpoint /downloadFile/id: " + err);
            res.writeHead(404, { "Content-Type": "text/plain" }); //Error 404: Not found
            res.end("Requested file not found!");
            console.log("Request failed!\n");
    });
});


app.use('/', express.static(__dirname + '/static')); //Sends static files

// ---- 404 Handling ----
var count404 = 0;
app.use(function (req, res) {
    console.log("---- -- 404 Handler -- ----");
    console.log("File " + req.originalUrl + " requested by " + req.ip);
    res.sendFile(__dirname + '/static/404/404' + (count404++ % 2) + '.html');
    console.log("Number of 404s so far: " + count404 + "\n");
});

// ---- DATABASE ----

//ALTER TABLE tablename AUTO_INCREMENT = 1; for resetting AI

var db = mysql.createConnection({
    host: "localhost",
    user: "User1",
    password: "ibims1user"
});

db.connect(function (err) {
    if (err) { console.log("Database connection failed!\n" + err); return}
    else {console.log("MySQL connected")}
});

function dbGetUserFiles(userid) {
    return new Promise(function (resolve, reject) {
        let tempQuery = "SELECT filename,upload_time,name FROM wtf.files LEFT JOIN wtf.shares ON wtf.files.id = wtf.shares.file_id LEFT JOIN wtf.users ON wtf.shares.user_id = wtf.users.id WHERE owner = " + db.escape(userid) + " ORDER BY wtf.files.id;";
        db.query(tempQuery, function (err, result) {
            if (err) {
                reject("Error in query: " + err);
            } else {
                let tempData = [];
                for (let i = 0; i < result.length; i++) { //builds object to be sent to client, removes duplicates in filename
                    if (arrContainsObj(result[i], tempData)) {
                        tempData[tempData.length - 1].name.push(result[i].name + "");
                    } else {
                        let tempObj = {};
                        tempObj.filename = result[i].filename + "";
                        tempObj.upload_time = result[i].upload_time;
                        tempObj.name = [];
                        tempObj.name.push(result[i].name + "");
                        tempData.push(tempObj);
                    }
                }
                let json = JSON.stringify(tempData);
                console.log("dbGetUserFiles for userid " + userid + " resulted in:\n" + json);
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
                console.log("dbGetSharedFiles for userid " + userid + " resulted in:\n" + json);
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
                console.log("dbAddUpload added entry with ID " + result.insertId + " for user " + userid);
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
                        console.log("dbAddShareEntries added share for file " + fileid + " for user " + shareArray[i]);
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
                    console.log("dbGetUpload retrieved filename " + result[0].filename + " for fileid " + fileId);
                    resolve(result[0].filename);
                }
            }
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
        console.log("/!\\ Helper get Filename Extension: input was empty, returning extension nope")
        return "nope";
    }
    console.log(filename.length);
    let tempFilename = filename.split(".");
    if (tempFilename.length === 0) {
        return tempFilename[0];
    } else {
        return tempFilename[tempFilename.length - 1];
    }
}

function authUser(userid, userToken, fileId) { //resolves if user is authorized
    return new Promise(function (resolve, reject) {
        console.log("Checking identity of user " + userid);
        console.log("CURRENTLY NO AUTHENTICATION ON SEVRER SIDE");
        resolve(true);
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
            reject("UploadId not listed in pendingUplaods");
        } else {
            resolve(true);
        }
    })
}