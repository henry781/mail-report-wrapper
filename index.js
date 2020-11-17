#!/usr/bin/env node

const nodemailer = require('nodemailer');
const {spawn} = require('child_process');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: false,
    auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    } : undefined,
    proxy: process.env.SMTP_PROXY ? process.env.SMTP_PROXY : undefined
});

async function execCommand(command, args) {

    return new Promise((resolve, reject) => {

        const child = spawn(command, args, {
            cwd: process.cwd(),
            detached: true
        });

        const chunks = [];

        child.stdout.on('data', chunk => {
            chunks.push(chunk);
            process.stdout.write(chunk);
        });

        child.stderr.on('data', chunk => {
            chunks.push(chunk);
            process.stderr.write(chunk);
        });

        child.on('exit', (code) => {
            const output = Buffer.concat(chunks).toString('utf8');
            resolve({code, output});
        });
    });
}

async function sendReport(code, output) {

    const subject = process.env.MAIL_SUBJECT + ' (exit code ' + code + ')'

    let info = await transporter.sendMail({
        from: process.env.MAIL_SENDER,
        to: process.env.MAIL_RECEIVERS,
        subject: subject,
        html: "<pre>" + output + "</pre>",
    });

    console.log('Report sent with id', info.messageId);
}

(async () => {

    const command = process.argv[2];
    const args = process.argv.slice(3);

    const {code, output} = await execCommand(command, args);
    console.log('Command ended with exit code', code);

    console.log('Sending report...');
    await sendReport(code, output);

    process.exit(code);
})();
