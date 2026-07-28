import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import axiosInstance from "../../../config/axios";
import { Toaster, toaster } from "../../../components/ui/toaster"
import { ClipLoader } from "react-spinners";
import { useAdminRouter } from "../../../routing";

const override = {
  display: "block",
  margin: "0 auto",
  borderColor: "white",
};

export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { navigate } = useAdminRouter();

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    
    try{
        if (validateForm()) {
      if(email && password){
        setLoading(true)
        const res = await axiosInstance.post("/admins/login", {
            email, password
        })
        setLoading(false)

        if(res?.data?.data?.token){
            window.localStorage.setItem("access_token",res?.data?.data?.token)
            window.localStorage.setItem("admin_profile", JSON.stringify(res?.data?.data?.admin || {}))
        }

                toaster.create({
  title: "Logged in successfully!",  
    type: 'success',
   closable: true,
       placement: "top-end",
})
      setTimeout(() => navigate("/home", { replace: true }), 500);
      }
    }
    }
    catch(error){
        setLoading(false)
        toaster.create({
  title: error?.response?.data?.message || error?.message,  
    type: 'error',
   closable: true,
       placement: "top-end",
})
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

    useEffect(() => {
    const token = window.localStorage.getItem("access_token");
    if (token) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
       <Toaster />

      {/* Custom Toast */}
        <div className="fixed top-4 right-4 z-50">
        </div>

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your admin account
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm`}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="pass" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="pass"
                  required
                  autoComplete="current-password"
                  className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                className="font-medium text-[#00D4AA] hover:text-teal-800 underline transition-colors duration-200 cursor-pointer"
                onClick={() => navigate("/reset-password")}
              >
                Reset Password
              </button>
            </div>
          </div>

          <div>
            <button
              disabled={loading}
              type="submit"
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#00D4AA] hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00D4AA] transition-colors duration-200 ${loading && 'opacity-[0.3]'}`}
            >
              {
                !loading?
              "Sign In"
                :
               <ClipLoader
        color={'white'}
        loading={true}
        size={25}
      />
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
