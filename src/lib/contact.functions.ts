import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Where Shift Fight! contact messages are delivered. */
export const CONTACT_TO = "awhatbag@gmail.com";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactResult = { ok: true } | { ok: false; error: string };

/**
 * Sends a contact message by email.
 *
 * Provider is pluggable: today it uses Resend over plain HTTP when the
 * RESEND_API_KEY / CONTACT_FROM env vars are configured. Swap the block inside
 * `deliver` for another provider without touching the UI or validation.
 */
export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }): Promise<ContactResult> => {
    const apiKey = process.env["RESEND_API_KEY"];
    const from = process.env["CONTACT_FROM"];
    if (!apiKey || !from) {
      return {
        ok: false,
        error: "Email sending isn't set up yet, so your message wasn't sent.",
      };
    }

    const body = {
      from,
      to: [CONTACT_TO],
      reply_to: data.email,
      subject: `Shift Fight! contact message from ${data.name}`,
      text: [
        "New Shift Fight! contact message",
        "",
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        "",
        "Message:",
        data.message,
      ].join("\n"),
    };

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error("contact email failed", res.status, await res.text());
        return { ok: false, error: "We couldn't send your message. Please try again later." };
      }
      return { ok: true };
    } catch (error) {
      console.error("contact email error", error);
      return { ok: false, error: "We couldn't send your message. Please try again later." };
    }
  });
