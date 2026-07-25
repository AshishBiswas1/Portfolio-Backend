const nodemailer = require('nodemailer');
const pug = require('pug');
const path = require('path');
const { htmlToText } = require('html-to-text');

const sendEmail = async (options) => {
  let transporter;

  // Use configured email service if credentials exist
  if (process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD) {
    if (process.env.EMAIL_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
  } else {
    // Ethereal / Dev test account fallback when credentials are not in .env yet
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  // Template directory is 'view/email' (singular view)
  const templatePath = path.join(
    __dirname,
    `../view/email/${options.template}.pug`
  );

  let html;
  try {
    html = pug.renderFile(templatePath, {
      subject: options.subject,
      ...options.data
    });
  } catch (err) {
    // Fallback HTML if pug render fails
    const link = options.data?.resetURL || '#';
    html = `<p>Hello ${options.data?.firstName || 'Admin'},</p><p>Reset your password using this link: <a href="${link}">${link}</a></p>`;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `Portfolio Admin <${process.env.EMAIL_USERNAME || 'admin@ashishbiswas.dev'}>`,
    to: options.to || options.email,
    subject: options.subject,
    html,
    text: htmlToText ? htmlToText(html) : html.replace(/<[^>]*>?/gm, ''),
    replyTo: options.replyTo || undefined
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email Dispatched] Subject: "${options.subject}" to ${options.email || options.to}`);
  if (nodemailer.getTestMessageUrl && info) {
    console.log(`[Email Test Preview URL]: ${nodemailer.getTestMessageUrl(info)}`);
  }
};

module.exports = sendEmail;
