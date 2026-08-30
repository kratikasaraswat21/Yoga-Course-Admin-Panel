import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const DEFAULT_METADATA = {
  title: "Admin Dashboard | Kratika Yoga",
  description: "Manage Kratika Yoga courses, digital content, and affiliate products from the admin dashboard.",
};

const getPageMetadata = (pathname: string) => {
  if (pathname === "/auth/login") {
    return {
      title: "Sign In | Kratika Yoga Admin",
      description: "Sign in to the Kratika Yoga admin panel to manage courses and digital content.",
    };
  }

  if (pathname === "/auth/verify-otp") {
    return {
      title: "Verify OTP | Kratika Yoga Admin",
      description: "Verify your one-time password to securely access the Kratika Yoga admin panel.",
    };
  }

  if (pathname === "/auth/reset-password" || pathname === "/reset-password") {
    return {
      title: "Reset Password | Kratika Yoga Admin",
      description: "Create a new password for your Kratika Yoga admin account.",
    };
  }

  if (pathname === "/dashboard") {
    return {
      title: "Dashboard | Kratika Yoga Admin",
      description: "View an overview of your Kratika Yoga courses, content, and admin activity.",
    };
  }

  if (pathname === "/course") {
    return {
      title: "Course Management | Kratika Yoga Admin",
      description: "Create, organize, update, and manage courses for the Kratika Yoga platform.",
    };
  }

  if (pathname === "/course/add" || pathname === "/course/edit") {
    return {
      title: pathname.endsWith("/add") ? "Add Course | Kratika Yoga Admin" : "Edit Course | Kratika Yoga Admin",
      description: pathname.endsWith("/add")
        ? "Create and publish a new course on the Kratika Yoga platform."
        : "Update course details, videos, and content on the Kratika Yoga platform.",
    };
  }

  if (pathname.startsWith("/course/analytics/")) {
    return {
      title: "Course Analytics | Kratika Yoga Admin",
      description: "Review course performance and analytics for the Kratika Yoga platform.",
    };
  }

  if (pathname === "/pdf-courses") {
    return {
      title: "PDF Course Management | Kratika Yoga Admin",
      description: "Manage PDF courses and downloadable learning content for Kratika Yoga students.",
    };
  }

  if (pathname === "/affiliate-products") {
    return {
      title: "Affiliate Products | Kratika Yoga Admin",
      description: "Manage affiliate products and recommendations shown on the Kratika Yoga platform.",
    };
  }

  return DEFAULT_METADATA;
};

function PageMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const { title, description } = getPageMetadata(pathname);
    document.title = title;

    let descriptionElement = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!descriptionElement) {
      descriptionElement = document.createElement("meta");
      descriptionElement.name = "description";
      document.head.appendChild(descriptionElement);
    }

    descriptionElement.content = description;
  }, [pathname]);

  return null;
}

export default PageMetadata;
