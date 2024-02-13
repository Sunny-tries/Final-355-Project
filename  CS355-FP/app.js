const http = require("http");
const https = require("https")
const url = require("url");
const fs = require("fs");
require('dotenv').config();
const port = 4000;


const server = http.createServer(); //Creating server
const api_key = process.env.API_KEY;
let name = "";

server.on("request", request_handler); // Server listening for requests
server.on("listening", listen_handler); // server saying which port its listening on and listening
server.listen(port); // give the server the port 3000 to listen on

//fires whenever the server is created and listening
function listen_handler(){
  console.log(`Now listening on port ${port}`)
}
//fires whenever a client accesses the localhost and has error checking. Redirects if the client goes to an incorrect endpoint
function request_handler(req, res){
    console.log(`New Request from ${req.socket.remoteAddress} for ${req.url}`);
    if(req.url === "/"){
        res.writeHead(200, {'Content-Type': 'text/html'});
        const html_stream = fs.createReadStream("form.html")
        html_stream.pipe(res);

    }else if(req.url.startsWith("/print")){
        res.writeHead(200, {'Content-Type': 'text/html'});
        const user_input = url.parse(req.url, true).query;
        name = user_input.name;
        if(name == null || name == ""){
            res.writeHead(404, {"Content-Type": "text/html"})
            res.end(`<h1>Missing Input</h1>`)
        }
        get_cat_photo(res);
    }
    else{
        res.writeHead(404, {"Content-Type": "text/html"});
        res.end(`<h1>404 Not Found</h1>`)
    }
}

// Getting the cat photo using api key
// Stream in the data in a string via chunks because we dont know the size of the image, and the parses it back to JSON object where we use the URL
function get_cat_photo(res) {
    const cat_url = `https://api.thecatapi.com/v1/images/search?limit=1&api_key=${api_key}`;
  
    https.get(cat_url, (catRes) => {
      let catData = '';
  
      catRes.on('data', (chunk) => {
        catData += chunk;
      });
      catRes.on('end', () => {
        try {
          const catImage = JSON.parse(catData);
          // Check if the API response contains an image URL
          if (catImage && catImage[0] && catImage[0].url) {
            const imageUrl = catImage[0].url;
  
            joke(res, imageUrl, name);  

          } else {
            console.error('Invalid cat image data:', catData);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>Internal Server Error</h1>');
          }
        } catch (error) {
          console.error('Error parsing cat image data:', error);
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h1>Internal Server Error</h1>');
        }
      });
    }).on('error', (error) => {
      console.error('Error fetching cat image:', error);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end('<h1>Internal Server Error</h1>');
    });
  }

  // Gets the joke, open API
  // Saying how to recieve the data. Similar to cat stream it in via chunks and then parsing it as a json object. 
  function joke(res, imageURL, name, ...args){
    const joke_url = 'https://icanhazdadjoke.com/';

    const options ={
        headers: {
            'Accept': 'application/json'
        }
    };

    https.get(joke_url, options, (jokeRes) => {
        let jokeData = '';
        jokeRes.on('data', (chunk) =>{
            jokeData += chunk;
        });

        jokeRes.on('end', () =>{
          try {
            const joke = JSON.parse(jokeData);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            let text = `<img src="${imageURL}" alt="Cat Image" style="max-width: 300px; height: auto;">
                        <h1>Here is a cat for ${name}. Also, ${joke.joke}</h1>`;
            res.end(text);
        } catch (error) {
            // Handle JSON parsing error
            console.error('Error parsing joke data:', error);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>Internal Server Error</h1>');
        }
        })
    })
  }