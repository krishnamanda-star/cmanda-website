import Link from 'next/link';

export default function HomePage() {
  const sections = [
    {
      id: 'meditation',
      title: 'Meditation',
      subtitle: 'Just Watching',
      description: 'Reflections from practice. Exploring mindfulness, presence, and the path of self-discovery through Vipassana meditation.',
      href: '/meditation',
      icon: '🧘',
      color: 'from-amber-50 to-orange-100',
      borderColor: 'border-amber-200',
      hoverColor: 'hover:border-amber-400',
    },
    {
      id: 'cycling',
      title: 'Cycling',
      subtitle: 'Meditation in Motion',
      description: 'Road cycling through scenic routes, challenging climbs, and long-distance adventures. Finding freedom on two wheels.',
      href: '/cycling',
      icon: '🚴',
      color: 'from-green-50 to-emerald-100',
      borderColor: 'border-green-200',
      hoverColor: 'hover:border-green-400',
    },
    {
      id: 'coffee',
      title: 'Coffee',
      subtitle: 'The Art of Coffee',
      description: 'Crafting the perfect shot. Exploring beans, techniques, and the ritual of espresso making.',
      href: '/coffee',
      icon: '☕',
      color: 'from-amber-50 to-brown-100',
      borderColor: 'border-amber-200',
      hoverColor: 'hover:border-amber-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Krishna Manda
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Exploring mindfulness, pursuing passions, and building innovative AI solutions.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={section.href}
              className={`group block bg-gradient-to-br ${section.color} rounded-2xl border-2 ${section.borderColor} ${section.hoverColor} p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
            >
              <div className="text-4xl mb-4">{section.icon}</div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {section.title}
              </h2>
              <p className="text-sm font-medium text-gray-500 mb-3">
                {section.subtitle}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {section.description}
              </p>
              <div className="mt-4 flex items-center text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Explore
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* AI Solutions Link */}
        <div className="mt-12 text-center">
          <Link
            href="/ai-solutions"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            View AI Solutions
          </Link>
        </div>
      </div>
    </div>
  );
}
