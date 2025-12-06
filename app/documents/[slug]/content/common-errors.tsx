export default function CommonErrors() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Common Errors</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Encountering issues? This guide covers the most common errors users experience with Waysorted and provides quick solutions to get you back on track.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Authentication Errors</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Session Expired</span>: Your login session has timed out. Simply log in again to continue.</li>
        <li><span className="text-secondary-db-100">Invalid Credentials</span>: Double-check your email and password. Use &quot;Forgot Password&quot; if needed.</li>
        <li><span className="text-secondary-db-100">Account Locked</span>: Too many failed login attempts. Wait 15 minutes or reset your password.</li>
        <li><span className="text-secondary-db-100">Figma Auth Failed</span>: Reconnect your Figma account in Settings &gt; Integrations.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Plugin Errors</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Plugin Not Loading</span>: Refresh Figma, check your internet connection, or reinstall the plugin.</li>
        <li><span className="text-secondary-db-100">Feature Unavailable</span>: Ensure you have sufficient credits or the required subscription level.</li>
        <li><span className="text-secondary-db-100">Sync Failed</span>: Check your network connection and try syncing again. Clear cache if the issue persists.</li>
        <li><span className="text-secondary-db-100">Export Error</span>: Verify your file permissions and ensure enough disk space is available.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Network Errors</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        If you see &quot;Connection Failed&quot; or &quot;Network Error&quot; messages, check your internet connection, disable VPNs temporarily, or try again later. Our status page at status.waysorted.com shows current service availability.
      </p>
    </>
  );
}
