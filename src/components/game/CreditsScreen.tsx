import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { sendContactMessage } from "@/lib/contact.functions";

type Status = "idle" | "sending" | "sent" | "error";

export function CreditsScreen({ onBack }: { onBack: () => void }) {
  const send = useServerFn(sendContactMessage);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Please enter your name.");
    if (!emailValid) return setError("Please enter a valid email address.");
    if (!message.trim()) return setError("Please enter a message.");

    setStatus("sending");
    try {
      const result = await send({
        data: { name: name.trim(), email: email.trim(), message: message.trim() },
      });
      if (result.ok) {
        setStatus("sent");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("error");
        setError(result.error);
      }
    } catch {
      setStatus("error");
      setError("We couldn't send your message. Please try again later.");
    }
  }

  return (
    <div className="absolute inset-0 z-[80] overflow-y-auto bg-background px-4 pb-10 pt-4">
      <button
        onClick={onBack}
        className="chunky chunky-press rounded-xl bg-secondary px-3 py-2 font-display text-sm font-black uppercase text-secondary-foreground"
      >
        ← Back
      </button>

      <h1 className="mt-4 text-center font-display text-4xl font-black uppercase text-foreground">
        Shift Fight!
      </h1>

      <section className="mt-4 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-xl font-black uppercase text-foreground">Created by</h2>
        <ul className="mt-2 space-y-1 text-base font-bold text-muted-foreground">
          <li>Ivan Buckingham</li>
          <li>Bob</li>
        </ul>
      </section>

      <section className="mt-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-xl font-black uppercase text-foreground">Music Credits</h2>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          Original music for <span className="font-black">Shift Fight!</span> created by Ivan
          Buckingham using Mureka (AI music generation), 12 September 2026.
        </p>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          Mureka is developed and operated by SKYWORK AI PTE. LTD. All ownership, title, interest and
          intellectual property rights in the music belong to Ivan Buckingham under a Mureka
          commercial ownership certificate.
        </p>
      </section>

      <section className="mt-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-xl font-black uppercase text-foreground">Contact</h2>
        {status === "sent" ? (
          <div className="mt-3">
            <p className="font-display text-base font-black uppercase text-calm-foreground">
              Message sent! Thanks for getting in touch.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="chunky chunky-press mt-3 rounded-xl bg-secondary px-3 py-2 font-display text-sm font-black uppercase text-secondary-foreground"
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-3" noValidate>
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="w-full rounded-xl border border-input bg-background px-3 py-3 text-base text-foreground"
                placeholder="Your name"
              />
            </Field>
            <Field label="Email">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                maxLength={255}
                className="w-full rounded-xl border border-input bg-background px-3 py-3 text-base text-foreground"
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Message">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={5}
                className="w-full rounded-xl border border-input bg-background px-3 py-3 text-base text-foreground"
                placeholder="What's on your mind?"
              />
            </Field>
            {error && (
              <p className="font-display text-sm font-black uppercase text-destructive">{error}</p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="chunky chunky-press w-full rounded-2xl bg-primary py-4 font-display text-lg font-black uppercase text-primary-foreground disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-display text-sm font-black uppercase text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
