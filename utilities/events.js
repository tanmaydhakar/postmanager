const { google } = require('googleapis');
const axios = require('axios');
const path = require('path');
const schedule = require('node-schedule');

const db = require(path.resolve('./models'));
const { Event, User } = db;
const mail = require(path.resolve('./utilities/mail'));
const { OAuth2 } = google.auth;

const oAuth2Client = new OAuth2(
  process.env.google_client_id,
  process.env.google_client_secret,
  `${process.env.hostname}/api/events/callback`
);
oAuth2Client.setCredentials({
  refresh_token: process.env.google_refresh_token
});

const generateOauthUrl = async function () {
  const events = await Event.findAll({ where: {}, raw: true });

  if (events.length) {
    await Event.destroy({ where: {} });
  }
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',

    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar'
    ]
  });
  console.log(`\n Visit this url to schedule event mails- \n\n ${url} \n`);
};

const scheduleEventMails = async function (eventData) {
  schedule.scheduleJob(
    new Date(eventData.start.date).getTime() - 24 * 3600 * 100 * 7,
    async function () {
      const emails = await User.findAll({ attributes: ['email'], raw: true });
      const emailsArray = [];
      for (let i = 0; i <= emails.length - 1; i += 1) {
        emailsArray.push(emails[i].email);
      }
      if (emailsArray.length) {
        eventData.emailsArray = emailsArray;
        await mail.sendMail(eventData, 'Event');
        await Event.updateStatus(eventData.id, 'Mailed');
      }
    }
  );
};

const getEvents = async function (oAuthCode) {
  oAuth2Client.getToken(oAuthCode, function (error, tokens) {
    if (error) {
      console.log(error, new Date());
    } else {
      axios
        .get(
          `https://www.googleapis.com/calendar/v3/calendars/en.indian%23holiday@group.v.calendar.google.com/events?access_token=${tokens.access_token}`
        )
        .then(async function (response) {
          const { data } = response;

          for (let i = 0; i <= data.items.length - 1; i += 1) {
            const eventObj = data.items[i];
            if (new Date(eventObj.start.date) >= new Date().getTime() + 24 * 3600 * 1000 * 7) {
              const event = new Event();
              event.name = eventObj.summary;
              event.start = new Date(eventObj.start.date);
              event.end = new Date(eventObj.end.date);
              await event.save();

              await scheduleEventMails(event);
            }
          }
          console.log('Events Scheduled');
        })
        .catch(err => {
          console.log(err.message, new Date());
        });
    }
  });
};

module.exports = {
  generateOauthUrl,
  getEvents
};
