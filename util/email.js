const nodemailer = require('nodemailer');
const pug = require('pug');
const path = require('path');
const { htmlToText } = require('html-to-text');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const templatePath = path.join(
    __dirname,
    `../views/email/${options.template}.pug`
  );

  const html = pug.renderFile(templatePath, {
    subject: options.subject,
    ...options.data // Spread operator passes all custom variables right into Pug
  });

  const mailOptions = {
    from: `Portfolio Hub <${process.env.EMAIL_USERNAME}>`,
    to: options.to || options.email || process.env.EMAIL_USERNAME,
    subject: options.subject,
    html, // The rendered HTML content
    text: htmlToText(html), // Automatic plain-text fallback for email clients
    replyTo: options.replyTo || undefined
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
