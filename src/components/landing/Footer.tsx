import { MapPin, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const waveIn = (fromRight: boolean, delay: number) => ({
  initial: { x: fromRight ? 100 : -100, opacity: 0 },
  whileInView: { x: 0, opacity: 1 },
  viewport: { once: true },
  transition: {
    x: { type: "spring" as const, stiffness: 50, damping: 14, delay },
    opacity: { duration: 0.5, delay },
  },
});

export const Footer = () => {
  return (
    <footer className="h-screen flex flex-col justify-center bg-gray-900 text-white">
      <div className="container px-4">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <motion.div {...waveIn(false, 0)} className="space-y-4">
            <h3 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">MtaaLoop</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Transforming every apartment building into a thriving digital village.</p>
          </motion.div>

          <motion.div {...waveIn(true, 0.1)} className="space-y-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-widest">For Partners</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><Link to="/auth/vendor-signup" className="hover:text-white transition-colors">Join as Vendor →</Link></li>
              <li><Link to="/auth/estate-signup" className="hover:text-white transition-colors">Register Estate →</Link></li>
              <li><Link to="/auth/rider-signup" className="hover:text-white transition-colors">Become a Rider →</Link></li>
            </ul>
          </motion.div>

          <motion.div {...waveIn(false, 0.2)} className="space-y-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-widest">Company</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </motion.div>

          <motion.div {...waveIn(true, 0.3)} className="space-y-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-widest">Contact</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-500" /> Nairobi, Kenya</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500" /> hello.mtaaloop@africall.ke</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500" /> +254 730 833 399</li>
            </ul>
          </motion.div>
        </div>

        <motion.div {...waveIn(false, 0.4)} className="pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <span className="text-gray-700">•</span>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <span className="text-gray-700">•</span>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
          <p className="text-gray-600">© 2025 MtaaLoop. All rights reserved.</p>
          <div className="mt-4 flex gap-4 justify-center">
            <Link to="/compliance" className="text-xs text-gray-600 hover:text-white transition-colors">Compliance →</Link>
            <Link to="/admin/login" className="text-xs text-gray-600 hover:text-white transition-colors">Admin →</Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
