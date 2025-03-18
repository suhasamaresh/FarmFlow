import React from "react";

export default function Footer(): React.ReactNode {
  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Track Produce", href: "/track" },
    { name: "Payments & Staking", href: "/payments" },
    { name: "Disputes", href: "/disputes" },
    { name: "Governance", href: "/governance" },
    { name: "About Us", href: "/about" },
    { name: "FAQs", href: "/faqs" },
  ];

  const socialLinks = [
    {
      name: "Twitter/X",
      href: "https://twitter.com/DecentralAgri",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Telegram",
      href: "https://t.me/decentralagri",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.957 12.878l-7.573 2.828 2.829-9.192 7.572 2.829-2.828 3.535zm7.778-9.192L4.384 17.313c-.707.707-.354 1.768.707 2.121l3.536 1.414c.707.283 1.414 0 1.697-.707l2.121-5.657 5.657-2.121c.707-.283.99-.99.707-1.697l-1.414-3.536c-.354-1.061-1.414-1.414-2.121-.707z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/company/decentralagri",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: "Discord",
      href: "https://discord.gg/decentralagri",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.07.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.07-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.87 9.697-.215 15.145.066 20.509a.075.075 0 00.029.033 19.935 19.935 0 006.027 3.05.073.073 0 00.075-.019c.465-.617.894-1.27 1.255-1.951a.073.073 0 00-.04-.112 13.297 13.297 0 01-1.873-.842.074.074 0 01-.008-.124c.126-.094.252-.192.378-.291a.072.072 0 01.077-.01c3.927 1.793 8.18 1.793 12.062 0a.073.073 0 01.078.01c.125.099.252.197.378.291a.074.074 0 01-.008.125 13.345 13.345 0 01-1.874.842.073.073 0 00-.04.112c.36.682.79 1.334 1.255 1.951a.073.073 0 00.075.019 19.938 19.938 0 006.028-3.05.074.074 0 00.028-.033c.338-5.948-.97-11.287-3.551-16.12a.07.07 0 00-.032-.027zM8.02 15.332c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.419 0 1.333-.956 2.419-2.157 2.419zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.419 0 1.333-.946 2.419-2.157 2.419z" />
        </svg>
      ),
    },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Smart Contract Audits", href: "/audits" },
  ];

  return (
    <footer className="bg-gradient-to-r from-green-600 to-green-800 text-green-300 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Quick Navigation */}
          <div>
            <h3 className="text-lg font-semibold text-green-200 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-green-300 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-green-200 mb-4">
              Contact Us
            </h3>
            <ul className="space-y-2">
              <li>
                Email:{" "}
                <a
                  href="mailto:support@decentralagri.com"
                  className="text-green-300 hover:text-white transition-colors duration-200"
                >
                  support@decentralagri.com
                </a>
              </li>
              <li>
                Telegram:{" "}
                <a
                  href="https://t.me/decentralagri"
                  className="text-green-300 hover:text-white transition-colors duration-200"
                >
                  [Join Here]
                </a>
              </li>
              <li>
                Twitter:{" "}
                <a
                  href="https://twitter.com/DecentralAgri"
                  className="text-green-300 hover:text-white transition-colors duration-200"
                >
                  @DecentralAgri
                </a>
              </li>
              <li>
                LinkedIn:{" "}
                <a
                  href="https://linkedin.com/company/decentralagri"
                  className="text-green-300 hover:text-white transition-colors duration-200"
                >
                  [Follow Us]
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media Links */}
          <div>
            <h3 className="text-lg font-semibold text-green-200 mb-4">
              Follow Us
            </h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-green-300 hover:text-white transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Legal & Policies */}
          <div>
            <h3 className="text-lg font-semibold text-green-200 mb-4">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-green-300 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright & Disclaimer */}
        <div className="mt-12 pt-8 border-t border-green-400 border-opacity-30 text-center">
          <p className="text-green-300 mb-2">
            © 2025 Decentralized Agri Supply. All Rights Reserved.
          </p>
          <p className="text-sm text-green-300 max-w-2xl mx-auto">
            Disclaimer: This platform operates on blockchain technology.
            Transactions are irreversible, and users are responsible for their
            actions.
          </p>
        </div>

        {/* Network Status */}
        <div className="mt-6 text-center">
          <p className="text-green-300 text-sm">
            Network: <span className="font-medium">Solana Devnet</span> |
            <a
              href="https://explorer.solana.com/address/example"
              className="text-green-300 hover:text-white transition-colors duration-200 ml-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Smart Contract
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}