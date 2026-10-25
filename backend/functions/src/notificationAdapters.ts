export async function sendExternalNotifications(
  input: {
    email?: string;
    phone?: string;
    name?: string;
    title: string;
    body: string;
  },
  config: {
    emailService?: string;
    emailTemplate?: string;
    emailPublicKey?: string;
    emailPrivateKey?: string;
    smsDevice?: string;
    smsApiKey?: string;
  },
  request: typeof fetch = fetch,
) {
  const results: Record<string, string> = {};
  if (
    config.emailService &&
    config.emailTemplate &&
    config.emailPublicKey &&
    config.emailPrivateKey &&
    input.email
  ) {
    try {
      const response = await request(
        "https://api.emailjs.com/api/v1.0/email/send",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            service_id: config.emailService,
            template_id: config.emailTemplate,
            user_id: config.emailPublicKey,
            accessToken: config.emailPrivateKey,
            template_params: {
              to_email: input.email,
              to_name: input.name || "Customer",
              subject: input.title,
              message: input.body,
            },
          }),
        },
      );
      results.email = response.ok ? "sent" : `failed:${response.status}`;
    } catch {
      results.email = "failed:network";
    }
  }
  if (
    config.smsDevice &&
    config.smsApiKey &&
    input.phone &&
    /^\d{10}$/.test(input.phone)
  ) {
    try {
      const response = await request(
        `https://api.textbee.dev/api/v1/gateway/devices/${encodeURIComponent(config.smsDevice)}/send-sms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": config.smsApiKey,
          },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            recipients: [`+91${input.phone}`],
            message: `${input.title}: ${input.body}`,
          }),
        },
      );
      results.sms = response.ok ? "sent" : `failed:${response.status}`;
    } catch {
      results.sms = "failed:network";
    }
  }
  return results;
}
