'use strict';
var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//Listening on Port 1337
http.listen(1337, function () {
    console.log('Server up on 1337')
})

// ---- ROUTING ----
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/websites/index.html')
})

app.get('/impressum.html', function (req, res) {
    res.sendFile(__dirname + '/websites/impressum.html')
})


io.on('connection', function (socket) {
    console.log('Connection recieved')
    io.emit('hallo',"Ich bin peter")
});

io.on('chat-in', function (socket) { console.log("Test") });