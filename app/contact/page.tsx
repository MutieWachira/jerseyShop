"use client";

import { useState } from "react";

export default function ContactPage() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log({
      name,
      email,
      message,
    });
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16">

        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Contact Us
        </h1>

        <p className="text-slate-600 mb-10">
          Have a question about an order, jersey size, or availability?
          Send us a message and our team will respond shortly.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="text-sm text-slate-600">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">Message</label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-6 py-3 text-white font-semibold hover:bg-slate-800"
          >
            Send Message
          </button>

        </form>

      </div>
    </main>
  );
}