export default function Loading() {
  return (
    <div className="flex h-screen w-3xl items-center justify-center">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"
        aria-label="Loading"
      />
    </div>
  );
}
