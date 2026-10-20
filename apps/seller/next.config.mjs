/** @type {import('next').NextConfig} */
const nextConfig = {
  // The seller dashboard must never show up in search engines.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
