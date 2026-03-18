import nodemailer from 'nodemailer'

/**
 * Crea un transporter Nodemailer.
 * - Si SMTP_HOST está definido → usa SMTP real
 * - Si no → usa ethereal (modo dev, muestra enlace en consola)
 */
async function createTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  // Modo desarrollo: cuenta Ethereal temporal (mensajes visibles en ethereal.email)
  const testAccount = await nodemailer.createTestAccount()
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  })
}

export interface SendEmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

/**
 * Envía un correo electrónico.
 */
export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  const from = process.env.SMTP_FROM || 'noreply@mesatecnica.cavecom-e.org'
  const transporter = await createTransporter()

  const info = await transporter.sendMail({
    from: `"Mesa Técnica de Criptoactivos" <${from}>`,
    to,
    subject,
    text,
    html,
  })

  // En modo dev (Ethereal), mostrar el enlace para ver el email
  if (!process.env.SMTP_HOST) {
    console.log(`\n╔════════════════════════════════════════╗`)
    console.log(`║  Email enviado a: ${to}`)
    console.log(`║  Asunto: ${subject}`)
    console.log(`║  Ver email: ${nodemailer.getTestMessageUrl(info)}`)
    console.log(`╚════════════════════════════════════════╝\n`)
  }

  return info
}
