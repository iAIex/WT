'use strict';
var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var mysql = require('mysql');

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
app.get('/getFiles:id-:token', function (req, res) {
    console.log("AJAX Requested by " + req.ip);
    console.log("   ID: "+req.params.id);
    console.log("Token: "+req.params.token);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("HANS");
})