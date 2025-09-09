import { useNavigate } from 'react-router-dom'
import { Shield, Users, FileText, BarChart3, Lock, Globe, ArrowRight, CheckCircle, Sparkles, Database, Zap, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'

export function LandingPage() {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const features = [
    {
      icon: Users,
      title: 'Διαχείριση Πολιτών',
      description: 'Ολοκληρωμένη καταγραφή και εξυπηρέτηση πολιτών που απευθύνονται στο γραφείο του βουλευτή',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'Στρατολογικά Θέματα',
      description: 'Διαχείριση αιτημάτων για στρατολογικές υποθέσεις και παροχή βοήθειας σε στρατευσίμους',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: FileText,
      title: 'Αιτήματα Πολιτών',
      description: 'Καταγραφή και παρακολούθηση αιτημάτων πολιτών προς το βουλευτικό γραφείο',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: BarChart3,
      title: 'Στατιστικά Εξυπηρέτησης',
      description: 'Αναλυτικά στοιχεία για την αποτελεσματικότητα του γραφείου και τον χρόνο ανταπόκρισης',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: Lock,
      title: 'Ασφάλεια Δεδομένων',
      description: 'Προστασία προσωπικών δεδομένων πολιτών με υψηλά πρότυπα ασφαλείας',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Globe,
      title: 'Διασύνδεση Υπηρεσιών',
      description: 'Άμεση επικοινωνία με δημόσιες υπηρεσίες για ταχύτερη διεκπεραίωση υποθέσεων',
      gradient: 'from-teal-500 to-blue-500'
    }
  ]

  const stats = [
    { value: '5,000+', label: 'Εξυπηρετημένοι Πολίτες' },
    { value: '48h', label: 'Μέσος Χρόνος Απάντησης' },
    { value: '95%', label: 'Επιτυχής Διεκπεραίωση' },
    { value: '100%', label: 'Εμπιστευτικότητα' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl animate-spin-slow"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-20 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center transform transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  #oliipoligoli
                </h1>
                <p className="text-xs text-gray-400">Σύστημα Διαχείρισης Πολιτών</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transform transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 overflow-hidden"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span>Σύνδεση</span>
                <ArrowRight className="w-5 h-5 transform transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`relative z-10 px-4 pt-20 pb-32 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400 font-medium">Βουλευτικό Γραφείο Νέας Δημοκρατίας</span>
              </div>
              
              <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Πλατφόρμα Διαχείρισης
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                  Βουλευτή Γκολιδάκη
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 leading-relaxed">
                Εξειδικευμένη πλατφόρμα διαχείρισης για το γραφείο του Βουλευτή της Νέας Δημοκρατίας, 
                κ. Διαμαντή Γκολιδάκη. Σύγχρονη τεχνολογία για αποτελεσματική εξυπηρέτηση πολιτών.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transform transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 flex items-center space-x-3"
                >
                  <span>Ξεκινήστε Τώρα</span>
                  <ArrowRight className="w-5 h-5 transform transition-transform group-hover:translate-x-2" />
                </button>
                <button className="px-8 py-4 bg-slate-800/50 backdrop-blur text-white font-semibold rounded-xl border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all">
                  Μάθετε Περισσότερα
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-slate-800">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl transform transition-transform hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent z-10"></div>
                <img 
                  src="/hero-image.jpg" 
                  alt="Διαμαντής Γκολιδάκης - Βουλευτής Νέας Δημοκρατίας" 
                  className="w-full h-[600px] object-cover object-center"
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                  <h3 className="text-2xl font-bold text-white mb-2">Διαμαντής Γκολιδάκης</h3>
                  <p className="text-gray-300">Βουλευτής Νέας Δημοκρατίας</p>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-30 animate-pulse delay-700"></div>
              
              {/* Floating Card */}
              <div className="absolute -bottom-6 -right-6 bg-slate-800/90 backdrop-blur-xl p-4 rounded-xl border border-slate-700 shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">100% Ασφαλές</p>
                    <p className="text-xs text-gray-400">SSL Κρυπτογράφηση</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Υπηρεσίες Γραφείου
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Ολοκληρωμένη λύση για την αποτελεσματική λειτουργία του βουλευτικού γραφείου του κ. Γκολιδάκη
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative bg-slate-800/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all duration-500 transform ${
                  hoveredCard === index ? 'scale-105 shadow-2xl' : ''
                }`}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`}></div>
                
                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 transform transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-400 group-hover:bg-clip-text transition-all">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>

                  <div className="mt-6 flex items-center text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Μάθετε περισσότερα</span>
                    <ArrowRight className="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-2" />
                  </div>
                </div>

                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-transparent via-transparent to-blue-500/10 rounded-2xl"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="relative z-10 py-32 px-4 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-12">
              <div>
                <h2 className="text-4xl font-bold text-white mb-6">
                  Σύγχρονες Λύσεις για
                  <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Άριστη Εξυπηρέτηση Πολιτών
                  </span>
                </h2>
                <p className="text-lg text-gray-400">
                  Το γραφείο του κ. Γκολιδάκη χρησιμοποιεί την πλέον σύγχρονη τεχνολογία για γρήγορη και αποτελεσματική εξυπηρέτηση.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  { icon: Database, title: 'Βάση Δεδομένων', desc: 'Ασφαλής αποθήκευση όλων των αιτημάτων πολιτών' },
                  { icon: Zap, title: 'Άμεση Ανταπόκριση', desc: 'Γρήγορη διεκπεραίωση υποθέσεων πολιτών' },
                  { icon: Lock, title: 'Προστασία Δεδομένων', desc: 'Πλήρης συμμόρφωση με GDPR' },
                  { icon: TrendingUp, title: 'Συνεχής Βελτίωση', desc: 'Διαρκής αναβάθμιση υπηρεσιών' }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4 group">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all">
                      <item.icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1">{item.title}</h4>
                      <p className="text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-slate-800/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-700">
                    <h3 className="text-xl font-bold text-white">Πίνακας Ελέγχου Γραφείου</h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Mock Dashboard */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">Ενεργά Αιτήματα</p>
                      <p className="text-2xl font-bold text-purple-400">47</p>
                      <p className="text-xs text-yellow-400 mt-1">12 νέα σήμερα</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">Στρατολογικά</p>
                      <p className="text-2xl font-bold text-green-400">892</p>
                      <p className="text-xs text-gray-400 mt-1">Υποθέσεις 2025</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">Επιτυχής Διεκπεραίωση</p>
                      <p className="text-2xl font-bold text-cyan-400">95%</p>
                      <p className="text-xs text-gray-400 mt-1">Μέσος όρος</p>
                    </div>
                  </div>

                  {/* Mock Chart */}
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-4">Μηνιαία Δραστηριότητα</p>
                    <div className="flex items-end space-x-2 h-24">
                      {[40, 65, 45, 80, 55, 70, 85, 60, 75, 90, 70, 85].map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                          style={{ height: `${height}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 bg-gradient-to-r from-blue-500 to-purple-500 p-0.5 rounded-xl">
                <div className="bg-slate-900 px-4 py-2 rounded-xl">
                  <p className="text-xs text-gray-400">Response Time</p>
                  <p className="text-lg font-bold text-white">12ms</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl p-16 rounded-3xl border border-blue-500/20">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Πρόσβαση στο Σύστημα
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Συνδεθείτε για να αποκτήσετε πρόσβαση στο σύστημα διαχείρισης του βουλευτικού γραφείου
            </p>
            <button
              onClick={() => navigate('/login')}
              className="group inline-flex items-center space-x-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-purple-700 transform transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30"
            >
              <span>Συνδεθείτε στην Πλατφόρμα</span>
              <ArrowRight className="w-6 h-6 transform transition-transform group-hover:translate-x-2" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                #oliipoligoli
              </h3>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
              <p className="text-gray-300">
                Αναπτύχθηκε με πολύ εκτίμηση από την{' '}
                <a 
                  href="https://naic.gr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  ntontisai.gr
                </a>
              </p>
              
              <p className="text-gray-400">
                Με την υπογραφή του <span className="text-white font-semibold">Ντόντη Χρήστου</span>
              </p>
              
              <p className="text-gray-400">
                Αφιερωμένο στο team του κυρίου Βουλευτή <span className="text-white font-semibold">Διαμαντή Γκολιδάκη</span>
              </p>
              
              <p className="text-lg text-transparent bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text font-semibold pt-4">
                Καλή Επιτυχία! 🚀
              </p>
            </div>

            <div className="pt-8 border-t border-slate-800">
              <p className="text-sm text-gray-500">
                © 2025 #oliipoligoli. All rights reserved. | Powered by naic.gr
              </p>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}