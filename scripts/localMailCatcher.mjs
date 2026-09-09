// Minimal SMTP sink for local development. PocketBase ships with SMTP disabled
// and falls back to the system sendmail, which silently drops mail on a dev
// machine, so `npm run dev` points PocketBase here instead. Messages are never
// delivered anywhere; the login code is printed to the terminal.

import { createServer } from "node:net";

export const LOCAL_SMTP_HOST = "127.0.0.1";
export const LOCAL_SMTP_PORT = 1025;

function decodeQuotedPrintable(text) {
  return text
    .replaceAll(/=\n/g, "")
    .replaceAll(/=([\dA-Fa-f]{2})/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)));
}

function header(message, name) {
  const match = new RegExp(`^${name}:\\s*(.+)$`, "im").exec(message);
  return match?.[1]?.trim() ?? "";
}

// PocketBase sends multipart mail whose text/plain alternative already reads
// well, so show that rather than unpicking the HTML.
function plainText(message) {
  const part = message.search(/^Content-Type:\s*text\/plain/im);
  if (part === -1) return "";
  const start = message.indexOf("\n\n", part);
  if (start === -1) return "";
  const rest = message.slice(start + 2);
  const end = rest.search(/^--/m);
  return decodeQuotedPrintable(end === -1 ? rest : rest.slice(0, end)).trim();
}

function summarize(message) {
  const body = plainText(message);
  console.log(`\n📧 ${header(message, "To")} — ${header(message, "Subject")}`);
  for (const line of body.split("\n")) {
    if (line.trim() !== "") console.log(`   ${line.trim()}`);
  }
  console.log("");
}

function handleConnection(socket) {
  let buffer = "";
  let message = "";
  let inData = false;

  socket.write("220 localhost local mail catcher\r\n");

  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");

    for (;;) {
      const end = buffer.indexOf("\r\n");
      if (end === -1) return;
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);

      if (inData) {
        if (line === ".") {
          inData = false;
          summarize(message);
          message = "";
          socket.write("250 2.0.0 Ok: queued\r\n");
        } else {
          // Undo dot-stuffing.
          message += `${line.startsWith("..") ? line.slice(1) : line}\n`;
        }
        continue;
      }

      const command = line.slice(0, 4).toUpperCase();
      if (command === "EHLO") {
        // Advertise nothing: no STARTTLS and no AUTH keeps the client plaintext.
        socket.write("250 localhost\r\n");
      } else if (command === "HELO" || command === "MAIL" || command === "RCPT") {
        socket.write("250 2.0.0 Ok\r\n");
      } else if (command === "DATA") {
        inData = true;
        socket.write("354 End data with <CR><LF>.<CR><LF>\r\n");
      } else if (command === "RSET" || command === "NOOP") {
        socket.write("250 2.0.0 Ok\r\n");
      } else if (command === "QUIT") {
        socket.write("221 2.0.0 Bye\r\n");
        socket.end();
      } else {
        socket.write("502 5.5.1 Command not implemented\r\n");
      }
    }
  });

  socket.on("error", () => socket.destroy());
}

export async function startLocalMailCatcher() {
  const server = createServer(handleConnection);

  let listening = false;
  await new Promise((resolve, reject) => {
    server.on("error", (error) => {
      // Something else is already catching mail on this port; leave it to it.
      if (listening || error.code === "EADDRINUSE") {
        console.error(`Local mail catcher: ${error.message}`);
        resolve();
      } else {
        reject(error);
      }
    });
    server.listen(LOCAL_SMTP_PORT, LOCAL_SMTP_HOST, () => {
      listening = true;
      resolve();
    });
  });

  return {
    stop() {
      server.close();
    },
  };
}
