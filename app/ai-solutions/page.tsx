export default function AISolutionsPage() {
  const solutions = [
    {
      id: 'call-center',
      title: 'Call Center Automation',
      icon: '📞',
      tagline: 'Transform customer service with intelligent AI agents',
      description: `
        Revolutionize your call center operations with advanced AI-powered automation that handles
        customer inquiries with human-like understanding and efficiency. Our solutions reduce wait times,
        improve customer satisfaction, and significantly lower operational costs.
      `,
      features: [
        {
          name: 'Natural Language Processing',
          detail: 'Advanced NLP enables understanding of customer intent, sentiment, and context',
        },
        {
          name: 'Multi-Channel Support',
          detail: 'Seamlessly handle voice, chat, email, and messaging platforms',
        },
        {
          name: '24/7 Availability',
          detail: 'Never miss a customer inquiry with round-the-clock automated assistance',
        },
        {
          name: 'Intelligent Routing',
          detail: 'Smart escalation to human agents when needed, with full context transfer',
        },
        {
          name: 'Analytics & Insights',
          detail: 'Real-time dashboards and reporting for continuous optimization',
        },
      ],
      benefits: [
        'Reduce average handle time by up to 60%',
        'Lower operational costs by 40-50%',
        'Improve customer satisfaction scores',
        'Scale support without proportional staff increases',
      ],
    },
    {
      id: 'knowledge-management',
      title: 'Knowledge Management',
      icon: '📚',
      tagline: 'Unlock enterprise knowledge with AI-powered intelligence',
      description: `
        Transform your organization's collective knowledge into an accessible, intelligent resource.
        Our AI-powered knowledge management systems make it easy for employees to find information,
        learn from past experiences, and make data-driven decisions.
      `,
      features: [
        {
          name: 'Intelligent Search',
          detail: 'Semantic search understands intent, not just keywords',
        },
        {
          name: 'Automatic Categorization',
          detail: 'AI organizes and tags content automatically as it is created',
        },
        {
          name: 'Knowledge Extraction',
          detail: 'Extract insights and patterns from unstructured documents',
        },
        {
          name: 'Smart Recommendations',
          detail: 'Context-aware suggestions based on user behavior and needs',
        },
        {
          name: 'Version Control & Compliance',
          detail: 'Track changes, maintain audit trails, ensure regulatory compliance',
        },
      ],
      benefits: [
        'Reduce time spent searching for information by 70%',
        'Improve decision-making with better access to insights',
        'Eliminate knowledge silos across departments',
        'Onboard new employees 3x faster',
      ],
    },
    {
      id: 'agentic-platforms',
      title: 'Agentic AI Platforms',
      icon: '🤖',
      tagline: 'Deploy autonomous AI agents for complex workflows',
      description: `
        Build sophisticated AI systems that can reason, plan, and execute complex tasks autonomously.
        Our agentic AI platforms enable organizations to automate entire workflows, from simple
        repetitive tasks to complex decision-making processes.
      `,
      features: [
        {
          name: 'Multi-Agent Orchestration',
          detail: 'Coordinate multiple specialized AI agents working together',
        },
        {
          name: 'Tool Integration',
          detail: 'Agents can use APIs, databases, and external tools to complete tasks',
        },
        {
          name: 'Reasoning & Planning',
          detail: 'Advanced cognitive capabilities for complex problem-solving',
        },
        {
          name: 'Human-in-the-Loop',
          detail: 'Configurable approval workflows for critical decisions',
        },
        {
          name: 'Learning & Adaptation',
          detail: 'Systems improve over time through reinforcement and feedback',
        },
      ],
      benefits: [
        'Automate complex, multi-step business processes',
        'Improve accuracy and consistency in operations',
        'Free human workers for high-value creative tasks',
        'Scale operations without linear cost increases',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Enterprise AI Solutions</h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Transforming businesses with cutting-edge artificial intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Empowering Organizations with AI</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Our AI solutions are designed to solve real business challenges. From customer service automation
            to knowledge management and autonomous agents, we help enterprises leverage the latest advances
            in artificial intelligence to drive efficiency, reduce costs, and create better experiences
            for customers and employees alike.
          </p>
        </div>
      </div>

      {/* Solutions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-16">
          {solutions.map((solution) => (
            <div key={solution.id} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Solution Header */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 px-8 sm:px-10 py-8 border-b border-gray-200">
                <div className="flex items-center mb-4">
                  <span className="text-5xl mr-4">{solution.icon}</span>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{solution.title}</h2>
                    <p className="text-blue-600 font-medium mt-1">{solution.tagline}</p>
                  </div>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed">{solution.description}</p>
              </div>

              {/* Solution Content */}
              <div className="px-8 sm:px-10 py-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Features */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="w-6 h-6 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path
                          fillRule="evenodd"
                          d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Key Features
                    </h3>
                    <div className="space-y-4">
                      {solution.features.map((feature, idx) => (
                        <div key={idx} className="border-l-4 border-blue-600 pl-4">
                          <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{feature.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Business Benefits
                    </h3>
                    <ul className="space-y-3">
                      {solution.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start">
                          <svg
                            className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900 font-medium">
                        💡 Ready to transform your operations?
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Contact us to discuss how this solution can be tailored to your needs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl shadow-xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Let's Build the Future Together</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Our AI solutions are customizable and scalable to meet your unique business needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              Schedule a Demo
            </button>
            <button className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors">
              Download Whitepaper
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
