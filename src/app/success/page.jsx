export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-blue-600 flex flex-col">
      {/* Logo positioned in the upper middle area */}
      <div className="flex-1 flex items-end justify-center pb-8 md:pb-12">
        <img
          className="w-32 h-auto md:w-40 lg:w-48"
          src="https://res.cloudinary.com/dvufcaqt1/image/upload/v1751023682/Mask_group_1_ihq7jo.svg"
          alt="Waysorted Logo"
        />
      </div>

      {/* Main content centered vertically */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center text-white space-y-4 md:space-y-6">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight hanken-font-bold">
            Logged in sucessfully
          </h2>
          <p className="text-base md:text-lg lg:text-xl font-medium opacity-90 hanken-font-regular max-w-md mx-auto">
            You may close this tab and return to Figma
          </p>
        </div>
      </div>

      <div className="flex-1"></div>
    </div>
  );
}
