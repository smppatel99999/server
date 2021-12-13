const fsa = require('firebase-admin');

//You can use firebase-admin sdk json file to authentica. 
//'file' is the json file for auth. Point it to your file or use
//the env's below
const sa = require('./file')
// const sa = {
//   "type": process.env.TYPE,
//   "project_id": process.env.PROJECT_ID,
//   "private_key_id": process.env.PRIVATE_KEY_ID,
//   "private_key": process.env.PRIVATE_KEY,
//   "client_email": process.env.CLIENT_EMAIL,
//   "client_id": process.env.CLIENT_ID,
//   "auth_uri": process.env.AUTH_URI,
//   "token_uri": process.env.TOKEN_URI,
// }


//initializing firebase
const defapp = fsa.initializeApp({
    credential: fsa.credential.cert(sa),
    databaseURL: process.env.DATABASE_URL,
    storageBucket: process.env.STORAGE_BUCKET,
});

//logging the app name


const db=fsa.firestore()
const songsCollection = db.collection('songs')



function getData(){

    return new Promise((resolve,reject)=>{

        const cityRef = db.collection('songs');
        const doc = cityRef.get().then(querySnapshot => {
        let documents = querySnapshot.docs.map(doc => doc.data())
        // do something with documents
        resolve(documents)

        });

    });


}

function getDataForAPI(){

    return new Promise((resolve,reject)=>{

        const cityRef1 = db.collection('songs');
        const doc = cityRef1.get().then(querySnapshot => {
        let documents = querySnapshot.docs.map(doc => doc.data())
        // do something with documents
        resolve(documents)

        });

    });


}






function sendMP3(uploadPath, fileName){
    
        return new Promise((resolve,reject)=>{
            
            var bucket = fsa.storage().bucket();
            
            bucket.upload(uploadPath, { destination: "songs/"+fileName },function(err, file) {
            
                if (!err) {
                    console.log("FIREBASE MP3 UPLOAD FINISHED")
                    var dt = "https://storage.googleapis.com/"+file.metadata.bucket +"/songs/"+fileName
                    console.log(dt)
                    resolve(dt)
                  }else{
                    console.log("FIREBASE MP3 UPLOAD FAILED, ERROR DATA :", err)
                  }
        
        });

    });


    
}



function sendAlbumArt(uploadPath, fileName){
    
    
    return new Promise((resolve,reject)=>{
            
            var bucket = fsa.storage().bucket();
            bucket.upload(uploadPath, { destination: "images/"+fileName },function(err, file) {
                  
                  if (!err) {
                  
                    var dt = "https://storage.googleapis.com/"+file.metadata.bucket +"/images/"+fileName
                    console.log("FIREBASE IMAGE UPLOAD FINISHED. URL : ", dt)
                    resolve(dt)
                  
                  }else{
                    console.log("FIREBASE UPLOAD FAILED, ERROR DATA :", err)
                  }
        });

    //end-of-promise
});


    
}













function addMetaData(argument) {
    
    return new Promise((resolve,reject)=>{

        songsCollection.add(argument).then(()=>{
                resolve("Data Updated Sucessfully to the Firebase")
            }).catch((err)=>{
                console.log("ERROR UPLOADING FIREBASE METADATA", err)
                reject(err)
                res.send(err)
            });

    });

    

}

function checkBeforeUpload(file="unKnown"){


    return new Promise((resolve, reject)=>{

            const citiesRef = db.collection('songs');
            const snapshot = citiesRef.where('title', '==', file).get().then(querySnapshot => {
            
            //let documents = querySnapshot.docs.map(doc => doc.data())
            // do something with documents
            //console.log(documents)
            
            if (querySnapshot.empty) {
                console.log("No Duplicate. Going Ahead")
                resolve(true)
            }else{
                console.log("Song Exists.")
                resolve(false)
            }

          });


    });


}





function clearCollection(path) {
  const ref = db.collection(path)
  ref.onSnapshot((snapshot) => {
    snapshot.docs.forEach((doc) => {
      ref.doc(doc.id).delete()
    })
  })
}


module.exports.getData = getData
module.exports.getDataForAPI = getDataForAPI
module.exports.sendMP3 = sendMP3
module.exports.sendAlbumArt = sendAlbumArt
module.exports.addMetaData = addMetaData
module.exports.checkBeforeUpload = checkBeforeUpload
module.exports.clearCollection = clearCollection