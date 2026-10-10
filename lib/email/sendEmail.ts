// Server-side I/O: sends the hotel email via the Resend API, or logs it when Resend is not configured.
// Used by app/api/plan/route.ts. Never throws: a failed email must not fail the saved plan.
// The email after rendering: what goes over the wire (the model before rendering is HotelEmail).
export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
  attendeesCsv: string | null;
};

const RESEND_URL = "https://api.resend.com/emails";

// Without a verified domain, Resend only sends from onboarding@resend.dev and only to the
// account owner's address. That is fine for the demo: the owner's inbox is the hotel inbox.
const FROM_ADDRESS = "Event planning <onboarding@resend.dev>";

// Excel reads a UTF-8 file as ANSI unless it starts with a BOM, which garbles accented names.
const UTF8_BOM = "\uFEFF";

export async function sendEmail(message: RenderedEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.HOTEL_NOTIFY_EMAIL;

  if (!apiKey || !notifyEmail) {
    logEmail(message, notifyEmail);
    return;
  }

  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildResendBody(message, notifyEmail)),
    });

    // Log only the status: the key and the email body must never reach the server log.
    if (!response.ok) {
      console.error(`Hotel email: Resend answered with status ${response.status}`);
    }
  } catch (error) {
    console.error("Hotel email: network error while calling Resend", error instanceof Error ? error.name : "");
  }
}

function buildResendBody(message: RenderedEmail, notifyEmail: string) {
  return {
    from: FROM_ADDRESS,
    to: [notifyEmail],
    subject: message.subject,
    html: message.html,
    text: message.text,
    ...(message.attendeesCsv === null
      ? {}
      : {
          attachments: [
            {
              filename: "attendees.csv",
              content: Buffer.from(UTF8_BOM + message.attendeesCsv, "utf8").toString("base64"),
            },
          ],
        }),
  };
}

// Local development without Resend: the same content goes to the terminal instead.
function logEmail(message: RenderedEmail, notifyEmail: string | undefined): void {
  console.log("Hotel email (Resend not configured, not sent)");
  console.log(`To: ${notifyEmail || "(HOTEL_NOTIFY_EMAIL not set)"}`);
  console.log(`Subject: ${message.subject}`);
  console.log(`Attachment: ${message.attendeesCsv === null ? "none" : "attendees.csv"}`);
  console.log(message.text);
}
