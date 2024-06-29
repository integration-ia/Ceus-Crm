import nodemailer from "nodemailer";
import { env } from "~/env";

const transporter =
  env.NODE_ENV === "production"
    ? nodemailer.createTransport({
        host: "smtp-relay.sendinblue.com",
        port: 587,
        auth: {
          user: env.BREVO_SMTP_USER,
          pass: env.BREVO_SMTP_KEY,
        },
      })
    : nodemailer.createTransport({
        port: 1025,
      });

export const sendEmail = async (
  recipientEmail: string,
  subject: string,
  html: string,
) => {
  try {
    console.info(`Sending e-mail to recipient with e-mail ${recipientEmail}`);

    const response = await transporter.sendMail({
      from: "notificacion@ceus.site",
      to: recipientEmail,
      subject,
      html,
    });

    console.info("E-mail sent successfully!", response);
  } catch (error) {
    console.error(
      `Could not send email to ${recipientEmail}. Error: ${(error as Error).message}`,
    );
  }
};
