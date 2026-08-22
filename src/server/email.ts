import tls from "node:tls";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const RESEND_DEFAULT_FROM = "onboarding@resend.dev";

type ContactEmailPayload = {
  from?: string;
  recipient: string;
  name: string;
  email: string;
  organization?: string;
  phone?: string;
  subject?: string;
  message: string;
};

type EmailProvider = "resend" | "gmail";
type EmailProviderMode = EmailProvider | "auto";

function formatHtml(payload: ContactEmailPayload) {
  const details = [
    `<p><strong>Nombre:</strong> ${payload.name}</p>`,
    `<p><strong>Email:</strong> ${payload.email}</p>`,
  ];

  if (payload.organization) {
    details.push(`<p><strong>Organización:</strong> ${payload.organization}</p>`);
  }

  if (payload.phone) {
    details.push(`<p><strong>Teléfono:</strong> ${payload.phone}</p>`);
  }

  const message = `<p><strong>Mensaje:</strong></p><p>${payload.message.replace(/\n/g, "<br/>")}</p>`;

  return `${details.join("")}${message}`;
}

function formatText(payload: ContactEmailPayload) {
  const parts = [
    `Nombre: ${payload.name}`,
    `Email: ${payload.email}`,
  ];

  if (payload.organization) {
    parts.push(`Organización: ${payload.organization}`);
  }

  if (payload.phone) {
    parts.push(`Teléfono: ${payload.phone}`);
  }

  parts.push("Mensaje:");
  parts.push(payload.message);

  return parts.join("\n");
}

function resolveProvider(): EmailProvider {
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasGmail = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  const configuredProvider = (process.env.EMAIL_PROVIDER || "auto").trim().toLowerCase() as EmailProviderMode;

  if (!["auto", "resend", "gmail"].includes(configuredProvider)) {
    throw new Error('Invalid EMAIL_PROVIDER value. Use "auto", "resend", or "gmail".');
  }

  if (configuredProvider === "resend") {
    if (!hasResend) {
      throw new Error('EMAIL_PROVIDER is "resend" but RESEND_API_KEY is missing.');
    }

    return "resend";
  }

  if (configuredProvider === "gmail") {
    if (!hasGmail) {
      throw new Error('EMAIL_PROVIDER is "gmail" but GMAIL_USER/GMAIL_APP_PASSWORD are missing.');
    }

    return "gmail";
  }

  if (hasResend) {
    return "resend";
  }

  if (hasGmail) {
    return "gmail";
  }

  throw new Error(
    "Email provider not configured (RESEND_API_KEY or GMAIL_USER/GMAIL_APP_PASSWORD)",
  );
}


async function sendViaResend(payload: ContactEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM || RESEND_DEFAULT_FROM;

  if (!apiKey) {
    throw new Error("Resend provider not configured (RESEND_API_KEY missing)");
  }


  const subject = payload.subject?.trim()
    ? payload.subject.trim()
    : `Nuevo mensaje de ${payload.name}`;

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.recipient,
      reply_to: payload.email,
      subject,
      html: formatHtml(payload),
      text: formatText(payload),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend request failed: ${response.status} ${body}`);
  }
}

async function readSmtpResponse(socket: tls.TLSSocket) {
  return new Promise<string>((resolve, reject) => {
    let buffer = "";

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");

      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const lastLine = lines[lines.length - 1];

      if (!lastLine) return;

      const match = lastLine.match(/^(\d{3})([ -])/);

      if (!match) return;
      if (match[2] === "-") return; // multi-line, wait for final line

      socket.off("data", onData);
      socket.off("error", onError);

      const code = Number(match[1]);
      if (code >= 400) {
        reject(new Error(`SMTP error ${code}: ${buffer.trim()}`));
      } else {
        resolve(buffer);
      }
    };

    const onError = (error: Error) => {
      socket.off("data", onData);
      reject(error);
    };

    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function smtpCommand(socket: tls.TLSSocket, command: string) {
  socket.write(`${command}\r\n`);
  return readSmtpResponse(socket);
}


function toFriendlyGmailError(error: unknown) {
  if (!(error instanceof Error)) {
    return new Error("Failed to send message via Gmail SMTP");
  }

  const message = error.message;

  if (message.includes("SMTP error 534") || message.includes("Application-specific password required")) {
    return new Error(
      "Gmail rechazó el inicio de sesión: necesitas un App Password de Google (16 caracteres). "
      + "Activa 2-Step Verification, genera una nueva contraseña de aplicación y colócala en GMAIL_APP_PASSWORD.",
    );
  }

  if (message.includes("SMTP error 535") || message.includes("Authentication failed")) {
    return new Error(
      "Gmail rechazó las credenciales SMTP. Verifica GMAIL_USER, regenera GMAIL_APP_PASSWORD y elimina espacios extra.",
    );
  }

  return error;
}

async function sendViaGmail(payload: ContactEmailPayload) {
  const user = process.env.GMAIL_USER;
  const password = process.env.GMAIL_APP_PASSWORD;
  const host = process.env.GMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.GMAIL_PORT || 465);
  const from = process.env.CONTACT_FROM || user;

  if (!user || !password || !from) {
    throw new Error(
      "Gmail provider not configured (GMAIL_USER/GMAIL_APP_PASSWORD/CONTACT_FROM)",
    );
  }

  const subject = payload.subject?.trim()
    ? payload.subject.trim()
    : `Nuevo mensaje de ${payload.name}`;

  const socket = tls.connect({ host, port, rejectUnauthorized: true });

  try {
    await new Promise<void>((resolve, reject) => {
      if (socket.readyState === "open") return resolve();
      socket.once("secureConnect", () => resolve());
      socket.once("error", reject);
    });

    await readSmtpResponse(socket); // initial 220 greeting
    await smtpCommand(socket, "EHLO localhost");
    await smtpCommand(socket, "AUTH LOGIN");
    await smtpCommand(socket, Buffer.from(user).toString("base64"));
    await smtpCommand(socket, Buffer.from(password).toString("base64"));
    await smtpCommand(socket, `MAIL FROM:<${from}>`);
    await smtpCommand(socket, `RCPT TO:<${payload.recipient}>`);
    await smtpCommand(socket, "DATA");

    const boundary = `----=_Part_${Date.now()}`;
    const headers = [
      `From: "${payload.name}" <${from}>`,
      `To: ${payload.recipient}`,
      `Reply-To: ${payload.email}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ].join("\r\n");

    const body = [
      `--${boundary}`,
      "Content-Type: text/plain; charset=\"UTF-8\"",
      "",
      formatText(payload),
      `--${boundary}`,
      "Content-Type: text/html; charset=\"UTF-8\"",
      "",
      formatHtml(payload),
      `--${boundary}--`,
      "",
    ].join("\r\n");

    socket.write(`${headers}\r\n\r\n${body}\r\n.\r\n`);
    await readSmtpResponse(socket);
    await smtpCommand(socket, "QUIT");
  } catch (error) {
    throw toFriendlyGmailError(error);
  } finally {
    socket.end();
  }
}

export async function sendContactEmail(payload: ContactEmailPayload) {
  const provider = resolveProvider();

  if (provider === "resend") {
    return sendViaResend(payload);
  }

  return sendViaGmail(payload);
}
