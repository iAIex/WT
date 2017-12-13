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

app.get('/ajax', function (req, res) {
    console.log("AJAX Requested by " + req.ip);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hallo");
})

app.get('/getSharedFiles:id', function (req, res) {
    console.log("Shared files for userid "+req.params.id+" requested by " + req.ip);
    let callback = function (err, result) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(result);
    };
    dbGetSharedFiles(callback,req.params.id);
});

app.get('/getUserFiles:id', function (req, res) {
    console.log("User files for userid "+req.params.id+" requested by " + req.ip);
    let callback = function (err, result) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(result);
    };
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
//SELECT filename, name FROM wtf.shares JOIN wtf.files ON wtf.shares.file_id = wtf.files.id JOIN wtf.users ON wtf.files.owner = wtf.users.id WHERE user_id = 2; for getting Shared files

var db = mysql.createConnection({
    host: "localhost",
    user: "User1",
    password: "ibims1user"
})

db.connect(function (err) {
    if (err) throw err;
    console.log("MySQL connected");
});

function dbGetUserFiles(callback, userid) {
    let tempQuery = "SELECT filename FROM wtf.files WHERE owner =" + userid + ";";
    db.query(tempQuery, function (err, result) {
        var json = JSON.stringify(result);
        console.log("dbGetUserFiles for userid " + userid + " resulted in:\n" +json);
        callback(null, json);
    });
}

function dbGetSharedFiles(callback,userid) {
    let tempQuery = "SELECT filename, name FROM wtf.shares JOIN wtf.files ON wtf.shares.file_id = wtf.files.id JOIN wtf.users ON wtf.files.owner = wtf.users.id WHERE user_id = "+userid+";";
    db.query(tempQuery, function (err, result) {
        var json = JSON.stringify(result);
        console.log("dbGetSharedFiles for userid "+userid+" resulted in:\n"+json);
        callback(null,json);
    });
}

/*
function dbSaveFile(userid,filename,filetype) {
    var tempQuery = "INSERT INTO `wtf`.`files` (`owner`, `filename`, `filetype`) VALUES ('" + userid + "', '" + filename + "', '" + filetype + "');";
    var fileID = "";
    db.query(tempQuery, function (err, result) {
    });
}*/