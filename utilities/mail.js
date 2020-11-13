const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.email_host,
  port: process.env.email_port,
  service: process.env.email_service,
  secure: process.env.email_secure,
  auth: {
    user: process.env.email_id,
    pass: process.env.email_pass
  }
});

const sendMail = async function (data, type) {
  let template;
  const mailOptions = {
    from: process.env.email_from,
    to: data.to.join(),
    subject: data.subject || '',
    text: data.text || ''
  };

  if (template) {
    mailOptions.html = template;
  }

  const mail = await transporter.sendMail(mailOptions);
  return mail;
};

module.exports = {
  sendMail
};
