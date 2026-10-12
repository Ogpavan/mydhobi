const DEFAULT_MSGCLUB_API_URL =
  "https://msg.icloudsms.com/rest/services/sendSMS/sendGroupSms";

export type OtpSmsPurpose = "login" | "password_reset";

export class SmsConfigurationError extends Error {
  constructor() {
    super("SMS service is not configured.");
    this.name = "SmsConfigurationError";
  }
}

export class SmsProviderError extends Error {
  constructor() {
    super("The SMS provider could not send the code.");
    this.name = "SmsProviderError";
  }
}

function getMessage(purpose: OtpSmsPurpose, code: string) {
  const configured =
    purpose === "login"
      ? process.env.MSGCLUB_LOGIN_OTP_MESSAGE
      : process.env.MSGCLUB_PASSWORD_RESET_MESSAGE;
  const template =
    configured ??
    (purpose === "login"
      ? "Your MyDhobi login OTP is {otp}. It is valid for {minutes} minutes. Do not share it."
      : "Your MyDhobi password reset OTP is {otp}. It is valid for {minutes} minutes. Do not share it.");

  return template.replaceAll("{otp}", code).replaceAll("{minutes}", "5");
}

function responseCode(body: unknown) {
  if (!body || typeof body !== "object" || !("responseCode" in body)) {
    return null;
  }

  const value = body.responseCode;
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : null;
}

export function buildMsgclubUrl(mobile: string, message: string): URL {
  const authKey = process.env.MSGCLUB_AUTH_KEY?.trim();
  if (!authKey) throw new SmsConfigurationError();

  const url = new URL(
    process.env.MSGCLUB_API_URL?.trim() || DEFAULT_MSGCLUB_API_URL,
  );
  url.searchParams.set("AUTH_KEY", authKey);
  url.searchParams.set("message", message);
  url.searchParams.set(
    "senderId",
    process.env.MSGCLUB_SENDER_ID?.trim() || "DEMOOS",
  );
  url.searchParams.set("routeId", process.env.MSGCLUB_ROUTE_ID?.trim() || "1");
  url.searchParams.set("mobileNos", mobile);
  url.searchParams.set(
    "smsContentType",
    process.env.MSGCLUB_SMS_CONTENT_TYPE?.trim() || "english",
  );

  const optionalParameters = [
    ["entityid", process.env.MSGCLUB_ENTITY_ID],
    ["tmid", process.env.MSGCLUB_TMID || "140200000022"],
    ["templateid", process.env.MSGCLUB_TEMPLATE_ID],
    ["concentFailoverId", process.env.MSGCLUB_CONCENT_FAILOVER_ID || "30"],
  ] as const;
  for (const [name, value] of optionalParameters) {
    const trimmed = value?.trim();
    if (trimmed) url.searchParams.set(name, trimmed);
  }

  return url;
}

export async function sendMsgclubSms({
  mobile,
  message,
}: {
  mobile: string;
  message: string;
}) {
  let response: Response;
  try {
    response = await fetch(buildMsgclubUrl(mobile, message), {
      method: "GET",
      headers: { Accept: "application/json, text/plain" },
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    if (error instanceof SmsConfigurationError) throw error;
    throw new SmsProviderError();
  }
  const rawBody = await response.text();
  let body: unknown = null;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    // MsgClub may return a plain text error. Do not expose it to the client.
  }

  if (!response.ok || responseCode(body) !== "3001") {
    throw new SmsProviderError();
  }
}

export async function sendOtpSms(
  mobile: string,
  code: string,
  purpose: OtpSmsPurpose,
) {
  await sendMsgclubSms({
    mobile,
    message: getMessage(purpose, code),
  });
}
