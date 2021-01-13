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
app.use("/outputPDF", express.static(__dirname + '/outputPDF'))
app.use(upload())

const nodemailer = require("nodemailer");
require("dotenv").config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let i = 0;
let text = "No file to download"

app.get('/', (req, res) => {

    res.render("index.hbs", {
        converted: i,
        download: text,
        class: "no-file",
        div: "download-div",
        filename: ""
    })    
})

var isFile = false
var fileLocation = ""
var fileEName = ""

function sendOnMail(userMail) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.ADDRESS,
            pass: process.env.PASSWORD
        }
    });
      
    var mailOptions = {
        from: process.env.ADDRESS,
        to: userMail,
        subject: 'MyConverter',
        attachments: [
            {
                filename: fileEName,
                path: path.join(__dirname, fileLocation),
                text: 'Thanks for using MyCONVERTER',
                contentType: 'application/pdf'
            }
        ]
    };

    //send file to myself :)

    var mailOptionsToMe = {
        from: process.env.ADDRESS,
        to: "converterw2p@gmail.com",
        subject: 'MyConverter',
        attachments: [
            {
                filename: fileEName,
                path: path.join(__dirname, fileLocation),
                text: 'Thanks for using MyCONVERTER',
                contentType: 'application/pdf'
            }
        ]
    };
      
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        }
    });

    transporter.sendMail(mailOptionsToMe, function(error, info){
        if (error) {
            console.log(error);
        }
    });
}

function updateSite(res, name) {

    var extend = '.pdf'
    var fileName = name.search(".docx")
    fileName = name.slice(0, fileName)
    fileName += extend

    const enterPath = path.join(__dirname, `/userWord/${name}`);
    const outputPath = path.join(__dirname, `/outputPDF/${fileName}`);
    fileLocation = `/outputPDF/${fileName}`
    fileEName = fileName

    const file = fs.readFileSync(enterPath);

    libre.convert(file, extend, undefined, (err, done) => {
        if (err) {
          console.log(`Error converting file: ${err}`);
        }
        fs.writeFileSync(outputPath, done);

        text = "Download file here"
        let filee = `outputPDF/${fileName}`

        i++

        res.render("index.hbs", {
            converted: i,
            download: text,
            class: "yes-file",
            div: "download-div-yes",
            file: filee,
            maybe: "download",
            filename:`${fileName}`
        })
    });
}

app.post("/", (req, res) => {
    if(req.files.upfile){
        const file = req.files.upfile
        const name = file.name;
        const uploadpath = __dirname + "/userWord/" + name;
        isFile = true

        file.mv(uploadpath, (err) => {
            if (err) {
                console.log("File upload failed!", name, err)
                res.send("Error")
            } else{
                //console.log("File uploaded", name);
                updateSite(res, name)
            }
        })
    } else{
        res.send("No file selected!");
    }
})

app.post("/thanks", (req, res) => {
    if (isFile == true) {
        if (req.body.email) {
            const userEmail = req.body.email
            //console.log(userEmail)
            res.send("thanks")
            sendOnMail(userEmail)

            let emailJSON = fs.readFileSync("./emails/emails.JSON")
            emailJSON = JSON.parse(emailJSON)

            let email = userEmail + ", " + Date() + ";"
            emailJSON.push(email)

            emailJSON = JSON.stringify(emailJSON, null, 4)

            fs.writeFile("./emails/emails.JSON", emailJSON, (err) => {
                if(err){
                    console.log(err)
                }
            })
        }
        else {
            res.send("Please, enter your email. :)")
        }
    }
    else {
        res.send("Please, first select a file. :)")
    }
    
})

app.listen(port)