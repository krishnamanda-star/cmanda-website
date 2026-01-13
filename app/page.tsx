import Link from 'next/link';

export default function Home() {
  const sections = [
    {
      title: 'Meditation',
      description: 'Explore my meditation practice and journey towards mindfulness',
      href: '/meditation',
      icon: '🧘',
      color: 'from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200',
    },
    {
      title: 'Hobbies',
      description: 'Discover my passions: cycling, snowboarding, espresso, and sports',
      href: '/hobbies',
      icon: '🚴',
      color: 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200',
    },
    {
      title: 'AI Solutions',
      description: 'Enterprise AI solutions for modern businesses',
      href: '/ai-solutions',
      icon: '🤖',
      color: 'from-green-50 to-green-100 hover:from-green-100 hover:to-green-200',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
            Krishna Manda
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Welcome to my personal space. Exploring mindfulness, pursuing passions,
            and building innovative AI solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/meditation"
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explore My Journey
            </Link>
            <Link
              href="/ai-solutions"
              className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-colors"
            >
              View AI Solutions
            </Link>
          </div>
        </div>
      </section>

      {/* Sections Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className={`block p-8 rounded-2xl bg-gradient-to-br ${section.color} border border-gray-200 transition-all duration-200 transform hover:scale-105 hover:shadow-lg`}
            >
              <div className="text-5xl mb-4">{section.icon}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{section.title}</h2>
              <p className="text-gray-600">{section.description}</p>
              <div className="mt-4 text-blue-600 font-medium flex items-center">
                Learn more
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">About Me</h2>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="mb-4">
              I'm passionate about exploring the intersection of mindfulness, active living, and technology.
              Through meditation, I've discovered the power of presence and self-awareness.
            </p>
            <p className="mb-4">
              When I'm not meditating, you'll find me cycling through scenic routes, carving down mountains
              on my Lib Tech Orca, or crafting the perfect espresso shot. I believe in living fully and
              embracing diverse experiences.
            </p>
            <p>
              Professionally, I work on cutting-edge AI solutions that help enterprises transform their
              operations through intelligent automation and knowledge management.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} Krishna Manda. All rights reserved.</p>
      </footer>
    </div>
  );
}
