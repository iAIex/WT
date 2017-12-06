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

app.get('/getFiles:id-:token', function (req, res) {
    console.log("AJAX Requested by " + req.ip);
    console.log("   ID: " + req.params.id);
    console.log("Token: "+req.params.token);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("HANS");
})

app.use(fileUpload());

app.post('/upload', function (req, res) {

    console.log(req.files);

    if (!req.files)
        return res.status(400).send('No files were uploaded.');

    var myFile = req.files.myFile; //Name of input field

    myFile.mv("userfiles/"+myFile.name, function (err) { //move (mv()) file to userfiles
        if (err)
            return res.status(500).send(err);

        res.send('File uploaded!');
    });
});