import Image from "next/image";
import {
  Box,
  FileText,
  LayoutGrid,
  Home,
  Activity,
  Clock,
  Phone,
  Headphones,
  Mail,
  MapPin,
} from "lucide-react";
import { Navbar } from "./components/navbar";

const services = [
  {
    icon: Box,
    title: "Distressed Project Turnaround",
    description:
      "Full commercial review of struggling projects. We identify risks, maximize revenue through claims, minimize exposure, and optimize cash flow to get your project back on track.",
    items: [
      "Head contract entitlement analysis",
      "Liquidated damages minimization",
      "EOT & claims optimization",
      "Cash flow recovery",
    ],
  },
  {
    icon: FileText,
    title: "Contract Management",
    description:
      "Strategic upstream and downstream contract management. We ensure you understand your obligations, maximize opportunities, and mitigate risks at every level.",
    items: [
      "Subcontractor accountability & risk",
      "Variation management & recovery",
      "Progress claims optimization",
      "Procurement alignment",
    ],
  },
  {
    icon: LayoutGrid,
    title: "Developer Services",
    description:
      "Risk profiling, procurement strategy, and commercial training for developers. We help you understand what risks you're buying and drive optimal outcomes.",
    items: [
      "Contract risk profiling",
      "Procurement strategy",
      "Commercial training programs",
      "Tender review & compilation",
    ],
  },
  {
    icon: Home,
    title: "Strata & Defects",
    description:
      "Management of defective works and commercial dispute resolution. We liaise with owners corporations and drive practical, commercial outcomes.",
    items: [
      "Defect management & resolution",
      "Owners corporation liaison",
      "Commercial dispute resolution",
      "On-site process management",
    ],
  },
  {
    icon: Activity,
    title: "Operational Excellence",
    description:
      "Program scheduling, quality compliance, and process-driven initiatives. We enhance operational performance through accountability and systems alignment.",
    items: [
      "Program & scheduling excellence",
      "Quality & compliance systems",
      "Process implementation",
      "Commercial training & upskilling",
    ],
  },
  {
    icon: Clock,
    title: "Project Intervention",
    description:
      "Rapid response for projects in crisis. We identify opportunities, manage risks, and implement immediate solutions to restore profitability.",
    items: [
      "Rapid project assessment",
      "Risk & opportunity identification",
      "Crisis management & recovery",
      "Reporting & forecast correction",
    ],
  },
];

const stats = [
  { value: "20+", label: "Years Experience" },
  { value: "100%", label: "Client Focused" },
  { value: "$67M+", label: "AUD Value Recovered" },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16 bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Turn Construction Chaos
              <br />
              Into{" "}
              <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Commercial Excellence
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl">
              Expert commercial consulting for contractors, developers, and
              strata. We rescue distressed projects, optimize contracts, and
              drive profitability.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#contact"
                className="inline-flex items-center rounded-lg bg-teal-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-teal-500/25 hover:bg-teal-400 transition-all hover:shadow-teal-500/40"
              >
                Start the Conversation
              </a>
              <a
                href="#services"
                className="inline-flex items-center rounded-lg border border-gray-500 px-6 py-3 text-base font-semibold text-gray-300 hover:border-teal-400 hover:text-teal-400 transition-colors"
              >
                Our Services
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              What We Do
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive commercial consulting across the construction
              lifecycle
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="group rounded-2xl bg-white p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-teal-200 transition-all duration-300"
              >
                <div className="mb-5 inline-flex items-center justify-center rounded-xl bg-teal-50 p-3 text-teal-600 group-hover:bg-teal-100 transition-colors">
                  <service.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start text-sm text-gray-500"
                    >
                      <span className="mr-2 mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Commercial Expertise
                <br />
                When You Need It Most
              </h2>
              <p className="mt-6 text-gray-600 leading-relaxed">
                PiRisk Management brings deep construction commercial expertise
                to projects at critical junctures. We specialize in turning
                around distressed projects, optimizing contractual arrangements,
                and driving commercial excellence across the construction
                lifecycle.
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                With comprehensive knowledge of head contracts, subcontract
                management, procurement, and dispute resolution, we help
                contractors, developers, and strata companies navigate complex
                commercial challenges and maximize outcomes.
              </p>
              <div className="mt-10 grid grid-cols-3 gap-8">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-3xl font-extrabold text-teal-600">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-gray-50 p-16 border border-teal-100">
                <Image
                  src="/logo.png"
                  alt="PiRisk Management"
                  width={280}
                  height={80}
                  className="w-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Let&apos;s Talk
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Ready to turn your project around? Get in touch today.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-teal-50 p-3 text-teal-600">
                  <Phone className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-900">Phone</h3>
                <p className="mt-2">
                  <a
                    href="tel:+61401805618"
                    className="text-gray-600 hover:text-teal-600"
                  >
                    +61 401 805 618
                  </a>
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-teal-50 p-3 text-teal-600">
                  <Headphones className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-900">Talk to Grace</h3>
                <p className="mt-2 text-sm text-gray-600 mb-4">
                  Our Virtual Secretary, trained on everything we do.
                </p>
                <button
                  type="button"
                  className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
                >
                  Chat with Grace
                </button>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-teal-50 p-3 text-teal-600">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-900">Email</h3>
                <p className="mt-2">
                  <a
                    href="mailto:allerick@pirisk.com.au"
                    className="text-gray-600 hover:text-teal-600"
                  >
                    allerick@pirisk.com.au
                  </a>
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-teal-50 p-3 text-teal-600">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-900">Location</h3>
                <p className="mt-2 text-gray-600">
                  Northern Beaches, Sydney
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
              <form>
                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Image
                src="/logo.png"
                alt="PiRisk Management"
                width={120}
                height={34}
                className="h-8 w-auto brightness-200"
              />
              <p className="text-sm text-gray-400">
                Construction Commercial Consulting
              </p>
            </div>
            <div className="flex gap-6">
              <a
                href="#services"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Services
              </a>
              <a
                href="#about"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                About
              </a>
              <a
                href="#contact"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} PiRisk Management. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
