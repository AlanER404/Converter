const express = require('express')
const upload = require('express-fileupload')
const app = express()
const port = 8080

const libre = require("libreoffice-convert")
const path = require('path');
const fs = require('fs');


app.set("view engine", "hbs");
app.use("/public/css", express.static(__dirname + '/public/css'));
app.use("/public/img", express.static(__dirname + '/public/img'))
app.use(upload())

let i = 0;
let text = "No file to download"

app.get('/', (req, res) => {

    res.render("index.hbs", {
        converted: i,
        download: text,
        class: "no-file",
        div: "download-div",
        file: ""
    })    
})

function updateSite(res, name) {

    var extend = '.pdf'
    var fileName = name.search(".docx")
    fileName = name.slice(0, fileName)
    fileName += extend
    console.log(fileName)
    const enterPath = path.join(__dirname, `/userWord/${name}`);
    const outputPath = path.join(__dirname, `/outputPDF/${fileName}`);

    const file = fs.readFileSync(enterPath);

    libre.convert(file, extend, undefined, (err, done) => {
        if (err) {
          console.log(`Error converting file: ${err}`);
        }
        fs.writeFileSync(outputPath, done);

        text = "Download file here"
        let file = `/outputPDF/${fileName}`

        res.render("index.hbs", {
            converted: i,
            download: text,
            class: "yes-file",
            div: "download-div-yes",
            file: file
        })
    });

    

}


app.post("/", (req, res) => {
    if(req.files.upfile){
        const file = req.files.upfile
        const name = file.name;
        const uploadpath = __dirname + "/userWord/" + name;

        file.mv(uploadpath, (err) => {
            if (err) {
                console.log("File upload failed!", name, err)
                res.send("Error")
            } else{
                console.log("File uploaded", name);
                updateSite(res, name)
            }
        })
    } else{
        res.send("No file selected!");
    }
})


app.listen(port)