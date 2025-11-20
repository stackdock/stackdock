'use client';

import { useState } from 'react';

/**
 * Netlify Contact Form Component
 * 
 * This component demonstrates Netlify Forms integration.
 * Netlify automatically detects forms with the data-netlify="true" attribute.
 * 
 * @see https://docs.netlify.com/forms/setup/
 */

export function NetlifyContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData as any).toString(),
      });

      if (response.ok) {
        setSubmitted(true);
        form.reset();
      } else {
        alert('There was an error submitting the form. Please try again.');
      }
    } catch (error) {
      alert('There was an error submitting the form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <h3 className="text-lg font-semibold text-green-900">Thank you!</h3>
        <p className="mt-2 text-green-800">
          Your message has been received. We&apos;ll get back to you soon.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm text-green-600 hover:text-green-700 underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      name="contact"
      method="POST"
      data-netlify="true"
      netlify-honeypot="bot-field"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Hidden fields for Netlify Forms */}
      <input type="hidden" name="form-name" value="contact" />
      
      {/* Honeypot field for spam protection */}
      <div className="hidden">
        <label>
          Don&apos;t fill this out: <input name="bot-field" />
        </label>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
          Subject
        </label>
        <input
          type="text"
          name="subject"
          id="subject"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message
        </label>
        <textarea
          name="message"
          id="message"
          rows={5}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </form>
  );
}
