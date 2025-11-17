import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout"; // 🔹 New import

import Register from "../Pages/Register.jsx";
import Profile from "../Pages/Profile.jsx";
import PrivacyPolicy from "../Pages/PrivacyPage.jsx";
import TermsOfService from "../Pages/Terms.jsx";
import PricingPage from "../Pages/Pricing.jsx";
import FeaturesPage from "../Pages/Features.jsx";
import BlogPage from "../Pages/BlogContainer.jsx";
import BlogDetails from "../Pages/BlogPage.jsx";
import InputQueryPage from "../Pages/InputQueryPage.jsx";
import AuthRedirect from "../Utils/AuthRedirect.jsx";
import ReviewPage from "../Pages/ReviewToolPage.jsx";
import SerpPage from "../Pages/SerpPage.jsx";
import SaplingPage from "../Pages/SaplingPage.jsx";
import RankingPage from "../Pages/RankingPage.jsx";
import ToolComingSoon from "../Pages/ToolComingSoon.jsx";
import Check from "../Pages/check.jsx";
import OauthCall from "../Pages/OauthCall.jsx";
import CitationBuilder from "../Pages/CitationBuilder.jsx";

import ContactPage from "../Pages/Contact.jsx";
import PlanPage from "../Pages/PlanPage.jsx";

const Home = lazy(() => import("../Pages/Home.jsx"));
const About = lazy(() => import("../Pages/About.jsx"));
const Login = lazy(() => import("../Pages/Login.jsx"));

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center h-screen"
          role="status"
        >
          <svg
            aria-hidden="true"
            className="w-16 h-16 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      }
    >
      <Routes>
        {/* 🔹 Public Layout with Navbar and Footer */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/Privacy" element={<PrivacyPolicy />} />
          <Route path="/Terms" element={<TermsOfService />} />
          <Route path="/Price" element={<PricingPage />} />
          <Route path="/Features" element={<FeaturesPage />} />
          <Route path="/Blog" element={<BlogPage />} />
          <Route path="/BlogPost/:id" element={<BlogDetails />} />
          <Route path="/ToolPage" element={<InputQueryPage />} />
          <Route path="/ReviewToolPage" element={<ReviewPage />} />
          <Route path="/SerpToolPage" element={<SerpPage />} />
          <Route path="/SaplingToolPage" element={<SaplingPage />} />
          <Route path="/RankingPage" element={<RankingPage />} />
          <Route path="/ToolComingSoon" element={<ToolComingSoon />} />
          <Route path="/check" element={<Check />} />
          <Route path="/OauthCall" element={<OauthCall />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/PlanPage" element={<PlanPage />} />
          <Route path="/CitationBuilder" element={<CitationBuilder />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <AuthRedirect>
                <Login />
              </AuthRedirect>
            }
          />
          <Route
            path="/register"
            element={
              <AuthRedirect>
                <Register />
              </AuthRedirect>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
