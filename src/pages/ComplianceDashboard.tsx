import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const businesses = [
  { name: "Mtaaloop Laundromat", description: "Self-service and full-service laundry for busy residents" },
  { name: "Mtaaloop Liquor Store", description: "Beer, wine, spirits delivery to your door" },
  { name: "Mtaaloop Pharmacy", description: "Medicines, prescriptions, health products with quick delivery" },
  { name: "Mtaaloop Minimart", description: "Groceries, snacks, household essentials" },
  { name: "Mtaaloop Restaurant", description: "Hot meals, food delivery from local eateries" },
  { name: "Mtaaloop Butchery", description: "Fresh meat, chicken, fish for daily cooking needs" },
  { name: "Mtaaloop Hardware", description: "Tools, paint, construction materials, home repairs" },
  { name: "Mtaaloop Salon", description: "Hair styling, beauty treatments, grooming services" },
  { name: "Mtaaloop Gym", description: "Fitness center memberships, workout classes" },
  { name: "Mtaaloop Car Wash", description: "Vehicle cleaning and detailing services" },
  { name: "Mtaaloop Electronics", description: "Phones, laptops, accessories, repairs" },
  { name: "Mtaaloop Stationery", description: "School supplies, office items, printing services" },
  { name: "Mtaaloop Gas Station", description: "LPG refills, cooking gas delivery" },
  { name: "Mtaaloop Pet Store", description: "Pet food, toys, grooming, veterinary supplies" },
  { name: "Mtaaloop Bakery", description: "Fresh bread, cakes, pastries daily" },
  { name: "Mtaaloop Greengrocery", description: "Fresh fruits, vegetables from local vendors" },
  { name: "Mtaaloop Tailor", description: "Clothing alterations, repairs, custom outfits" },
  { name: "Mtaaloop Dry Cleaner", description: "Professional garment cleaning and pressing" },
  { name: "Mtaaloop Cybercafé", description: "Internet access, photocopying, document printing" },
  { name: "Mtaaloop Mobile Money", description: "M-Pesa, Airtel Money agent services" },
  { name: "Mtaaloop Water Station", description: "Clean drinking water refills and delivery" },
  { name: "Mtaaloop Barbershop", description: "Men's grooming, haircuts, shaves" },
  { name: "Mtaaloop Spa", description: "Massage, facials, wellness treatments" },
  { name: "Mtaaloop Dental Clinic", description: "Dental care, checkups, emergency services" },
  { name: "Mtaaloop Optical Shop", description: "Eyeglasses, contact lenses, eye exams" },
  { name: "Mtaaloop Baby Shop", description: "Diapers, baby food, clothing, toys" },
  { name: "Mtaaloop Boutique", description: "Fashion, clothing, shoes, accessories" },
  { name: "Mtaaloop Furniture Store", description: "Home furniture, mattresses, decor" },
  { name: "Mtaaloop Plumber", description: "Emergency plumbing, installations, repairs" },
  { name: "Mtaaloop Electrician", description: "Electrical repairs, installations, wiring" },
  { name: "Mtaaloop Mechanic", description: "Car repairs, servicing, diagnostics" },
  { name: "Mtaaloop Tutor", description: "Private lessons, homework help, exam prep" },
  { name: "Mtaaloop Daycare", description: "Childcare services for working parents" },
  { name: "Mtaaloop Caterer", description: "Event catering, party food, bulk orders" },
  { name: "Mtaaloop Florist", description: "Fresh flowers, bouquets, event decorations" },
  { name: "Mtaaloop Courier", description: "Package delivery, document transport" },
  { name: "Mtaaloop Locksmith", description: "Key cutting, lock repairs, emergency access" },
  { name: "Mtaaloop Pest Control", description: "Fumigation, rodent control, bedbug treatment" },
  { name: "Mtaaloop Cleaning Service", description: "House cleaning, office cleaning, deep cleaning" },
  { name: "Mtaaloop Event Planner", description: "Weddings, parties, corporate events coordination" }
];

const ComplianceDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Compliance Dashboard</h1>
          <p className="text-lg text-gray-600">Monitor and manage business compliance across MtaaLoop ecosystem</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {businesses.map((business, index) => {
            // Convert business name to management route path
            const routePath = "/management/" + business.name
              .toLowerCase()
              .replace("mtaaloop ", "")
              .replace(/ /g, "-")
              .replace(/é/g, "e");

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Link
                  to={routePath}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300 block"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{business.name}</h3>
                  <p className="text-gray-600 text-sm">{business.description}</p>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;
