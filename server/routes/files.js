const path = require("path")
const formidable = require("formidable")
const fs = require("fs-extra")
const Remarkable = require("remarkable")
const ejs = require("ejs")
const md = new Remarkable("full", {
    html: true,
    linkify: true,
    typographer: true
})
async function files(req, res) {
    res.setHeader("Content-Type", "text/text")
    let fileName = this.randomToken(6) // 56,800,235,584 possible file names
    let form = new formidable.IncomingForm()
    form.parse(req, (err, fields, files) => {
        let userIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress
        if (!this.auth(this.c.key, fields.key)) {
            res.statusCode = 401
            res.write("Unauthorized");
            res.end();
            return this.log.warning(`Unauthorized User | File Upload | ${userIP}`)
        }
        let oldpath = files.fdata.path
        let newpath = `${__dirname}/../uploads/${fileName+files.fdata.name.toString().match(/(\.)+([a-zA-Z0-9]+)+/g, "").toString()}`
        if (fields.key === this.c.admin.key) {
            if (Math.round((files.fdata.size / 1024) / 1000) > this.c.admin.maxUploadSize) {
                if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[FAILED UPLOAD][ADMIN]\n[FILE](${files.fdata.name})\n[SIZE](${Math.round(files.fdata.size/1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\n[ERROR](ERR_FILE_TOO_BIG)\`\`\``)
                res.statusCode = 413
                res.write(`http://${req.headers.host}/ERR_FILE_TOO_BIG`)
                return res.end()
            } else {
                fs.move(oldpath, newpath, err => {
                    if (files.fdata.name.substring(files.fdata.name.lastIndexOf(".") + 1, files.fdata.name.length).toLowerCase() === "md" && this.c.markdown) {
                        fs.readFile(newpath, "utf-8", function read(err, data) {
                            let stream = fs.createWriteStream(`${__dirname}/../uploads/${fileName}.html`)
                            stream.once("open", fd => {
                                ejs.renderFile(`${__dirname}/../views/md.ejs`, {
                                    ogDesc: data.match(/.{1,297}/g)[0],
                                    mdRender: md.render(data)
                                }, {}, (err, str) => {
                                    stream.write(str)
                                })
                                stream.end()
                                fs.unlink(newpath, err => {
                                    if (err) return this.log.error(err)
                                });
                            })
                        })
                    }
                    if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[NEW UPLOAD][ADMIN]\n[SIZE](${Math.round(files.fdata.size/1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\`\`\`\nhttp://${req.headers.host}/${fileName}`)
                    if (err) return res.write(err)
                    this.log.verbose(`New File Upload: http://${req.headers.host}/${fileName} | IP: ${userIP}`)
                    let insecure = `http://${req.headers.host}/${fileName}`
                    let secure = `https://${req.headers.host}/${fileName}`
                    res.write(req.secure ? secure : insecure)
                    return res.end()
                })
            }
        } else {
            if (Math.round((files.fdata.size / 1024) / 1000) > this.c.maxUploadSize) {
                if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[FAILED UPLOAD][USER]\n[FILE](${files.fdata.name})\n[SIZE](${Math.round(files.fdata.size/1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\n[ERROR](ERR_FILE_TOO_BIG)\`\`\``)
                res.statusCode = 413
                res.write(`http://${req.headers.host}/ERR_FILE_TOO_BIG`)
                return res.end()
            } else {
                if (!this.c.allowed.includes(files.fdata.name.substring(files.fdata.name.lastIndexOf(".") + 1, files.fdata.name.length))) {
                    if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[FAILED UPLOAD][USER]\n[FILE](${files.fdata.name})\n[SIZE](${Math.round(files.fdata.size / 1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\n[ERROR](ERR_ILLEGAL_FILE_TYPE)\`\`\``)
                    res.statusCode = 415
                    res.write(`http://${req.headers.host}/ERR_ILLEGAL_FILE_TYPE`)
                    return res.end()
                } else {
                    fs.move(oldpath, newpath, err => {
                        if (files.fdata.name.substring(files.fdata.name.lastIndexOf(".") + 1, files.fdata.name.length).toLowerCase() === "md" && this.c.markdown) {
                            fs.readFile(newpath, "utf-8", function read(err, data) {
                                let stream = fs.createWriteStream(`${__dirname}/../uploads/${fileName}.html`)
                                stream.once("open", fd => {
                                    ejs.renderFile(`${__dirname}/../views/md.ejs`, {
                                        ogDesc: data.match(/.{1,297}/g)[0],
                                        mdRender: md.render(data)
                                    }, {}, (err, str) => {
                                        stream.write(str)
                                    })
                                    stream.end()
                                    fs.unlink(newpath, err => {
                                        if (err) return this.log.error(err)
                                    });
                                })
                            })
                        }
                        if (this.monitorChannel !== null) this.bot.createMessage(this.monitorChannel, `\`\`\`MARKDOWN\n[NEW UPLOAD][USER]\n[SIZE](${Math.round(files.fdata.size/1024)}KB)\n[TYPE](${files.fdata.type})\n[IP](${userIP})\n\`\`\`\nhttp://${req.headers.host}/${fileName}`)
                        if (err) return res.write(err)
                        this.log.verbose(`New File Upload: http://${req.headers.host}/${fileName} | IP: ${userIP}`)
                        let insecure = `http://${req.headers.host}/${fileName}`
                        let secure = `https://${req.headers.host}/${fileName}`
                        res.write(req.secure ? secure : insecure)
                        return res.end()
                    })
                }
            }
        }
    })
} 
module.exports = files