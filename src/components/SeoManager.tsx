import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";

type SeoConfig = {
  title: string;
  description: string;
  indexable?: boolean;
};

const DEFAULT_SEO: SeoConfig = {
  title: "CEP Hall | College Resource Booking Platform",
  description:
    "Book classrooms, labs, seminar halls, and campus facilities with approval workflows and real-time availability.",
  indexable: true,
};

const ROUTE_SEO: Array<{ path: string; seo: SeoConfig }> = [
  {
    path: "/",
    seo: {
      title: "CEP Hall | Campus Resource Booking",
      description:
        "Reserve campus labs, classrooms, and halls in seconds with approval workflows and live calendar visibility.",
      indexable: true,
    },
  },
  {
    path: "/calendar",
    seo: {
      title: "Live Resource Calendar | CEP Hall",
      description:
        "View real-time availability of campus resources and upcoming bookings through an interactive calendar.",
      indexable: true,
    },
  },
  {
    path: "/login",
    seo: {
      title: "Login | CEP Hall",
      description:
        "Sign in to manage bookings, submit new requests, and track approvals in CEP Hall.",
      indexable: false,
    },
  },
  {
    path: "/dashboard",
    seo: {
      title: "Dashboard | CEP Hall",
      description:
        "Manage your campus resource bookings, approvals, and requests from your personal dashboard.",
      indexable: false,
    },
  },
  {
    path: "/my-bookings",
    seo: {
      title: "My Bookings | CEP Hall",
      description:
        "Track your upcoming and past campus resource bookings with status updates and details.",
      indexable: false,
    },
  },
  {
    path: "/admin",
    seo: {
      title: "Admin Panel | CEP Hall",
      description:
        "Administrative controls for resources, approvers, and booking workflows.",
      indexable: false,
    },
  },
  {
    path: "/admin/approvers",
    seo: {
      title: "Admin Approvers | CEP Hall",
      description:
        "Manage approvers and authorization flow for booking requests.",
      indexable: false,
    },
  },
  {
    path: "/admin/resources",
    seo: {
      title: "Admin Resources | CEP Hall",
      description: "Create and manage campus resources available for booking.",
      indexable: false,
    },
  },
  {
    path: "/book/:resourceId",
    seo: {
      title: "Book Resource | CEP Hall",
      description:
        "Submit a booking request for campus resources with date and time details.",
      indexable: false,
    },
  },
  {
    path: "/edit/:bookingId",
    seo: {
      title: "Edit Booking | CEP Hall",
      description: "Update booking request details and resubmit for approval.",
      indexable: false,
    },
  },
];

function upsertMetaByName(name: string, content: string) {
  let element = document.head.querySelector(
    `meta[name="${name}"]`,
  ) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertMetaByProperty(property: string, content: string) {
  let element = document.head.querySelector(
    `meta[property="${property}"]`,
  ) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const matchedRoute = ROUTE_SEO.find(({ path }) =>
      matchPath({ path, end: true }, pathname),
    );

    const seo = matchedRoute?.seo ?? DEFAULT_SEO;
    const canonicalUrl = `${window.location.origin}${pathname}`;

    document.title = seo.title;
    upsertMetaByName("description", seo.description);
    upsertMetaByName(
      "robots",
      seo.indexable
        ? "index,follow,max-image-preview:large"
        : "noindex,nofollow",
    );

    upsertCanonical(canonicalUrl);

    upsertMetaByProperty("og:type", "website");
    upsertMetaByProperty("og:title", seo.title);
    upsertMetaByProperty("og:description", seo.description);
    upsertMetaByProperty("og:url", canonicalUrl);
    upsertMetaByProperty("og:image", `${window.location.origin}/logo.png`);

    upsertMetaByName("twitter:card", "summary_large_image");
    upsertMetaByName("twitter:title", seo.title);
    upsertMetaByName("twitter:description", seo.description);
    upsertMetaByName("twitter:image", `${window.location.origin}/logo.png`);
  }, [pathname]);

  return null;
}
