const nodemailer = require('nodemailer');
const path = require('path');

const db = require(path.resolve('./models'));
const { User } = db;

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
  let mailOptions;

  if (type === 'Post Created') {
    const user = await User.findByPk(data.user_id);
    mailOptions = {
      from: process.env.email_from,
      to: user.email,
      subject: 'Your post has been created successfully!',
      text: ''
    };

    template = `<p>Dear User,<br /><br /></p>
    <p>Your post has been successfully created.Following are your post details.<br /><br /><br /></p>
    <table style="height: 177px;" width="469">
    <tbody>
    <tr>
    <td style="width: 226px;">Message</td>
    <td style="width: 227px;">${data.message}</td>
    </tr>
    <tr>
    <td style="width: 226px;">Image</td>
    <td style="width: 227px;">${data.image_url}</td>
    </tr>
    <tr>
    <td style="width: 226px;">Schedule Date</td>
    <td style="width: 227px;">${data.scheduled_date}</td>
    </tr>
    </tbody>
    </table>`;
  }

  if (template) {
    mailOptions.html = template;
  }

  const mail = await transporter.sendMail(mailOptions);
  return mail;
};

module.exports = {
  sendMail
};
