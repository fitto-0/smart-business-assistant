const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Uploaded files (logos, favicons, product images, backgrounds...) are stored as
// relative paths such as "/uploads/products/product-1.png" and are served by the
// backend. They must therefore be resolved against the API origin, otherwise the
// browser requests them from the Next.js origin (port 3000) and gets a 404.
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const assetUrl = (url) => {
  if (!url || typeof url !== "string") return url;

  // Already absolute (http://, https://, //cdn.example.com), inline or blob data.
  if (
    /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url) ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default assetUrl;
