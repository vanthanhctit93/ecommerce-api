const express = require('express');
const nexmo = require('nexmo');

const app = express()

app.use(
    express.urlencoded({
        extended: true
    }
))
app.use(express.json())
app.post('/sendsms', (req, res) => {
    let fromPhone = req.body.formPhone;
    let toPhone = req.body.toPhone;
    let content = req.body.content;
    
    sendSMS(fromPhone, toPhone, content, (result) => {
        console.log(result);
    })
})

// const nex = new nexmo({
//     apiKey: '2bf574a1',
//     apiSecret: '55sWsTNYDxhnEz2v'
// });

sendSMS = (fromPhone, toPhone, content, callback) => {
    nex.message.sendSms(fromPhone, toPhone, content, {
        type: 'unicode',
    }, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if (result.message[0]['status'] === '0') {
                callback('Message sent successfully !')
            } else {
                callback(`Message failed with error: ${result.message[0]['error-text']}`)
            }
        }
    })
}
