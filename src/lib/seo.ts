import appSocialAsset from "@/assets/social-app.jpg.asset.json";
import authSocialAsset from "@/assets/social-auth.jpg.asset.json";
import homepageSocialAsset from "@/assets/social-homepage.jpg.asset.json";

export const SITE_URL = "https://psiennik.pl";

export const SOCIAL_IMAGES = {
  homepage: `${SITE_URL}${homepageSocialAsset.url}`,
  auth: `${SITE_URL}${authSocialAsset.url}`,
  app: `${SITE_URL}${appSocialAsset.url}`,
} as const;

type SocialMetaOptions = {
  title: string;
  description: string;
  path: string;
  image: keyof typeof SOCIAL_IMAGES;
  privatePage?: boolean;
};

export function socialMeta({
  title,
  description,
  path,
  image,
  privatePage = false,
}: SocialMetaOptions) {
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `${SITE_URL}${path}` },
    { property: "og:image", content: SOCIAL_IMAGES[image] },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: title },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: SOCIAL_IMAGES[image] },
    ...(privatePage ? [{ name: "robots", content: "noindex, nofollow" }] : []),
  ];
}