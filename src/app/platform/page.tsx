"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Globe, Users, TrendingUp, AlertTriangle, CheckCircle, Eye, EyeOff, Filter, MoreHorizontal, Download, Zap, BarChart3, Brain, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function PlatformPage() {
  const [selectedArticle, setSelectedArticle] = useState("breaking-news");
  const [currentSociety, setCurrentSociety] = useState("Tech Journalists");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock data for articles in review
  const articles = [
    {
      id: "breaking-news",
      title: "Tech Giant Announces Revolutionary AI Breakthrough",
      author: "Sarah Martinez",
      status: "analyzing",
      confidence: 78,
      flagged: 2,
      societies: ["Tech Journalists", "AI Researchers", "Industry Analysts"],
      publishedAt: "2h ago",
      readTime: "4 min"
    },
    {
      id: "political-analysis",
      title: "New Policy Changes Impact on Small Businesses",
      author: "David Chen",
      status: "verified",
      confidence: 92,
      flagged: 0,
      societies: ["Political Reporters", "Business Journalists", "Policy Experts"],
      publishedAt: "6h ago",
      readTime: "7 min"
    },
    {
      id: "health-report",
      title: "Study Reveals Surprising Health Benefits of Remote Work",
      author: "Dr. Maria Rodriguez",
      status: "published",
      confidence: 96,
      flagged: 0,
      societies: ["Health Reporters", "Workplace Experts", "Medical Professionals"],
      publishedAt: "1d ago",
      readTime: "5 min"
    }
  ];

  const societyInsights = {
    "Tech Journalists": {
      score: 85,
      attention: { full: 42, partial: 51, ignore: 7 },
      variants: [
        { name: "Original", description: "Revolutionary AI Breakthrough", score: 85 },
        { name: "Variant 1", description: "AI Advancement: Incremental Progress", score: 73 },
        { name: "Variant 2", description: "Major Tech Innovation Unveiled", score: 89 }
      ],
      conversation: [
        { theme: "Technical Accuracy", percentage: 45, quotes: ["Need more technical details", "Source verification required"] },
        { theme: "Industry Impact", percentage: 35, quotes: ["Could disrupt entire sector", "Significant market implications"] },
        { theme: "Skepticism", percentage: 20, quotes: ["Sounds like hype", "Need peer review"] }
      ]
    }
  };

  // Particle animation setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    const particles: Array<{x: number; y: number; vx: number; vy: number; life: number}> = [];
    const particleCount = 150;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: Math.random()
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(250, 250, 250, 0.05)';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particles.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life += 0.005;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.offsetWidth;
        if (particle.x > canvas.offsetWidth) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.offsetHeight;
        if (particle.y > canvas.offsetHeight) particle.y = 0;

        // Draw particle
        const alpha = 0.2 + 0.3 * Math.sin(particle.life);
        const size = 0.8 + Math.sin(particle.life * 1.5) * 0.3;
        
        ctx.fillStyle = `rgba(91, 141, 239, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Hide navbar for platform page
  useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) {
      navbar.style.display = 'none';
    }
    document.body.style.paddingTop = '0';
    
    return () => {
      if (navbar) {
        navbar.style.display = '';
      }
      document.body.style.paddingTop = '';
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A]">
      {/* Particle Canvas Background */}
      <canvas 
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />


       {/* Main Content Layout */}
       <div className="relative z-10 flex min-h-screen">
        {/* Left Sidebar - Article Queue */}
        <div className="w-[320px] border-r border-[#E5E5E5] bg-white/80 backdrop-blur-[10px]">
          <div className="px-6 py-8 border-b border-[#E5E5E5]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="headline-medium text-[#0A0A0A]">
                  Article Queue
                </h2>
                <p className="body-sans text-[#6B7280] mt-1">
                  {articles.length} articles in pipeline
                </p>
              </div>
              <Button variant="ghost" size="icon">
                <Filter className="size-4" />
              </Button>
            </div>
          </div>
          
          <div className="px-6 py-8 space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className={`cursor-pointer group transition-all duration-300 ${
                  selectedArticle === article.id 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-white hover:bg-gray-50 border-[#E5E5E5]'
                } border rounded-lg p-4`}
                onClick={() => setSelectedArticle(article.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="body-sans font-medium leading-tight mb-2 group-hover:text-[#5B8DEF] transition-colors">
                      {article.title}
                    </h3>
                    <p className="label-sans text-[#6B7280] mb-2 normal-case">
                      by {article.author} • {article.publishedAt} • {article.readTime}
                    </p>
                  </div>
                  <Badge 
                    className={`ml-2 shrink-0 label-sans normal-case ${
                      article.status === 'published' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : article.status === 'verified'
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                    }`}
                  >
                    {article.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 label-sans normal-case">
                      <div className={`w-2 h-2 rounded-full ${
                        article.confidence > 90 ? 'bg-green-400' : 
                        article.confidence > 70 ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                      {article.confidence}% confidence
                    </span>
                    {article.flagged > 0 && (
                      <span className="text-amber-600 flex items-center gap-1 label-sans normal-case">
                        <AlertTriangle className="size-3" />
                        {article.flagged} flagged
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity size-6">
                    <MoreHorizontal className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* Article Analysis Header */}
          <div className="bg-white/90 backdrop-blur-[10px] border-b border-[#E5E5E5] px-12 py-16">
            <div className="max-w-[1200px] mx-auto">
              <div className="mb-12">
                <h1 className="text-[#0A0A0A] mb-6 font-light leading-tight max-w-5xl" style={{ 
                  fontFamily: 'var(--font-family-serif)', 
                  fontSize: 'clamp(48px, 6vw, 72px)',
                  letterSpacing: '-0.02em'
                }}>
                  {articles.find(a => a.id === selectedArticle)?.title}
                </h1>
                <div className="flex items-center gap-6 body-sans text-[#6B7280] mb-8">
                  <span>by {articles.find(a => a.id === selectedArticle)?.author}</span>
                  <span>•</span>
                  <span className="capitalize">{articles.find(a => a.id === selectedArticle)?.status}</span>
                  <span>•</span>
                  <span>{articles.find(a => a.id === selectedArticle)?.publishedAt}</span>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="size-5 text-blue-600" />
                    <span className="label-sans text-blue-900 normal-case">AI Confidence</span>
                  </div>
                  <div className="headline-medium text-blue-900">
                    {articles.find(a => a.id === selectedArticle)?.confidence}%
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="size-5 text-purple-600" />
                    <span className="label-sans text-purple-900 normal-case">Society Score</span>
                  </div>
                  <div className="headline-medium text-purple-900">
                    85
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="size-5 text-green-600" />
                    <span className="label-sans text-green-900 normal-case">Facts Verified</span>
                  </div>
                  <div className="headline-medium text-green-900">
                    12/14
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="size-5 text-amber-600" />
                    <span className="label-sans text-amber-900 normal-case">Attention Score</span>
                  </div>
                  <div className="headline-medium text-amber-900">
                    High
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Analysis Sections */}
          <div className="flex-1 overflow-y-auto px-12 py-16 space-y-16">
            {/* Society Simulation */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="headline-medium text-[#0A0A0A] mb-2">
                    Society Simulation
                  </h2>
                  <p className="body-sans text-[#6B7280]">
                    AI agents modeling reader response across demographic groups
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="body-sans border-[#5B8DEF] text-[#5B8DEF] hover:bg-[#5B8DEF] hover:text-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                >
                  <Zap className="size-4 mr-2" />
                  Generate Variants
                </Button>
              </div>

              <div className="bg-white/60 backdrop-blur-[10px] border border-[#E5E5E5] rounded-lg p-6">
                {/* Enhanced particle visualization */}
                <div className="relative h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl mb-8 overflow-hidden shadow-sm">
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="grid grid-cols-16 gap-2 w-full h-full">
                      {Array.from({length: 128}).map((_, i) => {
                        const sentiment = Math.random();
                        const size = Math.random() * 3 + 2;
                        const opacity = 0.4 + Math.random() * 0.6;
                        const animationDelay = Math.random() * 2000;
                        return (
                          <div 
                            key={i}
                            className={`rounded-full transition-all duration-500 hover:scale-125 animate-pulse ${
                              sentiment > 0.65 ? 'bg-green-400 shadow-green-200' : 
                              sentiment > 0.35 ? 'bg-blue-400 shadow-blue-200' : 
                              sentiment > 0.15 ? 'bg-gray-400 shadow-gray-200' : 'bg-red-400 shadow-red-200'
                            }`}
                            style={{ 
                              width: `${size}px`, 
                              height: `${size}px`,
                              opacity: opacity,
                              animationDelay: `${animationDelay}ms`,
                              boxShadow: `0 0 8px currentColor`
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Floating insights */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-[10px] rounded-lg p-3 shadow-sm">
                    <div className="label-sans text-[#6B7280] mb-1 normal-case">Current Society</div>
                    <div className="body-sans font-semibold text-[#0A0A0A]">{currentSociety}</div>
                  </div>
                  
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-[10px] rounded-lg p-3 shadow-sm">
                    <div className="label-sans text-[#6B7280] mb-1 normal-case">Processing</div>
                    <div className="body-sans font-semibold text-[#5B8DEF]">5,247 agents</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="body-sans font-medium">Positive</span>
                    </div>
                    <div className="headline-medium text-[#0A0A0A]">
                      65%
                    </div>
                    <div className="label-sans text-[#6B7280] mt-1 normal-case">Strong engagement</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="body-sans font-medium">Neutral</span>
                    </div>
                    <div className="headline-medium text-[#0A0A0A]">
                      28%
                    </div>
                    <div className="label-sans text-[#6B7280] mt-1 normal-case">Passive reception</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span className="body-sans font-medium">Skeptical</span>
                    </div>
                    <div className="headline-medium text-[#0A0A0A]">
                      7%
                    </div>
                    <div className="label-sans text-[#6B7280] mt-1 normal-case">Need more evidence</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Fact-Checking Results */}
            <section>
              <div className="mb-8">
                <h2 className="headline-medium text-[#0A0A0A] mb-2">
                  Fact Verification
                </h2>
                <p className="body-sans text-[#6B7280]">
                  AI agents cross-referencing claims with trusted sources
                </p>
              </div>

              <div className="bg-white/60 backdrop-blur-[10px] border border-[#E5E5E5] rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="size-5 text-green-600" />
                      <div>
                        <p className="body-sans font-medium text-green-900">Primary Claims Verified</p>
                        <p className="body-sans text-green-700">12 of 14 claims cross-referenced and confirmed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="headline-medium text-green-900">
                        86%
                      </div>
                      <div className="label-sans text-green-600 normal-case">confidence</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-5 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="size-5 text-amber-600" />
                      <div>
                        <p className="body-sans font-medium text-amber-900">Source Credibility</p>
                        <p className="body-sans text-amber-700">2 sources need additional verification</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="headline-medium text-amber-900">
                        78%
                      </div>
                      <div className="label-sans text-amber-600 normal-case">verified</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-5 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="size-5 text-blue-600" />
                      <div>
                        <p className="body-sans font-medium text-blue-900">Bias Analysis</p>
                        <p className="body-sans text-blue-700">Neutral tone detected, balanced perspective</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="headline-medium text-blue-900">
                        92%
                      </div>
                      <div className="label-sans text-blue-600 normal-case">neutral</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right Sidebar - Society Insights */}
        <div className="w-[400px] border-l border-[#E5E5E5] bg-white/80 backdrop-blur-[10px] overflow-y-auto">
          <div className="px-6 py-8 border-b border-[#E5E5E5]">
            <div className="mb-6">
              <h3 className="headline-medium text-[#0A0A0A] mb-2">
                Society Insights
              </h3>
              <p className="body-sans text-[#6B7280]">
                Demographic analysis & reader prediction
              </p>
            </div>
            
            <div className="space-y-3">
              {['Tech Journalists', 'AI Researchers', 'Industry Analysts'].map((society) => (
                <button
                  key={society}
                  onClick={() => setCurrentSociety(society)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    currentSociety === society
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-gray-50 border-[#E5E5E5] text-[#6B7280] hover:bg-gray-100'
                  } border body-sans font-medium`}
                >
                  {society}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-8 space-y-8">
            {/* Impact Metrics */}
            <div>
              <h4 className="body-sans font-medium mb-4 text-[#0A0A0A]">Impact Metrics</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="body-sans text-[#6B7280]">Engagement Score</span>
                  <span className="headline-medium text-[#0A0A0A]">85</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#5B8DEF] to-[#9B59B6] h-2 rounded-full transition-all duration-1000" 
                    style={{width: '85%'}}
                  />
                </div>
                <p className="label-sans text-[#6B7280] normal-case">High engagement expected across demographics</p>
              </div>
            </div>

            {/* Attention Distribution */}
            <div>
              <h4 className="body-sans font-medium mb-4 text-[#0A0A0A]">Attention Distribution</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="size-4 text-green-600" />
                    <span className="body-sans font-medium text-green-900">Full Attention</span>
                  </div>
                  <span className="body-sans font-semibold text-green-900">42%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="size-4 text-blue-600" />
                    <span className="body-sans font-medium text-blue-900">Partial</span>
                  </div>
                  <span className="body-sans font-semibold text-blue-900">51%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <EyeOff className="size-4 text-gray-500" />
                    <span className="body-sans font-medium text-gray-700">Ignore</span>
                  </div>
                  <span className="body-sans font-semibold text-gray-700">7%</span>
                </div>
              </div>
            </div>

            <Separator className="bg-[#E5E5E5]" />

            {/* Conversation Insights */}
            <div>
              <h4 className="body-sans font-medium mb-4 text-[#0A0A0A]">Conversation Insights</h4>
              <div className="space-y-4">
                <div className="bg-white/80 border border-[#E5E5E5] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="body-sans font-medium text-[#0A0A0A]">Technical Accuracy</h5>
                    <span className="label-sans text-[#6B7280] normal-case">45%</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 bg-gray-50 rounded label-sans normal-case italic text-[#6B7280]">
                      "Need more technical details"
                    </div>
                    <div className="p-2 bg-gray-50 rounded label-sans normal-case italic text-[#6B7280]">
                      "Source verification required"
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/80 border border-[#E5E5E5] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="body-sans font-medium text-[#0A0A0A]">Industry Impact</h5>
                    <span className="label-sans text-[#6B7280] normal-case">35%</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 bg-gray-50 rounded label-sans normal-case italic text-[#6B7280]">
                      "Could disrupt entire sector"
                    </div>
                    <div className="p-2 bg-gray-50 rounded label-sans normal-case italic text-[#6B7280]">
                      "Significant market implications"
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-[#E5E5E5]" />

            {/* Actions */}
            <div>
              <h4 className="body-sans font-medium mb-4 text-[#0A0A0A]">Actions</h4>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start body-sans border-[#5B8DEF] text-[#5B8DEF] hover:bg-[#5B8DEF] hover:text-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                >
                  <TrendingUp className="size-4 mr-2" />
                  Generate Variants
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start body-sans border-[#E5E5E5] text-[#0A0A0A] hover:bg-gray-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
                  <Users className="size-4 mr-2" />
                  Test Different Society
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start body-sans border-[#E5E5E5] text-[#0A0A0A] hover:bg-gray-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
                  <Download className="size-4 mr-2" />
                  Export Analysis
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
