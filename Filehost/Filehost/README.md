# WTF - Web Technologies Filehost

A node based filehosting webservice

## Authors
* **Patrick Weiß** - *Frontend and Styling* - [Paddy24041998](https://github.com/paddy24041998)
* **Michael Schreder** - *Authentication on Clientside, Styling* - [Senpai96](https://github.com/senpai96)
* **Alexander Gebhardt** - *Backend, Authentication on Serverside, Database and Deployment* - [iAIex](https://github.com/iAIex)

## Authors' notes on their work
### Patrick Weiß - *Frontend and Styling* - [Paddy24041998](https://github.com/paddy24041998)

### Michael Schreder - *Authentication on Clientside, Styling* - [Senpai96](https://github.com/senpai96)

### Alexander Gebhardt - *Backend, Authentication on Serverside, Database and Deployment* - [iAIex](https://github.com/iAIex)
The server.js file is segmented into three sections:  
The routing section handles all communication with the client and is supposed to have as little logic as possible in it to make the code easier to read. All request are processed by promise chains.  
The database section includes functions which handle all database queries and implement most of the logic used for processing requests. These functions return promises that either get resolved or rejected depending on the result of the query. Some functions implement an "execCount" variable that keeps track of how often a certain operation has been performed. This is necessary since his ensured that a resolve only resolves to a complete set of data. "Promise.all" was not suited for this task as it requires all promises to resolve which is not always the case in this project since it is possible to in some cases get a complete dataset without all promises resolving.  
The helper functions are utility functions used for various tasks. They are created in order to keep the promise chains in the routing section clear and easy to read.


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

As database engine MySQL Community Server 5.7 was used
* [MySQL Community Server 5.7](https://dev.mysql.com/downloads/mysql/)

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
