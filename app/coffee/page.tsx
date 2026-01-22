export default function CoffeePage() {
  const highlights = [
    'Dialing in the perfect grind',
    'Experimenting with different beans and origins',
    'Mastering milk texturing and latte art',
    'Exploring brewing techniques and ratios',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">☕</span>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Espresso</h1>
              <p className="text-lg text-gray-600">The Art of Coffee Making</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Description */}
        <div className="prose prose-lg max-w-none mb-12">
          <p className="text-gray-700 leading-relaxed">
            The art of pulling the perfect espresso shot is a daily ritual that combines science, technique, 
            and a touch of magic. From selecting beans and dialing in the grinder to timing the extraction 
            and perfecting the crema, every variable matters.
          </p>
          <p className="text-gray-700 leading-relaxed mt-4">
            What started as a simple appreciation for good coffee has evolved into a passionate hobby. 
            I&apos;ve learned about different bean origins, roast profiles, and brewing techniques. The pursuit 
            of that perfect shot — balanced, complex, with rich flavors and silky texture — is an endless 
            journey of refinement and discovery.
          </p>
        </div>

        {/* Equipment Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">The Craft</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highlights.map((highlight, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quote */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-8 text-center">
          <blockquote className="text-lg text-gray-800 italic">
            &ldquo;Coffee is a language in itself.&rdquo;
          </blockquote>
          <p className="text-sm text-gray-600 mt-2">— Jackie Chan</p>
        </div>
      </div>
    </div>
  );
}

