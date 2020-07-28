const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'tjh8523@gmail.com',
    subject: 'Thanks for using task manager',
    text: `Welcome to the app, ${name}. Please let me know how you get along with this app.`,
  })
};

const sendCancellationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'tjh8523@gmail.com',
    subject: 'Why did you unregister your account?',
    text: `Thank you for using Task Manager, ${name} Please tell us why you cancel your account. We look forward to seeing you in the future.`,
    // html: '<h1>WHY DID U CANCEL?</h1>',
  });
};

module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail,
};
