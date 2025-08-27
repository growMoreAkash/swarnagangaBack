import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: "emil29@ethereal.email",
    pass: " gRUgZaFYfBpEGqCe4c ",
  },
});

export {transporter}