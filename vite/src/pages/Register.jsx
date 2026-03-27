import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getAuthConfig } from "../utils/sessions";

function Register() {
  const [formdata, setFormData] = useState({
    FirstName: "",
    MiddleName: "",
    LastName: "",
    Email: "",
    UserName: "",
    Password: "",
    Role: "student",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Restrict numbers for name fields
    if (["FirstName", "MiddleName", "LastName"].includes(name)) {
      value = value.replace(/[0-9]/g, "");
    }

    setFormData({ ...formdata, [name]: value });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const isPasswordValid = (password) =>
    /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (!isPasswordValid(formdata.Password)) {
      alert(
        "Password must be at least 8 characters and include both letters and numbers."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "/api/users/adduser",
        { ...formdata },
        getAuthConfig()
      );

      if (response.status === 201 || response.status === 200) {
        alert("Registration successful!");
        setFormData({
          FirstName: "",
          MiddleName: "",
          LastName: "",
          Email: "",
          UserName: "",
          Password: "",
          Role: "student",
        });
      }
    } catch (error) {
      console.log("Error response:", error.response?.status, error.response?.data);
      
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData?.error || "An error occurred while registering.";
      
      // Handle duplicate email or username
      if (errorMessage.toLowerCase().includes('email')) {
        setErrors({ Email: 'This email is already in use. Please use a different email.' });
      } else if (errorMessage.toLowerCase().includes('username')) {
        setErrors({ UserName: 'This username is already in use. Please choose a different username.' });
      } else {
        setErrors({ submit: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md border border-slate-300">
        <h1 className="text-3xl font-semibold text-slate-800 text-center mb-6">
          Create an Account
        </h1>

        {errors.submit && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-slate-700 font-medium mb-2">
              Role
            </label>
            <select
              name="Role"
              value={formdata.Role}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            <span className="text-xs text-slate-500">Choose account type.</span>
          </div>

          <div className="mb-4">
            <label className="block text-slate-700 font-medium mb-2">
              First Name
            </label>
            <input
              name="FirstName"
              value={formdata.FirstName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-md"
              placeholder="First Name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-slate-700 font-medium mb-2">
              Middle Name
            </label>
            <input
              name="MiddleName"
              value={formdata.MiddleName}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Middle Name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-slate-700 font-medium mb-2">
              Last Name
            </label>
            <input
              name="LastName"
              value={formdata.LastName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Last Name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-slate-700 font-medium mb-2">
              Email
            </label>
            <input
              name="Email"
              type="email"
              value={formdata.Email}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 border rounded-md ${
                errors.Email ? 'border-red-500' : ''
              }`}
              placeholder="Email"
            />
            {errors.Email && <p className="text-red-500 text-sm mt-1">{errors.Email}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-slate-700 font-medium mb-2">
              Username
            </label>
            <input
              name="UserName"
              value={formdata.UserName}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 border rounded-md ${
                errors.UserName ? 'border-red-500' : ''
              }`}
              placeholder="Username"
            />
            {errors.UserName && <p className="text-red-500 text-sm mt-1">{errors.UserName}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-slate-700 font-medium mb-2">
              Password
            </label>
            <input
              name="Password"
              type="password"
              value={formdata.Password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Password"
            />
            <span className="text-xs text-slate-500">
              Password must be at least 8 characters and include both letters
              and numbers. Symbols are allowed.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md disabled:bg-blue-400"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Register;
