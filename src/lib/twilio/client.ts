/**
 * Twilio REST API client (no SDK dependency).
 *
 * Wraps the Messages.json endpoint for SMS + WhatsApp. We use fetch +
 * basic auth instead of the official `twilio` npm package to avoid
 * adding ~3MB of dependencies for two HTTP calls.
 *
 * Twilio docs: https://www.twilio.com/docs/sms/api/message-resource#create-a-message
 */

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "twilio" });
const TWILIO_BASE = "https://api.twilio.com/2010-04-01";

export type TwilioChannel = "sms" | "whatsapp";

export type TwilioSendInput = {
  channel: TwilioChannel;
  /** Recipient in E.164 (e.g. "+34611223344"). The "whatsapp:" prefix is added automatically for WhatsApp. */
  to: string;
  body: string;
  /** Optional override of the From number. Defaults to TWILIO_FROM_SMS / TWILIO_FROM_WHATSAPP. */
  from?: string;
};

export type TwilioSendResult =
  | {
      ok: true;
      sid: string;
      status: string;       // queued|sending|sent|delivered (depends on Twilio's response timing)
      from: string;
      to: string;
    }
  | {
      ok: false;
      error: string;
      code?: string;
    };

export function isTwilioConfigured(): boolean {
  return !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN);
}

/**
 * Send an SMS or WhatsApp message via the Twilio REST API.
 * Never throws — returns a result object for the caller to inspect.
 */
export async function twilioSendMessage(input: TwilioSendInput): Promise<TwilioSendResult> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    return { ok: false, error: "Twilio no configurado (faltan TWILIO_ACCOUNT_SID/TOKEN)" };
  }

  const fromConfigured =
    input.channel === "whatsapp" ? env.TWILIO_FROM_WHATSAPP : env.TWILIO_FROM_SMS;
  const from = input.from ?? fromConfigured;
  if (!from) {
    return {
      ok: false,
      error: `Twilio FROM no configurado para canal ${input.channel}`,
    };
  }

  const to = input.channel === "whatsapp" && !input.to.startsWith("whatsapp:")
    ? `whatsapp:${input.to}`
    : input.to;

  const url = `${TWILIO_BASE}/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(
    `${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`,
  ).toString("base64");

  const form = new URLSearchParams();
  form.set("From", from);
  form.set("To", to);
  form.set("Body", input.body);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      log.warn(
        { status: res.status, errorBody, to, channel: input.channel },
        "Twilio send failed",
      );
      return {
        ok: false,
        error: `Twilio HTTP ${res.status}: ${errorBody.slice(0, 200)}`,
        code: String(res.status),
      };
    }

    const data = (await res.json()) as {
      sid: string;
      status: string;
      from: string;
      to: string;
      error_code?: number | null;
      error_message?: string | null;
    };

    if (data.error_code) {
      return {
        ok: false,
        error: data.error_message ?? "Twilio reportó un error",
        code: String(data.error_code),
      };
    }

    return {
      ok: true,
      sid: data.sid,
      status: data.status,
      from: data.from,
      to: data.to,
    };
  } catch (err) {
    log.error({ err }, "Twilio send threw");
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown Twilio error",
    };
  }
}
