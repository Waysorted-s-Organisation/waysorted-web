export default function CreditsAndUsage() {
  return (
    <>
      {/* Article headings included so TOC can map them */}
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Overview</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Waysorted uses credits to unlock premium features and plugins. Credits simplify billing by consolidating costs into a single balance.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">How credits work</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Balance</span>: View current credits in settings or the header.</li>
        <li><span className="text-secondary-db-100">Spend</span>: Deduct credits when you activate premium tools.</li>
        <li><span className="text-secondary-db-100">Top up</span>: Purchase packs or earn credits through rewards.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Earning Credits</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Earn credits by contributing to the community—submit plugins, refer users, or participate in events. Rewards stack up over time.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Ways to earn</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Referrals</span>: Get credits when someone joins via your link.</li>
        <li><span className="text-secondary-db-100">Plugin submissions</span>: Earn bonuses for approved plugins.</li>
        <li><span className="text-secondary-db-100">Events</span>: Participate in challenges and promotions.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Using Credits</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Spend credits on premium plugins, extended features, and priority support. Each transaction shows cost before confirmation.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Spending tips</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Preview cost</span>: Check the credit price before enabling a feature.</li>
        <li><span className="text-secondary-db-100">Bundles</span>: Some bundles offer discounted rates.</li>
        <li><span className="text-secondary-db-100">History</span>: Review transaction logs in billing settings.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Managing Credits</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Track balance, set alerts, and control who can spend credits in your workspace. Admins can allocate budgets to teams.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Admin controls</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Budgets</span>: Assign credit limits per team or project.</li>
        <li><span className="text-secondary-db-100">Alerts</span>: Get notified when balances drop below threshold.</li>
        <li><span className="text-secondary-db-100">Audit</span>: Review spend logs and export reports.</li>
      </ul>
    </>
  );
}
