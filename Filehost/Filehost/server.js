'use strict';
const express = require('express');
const fileUpload = require('express-fileupload');
const app = require('express')();
const http = require('http').Server(app);
const mysql = require('mysql');

//Listening on Port 1337
http.listen(1337, function () {
    console.log('Server up on 1337\n->Time to party<-');
})

// ---- ROUTING ----
app.use('/', express.static(__dirname + '/static'))

app.get('/', function (req, res) {
    console.log("Root Requested by " + req.ip);
    res.sendFile(__dirname + '/static/dummy.html')
})

app.get('/getSharedFiles:id', function (req, res) { //AJAX endpoint for getting sharedFiles by userId
    console.log("Shared files for userid "+req.params.id+" requested by " + req.ip);
    let callback = function (err, result) {
        if (err) {
            console.log("Error in endpoint /getSharedFiles: " + err);
            res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
            res.end(""+err);
            return;
        } else {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(result);
        }
    };
    dbGetSharedFiles(callback,req.params.id);
});

app.get('/getUserFiles:id', function (req, res) {
    console.log("User files for userid "+req.params.id+" requested by " + req.ip);
    let callback = function (err, result) {
        if (err) {
            console.log("Error in endpoint /getUserFiles: " + err);
            res.writeHead(400, { "Content-Type": "text/plain" }); //Error 400: Bad Request
            res.end(""+err);
            return;
        } else {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(result);
        }
    }
    dbGetUserFiles(callback, req.params.id);
});


//FILE UPLOAD
app.use(fileUpload());

app.post('/upload', function (req, res) {

    console.log(req.files);

    if (!req.files)
        return res.status(400).send('No files were uploaded.');

    let myFile = req.files.myFile; //Name of input field

    //var fileId = dbSaveFile(userid, myFile.name.myFile.filetype);

    myFile.mv("userfiles/"+myFile.name, function (err) { //move (mv()) file to userfiles
        if (err)
            return res.status(500).send(err);

        res.send('File uploaded!');
    });
});

//DATABASE

//ALTER TABLE tablename AUTO_INCREMENT = 1; for resetting AI

var db = mysql.createConnection({
    host: "localhost",
    user: "User1",
    password: "ibims1user"
})

db.connect(function (err) {
    if (err) console.log("Database connection failed!\n"+err);return;
    console.log("MySQL connected");
});

function dbGetUserFiles(callback, userid) {
    let tempQuery = "SELECT filename,upload_time,name FROM wtf.files LEFT JOIN wtf.shares ON wtf.files.id = wtf.shares.file_id LEFT JOIN wtf.users ON wtf.shares.user_id = wtf.users.id WHERE owner = "+userid+" ORDER BY wtf.files.id;";
    db.query(tempQuery, function (err, result) {
        if (err) {
            console.log("Error in query: " + err);
            callback("Query failed", null);
        } else {
            let tempData = [];
            for (let i = 0; i < result.length; i++) {
                console.log(tempData);
                if (arrContainsObj(result[i], tempData)) {
                    tempData[tempData.length - 1].name.push(result[i].name);
                } else {
                    let tempObj = {};
                    tempObj.filename = result[i].filename;
                    tempObj.upload_time = result[i].upload_time;
                    tempObj.name = [];
                    tempObj.name.push(result[i].name);
                    tempData.push(tempObj);
                }
            }
            var json = JSON.stringify(tempData);
            console.log("dbGetUserFiles for userid " + userid + " resulted in:\n" + json);
            callback(null, json);
        }
    });
}

function arrContainsObj(obj, array) {
    for (let x = 0; x < array.length; x++) {
        if (array[x].filename.includes(obj.filename)) {
            return true;
        }
    }
    return false;
}

function dbGetSharedFiles(callback,userid) {
    let tempQuery = "SELECT filename,upload_time, name FROM wtf.shares JOIN wtf.files ON wtf.shares.file_id = wtf.files.id JOIN wtf.users ON wtf.files.owner = wtf.users.id WHERE user_id = "+userid+";";
    db.query(tempQuery, function (err, result) {
        if (err) {
            console.log("Error in query: " + err);
            callback("Query failed", null);
        } else {
            var json = JSON.stringify(result);
            console.log("dbGetSharedFiles for userid " + userid + " resulted in:\n" + json);
            callback(null, json);
        }
    });
}

/*
function dbSaveFile(userid,filename,filetype) {
    var tempQuery = "INSERT INTO `wtf`.`files` (`owner`, `filename`, `filetype`) VALUES ('" + userid + "', '" + filename + "', '" + filetype + "');";
    var fileID = "";
    db.query(tempQuery, function (err, result) {
    });
}*/

function hans() {
    let callback = function (err, result) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(result);
    };
    dbGetUserFiles(callback, req.params.id);
}