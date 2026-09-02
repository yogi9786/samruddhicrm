import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import natureBg from '../../assets/nature-bg.png';
import { 
  Sparkles, Shield, ArrowRight, Calendar, MapPin, 
  Award, QrCode, Gift, Users, CheckCircle2, Ticket, Clock
} from 'lucide-react';
import '../../landing-animations.css';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Background with luxury nature overlay */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${natureBg})` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-950/70 via-slate-950/90 to-slate-950" />

      {/* Navbar */}
      <nav className="relative z-20 flex justify-between items-center px-6 md:px-12 py-5 border-b border-amber-500/10 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <img 
            src={logo} 
            alt="Siri Samruddhi Gold Palace" 
            className="h-11 w-11 rounded-full object-contain border border-amber-400/40 shadow-lg shadow-amber-500/20" 
          />
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide font-serif">
              SIRISAMRUDDHI
            </h1>
            <p className="text-[10px] font-semibold tracking-[0.35em] uppercase text-amber-400">
              Gold Palace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/gmb/registrationform/')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all text-xs font-semibold"
          >
            <Ticket size={14} />
            <span>Event Registration</span>
          </button>
          
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition-all"
          >
            <Shield size={13} className="text-amber-400" />
            <span>Staff / Admin</span>
          </button>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col justify-center items-center text-center">
        {/* Event Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-semibold mb-6 animate-pulse">
          <Sparkles size={15} />
          <span>OFFICIAL ANNUAL CONVENTION • 2026</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold font-serif text-white tracking-tight leading-[1.1] max-w-4xl">
          GBM Annual Grand <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Event & Delegate Conclave
          </span>
        </h1>

        {/* Description */}
        <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl font-light leading-relaxed">
          Celebrating excellence, unity, and growth across our branches in 
          <strong className="text-amber-300 font-medium"> Yelahanka</strong>, 
          <strong className="text-amber-300 font-medium"> Kolar</strong>, and 
          <strong className="text-amber-300 font-medium"> Udupi</strong>.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => navigate('/gmb/registrationform/')}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 text-base group"
          >
            <span>Register for GBM Event</span>
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => navigate('/admin')}
            className="w-full sm:w-auto px-7 py-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 text-base hover:border-amber-500/40"
          >
            <QrCode size={18} className="text-amber-400" />
            <span>Gate & Gift Scanner</span>
          </button>
        </div>

        {/* Event Quick Info Cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl w-full">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md text-left flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Event Date</h3>
              <p className="text-xs text-slate-400 mt-1">Annual Gala Convention</p>
              <p className="text-xs text-amber-300 font-medium mt-1">September 2026</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md text-left flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <MapPin size={22} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Participating Branches</h3>
              <p className="text-xs text-slate-400 mt-1">Yelahanka • Kolar • Udupi</p>
              <p className="text-xs text-amber-300 font-medium mt-1">Siri Samruddhi Gold Palace</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md text-left flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Gift size={22} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Exclusive Delegate Gifts</h3>
              <p className="text-xs text-slate-400 mt-1">Men: Executive Watch Set</p>
              <p className="text-xs text-amber-300 font-medium mt-0.5">Women: Pure Silk Saree Box</p>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-14 max-w-3xl w-full border-t border-slate-800/80 pt-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-6">
            Event Registration Process & Guidelines
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center mx-auto mb-2">1</div>
              <p className="text-xs text-slate-300 font-medium">Branch & Details</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Select store branch</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center mx-auto mb-2">2</div>
              <p className="text-xs text-slate-300 font-medium">OTP Verification</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Instant Digintra SMS</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center mx-auto mb-2">3</div>
              <p className="text-xs text-slate-300 font-medium">Live Selfie Capture</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Take photo on phone</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center mx-auto mb-2">4</div>
              <p className="text-xs text-slate-300 font-medium">Instant PDF Pass</p>
              <p className="text-[10px] text-slate-500 mt-0.5">WhatsApp & QR Pass</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-6 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-4">
        <div>
          © {new Date().getFullYear()} Siri Samruddhi Gold Palace. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-xs">
          <button onClick={() => navigate('/gmb/registrationform/')} className="hover:text-amber-400 transition-colors">
            Registration
          </button>
          <span>•</span>
          <button onClick={() => navigate('/admin')} className="hover:text-amber-400 transition-colors">
            Admin Portal
          </button>
        </div>
      </footer>
    </div>
  );
};
