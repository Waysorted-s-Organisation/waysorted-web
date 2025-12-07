export default function Webhooks() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Webhooks</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Webhooks allow your application to receive real-time notifications when events occur in Waysorted. Instead of polling the API, webhooks push data to your server automatically.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Setting Up Webhooks</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Endpoint Configuration</span>: Register your webhook URL in Settings &gt; Developer &gt; Webhooks.</li>
        <li><span className="text-secondary-db-100">Event Selection</span>: Choose which events trigger webhook notifications.</li>
        <li><span className="text-secondary-db-100">Secret Key</span>: Generate a secret key to verify webhook signatures.</li>
        <li><span className="text-secondary-db-100">Testing</span>: Use the &quot;Test Webhook&quot; button to verify your endpoint is working.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Available Events</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">palette.created</span>: Triggered when a new color palette is saved.</li>
        <li><span className="text-secondary-db-100">palette.updated</span>: Fired when an existing palette is modified.</li>
        <li><span className="text-secondary-db-100">credits.earned</span>: Notification when the user earns credits.</li>
        <li><span className="text-secondary-db-100">sync.completed</span>: Sent when a Figma sync operation finishes.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Security and Verification</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Always verify webhook signatures using the provided secret key. Respond with a 200 status code within 30 seconds to acknowledge receipt. Failed deliveries are retried with exponential backoff for up to 24 hours.
      </p>
    </>
  );
}
