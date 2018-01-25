# WTF - Web Technologies Filesharing

A node based filesharing webservice

## Authors
* **Patrick Weiß** - *Frontend and Styling* - [Paddy24041998](https://github.com/paddy24041998)
* **Michael Schreder** - *Authentication on Clientside, Styling* - [Senpai96](https://github.com/senpai96)
* **Alexander Gebhardt** - *Backend, Authentication on Serverside, Database and Deployment* - [iAIex](https://github.com/iAIex)

## Authors' notes on their work
### Patrick Weiß - *Frontend and Styling* - [Paddy24041998](https://github.com/paddy24041998)

### Michael Schreder - *Authentication on Clientside, Styling* - [Senpai96](https://github.com/senpai96)
The Google Sign-In with OAuth 2.0 is linked to a google developers OAuth 2.0-Client-ID. The OAuth 2.0-Client-ID is integrated in the sign-in button and only allows access from specific addresses. If you click on the google sign-in button and log in correctly to your account, is sends the google user token_id to the backend server to be verified. Access is only allowed from (http://localhost:1337) and (http://localhost:80). If the server is hosted on a different domain, the sign-in will refue to work.
The simple and friendly page design is done with css. The background picture is a free to use picture.

### Alexander Gebhardt - *Backend, Authentication on Serverside, Database and Deployment* - [iAIex](https://github.com/iAIex)
The server.js file is segmented into three sections:  
The routing section handles all communication with the client and is supposed to have as little logic as possible in it to make the code easier to read. All request are processed by promise chains.  
The database section includes functions which handle all database queries and implement most of the logic used for processing requests. These functions return promises that either get resolved or rejected depending on the result of the query. Some functions implement an "execCount" variable that keeps track of how often a certain operation has been performed. This is necessary since this ensures that a resolve only resolves to a complete set of data. "Promise.all" was not suited for this task as it requires all promises to resolve which is not always the case in this project since it is possible to (in some cases) get a complete dataset without all promises resolving.  
The helper functions are utility functions used for various tasks. They are created in order to keep the promise chains in the routing section clear and easy to read.  

The authentication of the users is done using the Google ID Token. Each request of the client passes a token which identifies the user. This token is then validated using the Google Auth Library.

## Getting Started

To get your very own copy of WTF running follow these steps

### Prerequisites and Installation

To run this on your machine you first have to set up a SQL Server on your PC. On Windows install [MySQL Community Server](https://dev.mysql.com/downloads/mysql/), on Debian Linux run
```
sudo apt-get install mysql-server
```
Then create the database "wtf" using the SQL query
```
CREATE DATABASE wtf;
```
After that create a database user for the node app in your SQL environment

```
CREATE USER your_username_here IDENTIFIED BY "your_password_here";
```
Now clone the git repo to a path of your choosing
```
git clone https://github.com/iAIex/WT.git
```
Import the sql dumps found in /Filehost/Database into your wtf database
```
sudo mysql wtf < sql_dump_name.sql
```
After that navigate to the server.js file in /Filehost/Filehost and edit the credentials for the database user in the server.js file to look like this
```
var db = mysql.createConnection({ //configuring db parameters
    host: "localhost",
    user: "YOUR_USERNAME_HERE",
    password: "YOUR_PASSWORD_HERE"
});
```
Additionally you have to provide a Google app token in server.js and index.html  
server.js
```
//Required for Google Auth
const audiance = "your_token_here.apps.googleusercontent.com";
```
index.html
```
<meta name="google-signin-client_id" content="your_token_here.apps.googleusercontent.com">
```
Then install node by downloading it [here](https://nodejs.org/en/download/) or on Debian Linux running
```
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt-get install -y nodejs
```
After that install all required npm packages by running
```
npm install package.json
```
Now your WTF is ready to launch. To start the server use the command
```
node server.js
```
That's it! Now your users can connect to your WTF

## Built With
* [Visual Studio 2017](https://www.visualstudio.com/de/downloads/)
* [Atom](https://atom.io/)

## Acknowledgments
This project is based on [Node.js](https://nodejs.org/) on the server side. It implements multiple node packages which are listed here:
* [express](https://expressjs.com/)
* [express-fileupload](https://github.com/richardgirges/express-fileupload)
* [mysql](https://github.com/mysqljs/mysql)
* [raw-body](https://github.com/stream-utils/raw-body)
* [save-file](https://github.com/dfcreative/save-file)
* [chalk](https://github.com/chalk/chalk)
* [google-auth-library](https://github.com/google/google-auth-library-nodejs)

As database engine MySQL Community Server 5.7 and MariaDB were used
* [MySQL Community Server 5.7](https://dev.mysql.com/downloads/mysql/)
* [MariaDB](https://mariadb.org/)

Additionally the following toolkits were used for the frontend:
* [Vue.js](https://vuejs.org/)

For authentication the google sign-in was used
* [Google Identity Platform](https://developers.google.com/identity/)

## Versioning
Versioning is still in beta you could say. We plan on versioning like this:
* Milestones are numbered 1.0.0
* Functional additions are numbered 0.1.0
* Bugfixes and improvements of existing features are numbered 0.0.1

This versioning sceme applies after version 1.0.0 if this project is continued

## License
This project is currently not licensed under any special license. If you want to use any of the code found in this repo for your own projects please contact me [iAIex](https://github.com/iAIex)
