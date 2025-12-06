export default function RatingsAndReviews() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Ratings and Reviews</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        The ratings and reviews system helps the community discover quality plugins while providing valuable feedback to creators. Learn how to make the most of this feature.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Rating Plugins</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Star Ratings</span>: Rate plugins from 1 to 5 stars based on your experience with functionality, ease of use, and value.</li>
        <li><span className="text-secondary-db-100">Rating Criteria</span>: Consider performance, user interface, documentation, and support when rating.</li>
        <li><span className="text-secondary-db-100">Update Your Rating</span>: Modify your rating anytime as the plugin evolves with updates.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Writing Reviews</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Be Constructive</span>: Share specific experiences, both positive and areas for improvement.</li>
        <li><span className="text-secondary-db-100">Include Use Cases</span>: Describe how you use the plugin to help others understand its applications.</li>
        <li><span className="text-secondary-db-100">Stay Respectful</span>: Maintain professional and helpful language in all reviews.</li>
        <li><span className="text-secondary-db-100">Report Issues</span>: Use the bug reporting feature for technical issues rather than leaving negative reviews.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Community Guidelines</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Reviews that violate community guidelines may be removed. This includes spam, promotional content, offensive language, or fake reviews. Help us maintain a trustworthy marketplace by flagging inappropriate content.
      </p>
    </>
  );
}
