import nodemailer from "nodemailer";

export const sendEmail = async (to: string, subject: string, html: string) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "szyhafguxaa6cglq@ethereal.email",
      pass: "Rkr3fvbSUWbG3c25ua",
    },
  });
  let info = await transporter.sendMail({
    from: "yiming@chen.com", // sender address
    to,
    subject,
    html,
  });
  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};
