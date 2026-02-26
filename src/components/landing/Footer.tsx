import { MapPin, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
});

export const Footer = () => {
  return (
    <footer className="h-screen flex flex-col justify-center bg-gray-800 text-white">
      <div className="container px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <motion.div {...fadeUp(0)} className="space-y-4">
            <h3 className="text-2xl font-bold text-blue-300">MtaaLoop</h3>
            <p className="text-sm text-gray-400">Transforming every neighborhood into a connected digital village.</p>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="space-y-4">
            <h4 className="font-semibold text-white">For Partners</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/auth/vendor-signup" className="hover:text-blue-300 transition-colors">Join as Vendor →</Link></li>
              <li><Link to="/auth/estate-signup" className="hover:text-blue-300 transition-colors">Register Estate →</Link></li>
              <li><Link to="/auth/rider-signup" className="hover:text-blue-300 transition-colors">Become a Rider →</Link></li>
            </ul>
          </motion.div>

          <motion.div {...fadeUp(0.2)} className="space-y-4">
            <h4 className="font-semibold text-white">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-blue-300 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-blue-300 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-blue-300 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-blue-300 transition-colors">Help Center</a></li>
            </ul>
          </motion.div>

          <motion.div {...fadeUp(0.3)} className="space-y-4">
            <h4 className="font-semibold text-white">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Nairobi, Kenya</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> hello.mtaaloop@africall.ke</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +254 730 833 399</li>
            </ul>
          </motion.div>
        </div>

        <motion.div {...fadeUp(0.4)} className="pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <a href="#" className="hover:text-blue-300 transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:text-blue-300 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-blue-300 transition-colors">Cookie Policy</a>
          </div>
          <p>© 2025 MtaaLoop. All rights reserved.</p>
          <div className="mt-4 flex gap-4 justify-center">
            <Link to="/compliance" className="text-xs text-gray-400 hover:text-white transition-colors">Compliance Portal →</Link>
            <Link to="/admin/login" className="text-xs text-gray-400 hover:text-white transition-colors">Admin Portal →</Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
