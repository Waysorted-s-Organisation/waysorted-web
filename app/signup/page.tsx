"use client";
export default function Signup(){
    return (
    <div className="min-h-screen blue-bg-dots flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-md max-w-md flex flex-col justify-center items-center">
        <div className="flex flex-col justify-center items-center gap-2 px-8 pt-8 pb-4">
          <img src="/icons/success.svg" alt="" />
          <h1 className="text-xl font-semibold text-black">Create an account</h1>
          <h3 className="text-sm text-secondary-db-70">Lorem ipsum dolor sit amet.</h3>

          {/* Google Sign In */}
          <button
            className="bg-secondary-db-5 hover:bg-primary-way-100 text-secondary-db-100 hover:text-white w-sm py-2 flex items-center justify-center gap-2 rounded-lg cursor-pointer transition-all duration-200"
          >
            <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          {/* Email Placeholder */}
          <button className="bg-secondary-db-5 hover:bg-primary-way-100 text-secondary-db-100 hover:text-white w-sm py-2 rounded-lg cursor-pointer transition-all duration-200">
            Continue with Email
          </button>

          <p className="text-xs pt-2 text-center text-secondary-db-70">
            Creating an account means you agree to our&nbsp;
            <span className="text-primary-way-100 underline cursor-pointer">Terms</span> and&nbsp;
            <span className="text-primary-way-100 underline cursor-pointer">Privacy Policy</span>
          </p>
        </div>

        <div className="border-t border-secondary-db-5 w-full text-center py-4 text-base font-semibold">
          <p>
            Already have an account?&nbsp;
            <span className="text-primary-way-100 underline cursor-pointer">Login</span>
          </p>
        </div>
      </div>
    </div>
    )
}