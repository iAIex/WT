'use strict';
const express = require('express');
const fileUpload = require('express-fileupload');
const saveFile = require('save-file');
const app = require('express')();
const http = require('http').Server(app);
const mysql = require('mysql');
const bodyParser = require('body-parser');
const getRawBody = require('raw-body');

//Listening on Port 1337
http.listen(1337, function () {
    console.log("Server up on 1337\n->Time to party<-");
});

// ---- ROUTING ----
app.get('/', function (req, res) {
    console.log("---- -- / -- ----");
    console.log("Root Requested by " + req.ip);
    res.sendFile(__dirname + '/static/noLibBullshit.html');
});

app.use('/', express.static(__dirname + '/static'));

app.get('/getSharedFiles/:id', function (req, res) { //AJAX endpoint for getting sharedFiles by userId
    console.log("---- -- /getSharedFiles/id -- ----");
    console.log("Request for userid " + req.params.id + " requested by " + req.ip);
    if (req.headers.accept === "application/json, text/plain") { //Checks for correct accept header
        let callback = function (err, result) { //handles "return" values of SQL query
            if (err) {
                console.log("Error in endpoint /getSharedFiles/id: " + err);
                res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
                res.end("" + err);
            } else {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(result);
                console.log("Request finnished!\n");
            }
        };
        dbGetSharedFiles(callback, req.params.id);
    } else {
        console.log("Error in endpoint /getSharedFiles/id: Invalid request accept header " + req.headers.accept+"\n");
        res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
        res.end("Invalid Request");
    }
});

app.get('/getUserFiles/:id', function (req, res) {
    console.log("---- -- /getUserFiles/id -- ----");
    console.log("Request for userid " + req.params.id + " by " + req.ip);
    if (req.headers.accept === "application/json, text/plain") { //Checks for correct accept header
        let callback = function (err, result) { //handles "return" values of SQL query
            if (err) {
                console.log("Error in endpoint /getUserFiles/id: " + err);
                res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
                res.end("" + err);
                return;
            } else {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(result);
                console.log("Request finnished!\n");
            }
        };
        dbGetUserFiles(callback, req.params.id);
    } else {
        console.log("Error in endpoint /getUserFiles/id: Invalid request accept header " + req.headers.accept+"\n");
        res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
        res.end("Invalid Request");
    }
});


// ---- FILE UPLOAD ----
app.use(fileUpload());
app.use(bodyParser.json());

var pendingUploads = {}; //Keeps track of pending uploads to reduce load on database

app.post('/upload', function (req, res) {
    console.log("---- -- /upload -- ----");
    console.log("Request for userid " + req.body.id + " by " + req.ip);
    if (req.headers["content-type"] === "application/json") { //Checks for correct accept header    
        dbAddUpload(req.body.id,req.body.shareWith, req.body.fileSize, req.body.fileName)
            .then(function (result) {
                return dbAddShareEntries(result.fileid, result.shareWith);
            })
            .then(function (result) {
                console.log("Pending Uploads now:");
                console.log(pendingUploads);
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ "UploadID": result }));
                console.log("Request finnished!\n");
            })
            .catch(function (err) {
                console.log("Error in endpoint /upload: " + err);
                console.log("Request failed!\n");
                res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
                res.end("Invalid Request");
        });
    } else {
        console.log("Error in endpoint /upload Invalid request content-type header " + req.headers["content-type"]+"\n");
        res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
        res.end("Invalid Request");
    }
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
    if (pendingUploads[req.params.id] == undefined) {
        console.log("Error in endpoint /upload/id: Invalid fileId " + req.params.id);
        res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
        res.end("Invalid Request");
    }
    if (req.headers["content-type"] === "application/octet-stream") {
        getRawBody(req)
            .then(function (buf) {
                return saveFile(buf, "userfiles/" + req.params.id + "." + getFileExtension(pendingUploads[req.params.id]));
            })
            .then(function () {
                delete pendingUploads[req.params.id];
                console.log("Pending Uploads now:");
                console.log(pendingUploads);
                console.log("Upload finished!\n");
            })
            .catch(function (err) {
                console.log(err);
                res.writeHead(500, { "Content-Type": "text/plain" }); //Error 500: Internal Server error
                res.end("That went wrong...");
            });
    } else {
        console.log("Error in endpoint /upload/id: Invalid request content-type header " + req.headers["content-type"]+"\n");
        res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
        res.end("Invalid Request");
    }
});

app.use(function (req, res) {
    console.log("---- -- 404 Handler -- ----");
    console.log("File " + req.originalUrl+" requested by " + req.ip+"\n");
    res.sendFile(__dirname + '/static/404/4041.html');
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

function dbGetUserFiles(callback, userid) {
    let tempQuery = "SELECT filename,upload_time,name FROM wtf.files LEFT JOIN wtf.shares ON wtf.files.id = wtf.shares.file_id LEFT JOIN wtf.users ON wtf.shares.user_id = wtf.users.id WHERE owner = "+userid+" ORDER BY wtf.files.id;";
    db.query(tempQuery, function (err, result) {
        if (err) {
            console.log("Error in query: " + err);
            callback("Query failed", null); //"returns" errors to endpoint
        } else {
            console.log(result);
            let tempData = [];
            for (let i = 0; i < result.length; i++) { //builds object to be sent to client, removes duplicates in filename
                if (arrContainsObj(result[i], tempData)) {
                    tempData[tempData.length - 1].name.push(result[i].name+"");
                } else {
                    let tempObj = {};
                    tempObj.filename = result[i].filename+"";
                    tempObj.upload_time = result[i].upload_time;
                    tempObj.name = [];
                    tempObj.name.push(result[i].name+"");
                    tempData.push(tempObj);
                }
            }
            let json = JSON.stringify(tempData);
            console.log("dbGetUserFiles for userid " + userid + " resulted in:\n" + json);
            callback(null, json); //"returns" result to endpoint
        }
    });
}

function dbGetSharedFiles(callback,userid) {
    let tempQuery = "SELECT filename,upload_time,name,files.id  FROM wtf.shares JOIN wtf.files ON wtf.shares.file_id = wtf.files.id JOIN wtf.users ON wtf.files.owner = wtf.users.id WHERE user_id = "+userid+";";
    db.query(tempQuery, function (err, result) {
        if (err) {
            console.log("Error in query: " + err);
            callback("Query failed", null); //"returns" errors to endpoint
        } else {
            let json = JSON.stringify(result);
            console.log("dbGetSharedFiles for userid " + userid + " resulted in:\n" + json);
            callback(null, json); //"returns" result to endpoint
        }
    });
}

function dbAddUpload(userid,shareWith,fileSize,fileName) {
    return new Promise(function (resolve, reject) {
        let tempQuery = "INSERT INTO `wtf`.`files` (`owner`, `filename`) VALUES ('" + userid + "', '" + fileName + "');";
        db.query(tempQuery, function (err, result) {
            if (err) {
                console.log("Error in query: " + err);
                reject("Error in request");
            } else {
                console.log("dbAddUpload added entry with ID " + result.insertId + " for user " + userid);
                pendingUploads[result.insertId] = fileName;
                resolve({ "userid":userid, "fileid": result.insertId, "shareWith": shareWith });
            }
        });
    });
}

function dbAddShareEntries(fileid, shareArray) {
    if (shareArray.length !== 0) {
        for (let i = 0; i < shareArray.length; i++){
            let tempQuery = "INSERT INTO `wtf`.`shares` (`user_id`, `file_id`) VALUES ('" + shareArray[i] + "', '" + fileid + "');";
            db.query(tempQuery, function (err, result) {
                if (err) {
                    console.log("Error in query: " + err);
                    reject("Error in request");
                } else {
                    console.log("dbAddShareEntries added share for file " + fileid + " for user " + shareArray[i]);
                }
            });
        }
    }
    return fileid;
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

function getFileExtension(filename) {
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