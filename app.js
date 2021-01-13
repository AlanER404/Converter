const express = require('express')
const upload = require('express-fileupload')
const app = express()
const port = 8080

const libre = require("libreoffice-convert")
const path = require('path');
const fs = require('fs');

const hbs = require('handlebars')

app.set("view engine", "hbs");
app.use("/public/css", express.static(__dirname + '/public/css'));
app.use("/public/img", express.static(__dirname + '/public/img'))
app.use("/outputPDF", express.static(__dirname + '/outputPDF'))
app.use(upload())

const nodemailer = require("nodemailer");
require("dotenv").config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var i = fs.readFileSync("./emails/counter.json")
i = JSON.parse(i)

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
      
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        }
    });
}

function updateJSON() { 
      
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

        i = fs.readFileSync("./emails/counter.json")
        i = JSON.parse(i)
        i++

        r = JSON.stringify(i)
        fs.writeFileSync("./emails/counter.json", r, (err) => {
            if (err) {
                console.log(err)
            }
        }) 
 
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
        res.render("error.hbs", {
            text: "No file selected!",
            todo: "In order for this to work, you need to upload word file to get converted pdf file. Press app icon to go back to home page",
            converted: i
        })
    }
})

app.post("/thanks", (req, res) => {
    if (isFile == true) {
        const userEmail = req.body.email
        //console.log(userEmail)

        sendOnMail(userEmail)

        let emailJSON = fs.readFileSync("./emails/emails.JSON")
        emailJSON = JSON.parse(emailJSON)

        let email = emailJSON.length + ". " + userEmail + ", " + Date() + ";"
        emailJSON.push(email)

        emailJSON = JSON.stringify(emailJSON, null, 4)

        fs.writeFile("./emails/emails.JSON", emailJSON, (err) => {
            if(err){
                console.log(err)
            }
        })

        res.render("thanks.hbs", {
            converte: i
        })
    }
    else {
        res.render("error.hbs", {
            text: "No file selected!",
            todo: "In order for this to work, you need to upload word file to get converted pdf file. Press app icon to go back to home page",
            converted: i
        })
    }
    
})

app.get("/adminconverter", (req, res) => {
    let adminJSON = fs.readFileSync("./emails/emails.JSON")
    adminJSON = JSON.parse(adminJSON)
    res.render("admin.hbs", {
        admin: adminJSON
    })
})

app.listen(process.env.PORT || port)