export default function MeditationPage() {
  const posts = [
    {
      id: 1,
      title: 'Beginning My Meditation Journey',
      date: '2024-01-15',
      content: `
        Today marks the beginning of a new chapter in my life. I've decided to commit to a daily meditation practice,
        something I've been curious about for years but never fully embraced. The stillness of the morning,
        the quiet moments before the world wakes up — these are the times I'm dedicating to understanding myself better.

        Starting with just 10 minutes each morning, I'm learning to observe my thoughts without judgment.
        It's harder than I imagined, but also more rewarding. Each breath is a reminder to come back to the present moment.
      `,
    },
    {
      id: 2,
      title: 'The Power of Breath Awareness',
      date: '2024-02-03',
      content: `
        Three weeks into my practice, and I'm noticing subtle but profound changes. The simple act of focusing on my breath
        has become an anchor in turbulent times. When work gets stressful or life feels overwhelming, I can return to this
        fundamental practice — just breathing, just being.

        I've learned that meditation isn't about achieving a blank mind or reaching some mystical state. It's about
        being present with whatever arises. The anxiety, the joy, the boredom — all of it is welcome. This acceptance
        is transforming how I relate to my experiences throughout the day.
      `,
    },
    {
      id: 3,
      title: 'Insights on Impermanence',
      date: '2024-03-12',
      content: `
        Two months in, and meditation has revealed something profound: everything changes. Thoughts come and go like clouds
        across the sky. Emotions rise and fall like waves on the ocean. Even the sense of "I" is fluid and changing.

        This understanding of impermanence has brought both peace and a slight discomfort. Peace, because I know difficult
        moments will pass. Discomfort, because pleasant moments will too. But there's a deeper freedom here — in not clinging
        to either, I'm learning to fully experience each moment as it is.

        My practice has expanded beyond formal sitting. I'm finding meditation in the rhythmic motion of cycling,
        in the focused attention while making espresso, in the flow state while snowboarding. Mindfulness is becoming
        a way of life, not just a morning ritual.
      `,
    },
    {
      id: 4,
      title: 'Reflections on Progress and Patience',
      date: '2024-04-20',
      content: `
        Today I sat for 30 minutes, and it felt both effortless and challenging. Some days, meditation flows naturally.
        Other days, every second feels like an eternity. I'm learning that both experiences are valuable teachers.

        The restless days teach patience. The peaceful days remind me why I practice. But the real growth happens in
        the space between — in the moment when I notice my mind has wandered and gently bring it back. That moment of
        recognition, that kindness toward myself, that's where the transformation lives.

        I'm grateful for this practice and curious about where it will lead. Each day on the cushion is an adventure,
        an exploration of consciousness, a deepening relationship with the present moment.
      `,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Meditation Journey</h1>
          <p className="text-xl text-gray-600">
            Reflections on mindfulness, presence, and the path of self-discovery
          </p>
          {/* Medium Publication Link */}
          <div className="mt-6">
            <a 
              href="https://medium.com/mymeditation" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
              </svg>
              Read more on Medium
            </a>
          </div>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {posts.map((post, index) => (
            <article
              key={post.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-10 hover:shadow-xl transition-shadow"
            >
              {/* Post Header */}
              <div className="mb-6">
                <time className="text-sm font-medium text-blue-600">
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">{post.title}</h2>
              </div>

              {/* Post Content */}
              <div className="prose prose-lg max-w-none text-gray-700">
                {post.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4 leading-relaxed">
                    {paragraph.trim()}
                  </p>
                ))}
              </div>

              {/* Divider (except for last post) */}
              {index < posts.length - 1 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-500">
                    <span>Continue reading below</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
          <p className="text-gray-600 mb-4">
            This meditation journal is a work in progress, just like the practice itself.
          </p>
          <p className="text-sm text-gray-500 mb-6">More reflections coming soon...</p>
          {/* Medium Link in Footer */}
          <a 
            href="https://medium.com/mymeditation" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
            </svg>
            Follow My Meditation on Medium
          </a>
        </div>
      </div>
    </div>
  );
}

