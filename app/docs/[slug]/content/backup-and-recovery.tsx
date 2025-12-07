export default function BackupAndRecovery() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Backup and Recovery</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Waysorted provides robust backup and recovery options to protect your data, settings, and creative work. Learn how to safeguard and restore your information.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Automatic Backups</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Daily Backups</span>: Your account data is automatically backed up daily to secure cloud storage.</li>
        <li><span className="text-secondary-db-100">Version History</span>: Access previous versions of your saved palettes, settings, and configurations.</li>
        <li><span className="text-secondary-db-100">Redundancy</span>: Data is stored across multiple geographic locations for disaster recovery.</li>
        <li><span className="text-secondary-db-100">Encryption</span>: All backups are encrypted at rest and in transit.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Manual Backup Options</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Export Data</span>: Download your complete data archive from Settings &gt; Data &gt; Export.</li>
        <li><span className="text-secondary-db-100">Selective Export</span>: Export specific items like color palettes or settings individually.</li>
        <li><span className="text-secondary-db-100">Schedule Exports</span>: Set up automated exports to your cloud storage provider.</li>
        <li><span className="text-secondary-db-100">Format Options</span>: Export in JSON, CSV, or platform-specific formats.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Data Recovery</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        To restore from a backup, go to Settings &gt; Data &gt; Recovery. Select a backup point or upload an exported archive. Contact support for assistance with recovering data from more than 30 days ago.
      </p>
    </>
  );
}
