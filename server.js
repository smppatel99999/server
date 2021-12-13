//importing all the modules
const express = require('express')
const hbs = require('hbs')
const port = process.env.PORT || 3000
const bodyParser = require("body-parser");
const fileUpload = require('express-fileupload');
var jsmediatags = require("jsmediatags");
require('dotenv').config({path: __dirname + '/.env'})

const fs = require('fs')
var {getData, getDataForAPI, sendMP3, sendAlbumArt,addMetaData, checkBeforeUpload, clearCollection } = require('./fb')

//instance of express
const app = express()
app.set('view engine','hbs') //setting view engine to handlebars
app.use(express.static('public')) //setting the public dir as static assets dir
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/',
    uploadTimeout:0,
}));

//body-parser to parse incoming formdata
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());






//#############################################################################


//###################### EXPRESS END-POINTS

app.get('/', (req, res)=>{
    
    Promise.all([getData()]).then((result)=>{
        res.render('index',{songs: result[0]});
    })


})

app.get('/send', (req, res)=>{
    
        res.render('upload');


})



app.get('/songs', (req, res)=>{

    res.setHeader('Content-Type', 'application/json');

    //To get all the data from the perticular promise    
    Promise.all([getDataForAPI()]).then(function(result){
        res.send(JSON.stringify(result[0]))
    });
});



app.get('/env', (req, res)=>{

res.send(process.env)



});






app.post('/upload', function(req, res) {

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let sampleFile = req.files.song;
  uploadPath = __dirname + '/public/' + sampleFile.name;
  fileName = sampleFile.name;




jsmediatags.read(uploadPath, {
  onSuccess: function(tag) {
    







  },
  onError: function(error) {
    console.log(':(', error.type, error.info);
  }
});


    

  //Use the mv() method to place the file somewhere on your server
  //console.log("TEMP FILE PATH :", sampleFile.tempFilePath)
  

  console.log(sampleFile.name)

  let mp3data = {
                "title":'',
                "artist":'',
                "temp_img_url":'',
                "img":"",
                "audio_url":"",
            }

  sampleFile.mv(uploadPath, function(err) {
    if (err){
      return res.status(500).send(err);
    }
        
        
    jsmediatags.read(uploadPath, {
          onSuccess: function(tag) {
            var tags = tag.tags;
            
            mp3data.title = tags.title;
            mp3data.artist = tags.artist;

        
        Promise.all([checkBeforeUpload(tag.tags.title)]).then(result=>{
                console.log("MP3 PUBLIC URL", result[0])
                if(result[0]){


            const btoa = function(str){ return Buffer.from(str, 'binary').toString('base64'); }
            
            const { format, data } = tag.tags.picture;
            let base64String = "";
            for (let i = 0; i < data.length; i++) {
              base64String += String.fromCharCode(data[i]);
            }
            
            var imageData = `data:${format};base64,${btoa(base64String)}`;
            
            var ext = format.split('/')[1] 
            imageFileName = sampleFile.name.split('.')[0] +'_imgfile.'+ext;
            makeImagePath = __dirname + '/public/'+imageFileName;

            require("fs").writeFile(makeImagePath, btoa(base64String), 'base64', function(err) {
            if(err == null){
                console.log("Created IMAGE File Successfully")
            }else{
                console.log("TEMP IMAGE CREATION FAILED ",err);
            }
            });

            mp3data.temp_img_url = makeImagePath
            

            Promise.all([sendMP3(uploadPath, fileName)]).then(result=>{
                console.log("MP3 PUBLIC URL", result[0])
                mp3data.audio_url = result[0]

            Promise.all([sendAlbumArt(makeImagePath, imageFileName) ]).then((result)=>{
            
                //double Promise
            console.log("IMAGE PUBLIC URL", result[0])
            mp3data.img = result[0]
            console.log(mp3data)

            Promise.all([addMetaData(mp3data)]).then((result)=>{
            console.log("METADATA UPLOADED", result[0])
            }).catch(err=>{
                console.log("ERROR METADATA UPLOAD", err)
            })                               

            res.setHeader('Content-Type', 'text/html');

            res.send(mp3data.title+" : Uploaded" + "<img src='"+mp3data.img+'" />')


            });                               
                
            });



                }else{

                    res.send("Exists.")

                }




//end of upload check
});







            
 




          },
          onError: function(error) {
            console.log('JSMEDIATAGS ERROR OCCURED : ', error.type, error.info);     
          }
        })        
  

    
    


    



  });








});



// app.get("/delfire",(req,res)=>{


// clearCollection('songs')
// res.send("Started the cleaning")
// })




app.listen(port,()=>{
    console.log(`running at ${port}`)
})
