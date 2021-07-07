const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
// in SENDGRID_API_KEY, key is copied from sendgrid.com where we gave key as Task Manager App

// sgMail.send({
//     to: 'revathyganesh98@gmail.com',
//     from: 'revathyganesh98@gmail.com',
//     subject: 'This is my first creation!',
//     text: 'I hope this mail actually gets to you'
// })

// node src/emails/account.js execute and check the spam folder in email

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'revathyganesh98@gmail.com',
        subject: 'Thanks for signing in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'revathyganesh98@gmail.com',
        subject: 'Thanks for joining us till now!',
        text: `Goodbye, ${name}. I hope to see you back soon.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}