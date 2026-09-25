import Link from "next/link";
import { useLanguage } from "../lib/LanguageContext";
import useAuth from "../lib/useAuth";

/**
 * Nav pill shared by the public pages (contact, docs, privacy, terms):
 * logged-out users see "Login", signed-in users see "Dashboard".
 */
export default function PortalAuthPill() {
  const { t } = useLanguage();
  const authed = useAuth();

  if (authed) {
    return (
      <Link href="/dashboard" className="portal-pill-btn">
        {t("nav.dashboard")}
      </Link>
    );
  }

  return (
    <Link href="/login" className="portal-pill-btn">
      {t("contact.login")}
    </Link>
  );
}
