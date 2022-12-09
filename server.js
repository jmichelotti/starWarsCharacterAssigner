process.stdin.setEncoding("utf-8");
const express = require('express');
const fetch = require('node-fetch');
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '.env') })

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const dbName = process.env.MONGO_DB_NAME;
const collectionName = process.env.MONGO_COLLECTION;

const bodyParser = require("body-parser");
// create an express app
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

// get the port number from the command line argument
const port = process.argv[2];


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${userName}:${password}@cluster0.oq2memk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const apiBaseURL = "https://swapi.dev/api/people/";



// create a route for the root path
app.get('/', (request, response) => {
    // send a response message
    response.sendFile('home.html', { root: __dirname });
});

app.get('/form', (request, response) => {
    response.sendFile('personForm.html', { root: __dirname });
});

app.get('/reviewForm', (request, response) => {
    response.sendFile('reviewForm.html', { root: __dirname });
});

app.post('/form', async (request, response) => {
    await submitForm(request, response);
    const { name, age, charNum } = request.body;
    response.sendFile('home.html', { root: __dirname });
});

async function submitForm(request, response) {
    const form = request.body;
    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection(collectionName);
        const result = await collection.insertOne(form);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

app.post('/reviewForm', async (request, response) => {
    let result = await getOneForm(request, response);
    const { name, age, charNum } = result;
    fetch(apiBaseURL + charNum)
        .then(response => response.json())
        .then(data => {
            let characterName = data.name;
            response.render("reviewCharacter", { name, age, charNum, characterName });
        })
});

async function getOneForm(request, response) {
    let filter = {name: request.body.name};
    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection(collectionName);
        const result = await collection.findOne(filter);
        return result;
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

process.stdout.write(`Web server started and running at http://localhost:${port}\nType stop to shutdown the server: `);

process.stdin.on('readable', () => {
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
        let command = dataInput.trim();
        if (command === "stop") {
            process.exit(0);
        }
    }
}
);

// start the server on the specified port
app.listen(port);