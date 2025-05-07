import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  webpack: (config) => {
    config.module.rules.push({
      test: /\.js$/,
      issuer: /antd/,
      use: {
        loader: "babel-loader",
        options: {
          plugins: [
            [
              "babel-plugin-transform-remove-console",
              { exclude: ["error", "warn"] },
            ],
          ],
        },
      },
    });
    return config;
  },
};

export default nextConfig;
