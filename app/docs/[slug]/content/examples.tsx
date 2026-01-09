export default function Examples() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">API Examples</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Learn how to use the Waysorted API with practical examples covering common use cases and integration patterns.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Basic API Calls</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">GET User Profile</span>: Retrieve the authenticated user&apos;s profile information with GET /users/me.</li>
        <li><span className="text-secondary-db-100">List Palettes</span>: Fetch saved color palettes with GET /palettes?limit=10&amp;offset=0.</li>
        <li><span className="text-secondary-db-100">Create Palette</span>: Save a new palette with POST /palettes and a JSON body containing colors.</li>
        <li><span className="text-secondary-db-100">Delete Resource</span>: Remove items with DELETE /palettes/:id using the resource ID.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Common Integration Patterns</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Pagination</span>: Use limit and offset parameters for paginated endpoints.</li>
        <li><span className="text-secondary-db-100">Filtering</span>: Apply query parameters to filter results by date, type, or status.</li>
        <li><span className="text-secondary-db-100">Error Handling</span>: Parse error responses for status codes and error messages.</li>
        <li><span className="text-secondary-db-100">Batch Operations</span>: Use bulk endpoints for creating or updating multiple resources.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Code Snippets</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Visit our GitHub repository for complete code examples in JavaScript, Python, Ruby, and more. Each example includes error handling, authentication setup, and best practices for production use.
      </p>
    </>
  );
}
